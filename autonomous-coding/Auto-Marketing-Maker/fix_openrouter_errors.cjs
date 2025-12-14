const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

// Find and replace the OpenRouter error handling in agent generation
const oldCode = `} catch (apiError) {
          console.log('OpenRouter API error, falling back to demo mode:', apiError.message);
          useMockContent = true;
        }
      }
      // Use Anthropic if provider is anthropic and we have the SDK`;

const newCode = `} catch (apiError) {
          console.log('OpenRouter API error:', apiError.message);

          // Parse error to determine if we should show to user or fallback
          const errorMessage = apiError.message || '';

          // Check for invalid model (400 or 404 errors, or model not found messages)
          if (errorMessage.includes('400') || errorMessage.includes('404') ||
              errorMessage.toLowerCase().includes('model') ||
              errorMessage.toLowerCase().includes('not found') ||
              errorMessage.toLowerCase().includes('invalid')) {
            res.write(\`data: \${JSON.stringify({ type: 'error', error: \`Invalid model: The model "\${modelString}" is not available or not recognized by OpenRouter. Please select a different model.\` })}\\n\\n\`);
            return res.end();
          }

          // Check for rate limit (429 errors)
          if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
            res.write(\`data: \${JSON.stringify({ type: 'error', error: 'Rate limit exceeded. OpenRouter is temporarily limiting requests. Please wait a moment and try again.' })}\\n\\n\`);
            return res.end();
          }

          // For other errors, fallback to demo mode
          useMockContent = true;
        }
      }
      // Use Anthropic if provider is anthropic and we have the SDK`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('server/index.js', content);
  console.log('Successfully patched OpenRouter error handling in agent generation');
} else {
  console.log('Could not find the target code block to patch');
  console.log('Searching for similar patterns...');

  // Try to find similar patterns
  if (content.includes("OpenRouter API error, falling back to demo mode")) {
    console.log('Found the error message pattern');
  }
}
