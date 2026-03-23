"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Campaign } from "@/lib/types"
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

interface EditCampaignDialogProps {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCampaignDialog({ campaign, open, onOpenChange }: EditCampaignDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const status = formData.get("status") as string
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      client_name: formData.get("client_name") as string,
      budget_usd: parseFloat(formData.get("budget_usd") as string),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      status,
      is_active: status === "active",
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("campaigns")
      .update(data)
      .eq("id", campaign.id)

    setLoading(false)

    if (error) {
      toast.error("Failed to update campaign")
      return
    }

    toast.success("Campaign updated successfully")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign settings.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Campaign Name</FieldLabel>
              <Input name="name" defaultValue={campaign.name} required />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                name="description"
                defaultValue={campaign.description || ""}
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel>Client Name</FieldLabel>
              <Input name="client_name" defaultValue={campaign.client_name} required />
            </Field>
            <Field>
              <FieldLabel>Budget (USD)</FieldLabel>
              <Input
                name="budget_usd"
                type="number"
                defaultValue={campaign.budget_usd}
                required
                min={0}
                step="0.01"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Start Date</FieldLabel>
                <Input
                  name="start_date"
                  type="date"
                  defaultValue={campaign.start_date}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>End Date</FieldLabel>
                <Input
                  name="end_date"
                  type="date"
                  defaultValue={campaign.end_date}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select name="status" defaultValue={campaign.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
