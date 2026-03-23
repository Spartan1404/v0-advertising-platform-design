import { createClient } from "@/lib/supabase/server"
import { SlotsTable } from "@/components/admin/slots/slots-table"
import { CreateSlotDialog } from "@/components/admin/slots/create-slot-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function getAdSlots() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ad_slots")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching ad slots:", error)
    return []
  }

  return data
}

export default async function SlotsPage() {
  const slots = await getAdSlots()

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ad Slots</h1>
          <p className="text-muted-foreground">
            Manage ad placement positions and their dimensions.
          </p>
        </div>
        <CreateSlotDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Ad Slots</CardTitle>
          <CardDescription>
            Configure where ads can be displayed on your platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SlotsTable slots={slots} />
        </CardContent>
      </Card>
    </div>
  )
}
