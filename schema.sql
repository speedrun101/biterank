-- ============================================================================
-- FORKRANK (BITE RANK) - FINAL PRODUCTION DATABASE SCHEMA (SUPABASE / POSTGRES)
-- Note for AI Agent (Antigravity): 
-- 1. All tables, views, & triggers below ALREADY EXIST in Supabase.
-- 2. RLS is disabled so the anon client can read/write directly.
-- 3. `trigger_update_menu_item_stats` automatically recalculates `avg_rating`,
--    `rating_count`, `avg_prep_time_mins` (`prep_time_mins`), and `bayesian_score`
--    on `menu_items` whenever a row in `ratings` is inserted, updated, or deleted.
-- ============================================================================

-- 1. CANTEENS TABLE (Each hostel has separate rows for 'day' and 'night' canteens)
CREATE TABLE canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                        -- 'Day Canteen' or 'Night Canteen'
  bhawan TEXT NOT NULL,                      -- e.g., 'Azad Bhawan', 'Rajendra Bhawan'
  shift_type TEXT CHECK (shift_type IN ('day', 'night')) NOT NULL,
  is_open BOOLEAN DEFAULT true,
  opening_time TEXT DEFAULT '10:30 AM',      -- '10:30 AM' for day, '10:30 PM' for night
  closing_time TEXT DEFAULT '10:30 PM',      -- '10:30 PM' for day, '10:30 AM' for night
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MENU ITEMS TABLE (Tied to a specific canteen via canteen_id)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID REFERENCES canteens(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                        -- e.g., 'Chole Bhature', 'Aloo Paratha'
  category TEXT NOT NULL DEFAULT 'North Indian', -- Synced automatically with `cuisine`
  cuisine TEXT NOT NULL DEFAULT 'North Indian',  -- Synced automatically with `category`
  is_veg BOOLEAN DEFAULT true,               -- Powers the 'Veg' filter pill & VEG badge
  price INTEGER NOT NULL,                    -- Price in INR (₹)
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  avg_prep_time_mins INTEGER DEFAULT 6,      -- Auto-updated by ratings trigger
  prep_time_mins INTEGER DEFAULT 6,          -- Synced alias for Antigravity UI
  avg_rating NUMERIC(3,2) DEFAULT 0.00,      -- Auto-updated by ratings trigger
  rating_count INTEGER DEFAULT 0,            -- Auto-updated by ratings trigger
  bayesian_score NUMERIC(4,3) DEFAULT 0.000, -- Used for Leaderboard ranking
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROFILES TABLE (Instant @iitr.ac.in login; standalone UUID PK)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,                   -- e.g., 'Aarav Mehta'
  email TEXT UNIQUE NOT NULL,                -- Must end with 'iitr.ac.in'
  bhawan TEXT DEFAULT 'Azad Bhawan',         -- User's resident hostel
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RATINGS TABLE (Strictly 1 rating per user per menu_item)
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  prep_time_mins INTEGER CHECK (prep_time_mins > 0 AND prep_time_mins <= 120) DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, menu_item_id),       -- Composite PK / UNIQUE(user_id, menu_item_id)
  UNIQUE (user_id, menu_item_id)
);

-- 5. FAVORITES TABLE (Many-to-Many join between profiles and menu_items)
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, menu_item_id)
);

-- 6. CANTEEN STATS VIEW (Read-only view for Canteens Directory & Header Stats)
CREATE OR REPLACE VIEW canteen_stats AS
SELECT 
  c.id,
  c.name,
  c.bhawan,
  c.shift_type,
  c.is_open,
  c.opening_time,
  c.closing_time,
  c.created_at,
  COUNT(m.id)::INTEGER AS item_count,
  COUNT(m.id)::INTEGER AS total_items,
  COALESCE(ROUND(AVG(NULLIF(m.avg_rating, 0)), 1), 4.2) AS canteen_avg_rating,
  COALESCE(ROUND(AVG(NULLIF(m.avg_rating, 0)), 1), 4.2) AS avg_rating,
  COALESCE(ROUND(AVG(m.avg_prep_time_mins))::INTEGER, 7) AS canteen_avg_serve_mins
FROM canteens c
LEFT JOIN menu_items m ON c.id = m.canteen_id
GROUP BY c.id;

-- 7. INDEXES FOR FAST FILTERING & LOOKUPS
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_id ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);