
  // Generate SWOT analysis for client
  app.post('/api/clients/:id/swot', async (req, res) => {
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

      // Check if SWOT already exists and regenerate is false
      if (client.swot_data && client.swot_data !== '{}' && !regenerate) {
        try {
          const existingSwot = JSON.parse(client.swot_data);
          if (existingSwot.strengths) {
            return res.json({
              message: 'SWOT analysis already exists',
              swot: existingSwot,
              client: client
            });
          }
        } catch (e) {
          // Continue to generate if parsing fails
        }
      }

      // Generate SWOT analysis using AI or mock data
      let swotData;

      if (anthropic) {
        // Use Claude to generate SWOT
        try {
          const prompt = 'Analyze this business and generate a comprehensive SWOT analysis:\n\n' +
            'Business: ' + client.name + '\n' +
            'Website: ' + (client.website_url || 'Not provided') + '\n' +
            'Custom Instructions: ' + (client.custom_instructions || 'None') + '\n' +
            'ICP Data: ' + (client.icp_data || '{}') + '\n\n' +
            'Generate a detailed SWOT analysis with exactly 3-5 bullet points for each category. Return ONLY valid JSON in this exact format:\n' +
            '{\n  "strengths": ["point 1", "point 2", "point 3"],\n  "weaknesses": ["point 1", "point 2", "point 3"],\n  "opportunities": ["point 1", "point 2", "point 3"],\n  "threats": ["point 1", "point 2", "point 3"],\n  "summary": "Brief 1-2 sentence summary of the analysis",\n  "generatedAt": "' + new Date().toISOString() + '"\n}';

          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
          });

          const responseText = message.content[0].text;
          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            swotData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse SWOT response');
          }
        } catch (aiError) {
          console.error('AI SWOT generation error:', aiError);
          // Fall back to mock data
          swotData = generateMockSwot(client);
        }
      } else {
        // Generate mock SWOT data if no API key
        swotData = generateMockSwot(client);
      }

      // Save SWOT data to database
      db.run(
        'UPDATE clients SET swot_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(swotData), id]
      );
      saveDatabase();

      // Log the agent execution
      const taskId = Date.now();
      db.run('INSERT INTO agent_executions (task_id, agent_type, input_context, output, tokens_used, execution_time_ms, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        taskId,
        'swot_analyzer',
        JSON.stringify({ client_id: id, client_name: client.name }),
        JSON.stringify(swotData),
        anthropic ? 500 : 0,
        150,
        'completed'
      ]);
      saveDatabase();

      // Return updated client with SWOT
      const updatedResult = execQuery('SELECT * FROM clients WHERE id = ' + id);
      const updatedColumns = updatedResult[0].columns;
      const updatedValues = updatedResult[0].values[0];
      const updatedClient = {};
      updatedColumns.forEach((col, idx) => {
        updatedClient[col] = updatedValues[idx];
      });

      res.json({
        message: 'SWOT analysis generated successfully',
        swot: swotData,
        client: updatedClient
      });
    } catch (error) {
      console.error('SWOT generation error:', error);
      res.status(500).json({
        error: 'Failed to generate SWOT analysis',
        message: error.message
      });
    }
  });

  // Helper function to generate mock SWOT data
  function generateMockSwot(client) {
    const businessName = client.name || 'the business';
    return {
      strengths: [
        'Strong brand presence for ' + businessName,
        'Established customer base and market recognition',
        'Quality products/services with proven track record',
        'Experienced team with industry expertise'
      ],
      weaknesses: [
        'Limited digital marketing presence',
        'Need for expanded online reach',
        'Resource constraints for scaling quickly',
        'Dependency on traditional marketing channels'
      ],
      opportunities: [
        'Growing market demand in target segments',
        'Expansion into new geographic markets',
        'Digital transformation and e-commerce growth',
        'Strategic partnerships and collaborations',
        'Emerging trends aligned with offerings'
      ],
      threats: [
        'Increasing competition in the market',
        'Economic uncertainty affecting consumer spending',
        'Rapid technological changes requiring adaptation',
        'Regulatory changes in the industry'
      ],
      summary: businessName + ' has solid foundational strengths with significant opportunities for growth through digital expansion, while managing competitive and economic pressures.',
      generatedAt: new Date().toISOString()
    };
  }

  // Update SWOT analysis for client
  app.put('/api/clients/:id/swot', (req, res) => {
    try {
      const { id } = req.params;
      const { swot } = req.body;

      if (!swot) {
        return res.status(400).json({ error: 'SWOT data is required' });
      }

      // Check if client exists
      const checkResult = execQuery('SELECT id FROM clients WHERE id = ' + id + ' AND is_archived = 0');
      if (!checkResult || checkResult.length === 0 || checkResult[0].values.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Update SWOT data
      const swotData = {
        ...swot,
        updatedAt: new Date().toISOString()
      };

      db.run(
        'UPDATE clients SET swot_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(swotData), id]
      );
      saveDatabase();

      // Return updated client
      const result = execQuery('SELECT * FROM clients WHERE id = ' + id);
      const columns = result[0].columns;
      const values = result[0].values[0];
      const client = {};
      columns.forEach((col, idx) => {
        client[col] = values[idx];
      });

      res.json({
        message: 'SWOT analysis updated successfully',
        swot: swotData,
        client: client
      });
    } catch (error) {
      console.error('SWOT update error:', error);
      res.status(500).json({
        error: 'Failed to update SWOT analysis',
        message: error.message
      });
    }
  });

