"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

interface Banner {
  id: string
  name: string
  image_url: string
  target_url: string | null
  alt_text: string | null
  ad_slot_id: string | null
  ad_slot: {
    id: string
    name: string
    width: number
    height: number
    position: string
  } | null
}

interface Campaign {
  id: string
  name: string
  priority: number
  banners: Banner[]
}

interface AdContextType {
  campaigns: Campaign[]
  isLoading: boolean
  isOffline: boolean
  getBannersForSlot: (slotId: string) => Banner[]
  trackImpression: (campaignId: string, bannerId: string, slotId?: string) => void
  trackClick: (campaignId: string, bannerId: string, slotId?: string) => void
}

const AdContext = createContext<AdContextType | null>(null)

const CACHE_KEY = "ad_campaigns_cache"
const TRACKING_QUEUE_KEY = "ad_tracking_queue"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CachedData {
  campaigns: Campaign[]
  cached_at: string
}

interface QueuedEvent {
  campaign_id: string
  banner_id: string
  ad_slot_id?: string
  impressions: number
  clicks: number
  event_date: string
}

export function AdProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  // Load cached data from localStorage
  const loadFromCache = useCallback((): CachedData | null => {
    if (typeof window === "undefined") return null
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null
      
      const data: CachedData = JSON.parse(cached)
      const cachedTime = new Date(data.cached_at).getTime()
      const now = Date.now()
      
      // Check if cache is still valid
      if (now - cachedTime < CACHE_DURATION) {
        return data
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Save data to cache
  const saveToCache = useCallback((data: CachedData) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
      // localStorage might be full or unavailable
    }
  }, [])

  // Get tracking queue
  const getTrackingQueue = useCallback((): QueuedEvent[] => {
    if (typeof window === "undefined") return []
    try {
      const queue = localStorage.getItem(TRACKING_QUEUE_KEY)
      return queue ? JSON.parse(queue) : []
    } catch {
      return []
    }
  }, [])

  // Save tracking queue
  const saveTrackingQueue = useCallback((queue: QueuedEvent[]) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(queue))
    } catch {
      // localStorage might be full
    }
  }, [])

  // Sync tracking queue with server
  const syncTrackingQueue = useCallback(async () => {
    const queue = getTrackingQueue()
    if (queue.length === 0) return

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: queue }),
      })

      if (response.ok) {
        // Clear the queue after successful sync
        saveTrackingQueue([])
      }
    } catch {
      // Will retry on next sync
    }
  }, [getTrackingQueue, saveTrackingQueue])

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await fetch("/api/campaigns/active")
      if (!response.ok) throw new Error("Failed to fetch")
      
      const data = await response.json()
      setCampaigns(data.campaigns || [])
      saveToCache({
        campaigns: data.campaigns || [],
        cached_at: data.cached_at || new Date().toISOString(),
      })
      setIsOffline(false)
      
      // Sync any pending tracking events
      syncTrackingQueue()
    } catch {
      // Load from cache on error
      const cached = loadFromCache()
      if (cached) {
        setCampaigns(cached.campaigns)
        setIsOffline(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [saveToCache, loadFromCache, syncTrackingQueue])

  // Initialize
  useEffect(() => {
    // First try to load from cache for instant display
    const cached = loadFromCache()
    if (cached) {
      setCampaigns(cached.campaigns)
      setIsLoading(false)
    }

    // Then fetch fresh data
    fetchCampaigns()

    // Handle online/offline events
    const handleOnline = () => {
      setIsOffline(false)
      fetchCampaigns()
      syncTrackingQueue()
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [fetchCampaigns, loadFromCache, syncTrackingQueue])

  // Get banners for a specific slot
  const getBannersForSlot = useCallback((slotId: string): Banner[] => {
    const banners: Banner[] = []
    
    // Sort campaigns by priority (highest first)
    const sortedCampaigns = [...campaigns].sort((a, b) => b.priority - a.priority)
    
    for (const campaign of sortedCampaigns) {
      for (const banner of campaign.banners) {
        if (banner.ad_slot_id === slotId || !banner.ad_slot_id) {
          banners.push(banner)
        }
      }
    }
    
    return banners
  }, [campaigns])

  // Track impression
  const trackImpression = useCallback((campaignId: string, bannerId: string, slotId?: string) => {
    const today = new Date().toISOString().split("T")[0]
    
    if (isOffline || !navigator.onLine) {
      // Queue for later
      const queue = getTrackingQueue()
      const existing = queue.find(
        e => e.campaign_id === campaignId && 
             e.banner_id === bannerId && 
             e.event_date === today
      )
      
      if (existing) {
        existing.impressions++
      } else {
        queue.push({
          campaign_id: campaignId,
          banner_id: bannerId,
          ad_slot_id: slotId,
          impressions: 1,
          clicks: 0,
          event_date: today,
        })
      }
      saveTrackingQueue(queue)
    } else {
      // Send immediately
      fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          banner_id: bannerId,
          ad_slot_id: slotId,
          impressions: 1,
          clicks: 0,
        }),
      }).catch(() => {
        // Queue on failure
        const queue = getTrackingQueue()
        queue.push({
          campaign_id: campaignId,
          banner_id: bannerId,
          ad_slot_id: slotId,
          impressions: 1,
          clicks: 0,
          event_date: today,
        })
        saveTrackingQueue(queue)
      })
    }
  }, [isOffline, getTrackingQueue, saveTrackingQueue])

  // Track click
  const trackClick = useCallback((campaignId: string, bannerId: string, slotId?: string) => {
    const today = new Date().toISOString().split("T")[0]
    
    if (isOffline || !navigator.onLine) {
      const queue = getTrackingQueue()
      const existing = queue.find(
        e => e.campaign_id === campaignId && 
             e.banner_id === bannerId && 
             e.event_date === today
      )
      
      if (existing) {
        existing.clicks++
      } else {
        queue.push({
          campaign_id: campaignId,
          banner_id: bannerId,
          ad_slot_id: slotId,
          impressions: 0,
          clicks: 1,
          event_date: today,
        })
      }
      saveTrackingQueue(queue)
    } else {
      fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          banner_id: bannerId,
          ad_slot_id: slotId,
          impressions: 0,
          clicks: 1,
        }),
      }).catch(() => {
        const queue = getTrackingQueue()
        queue.push({
          campaign_id: campaignId,
          banner_id: bannerId,
          ad_slot_id: slotId,
          impressions: 0,
          clicks: 1,
          event_date: today,
        })
        saveTrackingQueue(queue)
      })
    }
  }, [isOffline, getTrackingQueue, saveTrackingQueue])

  return (
    <AdContext.Provider
      value={{
        campaigns,
        isLoading,
        isOffline,
        getBannersForSlot,
        trackImpression,
        trackClick,
      }}
    >
      {children}
    </AdContext.Provider>
  )
}

export function useAds() {
  const context = useContext(AdContext)
  if (!context) {
    throw new Error("useAds must be used within an AdProvider")
  }
  return context
}
