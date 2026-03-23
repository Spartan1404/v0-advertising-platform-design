"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Plus } from "lucide-react"
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

export function CreateSlotDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
      is_active: true,
    }

    const supabase = createClient()
    const { error } = await supabase.from("ad_slots").insert(data)

    setLoading(false)

    if (error) {
      toast.error("Failed to create ad slot")
      return
    }

    toast.success("Ad slot created successfully")
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Slot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Ad Slot</DialogTitle>
            <DialogDescription>
              Define a new ad placement position for your platform.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input name="name" placeholder="Header Banner" required />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                name="description"
                placeholder="Displayed at the top of all pages"
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Width (px)</FieldLabel>
                <Input name="width" type="number" placeholder="728" required min={1} />
              </Field>
              <Field>
                <FieldLabel>Height (px)</FieldLabel>
                <Input name="height" type="number" placeholder="90" required min={1} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Position</FieldLabel>
              <Select name="position" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              Create Slot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
