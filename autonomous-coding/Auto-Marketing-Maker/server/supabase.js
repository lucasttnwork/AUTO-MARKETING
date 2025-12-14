import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;
let isConnected = false;
let connectionError = null;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Initialize Supabase client
export async function initializeSupabase() {
  console.log('📊 Initializing Supabase connection...');

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = 'Supabase credentials not found in environment variables';
    console.log('⚠️  ' + error);
    connectionError = error;
    return { success: false, error };
  }

  try {
    // Create public client (for client-side operations)
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase public client created');

    // Create admin client if service role key is available
    if (supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Supabase admin client created');
    }

    // Test connection with retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Use a simple health check - try to query the ai_models table or any system query
        // If we get an error about table not in schema cache, that's fine - connection worked
        const { data, error } = await supabase.from('ai_models').select('id').limit(1);

        // Connection succeeded if:
        // - No error (table exists and we got data or empty array)
        // - Error about table not found in schema (connection works, table just doesn't exist yet)
        // - PGRST116 (no rows found)
        if (!error || error.message?.includes('schema cache') || error.code === 'PGRST116' || error.code === '42P01') {
          isConnected = true;
          connectionError = null;
          console.log('✅ Supabase connection verified');
          break;
        }
        lastError = error;
      } catch (e) {
        // Network errors are actual connection failures
        if (e.message?.includes('fetch') || e.message?.includes('network') || e.message?.includes('ECONNREFUSED')) {
          lastError = e;
        } else {
          // Other errors likely mean we connected but something else went wrong
          isConnected = true;
          connectionError = null;
          console.log('✅ Supabase connection verified (with non-blocking error)');
          break;
        }
      }

      if (attempt < MAX_RETRIES) {
        console.log(`⚠️  Connection attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }

    if (!isConnected && lastError) {
      throw lastError;
    }

    // Initialize schema if needed
    await initializeSchema();

    return { success: true, client: supabase, adminClient: supabaseAdmin };

  } catch (error) {
    console.error('❌ Supabase initialization error:', error.message);
    connectionError = error.message;
    isConnected = false;
    return { success: false, error: error.message };
  }
}

// Initialize database schema
async function initializeSchema() {
  if (!supabaseAdmin) {
    console.log('⚠️  Admin client not available, skipping schema initialization');
    return;
  }

  console.log('📊 Checking/creating Supabase schema...');

  // Schema creation SQL - using PostgreSQL-specific features
  const schemaSql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      model_id UUID REFERENCES ai_models(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(conversation_id)
    );

    -- Templates table
    CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      report_type TEXT,
      title TEXT,
      content JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Task queue table
    CREATE TABLE IF NOT EXISTS task_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      metric_type TEXT,
      metric_value REAL,
      dimensions JSONB DEFAULT '{}',
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      key TEXT UNIQUE NOT NULL,
      value JSONB,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Calendar events table
    CREATE TABLE IF NOT EXISTS calendar_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  `;

  try {
    // Execute schema creation using admin client
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: schemaSql });

    if (error) {
      // If the rpc doesn't exist, try direct SQL execution via REST API
      console.log('⚠️  RPC not available, schema may need manual setup');
      // Check if tables exist instead
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!tableError && tables) {
        console.log('✅ Found existing tables:', tables.map(t => t.table_name).join(', '));
      }
    } else {
      console.log('✅ Supabase schema initialized successfully');
    }

    // Seed default data
    await seedDefaultData();

  } catch (error) {
    console.log('⚠️  Schema initialization note:', error.message);
  }
}

