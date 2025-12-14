const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');

// Fix agent generation INSERT
content = content.replace(
  `db.prepare(\`
          INSERT INTO agent_generations (agent_type, client_id, input_brief, system_prompt_used, output_content, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        \`).run(agentType, clientId, brief, systemPrompt, 'Generated via stream');`,
  `runQuery(\`
          INSERT INTO agent_generations (agent_type, client_id, input_brief, system_prompt_used, output_content, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        \`, [agentType, clientId, brief, systemPrompt, 'Generated via stream']);`
);

// Fix save-output INSERT
content = content.replace(
  `const result = db.prepare(\`
        INSERT INTO creative_assets (campaign_id, type, content, version, approval_status, created_at, updated_at)
        VALUES (?, ?, ?, 1, 'draft', datetime('now'), datetime('now'))
      \`).run(campaignId || null, agentType, content);`,
  `runQuery(\`
        INSERT INTO creative_assets (campaign_id, type, content, version, approval_status, created_at, updated_at)
        VALUES (?, ?, ?, 1, 'draft', datetime('now'), datetime('now'))
      \`, [campaignId || null, agentType, content]);
      const result = { lastInsertRowid: 0 }; // Placeholder`
);

// Fix history query with db.prepare().all()
content = content.replace(
  `const history = db.prepare(query).all(...params);`,
  `const history = getAllRows(query, params);`
);

// Fix prompts query
content = content.replace(
  `const presets = db.prepare('SELECT * FROM agent_prompts WHERE is_active = 1').all();`,
  `const presets = getAllRows('SELECT * FROM agent_prompts WHERE is_active = 1', []);`
);

fs.writeFileSync('server/index.js', content);
console.log('Fixed agent endpoint queries!');
