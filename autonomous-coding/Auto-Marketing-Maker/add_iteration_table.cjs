const fs = require('fs');

// Read the database file
let content = fs.readFileSync('server/database.js', 'utf8');

// The new table to add
const newTable = `
  // Iteration briefs table for storing generated briefs
  db.run(\`
    CREATE TABLE IF NOT EXISTS iteration_briefs (
      id INTEGER PRIMARY KEY,
      client_id INTEGER,
      brief_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  \`);

`;

// Find the location to insert (after trend_alerts table, before trend_settings)
const insertPoint = '  // Trend detection settings table';
const insertIndex = content.indexOf(insertPoint);

if (insertIndex === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Insert the new table
content = content.slice(0, insertIndex) + newTable + content.slice(insertIndex);

// Write back
fs.writeFileSync('server/database.js', content);
console.log('Added iteration_briefs table to server/database.js');
