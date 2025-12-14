const fs = require('fs');

const serverPath = 'C:/Users/Lucas/OneDrive/Documentos/PROJETOS - CODE/GOOGLE ANTIGRAVITY PROJECTS/AUTO-Coding/Linear-Coding-Agent-Harness/autonomous-coding/Auto-Marketing-Maker/server/index.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Update the done event to include options
const oldDone = "res.write(`data: ${JSON.stringify({ type: 'done', makerVoting: votingResult, isRedFlagged: votingResult.isRedFlagged })}\\n\\n`);";
const newDone = "res.write(`data: ${JSON.stringify({ type: 'done', makerVoting: { ...votingResult, options }, isRedFlagged: votingResult.isRedFlagged })}\\n\\n`);";

if (content.includes(oldDone)) {
  content = content.replace(oldDone, newDone);
  console.log('Updated done event to include options');
} else {
  console.log('Pattern not found, already updated?');
}

fs.writeFileSync(serverPath, content);
console.log('Done!');
