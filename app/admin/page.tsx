import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Image, BarChart3, MousePointerClick, Eye, RectangleHorizontal } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getDashboardStats() {
  const supabase = await createClient()

  // Get counts
  const [
    { count: activeCampaigns },
    { count: totalBanners },
    { count: activeSlots },
    { count: totalImpressions },
    { count: totalClicks },
  ] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("banners").select("*", { count: "exact", head: true }),
    supabase.from("ad_slots").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("tracking_events").select("*", { count: "exact", head: true }).eq("event_type", "impression"),
    supabase.from("tracking_events").select("*", { count: "exact", head: true }).eq("event_type", "click"),
  ])

  // Get recent campaigns
  const { data: recentCampaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    activeCampaigns: activeCampaigns || 0,
    totalBanners: totalBanners || 0,
    activeSlots: activeSlots || 0,
    totalImpressions: totalImpressions || 0,
    totalClicks: totalClicks || 0,
    recentCampaigns: recentCampaigns || [],
    ctr: totalImpressions && totalClicks ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00",
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns,
      description: "Currently running",
      icon: Megaphone,
      href: "/admin/campaigns",
    },
    {
      title: "Total Banners",
      value: stats.totalBanners,
      description: "Across all campaigns",
      icon: Image,
      href: "/admin/banners",
    },
    {
      title: "Active Ad Slots",
      value: stats.activeSlots,
      description: "Available positions",
      icon: RectangleHorizontal,
      href: "/admin/slots",
    },
    {
      title: "Total Impressions",
      value: stats.totalImpressions.toLocaleString(),
      description: "All time",
      icon: Eye,
      href: "/admin/analytics",
    },
    {
      title: "Total Clicks",
      value: stats.totalClicks.toLocaleString(),
      description: "All time",
      icon: MousePointerClick,
      href: "/admin/analytics",
    },
    {
      title: "Click-Through Rate",
      value: `${stats.ctr}%`,
      description: "Overall CTR",
      icon: BarChart3,
      href: "/admin/analytics",
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your advertising platform performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Latest campaigns added to the platform</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/campaigns">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
            ) : (
              <div className="space-y-4">
                {stats.recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">{campaign.name}</span>
                      <span className="text-sm text-muted-foreground">{campaign.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={campaign.is_active ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ${campaign.budget_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
