"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface SettingsFormProps {
  settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    max_active_campaigns: settings.max_active_campaigns || "10",
    default_ad_refresh_interval: settings.default_ad_refresh_interval || "30",
    enable_tracking: settings.enable_tracking !== "false",
    enable_offline_mode: settings.enable_offline_mode !== "false",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updates = [
        { key: "max_active_campaigns", value: formData.max_active_campaigns },
        { key: "default_ad_refresh_interval", value: formData.default_ad_refresh_interval },
        { key: "enable_tracking", value: String(formData.enable_tracking) },
        { key: "enable_offline_mode", value: String(formData.enable_offline_mode) },
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_config")
          .upsert(
            { key: update.key, value: update.value },
            { onConflict: "key" }
          )
        
        if (error) throw error
      }

      toast.success("Settings saved successfully")
      router.refresh()
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="max_campaigns">Max Active Campaigns</Label>
          <Input
            id="max_campaigns"
            type="number"
            min="1"
            max="100"
            value={formData.max_active_campaigns}
            onChange={(e) => setFormData({ ...formData, max_active_campaigns: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of campaigns that can be active simultaneously
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="refresh_interval">Ad Refresh Interval (seconds)</Label>
          <Input
            id="refresh_interval"
            type="number"
            min="10"
            max="300"
            value={formData.default_ad_refresh_interval}
            onChange={(e) => setFormData({ ...formData, default_ad_refresh_interval: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            How often ads rotate in the display slots
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Enable Tracking</Label>
            <p className="text-xs text-muted-foreground">
              Track impressions and clicks for analytics
            </p>
          </div>
          <Switch
            checked={formData.enable_tracking}
            onCheckedChange={(checked) => setFormData({ ...formData, enable_tracking: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Enable Offline Mode</Label>
            <p className="text-xs text-muted-foreground">
              Cache ads locally for offline access
            </p>
          </div>
          <Switch
            checked={formData.enable_offline_mode}
            onCheckedChange={(checked) => setFormData({ ...formData, enable_offline_mode: checked })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
        Save Settings
      </Button>
    </form>
  )
}
