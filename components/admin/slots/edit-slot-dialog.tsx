"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AdSlot } from "@/lib/types"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

const positions = [
  "header",
  "sidebar-left",
  "sidebar-right",
  "content-top",
  "content-bottom",
  "footer",
  "popup",
  "interstitial",
]

interface EditSlotDialogProps {
  slot: AdSlot
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSlotDialog({ slot, open, onOpenChange }: EditSlotDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      width: parseInt(formData.get("width") as string),
      height: parseInt(formData.get("height") as string),
      position: formData.get("position") as string,
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("ad_slots")
      .update(data)
      .eq("id", slot.id)

    setLoading(false)

    if (error) {
      toast.error("Failed to update ad slot")
      return
    }

    toast.success("Ad slot updated successfully")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Ad Slot</DialogTitle>
            <DialogDescription>
              Update the ad slot configuration.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input name="name" defaultValue={slot.name} required />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                name="description"
                defaultValue={slot.description || ""}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Width (px)</FieldLabel>
                <Input
                  name="width"
                  type="number"
                  defaultValue={slot.width}
                  required
                  min={1}
                />
              </Field>
              <Field>
                <FieldLabel>Height (px)</FieldLabel>
                <Input
                  name="height"
                  type="number"
                  defaultValue={slot.height}
                  required
                  min={1}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Position</FieldLabel>
              <Select name="position" defaultValue={slot.position} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos.charAt(0).toUpperCase() + pos.slice(1).replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
