const fs = require('fs');

const serverPath = 'server/index.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Find the section where demo mode check happens and needs updating
// We need to update the check from "if (!anthropic)" to also check for OpenRouter

const oldCheck = `      // If no API key available, send demo response in streaming fashion
      if (!anthropic) {`;

const newCheck = `      // Determine provider based on selected model
      const selectedModelInfo = chatModelString ? getRow('SELECT * FROM ai_models WHERE model_string = ?', [chatModelString]) : null;
      const chatModelProvider = selectedModelInfo?.provider || 'openrouter';

      // Check if we have a valid API provider available
      const hasValidProvider = (chatModelProvider === 'openrouter' && hasOpenRouterKey) || (chatModelProvider === 'anthropic' && anthropic);

      // If no API key available, send demo response in streaming fashion
      if (!hasValidProvider) {`;

if (content.includes(oldCheck)) {
  content = content.replace(oldCheck, newCheck);
  console.log('Replaced demo mode check');
} else {
  console.log('Old check not found');
}

// Now update the Claude API section to also handle OpenRouter
const oldClaudeSection = `      // Stream Claude API response
      try {
        const stream = await anthropic.messages.create({
          model: chatModelString,
          max_tokens: 1024,
          stream: true,
          system: \`You are the Super Agent for the AMA (Autonomous Marketing Agency) Platform. You are an expert marketing AI assistant that helps users with:

- Creating and managing marketing campaigns
- Client onboarding and brand voice analysis
- Creative content generation (ads, copy, scripts)
- Performance optimization and analytics
- Market intelligence and competitor analysis
- Task management and workflow automation

You have access to the entire AMA platform and can execute any marketing operation via natural language commands. Be helpful, professional, and concise. When users ask what you can do, list the major capabilities.\`,
          messages: [
            { role: 'user', content: message }
          ]
        });

        // Stream the response chunks
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            res.write(\`data: \${JSON.stringify({ type: 'content', content: text })}\\n\\n\`);
          }
        }

        res.write(\`data: \${JSON.stringify({ type: 'done' })}\\n\\n\`);
        res.end();

      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(\`data: \${JSON.stringify({ type: 'error', error: streamError.message })}\\n\\n\`);
        res.end();
      }`;

const newClaudeSection = `      // Define Super Agent system prompt
      const superAgentSystemPrompt = \`You are the Super Agent for the AMA (Autonomous Marketing Agency) Platform. You are an expert marketing AI assistant that helps users with:

- Creating and managing marketing campaigns
- Client onboarding and brand voice analysis
- Creative content generation (ads, copy, scripts)
- Performance optimization and analytics
- Market intelligence and competitor analysis
- Task management and workflow automation

You have access to the entire AMA platform and can execute any marketing operation via natural language commands. Be helpful, professional, and concise. When users ask what you can do, list the major capabilities.\`;

      // Use OpenRouter if provider is openrouter and we have a key
      if (chatModelProvider === 'openrouter' && hasOpenRouterKey) {
        try {
          console.log('Super Agent using OpenRouter with model:', chatModelString);
          const stream = streamOpenRouterCompletion(chatModelString, superAgentSystemPrompt, message);

          for await (const chunk of stream) {
            res.write(\`data: \${JSON.stringify({ type: 'content', content: chunk })}\\n\\n\`);
          }

          res.write(\`data: \${JSON.stringify({ type: 'done' })}\\n\\n\`);
          return res.end();
        } catch (apiError) {
          console.error('OpenRouter Super Agent error:', apiError);
          res.write(\`data: \${JSON.stringify({ type: 'error', error: apiError.message })}\\n\\n\`);
          return res.end();
        }
      }

      // Stream Claude API response (Anthropic)
      try {
        const stream = await anthropic.messages.create({
          model: chatModelString,
          max_tokens: 1024,
          stream: true,
          system: superAgentSystemPrompt,
          messages: [
            { role: 'user', content: message }
          ]
        });

        // Stream the response chunks
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            res.write(\`data: \${JSON.stringify({ type: 'content', content: text })}\\n\\n\`);
          }
        }

        res.write(\`data: \${JSON.stringify({ type: 'done' })}\\n\\n\`);
        res.end();

      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(\`data: \${JSON.stringify({ type: 'error', error: streamError.message })}\\n\\n\`);
        res.end();
      }`;

if (content.includes(oldClaudeSection)) {
  content = content.replace(oldClaudeSection, newClaudeSection);
  console.log('Replaced Claude API section with OpenRouter support');
} else {
  console.log('Old Claude section not found');
}

fs.writeFileSync(serverPath, content);
console.log('File saved');
