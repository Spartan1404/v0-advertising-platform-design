import { createClient } from "@/lib/supabase/server"
import { CampaignsTable } from "@/components/admin/campaigns/campaigns-table"
import { CreateCampaignDialog } from "@/components/admin/campaigns/create-campaign-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

async function getCampaigns() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching campaigns:", error)
    return []
  }

  return data
}

async function getActiveCampaignCount() {
  const supabase = await createClient()
  const { count } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  return count || 0
}

export default async function CampaignsPage() {
  const [campaigns, activeCount] = await Promise.all([
    getCampaigns(),
    getActiveCampaignCount(),
  ])

  const maxCampaigns = 10
  const isAtLimit = activeCount >= maxCampaigns

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage advertising campaigns and their budgets.
          </p>
        </div>
        <CreateCampaignDialog disabled={isAtLimit} />
      </div>

      {isAtLimit && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>
            You have reached the maximum of {maxCampaigns} active campaigns. Deactivate or complete existing campaigns to create new ones.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            {activeCount} of {maxCampaigns} active campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignsTable campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  )
}
