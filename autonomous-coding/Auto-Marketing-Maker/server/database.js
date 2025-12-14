import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'ama-platform.db');

let SQL;
let db;

// Initialize database
export async function initializeDatabase() {
  console.log('📊 Initializing database...');

  // Initialize SQL.js
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database');
  }

  console.log('📊 Creating database schema...');

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      preferences TEXT DEFAULT '{}',
      custom_instructions TEXT,
      role TEXT DEFAULT 'operator' CHECK(role IN ('admin', 'operator'))
    )
  `);

  // Clients table
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      website_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'archived')),
      brand_voice_path TEXT,
      assets_path TEXT,
      campaigns_path TEXT,
      custom_instructions TEXT,
      constitution_overrides TEXT DEFAULT '{}',
      icp_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_archived INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Campaigns table
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused', 'completed')),
      angle TEXT,
      offer_structure TEXT DEFAULT '{}',
      funnel_map TEXT DEFAULT '{}',
      budget_allocation TEXT DEFAULT '{}',
      schedule TEXT DEFAULT '{}',
      ab_tests TEXT DEFAULT '[]',
      target_roas REAL,
      actual_roas REAL,
      total_spend REAL DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      launched_at DATETIME,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Add ab_tests column if it doesn't exist (migration for existing databases)
  try {
    db.run(`ALTER TABLE campaigns ADD COLUMN ab_tests TEXT DEFAULT '[]'`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      campaign_id INTEGER,
      parent_task_id INTEGER,
      type TEXT CHECK(type IN ('creative', 'technical', 'strategic', 'optimization')),
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked', 'red_flagged')),
      assigned_agent TEXT,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      git_commit_sha TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
    )
  `);

  // Agent executions table
  db.run(`
    CREATE TABLE IF NOT EXISTS agent_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      agent_type TEXT CHECK(agent_type IN ('strategist', 'creator', 'critic', 'spy', 'super')),
      input_data TEXT DEFAULT '{}',
      output_data TEXT DEFAULT '{}',
      tokens_used INTEGER DEFAULT 0,
      execution_time_ms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  // Voting sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS voting_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      voting_type TEXT DEFAULT 'first_to_ahead_by_k',
      options TEXT DEFAULT '[]',
      votes TEXT DEFAULT '[]',
      winner_index INTEGER,
      entropy_score REAL,
      is_red_flagged INTEGER DEFAULT 0,
      red_flag_reason TEXT,
      resolved_by_user_id INTEGER,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
    )
  `);

  // Creative assets table
  db.run(`
    CREATE TABLE IF NOT EXISTS creative_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      task_id INTEGER,
      type TEXT CHECK(type IN ('headline', 'body_copy', 'image_brief', 'video_script', 'email', 'sms', 'landing_page')),
      format TEXT CHECK(format IN ('1_1', '4_5', '9_16', '1_91_1', 'text_only')),
      content TEXT,
      version INTEGER DEFAULT 1,
      performance_score REAL,
      approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  // Market intelligence table (Updated schema)
  db.run(`
    CREATE TABLE IF NOT EXISTS market_intel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
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
      performance_indicators TEXT DEFAULT '{}',
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);
  // Performance memory table
  db.run(`
    CREATE TABLE IF NOT EXISTS performance_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      campaign_id INTEGER,
      element_type TEXT CHECK(element_type IN ('hook', 'angle', 'offer', 'visual', 'audience', 'cta')),
      element_value TEXT,
      performance_score REAL,
      roas REAL,
      ctr REAL,
      cpc REAL,
      impressions INTEGER,
      is_best_practice INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  // SOPs table
  db.run(`
    CREATE TABLE IF NOT EXISTS sops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      steps TEXT DEFAULT '[]',
      prompts TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Client-specific SOP overrides table
  db.run(`
    CREATE TABLE IF NOT EXISTS client_sop_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      sop_id INTEGER NOT NULL,
      custom_steps TEXT DEFAULT '[]',
      custom_prompts TEXT DEFAULT '{}',
      override_description TEXT,
      is_active INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (sop_id) REFERENCES sops(id),
      UNIQUE(client_id, sop_id)
    )
  `);


  // SOP Executions table - tracks each SOP execution
  db.run(`
    CREATE TABLE IF NOT EXISTS sop_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL,
      client_id INTEGER,
      executed_by TEXT DEFAULT 'system',
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'paused')),
      total_steps INTEGER DEFAULT 0,
      completed_steps INTEGER DEFAULT 0,
      using_override INTEGER DEFAULT 0,
      override_version INTEGER,
      global_sop_version INTEGER,
      context TEXT DEFAULT '{}',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sop_id) REFERENCES sops(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // SOP Execution Steps table - tracks each step within an execution
  db.run(`
    CREATE TABLE IF NOT EXISTS sop_execution_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      step_action TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
      started_at DATETIME,
      completed_at DATETIME,
      notes TEXT,
      FOREIGN KEY (execution_id) REFERENCES sop_executions(id)
    )
  `);

  // Constitution table
  db.run(`
    CREATE TABLE IF NOT EXISTS constitution (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      type TEXT CHECK(type IN ('meta_policy', 'quality_standard', 'brand_guideline', 'custom')),
      rule_name TEXT NOT NULL,
      rule_content TEXT NOT NULL,
      severity TEXT DEFAULT 'warning' CHECK(severity IN ('warning', 'block')),
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Conversations table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      client_id INTEGER,
      title TEXT,
      context_type TEXT DEFAULT 'general' CHECK(context_type IN ('general', 'client_specific', 'campaign_specific')),
      messages TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Git commits table
  db.run(`
    CREATE TABLE IF NOT EXISTS git_commits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sha TEXT UNIQUE NOT NULL,
      task_id INTEGER,
      message TEXT NOT NULL,
      files_changed TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  // Usage tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS usage_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      agent_type TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cost_estimate REAL DEFAULT 0.0,
      operation_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Agent generations table (for Agents Hub)
  db.run(`
    CREATE TABLE IF NOT EXISTS agent_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_type TEXT NOT NULL,
      client_id INTEGER,
      campaign_id INTEGER,
      input_brief TEXT,
      system_prompt_used TEXT,
      output_content TEXT,
      output_variations TEXT DEFAULT '[]',
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      generation_time_ms INTEGER DEFAULT 0,
      model_used TEXT,
      user_rating INTEGER CHECK(user_rating BETWEEN 1 AND 5),
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT CHECK(type IN ('info', 'success', 'warning', 'error', 'red_flag', 'trend')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_url TEXT,
      action_label TEXT,
      is_read INTEGER DEFAULT 0,
      is_dismissed INTEGER DEFAULT 0,
      related_entity_type TEXT,
      related_entity_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Trend alerts table for market trend detection
  db.run(`
    CREATE TABLE IF NOT EXISTS trend_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trend_type TEXT CHECK(trend_type IN ('emerging_pattern', 'competitor_activity', 'cta_shift', 'ad_type_shift', 'theme_surge', 'performance_change')),
      trend_name TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'critical')),
      data TEXT DEFAULT '{}',
      source TEXT,
      confidence_score REAL DEFAULT 0.5,
      is_acknowledged INTEGER DEFAULT 0,
      is_actionable INTEGER DEFAULT 1,
      recommended_action TEXT,
      related_competitors TEXT DEFAULT '[]',
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      acknowledged_at DATETIME,
      expires_at DATETIME
    )
  `);


  // Iteration briefs table for storing generated briefs
  db.run(`
    CREATE TABLE IF NOT EXISTS iteration_briefs (
      id INTEGER PRIMARY KEY,
      client_id INTEGER,
      brief_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Competitor SWOT analysis table
  db.run(`
    CREATE TABLE IF NOT EXISTS competitor_swot (
      id INTEGER PRIMARY KEY,
      competitor_name TEXT NOT NULL,
      swot_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trend detection settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS trend_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Custom Prompt Presets table - for client-specific saved prompts
  db.run(`
    CREATE TABLE IF NOT EXISTS prompt_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      agent_type TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      UNIQUE(client_id, name)
    )
  `);

  // AI Models table - for model library management
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_string TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL CHECK(provider IN ('anthropic', 'openrouter')),
      display_name TEXT NOT NULL,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table - for organizing clients into projects
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Insert default trend settings if not exists
  const settingsCount = db.exec('SELECT COUNT(*) FROM trend_settings');
  if (settingsCount.length === 0 || settingsCount[0].values[0][0] === 0) {
    db.run(`INSERT OR IGNORE INTO trend_settings (setting_key, setting_value, description) VALUES
      ('min_confidence', '0.6', 'Minimum confidence score to generate alert'),
      ('competitor_activity_threshold', '5', 'Number of new ads to trigger competitor activity alert'),
      ('cta_shift_threshold', '20', 'Percentage change in CTA usage to trigger alert'),
      ('theme_surge_threshold', '30', 'Percentage increase in theme mentions to trigger alert'),
      ('check_frequency_hours', '24', 'How often to check for new trends'),
      ('alerts_enabled', '1', 'Enable/disable trend alerts')`);
  }

  // Insert default AI models if not exists
  const modelsCount = db.exec('SELECT COUNT(*) FROM ai_models');
  if (modelsCount.length === 0 || modelsCount[0].values[0][0] === 0) {
    db.run(`INSERT OR IGNORE INTO ai_models (model_string, provider, display_name, description, is_default, is_active) VALUES
      ('openai/gpt-4.1-mini', 'openrouter', 'GPT-4.1 Mini', 'Fast and efficient OpenAI model via OpenRouter', 1, 1),
      ('claude-sonnet-4-20250514', 'anthropic', 'Claude Sonnet 4', 'Anthropic Claude Sonnet - balanced performance', 0, 1),
      ('claude-opus-4-20250514', 'anthropic', 'Claude Opus 4', 'Anthropic Claude Opus - highest capability', 0, 1),
      ('openai/gpt-4-turbo', 'openrouter', 'GPT-4 Turbo', 'OpenAI GPT-4 Turbo via OpenRouter', 0, 1),
      ('anthropic/claude-3.5-sonnet', 'openrouter', 'Claude 3.5 Sonnet (OpenRouter)', 'Claude 3.5 Sonnet via OpenRouter', 0, 1),
      ('google/gemini-pro', 'openrouter', 'Gemini Pro', 'Google Gemini Pro via OpenRouter', 0, 1)`);
    console.log('✅ Default AI models seeded');
  }

  console.log('✅ Database schema created successfully');

  // Create default admin user if not exists
  const userCountResult = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = userCountResult.length > 0 && userCountResult[0].values.length > 0
    ? userCountResult[0].values[0][0]
    : 0;

  if (userCount === 0) {
    db.run(`
      INSERT INTO users (email, name, role, preferences)
      VALUES (?, ?, ?, ?)
    `, ['admin@ama-platform.local', 'Admin User', 'admin', '{"theme":"dark"}']);
    console.log('✅ Default admin user created');
  }

  // Run migrations for existing databases
  try {
    // Check if new columns exist, if not add them
    const columnsResult = db.exec('PRAGMA table_info(campaigns)');
    const columns = columnsResult.length > 0 && columnsResult[0].values
      ? columnsResult[0].values.map(row => row[1])
      : [];

    if (!columns.includes('total_spend')) {
      db.run('ALTER TABLE campaigns ADD COLUMN total_spend REAL DEFAULT 0');
      console.log('✅ Added total_spend column to campaigns table');
    }
    if (!columns.includes('impressions')) {
      db.run('ALTER TABLE campaigns ADD COLUMN impressions INTEGER DEFAULT 0');
      console.log('✅ Added impressions column to campaigns table');
    }
    if (!columns.includes('clicks')) {
      db.run('ALTER TABLE campaigns ADD COLUMN clicks INTEGER DEFAULT 0');
      console.log('✅ Added clicks column to campaigns table');
    }
    if (!columns.includes('conversions')) {
      db.run('ALTER TABLE campaigns ADD COLUMN conversions INTEGER DEFAULT 0');
      console.log('✅ Added conversions column to campaigns table');
    }
    if (!columns.includes('revenue')) {
      db.run('ALTER TABLE campaigns ADD COLUMN revenue REAL DEFAULT 0');
      console.log('✅ Added revenue column to campaigns table');
    }
  } catch (error) {
    console.log('⚠️  Migration warning:', error.message);
  }

  // Migration: Add swot_data, competitors_data, brand_absorption_data columns to clients table
  try {
    const clientColumnsResult = db.exec("PRAGMA table_info(clients)");
    const clientColumns = clientColumnsResult.length > 0
      ? clientColumnsResult[0].values.map(row => row[1])
      : [];

    if (!clientColumns.includes('swot_data')) {
      db.run("ALTER TABLE clients ADD COLUMN swot_data TEXT DEFAULT '{}'");
      console.log('✅ Added swot_data column to clients table');
    }

    if (!clientColumns.includes('competitors_data')) {
      db.run("ALTER TABLE clients ADD COLUMN competitors_data TEXT DEFAULT '[]'");
      console.log('✅ Added competitors_data column to clients table');
    }

    if (!clientColumns.includes('brand_absorption_data')) {
      db.run("ALTER TABLE clients ADD COLUMN brand_absorption_data TEXT DEFAULT '{}'");
      console.log('✅ Added brand_absorption_data column to clients table');
    }

    if (!clientColumns.includes('project_id')) {
      db.run("ALTER TABLE clients ADD COLUMN project_id INTEGER REFERENCES projects(id)");
      console.log('✅ Added project_id column to clients table');
    }
  } catch (error) {
    console.log('⚠️  Client migration warning:', error.message);
  }

    // Migration: Recreate creative_assets table with expanded type constraint
    try {
      const testResult = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='creative_assets'");
      if (testResult.length > 0 && testResult[0].values.length > 0) {
        const tableSql = testResult[0].values[0][0];
        if (tableSql && !tableSql.includes('landing_page')) {
          console.log('🔄 Migrating creative_assets table to support landing_page type...');
          const existingData = db.exec('SELECT * FROM creative_assets');
          db.run('DROP TABLE IF EXISTS creative_assets');
          db.run(`
            CREATE TABLE creative_assets (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              campaign_id INTEGER,
              task_id INTEGER,
              type TEXT CHECK(type IN ('headline', 'body_copy', 'image_brief', 'video_script', 'email', 'sms', 'landing_page')),
              format TEXT CHECK(format IN ('1_1', '4_5', '9_16', '1_91_1', 'text_only')),
              content TEXT,
              version INTEGER DEFAULT 1,
              performance_score REAL,
              approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
              FOREIGN KEY (task_id) REFERENCES tasks(id)
            )
          `);
          if (existingData.length > 0 && existingData[0].values && existingData[0].values.length > 0) {
            const cols = existingData[0].columns;
            for (const row of existingData[0].values) {
              const placeholders = cols.map(() => '?').join(', ');
              db.run(`INSERT INTO creative_assets (${cols.join(', ')}) VALUES (${placeholders})`, row);
            }
            console.log(`✅ Restored ${existingData[0].values.length} creative assets`);
          }
          console.log('✅ creative_assets table migrated successfully');
        }
      }
    } catch (migrationError) {
    console.log('⚠️ creative_assets migration notice:', migrationError.message);
    }

    // Migration: Recreate market_intel table with expanded schema
    try {
      const marketIntelResult = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='market_intel'");
      if (marketIntelResult.length > 0 && marketIntelResult[0].values.length > 0) {
        const tableSql = marketIntelResult[0].values[0][0];
        if (tableSql && !tableSql.includes('scraped_at')) {
          console.log('🔄 Migrating market_intel table with new columns...');
          db.run('DROP TABLE IF EXISTS market_intel');
          db.run(`
            CREATE TABLE market_intel (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              client_id INTEGER,
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
              performance_indicators TEXT DEFAULT '{}',
              scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (client_id) REFERENCES clients(id)
            )
          `);
          console.log('✅ market_intel table migrated successfully');
        }
      }
    } catch (migrationError) {
      console.log('⚠️ market_intel migration notice:', migrationError.message);
    }



  // Save database to file
  saveDatabase();

  return db;
}

// Save database to disk
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Get database connection
export async function getDatabase() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

// Wrapper for database queries that auto-saves
export function runQuery(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const result = db.run(sql, params);
  saveDatabase();
  return result;
}

export function execQuery(sql) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.exec(sql);
}

export function getAllRows(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function getRow(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const rows = getAllRows(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export default {
  initializeDatabase,
  getDatabase,
  saveDatabase,
  runQuery,
  execQuery,
  getAllRows,
  getRow
};
