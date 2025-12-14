const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL() {
  console.log('Running SQL in Supabase...');
  console.log('URL:', supabaseUrl);
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Make a direct REST API call to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql })
  });
  
  const result = await response.text();
  console.log('Response status:', response.status);
  console.log('Response:', result);
  
  if (response.status === 404) {
    console.log('\nThe exec_sql RPC function does not exist.');
    console.log('You need to run the SQL schema manually in Supabase SQL Editor.');
    console.log('Schema file location: supabase_schema.sql');
    console.log('\nAlternatively, we can try creating tables one by one...');
    await createTablesOneByOne();
  }
}

async function createTablesOneByOne() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  // Try to insert a test record into ai_models to verify table structure
  console.log('\nTrying to insert test data into ai_models...');
  
  const { data, error } = await supabase
    .from('ai_models')
    .insert({
      model_string: 'test-model-' + Date.now(),
      provider: 'openrouter',
      display_name: 'Test Model',
      description: 'Test description'
    })
    .select();
  
  if (error) {
    console.log('Error inserting:', error.message);
    console.log('\n=== IMPORTANT ===');
    console.log('The tables do not exist in Supabase yet.');
    console.log('Please run supabase_schema.sql in the Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard/project/ppgdxonvuvghdkukdtvd/sql/new');
    console.log('2. Copy the contents of supabase_schema.sql');
    console.log('3. Paste and run the SQL');
  } else {
    console.log('Insert successful:', data);
    // Clean up test data
    await supabase.from('ai_models').delete().eq('model_string', data[0].model_string);
    console.log('Test data cleaned up');
  }
}

runSQL();
