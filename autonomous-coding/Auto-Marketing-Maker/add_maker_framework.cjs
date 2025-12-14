const fs = require('fs');

const serverPath = 'C:/Users/Lucas/OneDrive/Documentos/PROJETOS - CODE/GOOGLE ANTIGRAVITY PROJECTS/AUTO-Coding/Linear-Coding-Agent-Harness/autonomous-coding/Auto-Marketing-Maker/server/index.js';
const content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

// Find the insertion point (line 290 - after '  };' and before '// Helper function to detect complex')
const insertIndex = 290;

const makerCode = `
  // ========================
  // MAKER FRAMEWORK HELPERS
  // ========================

  // Helper function to detect requests that need MAKER voting
  const detectMAKERRequest = (message) => {
    const lowerMessage = message.toLowerCase();
    const makerPatterns = [
      /vote\\s+on/i,
      /need\\s+(different|multiple|several)\\s+(options|approaches|perspectives)/i,
      /what.*(best|better|optimal).*(approach|option|way|strategy)/i,
      /compare\\s+(different|multiple)\\s+(approaches|options|strategies)/i,
      /get\\s+(agent|expert)\\s+opinions/i,
      /maker\\s+framework/i,
      /agent\\s+voting/i,
      /multi.?agent\\s+(decision|consensus)/i,
      /which\\s+(is|would be)\\s+(best|better)/i,
      /should\\s+i\\s+(use|try|go with)/i,
      /decide\\s+between/i,
      /best\\s+(approach|strategy|option)\\s+for/i,
      /what\\s+do\\s+the\\s+agents\\s+think/i,
      /expert\\s+consensus/i,
      /headline.*for/i,
      /tagline.*for/i,
      /subject\\s+line.*for/i,
      /generate.*options/i
    ];

    for (const pattern of makerPatterns) {
      if (pattern.test(lowerMessage)) return true;
    }

    return false;
  };

  // Helper function to extract what type of voting is needed
  const extractMAKERContext = (message) => {
    const lowerMessage = message.toLowerCase();

    // Headline/copy voting
    if (lowerMessage.includes('headline') || lowerMessage.includes('tagline') || lowerMessage.includes('title')) {
      return {
        type: 'headline',
        topic: 'Headlines',
        agents: ['Copywriter Agent', 'Performance Agent', 'Brand Voice Agent', 'Psychology Agent'],
        optionCount: 4
      };
    }

    // Subject line voting
    if (lowerMessage.includes('subject line') || lowerMessage.includes('email subject')) {
      return {
        type: 'subject_line',
        topic: 'Email Subject Lines',
        agents: ['Email Expert Agent', 'Copywriter Agent', 'A/B Test Agent', 'Psychology Agent'],
        optionCount: 4
      };
    }

    // Strategy voting
    if (lowerMessage.includes('strategy') || lowerMessage.includes('approach') || lowerMessage.includes('plan')) {
      return {
        type: 'strategy',
        topic: 'Marketing Strategy',
        agents: ['Strategist Agent', 'Performance Agent', 'Competitor Analysis Agent', 'ROI Optimizer Agent'],
        optionCount: 3
      };
    }

    // Ad copy voting
    if (lowerMessage.includes('ad') || lowerMessage.includes('copy')) {
      return {
        type: 'ad_copy',
        topic: 'Ad Copy',
        agents: ['Copywriter Agent', 'Conversion Expert Agent', 'Brand Voice Agent', 'Facebook Ads Agent'],
        optionCount: 4
      };
    }

    // Default voting context
    return {
      type: 'general',
      topic: 'Marketing Decision',
      agents: ['Strategist Agent', 'Creator Agent', 'Critic Agent', 'Performance Agent'],
      optionCount: 3
    };
  };

  // Helper function to generate MAKER voting options based on context
  const generateMAKEROptions = (context) => {
    const optionTemplates = {
      headline: [
        { text: 'Transform Your Business in 30 Days', rationale: 'Direct benefit with urgency', style: 'Results-focused' },
        { text: "The Secret Top Brands Don't Want You to Know", rationale: 'Curiosity gap technique', style: 'Mystery-driven' },
        { text: "Stop Wasting Money on Ads That Don't Convert", rationale: 'Pain point address', style: 'Problem-aware' },
        { text: 'Join 10,000+ Marketers Who Doubled Their ROI', rationale: 'Social proof', style: 'Authority-based' }
      ],
      subject_line: [
        { text: "Your marketing isn't working. Here's why...", rationale: 'Pattern interrupt + curiosity', style: 'Provocative' },
        { text: '[New] The strategy that changed everything', rationale: 'Novelty + intrigue', style: 'Story-based' },
        { text: 'Quick question about your campaigns', rationale: 'Personal, conversational', style: 'Casual' },
        { text: '🚀 Ready to 3x your ROAS?', rationale: 'Emoji + specific outcome', style: 'Direct benefit' }
      ],
      strategy: [
        { text: 'Aggressive Growth Strategy', rationale: 'High budget, rapid scaling, broad targeting', style: 'Scale-first' },
        { text: 'Data-Driven Optimization', rationale: 'Test small, iterate, optimize for efficiency', style: 'Analytical' },
        { text: 'Niche Domination Approach', rationale: 'Focus on specific segment, build authority', style: 'Specialized' }
      ],
      ad_copy: [
        { text: 'Tired of campaigns that flop? Our AI-powered platform helps you create winning ads in minutes, not hours.', rationale: 'Pain → Solution', style: 'Problem-solver' },
        { text: "Marketing agencies charge $5k/month. We give you the same results for $99. Here's how...", rationale: 'Price comparison', style: 'Value proposition' },
        { text: 'I spent 10 years in advertising. Then I discovered this AI tool that does my job better than I ever could.', rationale: 'Personal story', style: 'UGC-style' },
        { text: '✓ More leads ✓ Less spend ✓ Better ROAS. Get started free today.', rationale: 'Benefit list + CTA', style: 'Scannable' }
      ],
      general: [
        { text: 'Option A: Conservative Approach', rationale: 'Lower risk, steady growth', style: 'Safe' },
        { text: 'Option B: Balanced Strategy', rationale: 'Mix of innovation and proven methods', style: 'Moderate' },
        { text: 'Option C: Aggressive Innovation', rationale: 'Higher risk, higher potential reward', style: 'Bold' }
      ]
    };

    return optionTemplates[context.type] || optionTemplates.general;
  };

  // Helper function to simulate MAKER voting process
  const executeMAKERVoting = (context, options) => {
    const votes = [];
    const voteCounts = new Array(options.length).fill(0);

    // Each agent votes with some variation
    context.agents.forEach((agent, agentIndex) => {
      // Simulate each agent having preference based on their expertise
      const preferredOption = agentIndex % options.length;
      const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

      votes.push({
        agent,
        option_index: preferredOption,
        confidence: parseFloat(confidence.toFixed(2)),
        reasoning: 'Selected "' + options[preferredOption].text.substring(0, 30) + '..." based on ' + options[preferredOption].style + ' approach'
      });

      voteCounts[preferredOption] += confidence;
    });

    // Calculate entropy
    const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
    let entropy = 0;
    voteCounts.forEach(count => {
      if (count > 0) {
        const p = count / totalVotes;
        entropy -= p * Math.log2(p);
      }
    });
    const maxEntropy = Math.log2(options.length);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Find winner
    const maxVote = Math.max(...voteCounts);
    const winnerIndex = voteCounts.indexOf(maxVote);
    const isRedFlagged = normalizedEntropy > 0.8;

    return {
      votes,
      voteCounts: voteCounts.map(v => parseFloat(v.toFixed(2))),
      entropy: parseFloat(normalizedEntropy.toFixed(3)),
      winnerIndex: isRedFlagged ? null : winnerIndex,
      isRedFlagged,
      redFlagReason: isRedFlagged ? 'High entropy (' + (normalizedEntropy * 100).toFixed(1) + '%) - agents disagree significantly' : null,
      winner: isRedFlagged ? null : options[winnerIndex]
    };
  };
`;

// Insert the new code
lines.splice(insertIndex, 0, makerCode);

// Write back to file
fs.writeFileSync(serverPath, lines.join('\n'));
console.log('MAKER framework functions added successfully!');
