"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import type { Banner, Campaign, AdSlot } from "@/lib/types"
import Image from "next/image"

interface EditBannerDialogProps {
  banner: Banner & { campaign: Pick<Campaign, "id" | "name"> | null; ad_slot: Pick<AdSlot, "id" | "name" | "width" | "height"> | null }
  campaigns: Pick<Campaign, "id" | "name">[]
  adSlots: Pick<AdSlot, "id" | "name" | "width" | "height">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBannerDialog({ banner, campaigns, adSlots, open, onOpenChange }: EditBannerDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(banner.image_url || "")
  const [previewUrl, setPreviewUrl] = useState(banner.image_url || "")
  const [formData, setFormData] = useState({
    name: banner.name,
    campaign_id: banner.campaign_id || "",
    ad_slot_id: banner.ad_slot_id || "",
    target_url: banner.target_url || "",
    alt_text: banner.alt_text || "",
  })

  const selectedSlot = adSlots.find(s => s.id === formData.ad_slot_id)

  useEffect(() => {
    setFormData({
      name: banner.name,
      campaign_id: banner.campaign_id || "",
      ad_slot_id: banner.ad_slot_id || "",
      target_url: banner.target_url || "",
      alt_text: banner.alt_text || "",
    })
    setImageUrl(banner.image_url || "")
    setPreviewUrl(banner.image_url || "")
  }, [banner])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPEG, PNG, GIF, WebP")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB")
      return
    }

    if (selectedSlot) {
      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      await new Promise((resolve) => (img.onload = resolve))
      
      if (img.width !== selectedSlot.width || img.height !== selectedSlot.height) {
        toast.error(`Image dimensions must be ${selectedSlot.width}x${selectedSlot.height}px for this slot`)
        URL.revokeObjectURL(img.src)
        return
      }
      URL.revokeObjectURL(img.src)
    }

    setIsUploading(true)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await response.json()
      setImageUrl(url)
      toast.success("Image uploaded successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
      setPreviewUrl(banner.image_url || "")
    } finally {
      setIsUploading(false)
    }
  }

  function removeImage() {
    setImageUrl("")
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Banner name is required")
      return
    }
    
    if (!imageUrl) {
      toast.error("Please upload an image")
      return
    }

    setIsLoading(true)

    try {
      // Delete old image if it changed
      if (banner.image_url && banner.image_url !== imageUrl) {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: banner.image_url }),
        })
      }

      const { error } = await supabase
        .from("banners")
        .update({
          name: formData.name.trim(),
          campaign_id: formData.campaign_id || null,
          ad_slot_id: formData.ad_slot_id || null,
          image_url: imageUrl,
          target_url: formData.target_url.trim() || null,
          alt_text: formData.alt_text.trim() || null,
        })
        .eq("id", banner.id)

      if (error) throw error

      toast.success("Banner updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Failed to update banner")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>
              Update banner details and creative
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Banner Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Holiday Promo Banner"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-ad_slot">Ad Slot</Label>
              <Select
                value={formData.ad_slot_id}
                onValueChange={(value) => setFormData({ ...formData, ad_slot_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an ad slot" />
                </SelectTrigger>
                <SelectContent>
                  {adSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.name} ({slot.width}x{slot.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSlot && (
                <p className="text-xs text-muted-foreground">
                  Image must be exactly {selectedSlot.width}x{selectedSlot.height}px
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Banner Image *</Label>
              {previewUrl ? (
                <div className="relative rounded-lg border bg-muted p-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-4 top-4 h-6 w-6"
                    onClick={removeImage}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-background/80">
                      <Spinner className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, WebP (max 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-campaign">Campaign</Label>
              <Select
                value={formData.campaign_id}
                onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-target_url">Target URL</Label>
              <Input
                id="edit-target_url"
                type="url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://example.com/landing-page"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-alt_text">Alt Text</Label>
              <Input
                id="edit-alt_text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Descriptive text for accessibility"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading || !imageUrl}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
