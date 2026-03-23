import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: slots, error } = await supabase
      .from("ad_slots")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) throw error

    return NextResponse.json({
      slots: slots || [],
      cached_at: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      }
    })
  } catch (error) {
    console.error("Error fetching ad slots:", error)
    return NextResponse.json({ error: "Failed to fetch ad slots" }, { status: 500 })
  }
}
