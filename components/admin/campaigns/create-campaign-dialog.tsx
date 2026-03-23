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

interface CreateCampaignDialogProps {
  disabled?: boolean
}

export function CreateCampaignDialog({ disabled }: CreateCampaignDialogProps) {
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
      client_name: formData.get("client_name") as string,
      budget_usd: parseFloat(formData.get("budget_usd") as string),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      status: formData.get("status") as string,
      is_active: formData.get("status") === "active",
    }

    const supabase = createClient()
    const { error } = await supabase.from("campaigns").insert(data)

    setLoading(false)

    if (error) {
      toast.error("Failed to create campaign")
      return
    }

    toast.success("Campaign created successfully")
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="mr-2 size-4" />
          Add Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Set up a new advertising campaign.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Campaign Name</FieldLabel>
              <Input name="name" placeholder="Summer Sale 2026" required />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                name="description"
                placeholder="Campaign details and goals"
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel>Client Name</FieldLabel>
              <Input name="client_name" placeholder="Acme Corp" required />
            </Field>
            <Field>
              <FieldLabel>Budget (USD)</FieldLabel>
              <Input
                name="budget_usd"
                type="number"
                placeholder="5000"
                required
                min={0}
                step="0.01"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Start Date</FieldLabel>
                <Input name="start_date" type="date" required />
              </Field>
              <Field>
                <FieldLabel>End Date</FieldLabel>
                <Input name="end_date" type="date" required />
              </Field>
            </div>
            <Field>
              <FieldLabel>Initial Status</FieldLabel>
              <Select name="status" defaultValue="draft">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
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
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
