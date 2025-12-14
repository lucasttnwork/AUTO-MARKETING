// This script patches the agent generation to use OpenRouter when provider is 'openrouter'
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server', 'index.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Find and replace the generation logic
const oldGeneration = `const modelString = selectedModelInfo?.model_string || 'claude-sonnet-4-20250514';
      const modelProvider = selectedModelInfo?.provider || 'anthropic';

      if (anthropic) {
        // Use real Claude API if available
        try {
          const stream = await anthropic.messages.stream({
            model: modelString,
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: brief }]
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              res.write(\`data: \${JSON.stringify({ type: 'content', content: event.delta.text })}\\n\\n\`);
            }
          }

          // Log the generation
          runQuery(\`
            INSERT INTO agent_generations (agent_type, client_id, input_brief, system_prompt_used, output_content, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          \`, [agentType, clientId, brief, systemPrompt, 'Generated via stream']);
        } catch (apiError) {
          console.log('API error, falling back to demo mode:', apiError.message);
          useMockContent = true;
        }
      }

      if (useMockContent) {`;

const newGeneration = `const modelString = selectedModelInfo?.model_string || 'claude-sonnet-4-20250514';
      const modelProvider = selectedModelInfo?.provider || 'anthropic';

      let generationSuccessful = false;

      // Use OpenRouter if provider is openrouter and we have a key
      if (modelProvider === 'openrouter' && hasOpenRouterKey) {
        try {
          console.log('Using OpenRouter with model:', modelString);
          const stream = streamOpenRouterCompletion(modelString, systemPrompt, brief);

          for await (const chunk of stream) {
            res.write(\`data: \${JSON.stringify({ type: 'content', content: chunk })}\\n\\n\`);
          }

          // Log the generation
          runQuery(\`
            INSERT INTO agent_generations (agent_type, client_id, input_brief, system_prompt_used, output_content, model_used, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          \`, [agentType, clientId, brief, systemPrompt, 'Generated via OpenRouter stream', modelString]);

          generationSuccessful = true;
        } catch (apiError) {
          console.log('OpenRouter API error, falling back to demo mode:', apiError.message);
          useMockContent = true;
        }
      }
      // Use Anthropic if provider is anthropic and we have the SDK
      else if (modelProvider === 'anthropic' && anthropic) {
        // Use real Claude API if available
        try {
          const stream = await anthropic.messages.stream({
            model: modelString,
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: brief }]
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              res.write(\`data: \${JSON.stringify({ type: 'content', content: event.delta.text })}\\n\\n\`);
            }
          }

          // Log the generation
          runQuery(\`
            INSERT INTO agent_generations (agent_type, client_id, input_brief, system_prompt_used, output_content, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          \`, [agentType, clientId, brief, systemPrompt, 'Generated via stream']);

          generationSuccessful = true;
        } catch (apiError) {
          console.log('API error, falling back to demo mode:', apiError.message);
          useMockContent = true;
        }
      } else {
        // No API available, use mock
        useMockContent = true;
      }

      if (useMockContent && !generationSuccessful) {`;

content = content.replace(oldGeneration, newGeneration);

// Write the modified content
fs.writeFileSync(serverPath, content);
console.log('✅ Patched agent generation to use OpenRouter when provider is openrouter');
