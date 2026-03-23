"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Campaign } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2, Play, Pause, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { EditCampaignDialog } from "./edit-campaign-dialog"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { format } from "date-fns"

interface CampaignsTableProps {
  campaigns: Campaign[]
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "secondary",
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const router = useRouter()
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)

  async function toggleActive(campaign: Campaign) {
    const supabase = createClient()
    const newStatus = campaign.is_active ? "paused" : "active"
    const { error } = await supabase
      .from("campaigns")
      .update({ is_active: !campaign.is_active, status: newStatus })
      .eq("id", campaign.id)

    if (error) {
      toast.error("Failed to update campaign status")
      return
    }

    toast.success(`Campaign ${campaign.is_active ? "paused" : "activated"}`)
    router.refresh()
  }

  async function updateStatus(campaign: Campaign, status: string) {
    const supabase = createClient()
    const isActive = status === "active"
    const { error } = await supabase
      .from("campaigns")
      .update({ status, is_active: isActive })
      .eq("id", campaign.id)

    if (error) {
      toast.error("Failed to update campaign status")
      return
    }

    toast.success(`Campaign status updated to ${status}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteCampaign) return

    const supabase = createClient()
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", deleteCampaign.id)

    if (error) {
      toast.error("Failed to delete campaign. It may have associated banners.")
      setDeleteCampaign(null)
      return
    }

    toast.success("Campaign deleted successfully")
    setDeleteCampaign(null)
    router.refresh()
  }

  if (campaigns.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No campaigns yet</EmptyTitle>
        <EmptyDescription>Create your first campaign to start advertising.</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{campaign.name}</span>
                  {campaign.description && (
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {campaign.description}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{campaign.client_name}</TableCell>
              <TableCell>
                <span className="font-mono">${campaign.budget_usd.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{format(new Date(campaign.start_date), "MMM d, yyyy")}</span>
                  <span className="text-muted-foreground">
                    to {format(new Date(campaign.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[campaign.status]}>
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={campaign.is_active}
                  onCheckedChange={() => toggleActive(campaign)}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditCampaign(campaign)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => updateStatus(campaign, "active")}>
                      <Play className="mr-2 size-4" />
                      Set Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(campaign, "paused")}>
                      <Pause className="mr-2 size-4" />
                      Set Paused
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(campaign, "completed")}>
                      <CheckCircle className="mr-2 size-4" />
                      Set Completed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteCampaign(campaign)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteCampaign} onOpenChange={() => setDeleteCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteCampaign?.name}&quot;? This action cannot be undone.
              All associated banners and tracking data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editCampaign && (
        <EditCampaignDialog campaign={editCampaign} open={!!editCampaign} onOpenChange={() => setEditCampaign(null)} />
      )}
    </>
  )
}
