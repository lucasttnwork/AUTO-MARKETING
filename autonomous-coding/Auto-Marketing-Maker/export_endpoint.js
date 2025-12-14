
  // Export client data package
  app.get('/api/clients/:id/export', async (req, res) => {
    try {
      const { id } = req.params;

      // Get client data
      const clientResult = execQuery('SELECT * FROM clients WHERE id = ' + id);
      if (!clientResult || clientResult.length === 0 || clientResult[0].values.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const clientColumns = clientResult[0].columns;
      const clientValues = clientResult[0].values[0];
      const client = {};
      clientColumns.forEach((col, idx) => {
        client[col] = clientValues[idx];
      });

      // Parse JSON fields
      if (client.icp_data) {
        try { client.icp_data = JSON.parse(client.icp_data); } catch (e) {}
      }
      if (client.swot_data) {
        try { client.swot_data = JSON.parse(client.swot_data); } catch (e) {}
      }
      if (client.competitors_data) {
        try { client.competitors_data = JSON.parse(client.competitors_data); } catch (e) {}
      }
      if (client.brand_absorption_data) {
        try { client.brand_absorption_data = JSON.parse(client.brand_absorption_data); } catch (e) {}
      }
      if (client.constitution_overrides) {
        try { client.constitution_overrides = JSON.parse(client.constitution_overrides); } catch (e) {}
      }

      // Get campaigns for this client
      const campaignsResult = execQuery('SELECT * FROM campaigns WHERE client_id = ' + id);
      const campaigns = [];
      if (campaignsResult && campaignsResult.length > 0 && campaignsResult[0].values.length > 0) {
        const campColumns = campaignsResult[0].columns;
        campaignsResult[0].values.forEach(row => {
          const campaign = {};
          campColumns.forEach((col, idx) => {
            campaign[col] = row[idx];
          });
          // Parse JSON fields in campaigns
          ['angle', 'offer_structure', 'funnel_map', 'budget_allocation', 'schedule', 'ab_tests'].forEach(field => {
            if (campaign[field]) {
              try { campaign[field] = JSON.parse(campaign[field]); } catch (e) {}
            }
          });
          campaigns.push(campaign);
        });
      }

      // Get tasks for this client
      const tasksResult = execQuery('SELECT * FROM tasks WHERE client_id = ' + id);
      const tasks = [];
      if (tasksResult && tasksResult.length > 0 && tasksResult[0].values.length > 0) {
        const taskColumns = tasksResult[0].columns;
        tasksResult[0].values.forEach(row => {
          const task = {};
          taskColumns.forEach((col, idx) => {
            task[col] = row[idx];
          });
          tasks.push(task);
        });
      }

      // Get creative assets for campaigns
      const creativeAssets = [];
      if (campaigns.length > 0) {
        const campaignIds = campaigns.map(c => c.id).join(',');
        const assetsResult = execQuery('SELECT * FROM creative_assets WHERE campaign_id IN (' + campaignIds + ')');
        if (assetsResult && assetsResult.length > 0 && assetsResult[0].values.length > 0) {
          const assetColumns = assetsResult[0].columns;
          assetsResult[0].values.forEach(row => {
            const asset = {};
            assetColumns.forEach((col, idx) => {
              asset[col] = row[idx];
            });
            creativeAssets.push(asset);
          });
        }
      }

      // Get performance memory for this client
      const perfResult = execQuery('SELECT * FROM performance_memory WHERE client_id = ' + id);
      const performanceMemory = [];
      if (perfResult && perfResult.length > 0 && perfResult[0].values.length > 0) {
        const perfColumns = perfResult[0].columns;
        perfResult[0].values.forEach(row => {
          const perf = {};
          perfColumns.forEach((col, idx) => {
            perf[col] = row[idx];
          });
          performanceMemory.push(perf);
        });
      }

      // Get conversations for this client
      const convResult = execQuery('SELECT * FROM conversations WHERE client_id = ' + id);
      const conversations = [];
      if (convResult && convResult.length > 0 && convResult[0].values.length > 0) {
        const convColumns = convResult[0].columns;
        convResult[0].values.forEach(row => {
          const conv = {};
          convColumns.forEach((col, idx) => {
            conv[col] = row[idx];
          });
          if (conv.messages) {
            try { conv.messages = JSON.parse(conv.messages); } catch (e) {}
          }
          conversations.push(conv);
        });
      }

      // Build export package
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          version: '1.0',
          platform: 'AMA - Autonomous Marketing Agency'
        },
        client: client,
        campaigns: campaigns,
        tasks: tasks,
        creativeAssets: creativeAssets,
        performanceMemory: performanceMemory,
        conversations: conversations
      };

      // Set headers for JSON file download
      const filename = client.name.replace(/[^a-zA-Z0-9]/g, '_') + '_export_' + new Date().toISOString().split('T')[0] + '.json';
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

      res.json(exportData);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        error: 'Failed to export client data',
        message: error.message
      });
    }
  });
