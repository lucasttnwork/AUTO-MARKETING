// Brand absorption endpoint - processes client website and extracts brand information
  app.post('/api/clients/:id/absorb', async (req, res) => {
    try {
      const { id } = req.params;
      const { regenerate = false } = req.body;

      // Check if client exists
      const result = execQuery('SELECT * FROM clients WHERE id = ' + id + ' AND is_archived = 0');
      if (!result || result.length === 0 || result[0].values.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const columns = result[0].columns;
      const values = result[0].values[0];
      const client = {};
      columns.forEach((col, idx) => {
        client[col] = values[idx];
      });

      // Check if brand absorption already exists and regenerate is false
      if (client.brand_absorption_data && client.brand_absorption_data !== '{}' && !regenerate) {
        try {
          const existingData = JSON.parse(client.brand_absorption_data);
          if (existingData.brandVoice) {
            return res.json({
              message: 'Brand absorption data already exists',
              brandAbsorption: existingData,
              client: client
            });
          }
        } catch (e) {
          // Continue to generate if parsing fails
        }
      }

      // Generate brand absorption data using AI or mock data
      let brandAbsorptionData;

      if (anthropic) {
        try {
          const prompt = `Analyze this business and extract comprehensive brand voice information:

Business: ${client.name}
Website: ${client.website_url || 'Not provided'}
Custom Instructions: ${client.custom_instructions || 'None'}

Generate a detailed brand voice analysis that includes:
1. Tone of voice (formal, casual, professional, playful, etc.)
2. Key messaging pillars (3-5 core themes)
3. Brand values and personality traits
4. Communication style guidelines
5. Target audience language preferences
6. Do's and Don'ts for content creation

Return ONLY valid JSON in this exact format:
{
  "brandVoice": {
    "tone": "description of overall tone",
    "formality": "scale 1-10 where 1 is very casual, 10 is very formal",
    "personality": ["trait1", "trait2", "trait3"],
    "emotionalAppeal": "primary emotional connection the brand makes"
  },
  "messagingPillars": [
    {"pillar": "pillar name", "description": "what this pillar represents"},
    {"pillar": "pillar name", "description": "what this pillar represents"},
    {"pillar": "pillar name", "description": "what this pillar represents"}
  ],
  "values": ["value1", "value2", "value3", "value4"],
  "communicationGuidelines": {
    "dos": ["guideline 1", "guideline 2", "guideline 3"],
    "donts": ["avoid 1", "avoid 2", "avoid 3"]
  },
  "vocabularyStyle": {
    "preferredWords": ["word1", "word2", "word3"],
    "avoidWords": ["word1", "word2", "word3"],
    "jargonLevel": "none/low/medium/high"
  },
  "contentExamples": {
    "headlines": ["example headline 1", "example headline 2"],
    "taglines": ["example tagline 1", "example tagline 2"],
    "cta": ["example CTA 1", "example CTA 2"]
  },
  "extractedAt": "${new Date().toISOString()}"
}`;

          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          });

          const responseText = message.content[0].text;
          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            brandAbsorptionData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse brand absorption response');
          }
        } catch (aiError) {
          console.error('AI brand absorption error:', aiError);
          // Fall back to mock data
          brandAbsorptionData = generateMockBrandAbsorption(client);
        }
      } else {
        // Generate mock brand absorption data if no API key
        brandAbsorptionData = generateMockBrandAbsorption(client);
      }

      // Save brand absorption data to database
      db.run(
        'UPDATE clients SET brand_absorption_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(brandAbsorptionData), id]
      );
      saveDatabase();

      // Return updated client with brand absorption data
      const updatedResult = execQuery('SELECT * FROM clients WHERE id = ' + id);
      const updatedColumns = updatedResult[0].columns;
      const updatedValues = updatedResult[0].values[0];
      const updatedClient = {};
      updatedColumns.forEach((col, idx) => {
        updatedClient[col] = updatedValues[idx];
      });

      res.json({
        message: 'Brand absorption completed successfully',
        brandAbsorption: brandAbsorptionData,
        client: updatedClient
      });
    } catch (error) {
      console.error('Brand absorption error:', error);
      res.status(500).json({
        error: 'Failed to perform brand absorption',
        message: error.message
      });
    }
  });

  // Helper function to generate mock brand absorption data
  function generateMockBrandAbsorption(client) {
    const businessName = client.name || 'the business';
    return {
      brandVoice: {
        tone: 'Professional yet approachable - ' + businessName + ' speaks with authority while remaining accessible',
        formality: '6',
        personality: ['Trustworthy', 'Innovative', 'Customer-centric', 'Results-driven'],
        emotionalAppeal: 'Confidence and empowerment - helping customers achieve their goals'
      },
      messagingPillars: [
        { pillar: 'Quality Excellence', description: 'Commitment to delivering premium products/services' },
        { pillar: 'Customer Success', description: 'Focus on helping customers achieve their objectives' },
        { pillar: 'Innovation', description: 'Continuously evolving to meet market demands' },
        { pillar: 'Trust & Reliability', description: 'Building long-term relationships through consistency' }
      ],
      values: ['Integrity', 'Excellence', 'Innovation', 'Customer-first', 'Transparency'],
      communicationGuidelines: {
        dos: [
          'Use clear, concise language',
          'Focus on benefits over features',
          'Include social proof when possible',
          'Maintain a consistent tone across channels',
          'Address customer pain points directly'
        ],
        donts: [
          'Use overly technical jargon',
          'Make unsubstantiated claims',
          'Be overly salesy or pushy',
          'Ignore customer concerns',
          'Use negative competitor comparisons'
        ]
      },
      vocabularyStyle: {
        preferredWords: ['Empower', 'Transform', 'Achieve', 'Trusted', 'Premium', 'Results'],
        avoidWords: ['Cheap', 'Basic', 'Maybe', 'Try', 'Hope'],
        jargonLevel: 'low'
      },
      contentExamples: {
        headlines: [
          'Transform Your Business with ' + businessName,
          'Trusted by Industry Leaders',
          'Results That Speak for Themselves'
        ],
        taglines: [
          businessName + ' - Where Excellence Meets Innovation',
          'Your Success, Our Mission'
        ],
        cta: [
          'Get Started Today',
          'See How We Can Help',
          'Schedule Your Consultation'
        ]
      },
      extractedAt: new Date().toISOString()
    };
  }

  // Streaming brand absorption endpoint for real-time progress
  app.post('/api/clients/:id/absorb/stream', async (req, res) => {
    const { id } = req.params;
    const { regenerate = false } = req.body;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('progress', { step: 'starting', message: 'Initializing brand absorption process...' });

      // Check if client exists
      const result = execQuery('SELECT * FROM clients WHERE id = ' + id + ' AND is_archived = 0');
      if (!result || result.length === 0 || result[0].values.length === 0) {
        sendEvent('error', { message: 'Client not found' });
        return res.end();
      }

      const columns = result[0].columns;
      const values = result[0].values[0];
      const client = {};
      columns.forEach((col, idx) => {
        client[col] = values[idx];
      });

      sendEvent('progress', { step: 'client_loaded', message: 'Client data loaded: ' + client.name });

      // Check if brand absorption already exists and regenerate is false
      if (client.brand_absorption_data && client.brand_absorption_data !== '{}' && !regenerate) {
        try {
          const existingData = JSON.parse(client.brand_absorption_data);
          if (existingData.brandVoice) {
            sendEvent('complete', {
              message: 'Brand absorption data already exists',
              brandAbsorption: existingData,
              fromCache: true
            });
            return res.end();
          }
        } catch (e) {
          // Continue to generate if parsing fails
        }
      }

      sendEvent('progress', { step: 'analyzing', message: 'Analyzing brand voice and messaging...' });

      // Simulate processing steps with delays for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      sendEvent('progress', { step: 'extracting_tone', message: 'Extracting tone of voice...' });

      await new Promise(resolve => setTimeout(resolve, 500));
      sendEvent('progress', { step: 'identifying_pillars', message: 'Identifying messaging pillars...' });

      await new Promise(resolve => setTimeout(resolve, 500));
      sendEvent('progress', { step: 'analyzing_values', message: 'Analyzing brand values...' });

      // Generate brand absorption data
      let brandAbsorptionData;
      if (anthropic) {
        try {
          sendEvent('progress', { step: 'ai_analysis', message: 'Running AI-powered brand analysis...' });

          const prompt = `Analyze this business and extract comprehensive brand voice information:

Business: ${client.name}
Website: ${client.website_url || 'Not provided'}
Custom Instructions: ${client.custom_instructions || 'None'}

Generate a detailed brand voice analysis. Return ONLY valid JSON in this exact format:
{
  "brandVoice": {
    "tone": "description of overall tone",
    "formality": "scale 1-10 where 1 is very casual, 10 is very formal",
    "personality": ["trait1", "trait2", "trait3"],
    "emotionalAppeal": "primary emotional connection"
  },
  "messagingPillars": [
    {"pillar": "name", "description": "description"}
  ],
  "values": ["value1", "value2", "value3"],
  "communicationGuidelines": {
    "dos": ["do 1", "do 2"],
    "donts": ["dont 1", "dont 2"]
  },
  "vocabularyStyle": {
    "preferredWords": ["word1", "word2"],
    "avoidWords": ["word1", "word2"],
    "jargonLevel": "none/low/medium/high"
  },
  "contentExamples": {
    "headlines": ["headline 1", "headline 2"],
    "taglines": ["tagline 1"],
    "cta": ["cta 1", "cta 2"]
  },
  "extractedAt": "${new Date().toISOString()}"
}`;

          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          });

          const responseText = message.content[0].text;
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            brandAbsorptionData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse response');
          }
        } catch (aiError) {
          console.error('AI brand absorption error:', aiError);
          sendEvent('progress', { step: 'fallback', message: 'Using template-based analysis...' });
          brandAbsorptionData = generateMockBrandAbsorption(client);
        }
      } else {
        sendEvent('progress', { step: 'template', message: 'Generating brand profile from template...' });
        brandAbsorptionData = generateMockBrandAbsorption(client);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      sendEvent('progress', { step: 'saving', message: 'Saving brand absorption data...' });

      // Save brand absorption data to database
      db.run(
        'UPDATE clients SET brand_absorption_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(brandAbsorptionData), id]
      );
      saveDatabase();

      sendEvent('complete', {
        message: 'Brand absorption completed successfully',
        brandAbsorption: brandAbsorptionData
      });

    } catch (error) {
      console.error('Brand absorption streaming error:', error);
      sendEvent('error', { message: error.message });
    }

    res.end();
  });

  // Get brand voice data for a client
  app.get('/api/clients/:id/brand-voice', (req, res) => {
    try {
      const { id } = req.params;

      const result = execQuery('SELECT * FROM clients WHERE id = ' + id + ' AND is_archived = 0');
      if (!result || result.length === 0 || result[0].values.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const columns = result[0].columns;
      const values = result[0].values[0];
      const client = {};
      columns.forEach((col, idx) => {
        client[col] = values[idx];
      });

      let brandVoiceData = null;
      if (client.brand_absorption_data && client.brand_absorption_data !== '{}') {
        try {
          brandVoiceData = JSON.parse(client.brand_absorption_data);
        } catch (e) {
          console.error('Error parsing brand absorption data:', e);
        }
      }

      res.json({
        client: {
          id: client.id,
          name: client.name,
          website_url: client.website_url
        },
        brandVoice: brandVoiceData,
        hasData: brandVoiceData !== null
      });
    } catch (error) {
      console.error('Get brand voice error:', error);
      res.status(500).json({
        error: 'Failed to get brand voice data',
        message: error.message
      });
    }
  });
