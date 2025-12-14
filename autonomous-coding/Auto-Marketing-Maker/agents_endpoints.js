
  // ==================== AGENTS HUB ENDPOINTS ====================

  // Get client context for agents
  app.get('/api/agents/context/:clientId', (req, res) => {
    try {
      const { clientId } = req.params;
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Assemble context from various sources
      const context = {
        client: {
          id: client.id,
          name: client.name,
          website: client.website_url
        },
        brandVoice: client.brand_absorption_data ? JSON.parse(client.brand_absorption_data) : null,
        icp: client.icp_data ? JSON.parse(client.icp_data) : null,
        swot: client.swot_data ? JSON.parse(client.swot_data) : null,
        competitors: client.competitors_data ? JSON.parse(client.competitors_data) : null,
        constitution: db.prepare('SELECT * FROM constitution WHERE client_id = ? OR client_id IS NULL').all(clientId),
        topPerformers: db.prepare(`
          SELECT * FROM performance_memory
          WHERE client_id = ? AND is_best_practice = 1
          ORDER BY performance_score DESC LIMIT 10
        `).all(clientId),
        activeCampaigns: db.prepare(`
          SELECT * FROM campaigns
          WHERE client_id = ? AND status = 'active'
        `).all(clientId)
      };

      res.json(context);
    } catch (error) {
      console.error('Error fetching client context:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stream generation endpoint for agents
  app.post('/api/agents/generate/stream', async (req, res) => {
    const { agentType, clientId, brief, preset, customPrompt } = req.body;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Get client data for context
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);

      if (!client) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Client not found' })}\n\n`);
        return res.end();
      }

      // Build system prompt based on agent type and preset
      const agentPrompts = {
        'email-sequence': 'You are an expert email copywriter specializing in marketing sequences. Generate compelling, conversion-focused emails.',
        'landing-page': 'You are a landing page copywriter expert. Create persuasive copy that converts visitors into customers.',
        'social-media': 'You are a social media content specialist. Create engaging, platform-optimized content.',
        'ad-copy': 'You are an advertising copywriter. Write high-converting ad copy for digital platforms.',
        'video-script': 'You are a video script writer. Create engaging video content with clear structure.',
        'content-strategy': 'You are a content strategist. Plan comprehensive content calendars and strategies.',
        'sms-whatsapp': 'You are a mobile messaging specialist. Write concise, impactful SMS and WhatsApp messages.',
        'brand-voice': 'You are a brand analyst. Analyze and define brand voice characteristics.',
        'icp-researcher': 'You are a customer research specialist. Define ideal customer profiles with deep insights.',
        'competitor-spy': 'You are a competitive intelligence analyst. Analyze competitors and identify opportunities.'
      };

      const presetTones = {
        'conversion': 'Focus on direct, action-oriented copy with strong CTAs.',
        'consultative': 'Use an educational, trust-building approach.',
        'institutional': 'Maintain a professional, brand-building tone.',
        'friendly': 'Be casual, relatable, and approachable.',
        'urgent': 'Create urgency and FOMO-driven messaging.'
      };

      const basePrompt = agentPrompts[agentType] || 'You are a marketing content expert.';
      const toneInstruction = presetTones[preset] || presetTones['conversion'];

      const systemPrompt = `${basePrompt}

${toneInstruction}

CLIENT CONTEXT:
- Client Name: ${client.name}
- Website: ${client.website_url || 'Not provided'}
${client.icp_data ? `- ICP Data: ${client.icp_data}` : ''}
${client.brand_absorption_data ? `- Brand Voice: ${client.brand_absorption_data}` : ''}

${customPrompt ? `ADDITIONAL INSTRUCTIONS:\n${customPrompt}` : ''}

Generate high-quality content based on the brief provided. Be specific, creative, and actionable.`;

      if (anthropic) {
        // Use real Claude API if available
        const stream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: brief }]
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ type: 'content', content: event.delta.text })}\n\n`);
          }
        }

        // Log the generation
        db.prepare(`
          INSERT INTO agent_generations (agent_type, client_id, input_brief, system_prompt_used, output_content, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).run(agentType, clientId, brief, systemPrompt, 'Generated via stream');

      } else {
        // Demo mode - generate mock content
        const mockContent = generateMockAgentContent(agentType, brief, client.name);

        // Simulate streaming by sending chunks
        const words = mockContent.split(' ');
        for (let i = 0; i < words.length; i++) {
          res.write(`data: ${JSON.stringify({ type: 'content', content: words[i] + ' ' })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

    } catch (error) {
      console.error('Agent generation error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  });

  // Save agent output to assets
  app.post('/api/agents/save-output', (req, res) => {
    try {
      const { clientId, agentType, content, brief, campaignId } = req.body;

      const result = db.prepare(`
        INSERT INTO creative_assets (campaign_id, type, content, version, approval_status, created_at, updated_at)
        VALUES (?, ?, ?, 1, 'draft', datetime('now'), datetime('now'))
      `).run(campaignId || null, agentType, content);

      res.json({
        success: true,
        assetId: result.lastInsertRowid,
        message: 'Content saved to assets'
      });
    } catch (error) {
      console.error('Error saving agent output:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get agent generation history
  app.get('/api/agents/history', (req, res) => {
    try {
      const { clientId, limit = 20 } = req.query;

      let query = 'SELECT * FROM agent_generations';
      const params = [];

      if (clientId) {
        query += ' WHERE client_id = ?';
        params.push(clientId);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const history = db.prepare(query).all(...params);
      res.json(history);
    } catch (error) {
      console.error('Error fetching generation history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get list of available agents with metadata
  app.get('/api/agents/list', (req, res) => {
    const agents = [
      { id: 'email-sequence', name: 'Email Sequence Agent', category: 'Copy', description: 'Generate email sequences' },
      { id: 'landing-page', name: 'Landing Page Agent', category: 'Copy', description: 'Create landing page copy' },
      { id: 'social-media', name: 'Social Media Agent', category: 'Copy', description: 'Social media content' },
      { id: 'ad-copy', name: 'Ad Copy Agent', category: 'Copy', description: 'Advertising copy' },
      { id: 'video-script', name: 'Video Script Agent', category: 'Copy', description: 'Video scripts' },
      { id: 'content-strategy', name: 'Content Strategy Agent', category: 'Strategic', description: 'Content planning' },
      { id: 'sms-whatsapp', name: 'SMS/WhatsApp Agent', category: 'Copy', description: 'Mobile messaging' },
      { id: 'brand-voice', name: 'Brand Voice Analyzer', category: 'Strategic', description: 'Brand analysis' },
      { id: 'icp-researcher', name: 'ICP Researcher', category: 'Strategic', description: 'Customer profiles' },
      { id: 'competitor-spy', name: 'Competitor Spy', category: 'Strategic', description: 'Competitive intel' }
    ];
    res.json(agents);
  });

  // Get prompt presets
  app.get('/api/agents/prompts', (req, res) => {
    try {
      const presets = db.prepare('SELECT * FROM agent_prompts WHERE is_active = 1').all();
      res.json(presets);
    } catch (error) {
      res.json([
        { id: 'conversion', name: 'Conversion-focused', description: 'Direct, action-oriented copy' },
        { id: 'consultative', name: 'Consultative', description: 'Educational approach' },
        { id: 'institutional', name: 'Institutional', description: 'Professional tone' },
        { id: 'friendly', name: 'Friendly', description: 'Casual communication' },
        { id: 'urgent', name: 'Urgent', description: 'FOMO-driven copy' }
      ]);
    }
  });
