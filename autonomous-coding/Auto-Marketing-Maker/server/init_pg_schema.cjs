const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Extract database connection info from Supabase URL
// Supabase connection string format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
// We need the SERVICE_ROLE_KEY as password

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

// The password for connecting to Supabase Postgres is NOT the service key
// It is a separate database password. We need to check if we have it.
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

if (!dbPassword) {
  console.log('SUPABASE_DB_PASSWORD not set.');
  console.log('To connect directly to PostgreSQL, you need the database password.');
  console.log('You can find this in Supabase Dashboard > Settings > Database > Connection string');
  console.log('\nAlternatively, run the schema SQL manually in Supabase SQL Editor.');
  console.log('Schema file: supabase_schema.sql');
  console.log('URL: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  process.exit(0);
}

const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function initSchema() {
  console.log('Connecting to Supabase PostgreSQL...');
  console.log('Project:', projectRef);
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    // Read and execute schema SQL
    const sqlPath = path.join(__dirname, '..', 'supabase_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing schema SQL...');
    await client.query(sql);
    console.log('Schema created successfully!');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\nCreated tables:');
    result.rows.forEach(row => console.log('  - ' + row.table_name));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

initSchema();
