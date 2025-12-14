const fs = require('fs');

const appPath = 'C:/Users/Lucas/OneDrive/Documentos/PROJETOS - CODE/GOOGLE ANTIGRAVITY PROJECTS/AUTO-Coding/Linear-Coding-Agent-Harness/autonomous-coding/Auto-Marketing-Maker/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// Find the error handler pattern and add done handler after it
const errorHandler = `} else if (data.type === 'error') {
                                setMessages(prev => {
                                  const newMessages = [...prev]
                                  newMessages[messageIndex] = {
                                    role: 'assistant',
                                    content: 'Sorry, I encountered an error: ' + data.error
                                  }
                                  return newMessages
                                })
                              }`;

const enhancedHandler = `} else if (data.type === 'error') {
                                setMessages(prev => {
                                  const newMessages = [...prev]
                                  newMessages[messageIndex] = {
                                    role: 'assistant',
                                    content: 'Sorry, I encountered an error: ' + data.error
                                  }
                                  return newMessages
                                })
                              } else if (data.type === 'done' && data.isRedFlagged && data.makerVoting) {
                                // Show red-flag resolution modal for high entropy voting
                                setRedFlagModal({
                                  reason: data.makerVoting.redFlagReason,
                                  entropy: data.makerVoting.entropy,
                                  options: data.makerVoting.options || [],
                                  votes: data.makerVoting.votes || [],
                                  voteCounts: data.makerVoting.voteCounts || []
                                })
                              }`;

if (content.includes(errorHandler) && !content.includes('data.isRedFlagged')) {
  content = content.replace(errorHandler, enhancedHandler);
  console.log('Added red-flag detection in error handler');
} else {
  console.log('Pattern not found or already added');
}

fs.writeFileSync(appPath, content);
console.log('Done!');
