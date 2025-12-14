-- AMA Platform Supabase Schema
-- Run this SQL in the Supabase SQL Editor to create all tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  custom_instructions TEXT,
  role TEXT DEFAULT 'operator' CHECK(role IN ('admin', 'operator'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  website_url TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'archived')),
  brand_voice_path TEXT,
  assets_path TEXT,
  campaigns_path TEXT,
  custom_instructions TEXT,
  constitution_overrides JSONB DEFAULT '{}',
  icp_data JSONB DEFAULT '{}',
  swot_data JSONB DEFAULT '{}',
  competitors_data JSONB DEFAULT '[]',
  brand_absorption_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused', 'completed')),
  angle TEXT,
  offer_structure JSONB DEFAULT '{}',
  funnel_map JSONB DEFAULT '{}',
  budget_allocation JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  ab_tests JSONB DEFAULT '[]',
  target_roas REAL,
  actual_roas REAL,
  total_spend REAL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  launched_at TIMESTAMPTZ
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id),
  type TEXT CHECK(type IN ('creative', 'technical', 'strategic', 'optimization')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked', 'red_flagged')),
  assigned_agent TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  git_commit_sha TEXT
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  context_type TEXT DEFAULT 'general' CHECK(context_type IN ('general', 'client_specific', 'campaign_specific')),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_string TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('anthropic', 'openrouter')),
  display_name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent generations table
CREATE TABLE IF NOT EXISTS agent_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  input_brief TEXT,
  system_prompt_used TEXT,
  output_content TEXT,
  output_variations JSONB DEFAULT '[]',
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  model_used TEXT,
  user_rating INTEGER CHECK(user_rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOPs table
CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  steps JSONB DEFAULT '[]',
  prompts JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  voting_type TEXT DEFAULT 'first_to_ahead_by_k',
  options JSONB DEFAULT '[]',
  votes JSONB DEFAULT '[]',
  winner_index INTEGER,
  entropy_score REAL,
  is_red_flagged BOOLEAN DEFAULT FALSE,
  red_flag_reason TEXT,
  resolved_by_user_id UUID REFERENCES users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Creative assets table
CREATE TABLE IF NOT EXISTS creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('headline', 'body_copy', 'image_brief', 'video_script', 'email', 'sms', 'landing_page')),
  format TEXT CHECK(format IN ('1_1', '4_5', '9_16', '1_91_1', 'text_only')),
  content TEXT,
  version INTEGER DEFAULT 1,
  performance_score REAL,
  approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market intelligence table
CREATE TABLE IF NOT EXISTS market_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  source TEXT CHECK(source IN ('meta_ad_library', 'tiktok_creative_center', 'manual')),
  competitor_name TEXT,
  platform TEXT DEFAULT 'meta',
  ad_type TEXT,
  headline TEXT,
  body_copy TEXT,
  cta TEXT,
  creative_url TEXT,
  extracted_hook TEXT,
  extracted_angle TEXT,
  visual_style TEXT,
  status TEXT DEFAULT 'active',
  estimated_spend TEXT,
  performance_indicators JSONB DEFAULT '{}',
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT CHECK(type IN ('info', 'success', 'warning', 'error', 'red_flag', 'trend')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trend alerts table
CREATE TABLE IF NOT EXISTS trend_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_type TEXT CHECK(trend_type IN ('emerging_pattern', 'competitor_activity', 'cta_shift', 'ad_type_shift', 'theme_surge', 'performance_change')),
  trend_name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'critical')),
  data JSONB DEFAULT '{}',
  source TEXT,
  confidence_score REAL DEFAULT 0.5,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  is_actionable BOOLEAN DEFAULT TRUE,
  recommended_action TEXT,
  related_competitors JSONB DEFAULT '[]',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Conversation model preferences table
CREATE TABLE IF NOT EXISTS conversation_model_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  model_id UUID REFERENCES ai_models(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  type TEXT,
  content TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intel reports table
CREATE TABLE IF NOT EXISTS intel_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  report_type TEXT,
  title TEXT,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task queue table
CREATE TABLE IF NOT EXISTS task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_type TEXT,
  metric_value REAL,
  dimensions JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default AI models
INSERT INTO ai_models (model_string, provider, display_name, description, is_default)
VALUES
  ('openai/gpt-4.1-mini', 'openrouter', 'GPT-4.1 Mini', 'Fast and efficient OpenAI model via OpenRouter', true),
  ('claude-sonnet-4-20250514', 'anthropic', 'Claude Sonnet 4', 'Anthropic Claude Sonnet - balanced performance', false),
  ('claude-opus-4-20250514', 'anthropic', 'Claude Opus 4', 'Anthropic Claude Opus - highest capability', false),
  ('openai/gpt-4-turbo', 'openrouter', 'GPT-4 Turbo', 'OpenAI GPT-4 Turbo via OpenRouter', false),
  ('anthropic/claude-3.5-sonnet', 'openrouter', 'Claude 3.5 Sonnet (OpenRouter)', 'Claude 3.5 Sonnet via OpenRouter', false),
  ('google/gemini-pro', 'openrouter', 'Gemini Pro', 'Google Gemini Pro via OpenRouter', false)
ON CONFLICT (model_string) DO NOTHING;

-- Create default admin user
INSERT INTO users (email, name, role, preferences)
VALUES ('admin@ama-platform.local', 'Admin User', 'admin', '{"theme": "dark"}')
ON CONFLICT (email) DO NOTHING;
