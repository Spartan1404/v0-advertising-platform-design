"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AdSlot } from "@/lib/types"
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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { EditSlotDialog } from "./edit-slot-dialog"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"

interface SlotsTableProps {
  slots: AdSlot[]
}

export function SlotsTable({ slots }: SlotsTableProps) {
  const router = useRouter()
  const [deleteSlot, setDeleteSlot] = useState<AdSlot | null>(null)
  const [editSlot, setEditSlot] = useState<AdSlot | null>(null)

  async function toggleActive(slot: AdSlot) {
    const supabase = createClient()
    const { error } = await supabase
      .from("ad_slots")
      .update({ is_active: !slot.is_active })
      .eq("id", slot.id)

    if (error) {
      toast.error("Failed to update slot status")
      return
    }

    toast.success(`Slot ${slot.is_active ? "deactivated" : "activated"}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteSlot) return

    const supabase = createClient()
    const { error } = await supabase
      .from("ad_slots")
      .delete()
      .eq("id", deleteSlot.id)

    if (error) {
      toast.error("Failed to delete slot. It may have associated banners.")
      setDeleteSlot(null)
      return
    }

    toast.success("Slot deleted successfully")
    setDeleteSlot(null)
    router.refresh()
  }

  if (slots.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No ad slots yet</EmptyTitle>
        <EmptyDescription>Create your first ad slot to start placing ads.</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot) => (
            <TableRow key={slot.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{slot.name}</span>
                  {slot.description && (
                    <span className="text-sm text-muted-foreground">{slot.description}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{slot.position}</Badge>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {slot.width} x {slot.height}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={slot.is_active ? "default" : "secondary"}>
                  {slot.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={slot.is_active}
                  onCheckedChange={() => toggleActive(slot)}
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
                    <DropdownMenuItem onClick={() => setEditSlot(slot)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteSlot(slot)}
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

      <AlertDialog open={!!deleteSlot} onOpenChange={() => setDeleteSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteSlot?.name}&quot;? This action cannot be undone.
              Any banners associated with this slot will also be affected.
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

      {editSlot && (
        <EditSlotDialog slot={editSlot} open={!!editSlot} onOpenChange={() => setEditSlot(null)} />
      )}
    </>
  )
}
