"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { EditBannerDialog } from "./edit-banner-dialog"
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { Banner, Campaign, AdSlot } from "@/lib/types"
import Image from "next/image"

interface BannersTableProps {
  banners: (Banner & { campaign: Pick<Campaign, "id" | "name"> | null; ad_slot: Pick<AdSlot, "id" | "name" | "width" | "height"> | null })[]
  campaigns: Pick<Campaign, "id" | "name">[]
  adSlots: Pick<AdSlot, "id" | "name" | "width" | "height">[]
}

export function BannersTable({ banners, campaigns, adSlots }: BannersTableProps) {
  const router = useRouter()
  const supabase = createClient()
  const [editingBanner, setEditingBanner] = useState<BannersTableProps["banners"][0] | null>(null)
  const [deletingBanner, setDeletingBanner] = useState<BannersTableProps["banners"][0] | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function toggleActive(banner: BannersTableProps["banners"][0]) {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id)

    if (error) {
      toast.error("Failed to update banner status")
      return
    }

    toast.success(`Banner ${banner.is_active ? "deactivated" : "activated"}`)
    router.refresh()
  }

  async function deleteBanner() {
    if (!deletingBanner) return
    setIsDeleting(true)

    try {
      // Delete the image from Vercel Blob if it exists
      if (deletingBanner.image_url) {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: deletingBanner.image_url }),
        })
      }

      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", deletingBanner.id)

      if (error) throw error

      toast.success("Banner deleted successfully")
      router.refresh()
    } catch {
      toast.error("Failed to delete banner")
    } finally {
      setIsDeleting(false)
      setDeletingBanner(null)
    }
  }

  if (banners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No banners found</p>
        <p className="text-sm text-muted-foreground">Create a banner to get started</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Slot</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow key={banner.id}>
              <TableCell>
                {banner.image_url ? (
                  <div className="relative h-12 w-20 overflow-hidden rounded border bg-muted">
                    <Image
                      src={banner.image_url}
                      alt={banner.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-20 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  {banner.name}
                  {banner.target_url && (
                    <a
                      href={banner.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {banner.alt_text && (
                  <p className="text-xs text-muted-foreground">{banner.alt_text}</p>
                )}
              </TableCell>
              <TableCell>
                {banner.campaign?.name || (
                  <span className="text-muted-foreground">No campaign</span>
                )}
              </TableCell>
              <TableCell>
                {banner.ad_slot?.name || (
                  <span className="text-muted-foreground">No slot</span>
                )}
              </TableCell>
              <TableCell>
                {banner.ad_slot ? (
                  <span className="text-sm">
                    {banner.ad_slot.width} x {banner.ad_slot.height}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={banner.is_active ? "default" : "secondary"}>
                  {banner.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditingBanner(banner)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(banner)}>
                      {banner.is_active ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletingBanner(banner)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingBanner && (
        <EditBannerDialog
          banner={editingBanner}
          campaigns={campaigns}
          adSlots={adSlots}
          open={!!editingBanner}
          onOpenChange={(open) => !open && setEditingBanner(null)}
        />
      )}

      <AlertDialog open={!!deletingBanner} onOpenChange={(open) => !open && setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingBanner?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBanner}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
