const fs = require('fs');

const content = fs.readFileSync('server/index.js', 'utf-8');

const oldCode = `const contentTypeInstruction = contentType && contentTypeInstructions[contentType] ? \`\\n\\nCONTENT TYPE REQUIREMENTS:\\n\${contentTypeInstructions[contentType]}\` : '';

      const systemPrompt = \`\${basePrompt}

\${toneInstruction}
\${contentTypeInstruction}

CLIENT CONTEXT:`;

const newCode = `const contentTypeInstruction = contentType && contentTypeInstructions[contentType] ? \`\\n\\nCONTENT TYPE REQUIREMENTS:\\n\${contentTypeInstructions[contentType]}\` : '';

      // A/B Variants instruction for email sequences
      const abVariantsInstruction = generateABVariants && agentType === 'email-sequence' ? \`

A/B SUBJECT LINE VARIANTS REQUIREMENT:
For EACH email, generate 3 distinct subject line variants labeled as:
- **Subject A (Curiosity):** Create intrigue and curiosity
- **Subject B (Benefit):** Focus on clear benefits and value
- **Subject C (Urgency):** Create time-sensitivity or FOMO

Each variant should use a different psychological approach while maintaining brand voice consistency.\` : '';

      const systemPrompt = \`\${basePrompt}

\${toneInstruction}
\${contentTypeInstruction}
\${abVariantsInstruction}

CLIENT CONTEXT:`;

if (content.includes(oldCode)) {
  const newContent = content.replace(oldCode, newCode);
  fs.writeFileSync('server/index.js', newContent);
  console.log('Successfully updated server/index.js');
} else {
  console.log('Pattern not found in server/index.js');
}
