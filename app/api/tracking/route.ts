import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface TrackingEvent {
  campaign_id: string
  banner_id: string
  ad_slot_id?: string
  impressions?: number
  clicks?: number
  event_date?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Support both single events and batch events (for offline sync)
    const events: TrackingEvent[] = Array.isArray(body.events) ? body.events : [body]

    const today = new Date().toISOString().split("T")[0]

    for (const event of events) {
      const eventDate = event.event_date || today
      
      // Try to find existing record for this combination on this date
      const { data: existing } = await supabase
        .from("tracking_events")
        .select("id, impressions, clicks")
        .eq("campaign_id", event.campaign_id)
        .eq("banner_id", event.banner_id)
        .eq("event_date", eventDate)
        .maybeSingle()

      if (existing) {
        // Update existing record (aggregate)
        await supabase
          .from("tracking_events")
          .update({
            impressions: existing.impressions + (event.impressions || 0),
            clicks: existing.clicks + (event.clicks || 0),
          })
          .eq("id", existing.id)
      } else {
        // Insert new record
        await supabase.from("tracking_events").insert({
          campaign_id: event.campaign_id,
          banner_id: event.banner_id,
          ad_slot_id: event.ad_slot_id || null,
          impressions: event.impressions || 0,
          clicks: event.clicks || 0,
          event_date: eventDate,
        })
      }
    }

    return NextResponse.json({ success: true, processed: events.length })
  } catch (error) {
    console.error("Error tracking event:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
