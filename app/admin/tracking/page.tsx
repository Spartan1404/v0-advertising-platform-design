import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrackingChart } from "@/components/admin/tracking/tracking-chart"
import { TrackingTable } from "@/components/admin/tracking/tracking-table"
import { DateRangeFilter } from "@/components/admin/tracking/date-range-filter"
import { Eye, MousePointerClick, TrendingUp, DollarSign } from "lucide-react"

interface TrackingPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function TrackingPage({ searchParams }: TrackingPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Default to last 7 days
  const now = new Date()
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const fromDate = params.from || defaultFrom.toISOString().split("T")[0]
  const toDate = params.to || now.toISOString().split("T")[0]

  // Fetch aggregated tracking data
  const { data: trackingData } = await supabase
    .from("tracking_events")
    .select(`
      *,
      campaign:campaigns(id, name),
      banner:banners(id, name)
    `)
    .gte("event_date", fromDate)
    .lte("event_date", toDate)
    .order("event_date", { ascending: false })

  // Calculate totals
  const totals = trackingData?.reduce(
    (acc, event) => ({
      impressions: acc.impressions + (event.impressions || 0),
      clicks: acc.clicks + (event.clicks || 0),
    }),
    { impressions: 0, clicks: 0 }
  ) || { impressions: 0, clicks: 0 }

  const ctr = totals.impressions > 0 
    ? ((totals.clicks / totals.impressions) * 100).toFixed(2) 
    : "0.00"

  // Group data by date for the chart
  const chartData = trackingData?.reduce((acc, event) => {
    const date = event.event_date
    const existing = acc.find(d => d.date === date)
    if (existing) {
      existing.impressions += event.impressions || 0
      existing.clicks += event.clicks || 0
    } else {
      acc.push({
        date,
        impressions: event.impressions || 0,
        clicks: event.clicks || 0,
      })
    }
    return acc
  }, [] as { date: string; impressions: number; clicks: number }[]) || []

  // Sort by date ascending for the chart
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Group data by campaign for table
  const campaignData = trackingData?.reduce((acc, event) => {
    const campaignId = event.campaign_id || "unknown"
    const campaignName = event.campaign?.name || "Unassigned"
    
    const existing = acc.find(d => d.campaignId === campaignId)
    if (existing) {
      existing.impressions += event.impressions || 0
      existing.clicks += event.clicks || 0
    } else {
      acc.push({
        campaignId,
        campaignName,
        impressions: event.impressions || 0,
        clicks: event.clicks || 0,
      })
    }
    return acc
  }, [] as { campaignId: string; campaignName: string; impressions: number; clicks: number }[]) || []

  // Calculate estimated revenue (example: $0.001 per impression, $0.05 per click)
  const estimatedRevenue = (totals.impressions * 0.001 + totals.clicks * 0.05).toFixed(2)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track impressions, clicks, and campaign performance
          </p>
        </div>
        <DateRangeFilter fromDate={fromDate} toDate={toDate} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ad views in selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              User interactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ctr}%</div>
            <p className="text-xs text-muted-foreground">
              Click-through rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Based on default rates
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>
            Impressions and clicks trend for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Breakdown by campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingTable data={campaignData} />
        </CardContent>
      </Card>
    </div>
  )
}
