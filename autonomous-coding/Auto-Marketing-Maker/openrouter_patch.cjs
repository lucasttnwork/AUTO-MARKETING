// This script patches the server/index.js file to add OpenRouter support
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server', 'index.js');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add OpenRouter API key initialization after Anthropic init
const oldInit = `// Initialize Claude API client
let anthropic = null;
let hasValidApiKey = false;

// Store pending actions per session`;

const newInit = `// Initialize Claude API client
let anthropic = null;
let hasValidApiKey = false;

// Initialize OpenRouter API key
let openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
let hasOpenRouterKey = !!openrouterApiKey;
if (hasOpenRouterKey) {
  console.log('✅ OpenRouter API key loaded from environment');
}

// Store pending actions per session`;

content = content.replace(oldInit, newInit);

// 2. Add OpenRouter streaming helper function after pendingActions
const pendingActionsLine = `const pendingActions = new Map();`;
const openRouterHelper = `const pendingActions = new Map();

// OpenRouter streaming API helper
async function* streamOpenRouterCompletion(model, systemPrompt, userMessage) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${openrouterApiKey}\`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'AMA Platform'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`OpenRouter API error: \${response.status} - \${errorText}\`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }
}`;

content = content.replace(pendingActionsLine, openRouterHelper);

// Write the modified content
fs.writeFileSync(serverPath, content);
console.log('✅ Patched server/index.js with OpenRouter initialization and helper');
