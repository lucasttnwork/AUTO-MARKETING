const fs = require('fs');

const serverPath = 'C:/Users/Lucas/OneDrive/Documentos/PROJETOS - CODE/GOOGLE ANTIGRAVITY PROJECTS/AUTO-Coding/Linear-Coding-Agent-Harness/autonomous-coding/Auto-Marketing-Maker/server/index.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Find the pattern where we need to insert (before the detectComplexRequest check)
const searchPattern = `      // Check if this is a complex multi-step request that needs decomposition
      if (detectComplexRequest(message)) {`;

const makerHandlerCode = `      // Check if this is a request that needs MAKER framework voting
      if (detectMAKERRequest(message)) {
        const context = extractMAKERContext(message);
        const options = generateMAKEROptions(context);
        const votingResult = executeMAKERVoting(context, options);

        // Store voting result for potential resolution
        pendingActions.set(sessionId, {
          type: 'maker_voting',
          context,
          options,
          votingResult,
          originalRequest: message
        });

        // Build the MAKER voting response
        let makerResponse = '🗳️ **MAKER Framework Voting Session**\\n\\n';
        makerResponse += '📋 **Topic:** ' + context.topic + '\\n';
        makerResponse += '🤖 **Participating Agents:** ' + context.agents.join(', ') + '\\n\\n';
        makerResponse += '---\\n\\n';

        // Show options
        makerResponse += '**📝 Generated Options:**\\n\\n';
        options.forEach((opt, idx) => {
          makerResponse += '**Option ' + (idx + 1) + ':** "' + opt.text + '"\\n';
          makerResponse += '   • *Rationale:* ' + opt.rationale + '\\n';
          makerResponse += '   • *Style:* ' + opt.style + '\\n\\n';
        });

        makerResponse += '---\\n\\n';

        // Show voting process
        makerResponse += '**🗳️ Agent Voting Results:**\\n\\n';
        votingResult.votes.forEach((vote, idx) => {
          const optNum = vote.option_index + 1;
          const confPct = (vote.confidence * 100).toFixed(0);
          makerResponse += '• **' + vote.agent + '** voted for Option ' + optNum + ' (' + confPct + '% confidence)\\n';
        });

        makerResponse += '\\n';

        // Show vote counts
        makerResponse += '**📊 Vote Distribution:**\\n';
        votingResult.voteCounts.forEach((count, idx) => {
          const pct = ((count / votingResult.voteCounts.reduce((a,b) => a+b, 0)) * 100).toFixed(1);
          const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
          makerResponse += '   Option ' + (idx + 1) + ': ' + bar + ' ' + pct + '%\\n';
        });

        makerResponse += '\\n';
        makerResponse += '📈 **Entropy Score:** ' + (votingResult.entropy * 100).toFixed(1) + '% (lower = more consensus)\\n\\n';

        // Show result
        if (votingResult.isRedFlagged) {
          makerResponse += '---\\n\\n';
          makerResponse += '🚩 **RED FLAG TRIGGERED**\\n';
          makerResponse += 'Reason: ' + votingResult.redFlagReason + '\\n\\n';
          makerResponse += 'The agents could not reach consensus. **Human decision required.**\\n';
          makerResponse += 'Please select the option you prefer (e.g., "Select option 1").';
        } else {
          makerResponse += '---\\n\\n';
          makerResponse += '✅ **Winner: Option ' + (votingResult.winnerIndex + 1) + '**\\n';
          makerResponse += '"' + votingResult.winner.text + '"\\n\\n';
          makerResponse += '✨ Say "**Use it**" to proceed with this recommendation.';
        }

        // Stream the MAKER response
        const words = makerResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? words[i] : ' ' + words[i]);
          res.write(\`data: \${JSON.stringify({ type: 'content', content: chunk })}\\n\\n\`);
          await new Promise(resolve => setTimeout(resolve, 15));
        }

        res.write(\`data: \${JSON.stringify({ type: 'done', makerVoting: votingResult, isRedFlagged: votingResult.isRedFlagged })}\\n\\n\`);
        return res.end();
      }

`;

// Replace
if (content.includes(searchPattern)) {
  content = content.replace(searchPattern, makerHandlerCode + searchPattern);
  fs.writeFileSync(serverPath, content);
  console.log('MAKER handler code added successfully!');
} else {
  console.error('Pattern not found! Here are lines 815-825:');
  const lines = content.split('\n');
  console.log(lines.slice(814, 825).join('\n'));
}
