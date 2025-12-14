const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('Creating tables in Supabase...');
  
  // Create tables one by one using SQL
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ,
      preferences JSONB DEFAULT '{}',
      custom_instructions TEXT,
      role TEXT DEFAULT 'operator' CHECK(role IN ('admin', 'operator'))
    )`,
    
    // Projects table
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Clients table
    `CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      project_id UUID,
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
    )`,
    
    // Campaigns table
    `CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID,
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
    )`,
    
    // Tasks table
    `CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID,
      campaign_id UUID,
      parent_task_id UUID,
      type TEXT CHECK(type IN ('creative', 'technical', 'strategic', 'optimization')),
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked', 'red_flagged')),
      assigned_agent TEXT,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      git_commit_sha TEXT
    )`,
    
    // AI Models table
    `CREATE TABLE IF NOT EXISTS ai_models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model_string TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL CHECK(provider IN ('anthropic', 'openrouter')),
      display_name TEXT NOT NULL,
      description TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Conversations table
    `CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      client_id UUID,
      title TEXT,
      context_type TEXT DEFAULT 'general' CHECK(context_type IN ('general', 'client_specific', 'campaign_specific')),
      messages JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Agent generations table
    `CREATE TABLE IF NOT EXISTS agent_generations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_type TEXT NOT NULL,
      client_id UUID,
      campaign_id UUID,
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
    )`
  ];
  
  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        // Try direct approach - this requires a custom function
        console.log('Could not create ' + tableName + ': ' + error.message);
      } else {
        console.log('Created ' + tableName);
      }
    } catch (e) {
      console.log('Error creating ' + tableName + ': ' + e.message);
    }
  }
}

// Try to query existing tables
async function checkTables() {
  console.log('Checking existing tables...');
  
  const tablesToCheck = ['users', 'clients', 'ai_models', 'campaigns', 'tasks'];
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(table + ': NOT FOUND - ' + error.message);
    } else {
      console.log(table + ': EXISTS (' + (data?.length || 0) + ' rows)');
    }
  }
}

async function main() {
  await checkTables();
}

main();
