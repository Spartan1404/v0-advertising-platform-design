-- Cubadebate Advertising Platform Schema
-- v0.1 - No RLS (no auth)

-- Ad Slots (vanes) configuration
CREATE TABLE IF NOT EXISTS ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'completed')),
  billing_type TEXT NOT NULL CHECK (billing_type IN ('time', 'impressions', 'clicks')),
  -- Time-based billing
  daily_rate DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  -- Impression-based billing
  price_per_impression DECIMAL(10,4),
  total_impressions_purchased INT,
  impressions_delivered INT DEFAULT 0,
  -- Click-based billing
  price_per_click DECIMAL(10,2),
  total_clicks_purchased INT,
  clicks_delivered INT DEFAULT 0,
  -- Expiry conditions
  max_days INT,
  max_impressions INT,
  max_clicks INT,
  -- Metadata
  total_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Banners (assets)
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ad_slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  click_url TEXT,
  file_type TEXT CHECK (file_type IN ('png', 'jpg', 'gif')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking events (impressions and clicks)
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  count INT DEFAULT 1,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  is_offline_sync BOOLEAN DEFAULT FALSE
);

-- Platform configuration
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_banners_campaign_id ON banners(campaign_id);
CREATE INDEX IF NOT EXISTS idx_banners_ad_slot_id ON banners(ad_slot_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_campaign_id ON tracking_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_banner_id ON tracking_events(banner_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_reported_at ON tracking_events(reported_at);

-- Default platform settings
INSERT INTO platform_config (key, value) VALUES
  ('billing', '{"price_per_impression": 0.01, "price_per_click": 0.10, "daily_rate_default": 100}'),
  ('campaign_limits', '{"min_days": 1, "max_days": 365, "max_active_campaigns": 10}')
ON CONFLICT (key) DO NOTHING;

-- Default ad slots
INSERT INTO ad_slots (name, width, height, description) VALUES
  ('Leaderboard', 728, 90, 'Top banner slot - horizontal banner at the top of the page'),
  ('Medium Rectangle', 300, 250, 'Sidebar ad slot - standard sidebar banner'),
  ('Wide Skyscraper', 160, 600, 'Tall sidebar slot - vertical banner for sidebars'),
  ('Large Rectangle', 336, 280, 'Content area slot - larger inline content banner'),
  ('Half Page', 300, 600, 'Large sidebar slot - prominent vertical banner')
ON CONFLICT DO NOTHING;
