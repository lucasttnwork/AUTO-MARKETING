const fs = require('fs');
let serverCode = fs.readFileSync('server/index.js', 'utf8');

const creativeEndpoints = `

  // ==================== CREATIVE ASSET ENDPOINTS ====================

  // Creative templates data
  const creativeTemplates = {
    headline: [
      { name: 'Problem-Solution', structure: '[Problem] + [Solution] + [Benefit]', example: 'Tired of slow websites? Our hosting loads in 0.5s. Get more conversions today.' },
      { name: 'Question Hook', structure: '[Question] + [Answer teaser]', example: 'Want to double your sales? Here\'s how top brands do it...' },
      { name: 'Number-Based', structure: '[Number] + [Benefit] + [Timeframe]', example: '5 Ways to Boost ROI by 300% This Quarter' },
      { name: 'Fear of Missing Out', structure: '[Limited offer] + [Urgency] + [CTA]', example: 'Only 24 hours left! Get 50% off before it\'s gone.' }
    ],
    body_copy: [
      { name: 'PAS Framework', structure: 'Problem > Agitate > Solution', example: 'Your ads aren\'t converting. Every day you\'re losing money. Our AI fixes that instantly.' },
      { name: 'AIDA Framework', structure: 'Attention > Interest > Desire > Action', example: 'Stop scrolling! This tool helped 10,000 marketers. You could be next. Try free today.' },
      { name: 'Before-After-Bridge', structure: 'Before state > After state > How to get there', example: 'Before: 2% conversion. After: 12% conversion. The bridge? Our platform.' }
    ],
    image_brief: [
      { name: 'Product Hero', structure: 'Product + lighting + background + mood', example: 'Product centered, soft studio lighting, gradient background, premium feel' },
      { name: 'Lifestyle Shot', structure: 'Person + action + setting + emotion', example: 'Young professional, using laptop, modern office, confident expression' },
      { name: 'Social Proof', structure: 'Testimonial + person + results', example: 'Customer photo with quote overlay, before/after metrics shown' }
    ],
    video_script: [
      { name: 'Hook-Story-Offer', structure: 'Hook (3s) > Story (15s) > Offer (5s) > CTA (2s)', example: 'Hook: "I made $10K in a week..." Story: Background, journey... Offer: Product reveal... CTA: "Link in bio"' },
      { name: 'Problem-Demo-Result', structure: 'Show problem > Demonstrate solution > Show results', example: 'Problem: Manual work... Demo: Tool in action... Result: Time saved' }
    ]
  };

  // Generate creative asset
  app.post('/api/creative/generate', async (req, res) => {
    try {
      const {
        campaign_id,
        task_id,
        type = 'headline',
        format = 'text_only',
        brief,
        target_audience,
        brand_voice,
        count = 3
      } = req.body;

      if (!brief) {
        return res.status(400).json({ error: 'Brief is required' });
      }

      const validTypes = ['headline', 'body_copy', 'image_brief', 'video_script', 'email', 'sms'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: 'Invalid type',
          valid_types: validTypes
        });
      }

      const validFormats = ['1_1', '4_5', '9_16', '1_91_1', 'text_only'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({
          error: 'Invalid format',
          valid_formats: validFormats
        });
      }

      const assets = [];

      for (let i = 0; i < count; i++) {
        let content = '';

        if (anthropic) {
          try {
            const response = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              system: \`You are an expert marketing copywriter. Generate a \${type} for the following brief.
Format: \${format}
Target audience: \${target_audience || 'General'}
Brand voice: \${brand_voice || 'Professional'}

Return ONLY the creative content, no explanations or meta-commentary.\`,
              messages: [
                { role: 'user', content: brief + (i > 0 ? ' (Provide a different variation)' : '') }
              ]
            });
            content = response.content[0].text;
          } catch (apiError) {
            console.error('Creative generation API error:', apiError);
            content = generateDemoCreative(type, format, i);
          }
        } else {
          content = generateDemoCreative(type, format, i);
        }

        // Save to database
        const insertStmt = db.prepare(\`
          INSERT INTO creative_assets (campaign_id, task_id, type, format, content, version, created_at)
          VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
        \`);
        insertStmt.run([campaign_id || null, task_id || null, type, format, content]);
        insertStmt.free();

        const idResult = db.exec('SELECT last_insert_rowid() as id');
        const assetId = idResult[0].values[0][0];
        saveDatabase();

        assets.push({
          id: assetId,
          campaign_id: campaign_id || null,
          task_id: task_id || null,
          type,
          format,
          content,
          version: 1,
          approval_status: 'pending',
          created_at: new Date().toISOString()
        });
      }

      res.status(201).json({
        count: assets.length,
        assets
      });

    } catch (error) {
      console.error('Creative generation error:', error);
      res.status(500).json({
        error: 'Failed to generate creative',
        message: error.message
      });
    }
  });

  // Demo creative generator
  function generateDemoCreative(type, format, variation) {
    const demos = {
      headline: [
        'Transform Your Marketing With AI-Powered Insights',
        'Stop Wasting Ad Spend - Start Converting Today',
        'The Secret to 10x ROAS Revealed'
      ],
      body_copy: [
        'Struggling to scale your campaigns? Our AI analyzes millions of data points to find what works. Join 5,000+ marketers who increased conversions by 300%. Start your free trial now.',
        'Every dollar you spend on ads should work harder. Our platform optimizes bids, audiences, and creatives in real-time. See results in 24 hours or your money back.',
        'Marketing shouldn\'t be guesswork. Let AI handle the heavy lifting while you focus on strategy. Trusted by Fortune 500 brands.'
      ],
      image_brief: [
        'Hero shot: Product on clean white background, soft shadows, minimal styling. Focus on premium quality and simplicity.',
        'Lifestyle scene: Person using product in modern workspace, natural lighting, candid moment capturing ease of use.',
        'Comparison visual: Before/after split screen showing transformation, clear metrics overlay, professional typography.'
      ],
      video_script: [
        'HOOK (0-3s): "I was spending $10K/month on ads with nothing to show for it..."\nSTORY (3-18s): Cut to laptop screen showing analytics. "Then I discovered this tool. In just 2 weeks, my ROAS went from 1.2 to 4.5."\nOFFER (18-23s): Product demo montage with features highlighted.\nCTA (23-25s): "Link in bio to start your free trial."',
        'HOOK (0-3s): Close-up of frustrated marketer staring at screen.\nPROBLEM (3-10s): "Another failed campaign. Sound familiar?"\nSOLUTION (10-20s): Screen transitions to our platform. "Our AI does what takes humans hours - in seconds."\nRESULT (20-25s): Metrics showing growth. "Ready to transform your results?"'
      ],
      email: [
        'Subject: Your campaign is leaving money on the table\\n\\nHi [Name],\\n\\nI noticed you\'re running Facebook ads. Here\'s what the data shows:\\n\\n- Your CTR is below industry average\\n- Your creative is getting fatigued\\n- There\'s untapped audience potential\\n\\nWant me to show you exactly how to fix it? Reply "yes" and I\'ll send over a free audit.\\n\\nBest,\\n[Your Name]',
        'Subject: Quick win for your Q4 campaigns\\n\\nHey [Name],\\n\\nQ4 is here and CPMs are rising. But here\'s the thing - smart marketers are actually spending LESS and getting MORE.\\n\\nThe secret? AI-optimized creative testing.\\n\\nI\'d love to show you how [Company] increased ROAS by 280% last Black Friday.\\n\\n[CTA Button]'
      ],
      sms: [
        '[Brand]: Flash sale! 50% off everything for the next 4 hours. Use code FLASH50 at checkout. Shop now: [link]',
        'Your cart is waiting! Complete your order in the next 2 hours and get free shipping. [link]'
      ]
    };

    const typeContent = demos[type] || demos.headline;
    return typeContent[variation % typeContent.length];
  }

  // Get creative assets
  app.get('/api/creative/assets', (req, res) => {
    try {
      const { campaign_id, type, format, approval_status, limit = 50 } = req.query;

      let query = \`
        SELECT ca.*, c.name as campaign_name
        FROM creative_assets ca
        LEFT JOIN campaigns c ON ca.campaign_id = c.id
        WHERE 1=1
      \`;

      if (campaign_id) query += ' AND ca.campaign_id = ' + campaign_id;
      if (type) query += " AND ca.type = '" + type.replace(/'/g, "''") + "'";
      if (format) query += " AND ca.format = '" + format.replace(/'/g, "''") + "'";
      if (approval_status) query += " AND ca.approval_status = '" + approval_status.replace(/'/g, "''") + "'";
      query += ' ORDER BY ca.created_at DESC LIMIT ' + parseInt(limit);

      const result = execQuery(query);

      if (!result || result.length === 0) {
        return res.json([]);
      }

      const columns = result[0].columns;
      const assets = result[0].values.map(row => {
        const asset = {};
        columns.forEach((col, idx) => {
          asset[col] = row[idx];
        });
        return asset;
      });

      res.json(assets);
    } catch (error) {
      console.error('Get creative assets error:', error);
      res.status(500).json({
        error: 'Failed to get creative assets',
        message: error.message
      });
    }
  });

  // Get single creative asset
  app.get('/api/creative/assets/:id', (req, res) => {
    try {
      const { id } = req.params;
      const result = execQuery('SELECT * FROM creative_assets WHERE id = ' + id);

      if (!result || result.length === 0 || result[0].values.length === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const columns = result[0].columns;
      const values = result[0].values[0];
      const asset = {};
      columns.forEach((col, idx) => {
        asset[col] = values[idx];
      });

      res.json(asset);
    } catch (error) {
      console.error('Get creative asset error:', error);
      res.status(500).json({
        error: 'Failed to get creative asset',
        message: error.message
      });
    }
  });

  // Iterate on creative asset (create new version)
  app.post('/api/creative/assets/:id/iterate', async (req, res) => {
    try {
      const { id } = req.params;
      const { feedback, direction } = req.body;

      // Get original asset
      const result = execQuery('SELECT * FROM creative_assets WHERE id = ' + id);
      if (!result || result.length === 0 || result[0].values.length === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const columns = result[0].columns;
      const values = result[0].values[0];
      const original = {};
      columns.forEach((col, idx) => {
        original[col] = values[idx];
      });

      // Generate new version
      let newContent = '';
      if (anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: 'You are an expert marketing copywriter. Create an improved version of the given creative.',
            messages: [
              { role: 'user', content: \`Original creative:\\n\${original.content}\\n\\nFeedback: \${feedback || 'Make it better'}\\nDirection: \${direction || 'More compelling'}\\n\\nProvide an improved version:\` }
            ]
          });
          newContent = response.content[0].text;
        } catch (apiError) {
          newContent = original.content + ' [Iterated version - improved]';
        }
      } else {
        newContent = original.content + ' [Iterated version - improved]';
      }

      // Get max version for this asset chain
      const versionResult = execQuery(\`
        SELECT MAX(version) as max_version FROM creative_assets
        WHERE campaign_id = \${original.campaign_id || 'NULL'} AND type = '\${original.type}' AND format = '\${original.format}'
      \`);
      const maxVersion = versionResult[0]?.values[0]?.[0] || 1;

      // Create new version
      const insertStmt = db.prepare(\`
        INSERT INTO creative_assets (campaign_id, task_id, type, format, content, version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      \`);
      insertStmt.run([
        original.campaign_id,
        original.task_id,
        original.type,
        original.format,
        newContent,
        maxVersion + 1
      ]);
      insertStmt.free();

      const idResult = db.exec('SELECT last_insert_rowid() as id');
      const newAssetId = idResult[0].values[0][0];
      saveDatabase();

      res.status(201).json({
        id: newAssetId,
        campaign_id: original.campaign_id,
        task_id: original.task_id,
        type: original.type,
        format: original.format,
        content: newContent,
        version: maxVersion + 1,
        previous_version_id: parseInt(id),
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Creative iteration error:', error);
      res.status(500).json({
        error: 'Failed to iterate creative',
        message: error.message
      });
    }
  });

  // Update creative asset approval status
  app.patch('/api/creative/assets/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { approval_status, performance_score } = req.body;

      const updates = [];
      if (approval_status) {
        updates.push("approval_status = '" + approval_status.replace(/'/g, "''") + "'");
      }
      if (performance_score !== undefined) {
        updates.push('performance_score = ' + parseFloat(performance_score));
      }
      updates.push("updated_at = datetime('now')");

      const query = 'UPDATE creative_assets SET ' + updates.join(', ') + ' WHERE id = ' + id;
      db.run(query);
      saveDatabase();

      // Get updated asset
      const result = execQuery('SELECT * FROM creative_assets WHERE id = ' + id);
      if (!result || result.length === 0 || result[0].values.length === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const columns = result[0].columns;
      const values = result[0].values[0];
      const asset = {};
      columns.forEach((col, idx) => {
        asset[col] = values[idx];
      });

      res.json(asset);
    } catch (error) {
      console.error('Update creative asset error:', error);
      res.status(500).json({
        error: 'Failed to update creative asset',
        message: error.message
      });
    }
  });

  // Get creative templates
  app.get('/api/creative/templates', (req, res) => {
    try {
      const { type } = req.query;

      if (type && creativeTemplates[type]) {
        return res.json({
          type,
          templates: creativeTemplates[type]
        });
      }

      res.json({
        types: Object.keys(creativeTemplates),
        templates: creativeTemplates
      });
    } catch (error) {
      console.error('Get creative templates error:', error);
      res.status(500).json({
        error: 'Failed to get creative templates',
        message: error.message
      });
    }
  });

  // ==================== END CREATIVE ASSET ENDPOINTS ====================
`;

const marker = '// ==================== END VOTING SESSION ENDPOINTS ====================';
serverCode = serverCode.replace(marker, marker + creativeEndpoints);

fs.writeFileSync('server/index.js', serverCode);
console.log('Creative endpoints added successfully');
