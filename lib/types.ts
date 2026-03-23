// Database types for the advertising platform

export interface AdSlot {
  id: string
  name: string
  description: string | null
  width: number
  height: number
  position: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  client_name: string
  budget_usd: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Banner {
  id: string
  campaign_id: string
  ad_slot_id: string
  name: string
  image_url: string
  target_url: string
  alt_text: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  campaign?: Campaign
  ad_slot?: AdSlot
}

export interface TrackingEvent {
  id: string
  banner_id: string
  campaign_id: string
  ad_slot_id: string
  event_type: 'impression' | 'click'
  user_agent: string | null
  ip_address: string | null
  referrer: string | null
  created_at: string
  // Joined data
  banner?: Banner
  campaign?: Campaign
  ad_slot?: AdSlot
}

export interface PlatformConfig {
  id: string
  key: string
  value: string
  description: string | null
  created_at: string
  updated_at: string
}

// Analytics types
export interface CampaignStats {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  ctr: number
  budget_usd: number
  spent_usd: number
}

export interface DailyStats {
  date: string
  impressions: number
  clicks: number
}

export interface SlotStats {
  slot_id: string
  slot_name: string
  impressions: number
  clicks: number
  ctr: number
}
