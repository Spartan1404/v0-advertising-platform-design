import { createClient } from "@/lib/supabase/server"
import { BannersTable } from "@/components/admin/banners/banners-table"
import { CreateBannerDialog } from "@/components/admin/banners/create-banner-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"

export default async function BannersPage() {
  const supabase = await createClient()
  
  const [{ data: banners }, { data: campaigns }, { data: adSlots }] = await Promise.all([
    supabase
      .from("banners")
      .select(`
        *,
        campaign:campaigns(id, name),
        ad_slot:ad_slots(id, name, width, height)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("status", "active")
      .order("name"),
    supabase
      .from("ad_slots")
      .select("id, name, width, height")
      .eq("is_active", true)
      .order("name"),
  ])

  const activeBanners = banners?.filter(b => b.is_active).length || 0
  const totalBanners = banners?.length || 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">
            Manage banner creatives for your campaigns
          </p>
        </div>
        <CreateBannerDialog 
          campaigns={campaigns || []} 
          adSlots={adSlots || []} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBanners}</div>
            <p className="text-xs text-muted-foreground">
              All banner creatives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Banners</CardTitle>
            <Badge variant="default" className="h-4">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBanners}</div>
            <p className="text-xs text-muted-foreground">
              Currently serving ads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactive Banners</CardTitle>
            <Badge variant="secondary" className="h-4">Paused</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBanners - activeBanners}</div>
            <p className="text-xs text-muted-foreground">
              Not currently serving
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Banners</CardTitle>
          <CardDescription>
            View and manage all banner creatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannersTable 
            banners={banners || []} 
            campaigns={campaigns || []}
            adSlots={adSlots || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
