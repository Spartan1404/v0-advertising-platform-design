"use client"

import { useState, useRef } from "react"
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
  DialogTrigger,
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
import { Plus, Upload, X } from "lucide-react"
import { toast } from "sonner"
import type { Campaign, AdSlot } from "@/lib/types"
import Image from "next/image"

interface CreateBannerDialogProps {
  campaigns: Pick<Campaign, "id" | "name">[]
  adSlots: Pick<AdSlot, "id" | "name" | "width" | "height">[]
}

export function CreateBannerDialog({ campaigns, adSlots }: CreateBannerDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    campaign_id: "",
    ad_slot_id: "",
    target_url: "",
    alt_text: "",
  })

  const selectedSlot = adSlots.find(s => s.id === formData.ad_slot_id)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPEG, PNG, GIF, WebP")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB")
      return
    }

    // If a slot is selected, validate dimensions
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
      setPreviewUrl("")
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
      const { error } = await supabase.from("banners").insert({
        name: formData.name.trim(),
        campaign_id: formData.campaign_id || null,
        ad_slot_id: formData.ad_slot_id || null,
        image_url: imageUrl,
        target_url: formData.target_url.trim() || null,
        alt_text: formData.alt_text.trim() || null,
        is_active: true,
      })

      if (error) throw error

      toast.success("Banner created successfully")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error("Failed to create banner")
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      campaign_id: "",
      ad_slot_id: "",
      target_url: "",
      alt_text: "",
    })
    setImageUrl("")
    setPreviewUrl("")
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Banner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Banner</DialogTitle>
            <DialogDescription>
              Upload a new banner creative for your campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Banner Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Holiday Promo Banner"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ad_slot">Ad Slot</Label>
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
              <Label htmlFor="campaign">Campaign</Label>
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
              <Label htmlFor="target_url">Target URL</Label>
              <Input
                id="target_url"
                type="url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://example.com/landing-page"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="alt_text">Alt Text</Label>
              <Input
                id="alt_text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Descriptive text for accessibility"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading || !imageUrl}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Create Banner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