// Seed default data
async function seedDefaultData() {
  const client = supabaseAdmin || supabase;

  // Check if default AI models exist
  const { data: existingModels } = await client
    .from('ai_models')
    .select('id')
    .limit(1);

  if (!existingModels || existingModels.length === 0) {
    const defaultModels = [
      { model_string: 'openai/gpt-4.1-mini', provider: 'openrouter', display_name: 'GPT-4.1 Mini', description: 'Fast and efficient OpenAI model via OpenRouter', is_default: true },
      { model_string: 'claude-sonnet-4-20250514', provider: 'anthropic', display_name: 'Claude Sonnet 4', description: 'Anthropic Claude Sonnet - balanced performance' },
      { model_string: 'claude-opus-4-20250514', provider: 'anthropic', display_name: 'Claude Opus 4', description: 'Anthropic Claude Opus - highest capability' },
      { model_string: 'openai/gpt-4-turbo', provider: 'openrouter', display_name: 'GPT-4 Turbo', description: 'OpenAI GPT-4 Turbo via OpenRouter' },
      { model_string: 'anthropic/claude-3.5-sonnet', provider: 'openrouter', display_name: 'Claude 3.5 Sonnet (OpenRouter)', description: 'Claude 3.5 Sonnet via OpenRouter' },
      { model_string: 'google/gemini-pro', provider: 'openrouter', display_name: 'Gemini Pro', description: 'Google Gemini Pro via OpenRouter' }
    ];

    const { error } = await client.from('ai_models').insert(defaultModels);
    if (!error) {
      console.log('✅ Default AI models seeded');
    }
  }

  // Check if default user exists
  const { data: existingUsers } = await client
    .from('users')
    .select('id')
    .limit(1);

  if (!existingUsers || existingUsers.length === 0) {
    const { error } = await client.from('users').insert({
      email: 'admin@ama-platform.local',
      name: 'Admin User',
      role: 'admin',
      preferences: { theme: 'dark' }
    });
    if (!error) {
      console.log('✅ Default admin user created');
    }
  }
}

// Get Supabase client
export function getSupabaseClient() {
  return supabase;
}

// Get Supabase admin client
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

// Check connection status
export function isSupabaseConnected() {
  return isConnected;
}

// Get connection error if any
export function getConnectionError() {
  return connectionError;
}

// Get all tables from information schema
export async function getTableList() {
  const client = supabaseAdmin || supabase;

  try {
    // Try using RPC first (requires function to be created in Supabase)
    const { data, error } = await client.rpc('get_table_list');

    if (!error && data) {
      return data.map(t => t.table_name || t.tablename || t);
    }
  } catch (e) {
    // RPC not available, continue to fallback
  }

  // Fallback: Try querying pg_catalog.pg_tables
  try {
    const { data: tables, error: pgError } = await client
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (!pgError && tables) {
      return tables.map(t => t.tablename);
    }
  } catch (e) {
    // pg_catalog not accessible
  }

  // Last resort: Return list of known tables
  console.log('⚠️  Could not query table list from database, returning known tables');
  return [
    'users', 'projects', 'clients', 'campaigns', 'tasks',
    'conversations', 'ai_models', 'agent_generations', 'sops',
    'voting_sessions', 'creative_assets', 'market_intel',
    'notifications', 'trend_alerts', 'conversation_model_preferences',
    'templates', 'agents', 'intel_reports', 'task_queue',
    'analytics', 'settings', 'calendar_events'
  ];
}

// CRUD operations wrapper for compatibility
export const supabaseDb = {
  // Get all rows from a table
  async getAll(table, options = {}) {
    const client = supabaseAdmin || supabase;
    let query = client.from(table).select(options.select || '*');

    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        query = query.eq(key, value);
      }
    }

    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single row by id
  async getById(table, id) {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Insert row(s)
  async insert(table, data) {
    const client = supabaseAdmin || supabase;
    const { data: result, error } = await client
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return Array.isArray(data) ? result : result[0];
  },

  // Update row(s)
  async update(table, id, data) {
    const client = supabaseAdmin || supabase;
    const { data: result, error } = await client
      .from(table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return result[0];
  },

  // Delete row(s)
  async delete(table, id) {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Execute raw SQL (admin only)
  async rawQuery(sql) {
    if (!supabaseAdmin) {
      throw new Error('Admin client required for raw queries');
    }
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    if (error) throw error;
    return data;
  }
};

export default {
  initializeSupabase,
  getSupabaseClient,
  getSupabaseAdmin,
  isSupabaseConnected,
  getConnectionError,
  getTableList,
  supabaseDb
};
