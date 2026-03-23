import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // Get active campaigns with their banners
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select(`
        id,
        name,
        start_date,
        end_date,
        priority,
        banners (
          id,
          name,
          image_url,
          target_url,
          alt_text,
          ad_slot_id,
          is_active,
          ad_slot:ad_slots (
            id,
            name,
            width,
            height,
            position
          )
        )
      `)
      .eq("status", "active")
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("priority", { ascending: false })

    if (error) throw error

    // Filter to only active banners and format response
    const activeCampaigns = campaigns?.map(campaign => ({
      ...campaign,
      banners: campaign.banners?.filter(banner => banner.is_active) || []
    })).filter(campaign => campaign.banners.length > 0) || []

    return NextResponse.json({
      campaigns: activeCampaigns,
      cached_at: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      }
    })
  } catch (error) {
    console.error("Error fetching active campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}
