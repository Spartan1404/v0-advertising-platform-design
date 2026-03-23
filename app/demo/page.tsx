import { createClient } from "@/lib/supabase/server"
import { AdProvider } from "@/components/ads/ad-provider"
import { AdSlot } from "@/components/ads/ad-slot"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Layout, Smartphone, Monitor } from "lucide-react"

export default async function DemoPage() {
  const supabase = await createClient()
  
  const { data: slots } = await supabase
    .from("ad_slots")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <AdProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Admin
                </Button>
              </Link>
              <div className="h-4 w-px bg-border" />
              <h1 className="font-semibold">Ad Display Demo</h1>
            </div>
            <Badge variant="outline">Preview Mode</Badge>
          </div>
        </header>

        <main className="container py-8">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Frontend Ad Display Demo
                </CardTitle>
                <CardDescription>
                  This page demonstrates how ads will appear on your website. The ad slots below 
                  display active banners from your campaigns with automatic rotation and tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Offline Support</Badge>
                  <Badge variant="secondary">Auto-Rotation</Badge>
                  <Badge variant="secondary">Impression Tracking</Badge>
                  <Badge variant="secondary">Click Tracking</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Ad Slots Preview */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Active Ad Slots</h2>
              
              {slots && slots.length > 0 ? (
                <div className="space-y-8">
                  {slots.map((slot) => (
                    <Card key={slot.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{slot.name}</CardTitle>
                            <CardDescription>
                              {slot.width}x{slot.height}px - {slot.position}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {slot.width <= 320 ? (
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-center rounded-lg bg-muted/50 p-4">
                          <AdSlot
                            slotId={slot.id}
                            width={slot.width}
                            height={slot.height}
                            refreshInterval={30}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No active ad slots</p>
                    <p className="text-sm text-muted-foreground">
                      Create ad slots in the admin panel to see them here
                    </p>
                    <Link href="/admin/slots" className="mt-4">
                      <Button variant="outline" size="sm">
                        Manage Ad Slots
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Example Integration */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Example</CardTitle>
                <CardDescription>
                  Copy this code to display ads in your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`import { AdProvider } from "@/components/ads/ad-provider"
import { AdSlot } from "@/components/ads/ad-slot"

// Wrap your app with AdProvider
function App() {
  return (
    <AdProvider>
      <YourApp />
    </AdProvider>
  )
}

// Use AdSlot component where you want ads
function YourPage() {
  return (
    <AdSlot
      slotId="your-slot-id"
      width={728}
      height={90}
      refreshInterval={30}
    />
  )
}`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AdProvider>
  )
}
