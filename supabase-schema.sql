-- ==============================================================================
-- FUAHSE_🅸🅽🆂🅸🅳🅴🆁 - The Campus Mirror
-- Complete Production Database Migration & Schema for Supabase PostgreSQL
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Follower ID Sequence and Generator
CREATE SEQUENCE IF NOT EXISTS follower_id_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_follower_id()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('follower_id_seq');
  RETURN 'FOLLOWER-' || LPAD(next_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Default Categories
INSERT INTO categories (name, slug, is_active)
VALUES
  ('Gossip', 'gossip', true),
  ('Relationship', 'relationship', true),
  ('Entertainment', 'entertainment', true),
  ('Campus', 'campus', true),
  ('Celebrity', 'celebrity', true),
  ('Confession', 'confession', true),
  ('News / Tip', 'news-tip', true),
  ('Other', 'other', true)
ON CONFLICT (name) DO NOTHING;

-- 4. User Profiles Table (Followers)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT UNIQUE NOT NULL DEFAULT generate_follower_id(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 100),
  state TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'deactivated', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_follower_id ON profiles(follower_id);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(account_status);

-- 5. Admin Accounts & Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN')),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);

-- 6. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  follower_id TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('text', 'image', 'video', 'audio')),
  text_content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'posted')),
  rejection_reason TEXT,
  moderation_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  posted_by TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_follower_id ON submissions(follower_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_category_id ON submissions(category_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- 7. Submission Media Table
CREATE TABLE IF NOT EXISTS submission_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_media_submission_id ON submission_media(submission_id);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);

-- 9. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed System Settings
INSERT INTO system_settings (key, value)
VALUES
  ('general', '{"platform_name": "FUAHSE_🅸🅽🆂🅸🅳🅴🆁", "subtitle": "The Campus Mirror", "whatsapp_channel_url": "https://whatsapp.com/channel/0029Vazzxus65yDCGNFyav1R", "allow_submissions": true}'::jsonb),
  ('upload_limits', '{"max_image_mb": 10, "max_video_mb": 50, "max_audio_mb": 25}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 10. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_submissions_modtime
BEFORE UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_admin_roles_modtime
BEFORE UPDATE ON admin_roles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 11. Storage Bucket Creation (Run in Supabase Storage or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions-media', 'submissions-media', true) ON CONFLICT (id) DO NOTHING;
