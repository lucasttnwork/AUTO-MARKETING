const fs = require('fs');

const appPath = 'C:/Users/Lucas/OneDrive/Documentos/PROJETOS - CODE/GOOGLE ANTIGRAVITY PROJECTS/AUTO-Coding/Linear-Coding-Agent-Harness/autonomous-coding/Auto-Marketing-Maker/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add red-flag modal state after confirmDialog state
const statePattern = `const [confirmDialog, setConfirmDialog] = useState(null)`;
const newState = `const [confirmDialog, setConfirmDialog] = useState(null)
  const [redFlagModal, setRedFlagModal] = useState(null)`;

if (content.includes(statePattern) && !content.includes('redFlagModal')) {
  content = content.replace(statePattern, newState);
  console.log('Added redFlagModal state');
}

// 2. Add the modal JSX after the confirmation dialog
const confirmDialogEnd = `          {/* Confirmation Dialog (Test #133) */}
          {confirmDialog && (`;

const redFlagModalJSX = `          {/* Red-Flag Resolution Modal (Test #137) */}
          {redFlagModal && (
            <div
              className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="redflag-dialog-title"
              aria-describedby="redflag-dialog-desc"
            >
              <div className="w-[32rem] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🚩</span>
                  <div>
                    <h3 id="redflag-dialog-title" className="text-xl font-bold text-red-600">Red Flag: Human Decision Required</h3>
                    <p className="text-sm text-slate-500">{redFlagModal.reason}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p id="redflag-dialog-desc" className="text-slate-600 dark:text-slate-400 mb-2">
                    The agents could not reach consensus. Please review the options and select your preference:
                  </p>
                  <div className="text-sm text-slate-500 mb-2">
                    Entropy Score: <span className="font-mono text-red-500">{(redFlagModal.entropy * 100).toFixed(1)}%</span> (higher = more disagreement)
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Options</h4>
                  {redFlagModal.options?.map((option, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const selected = redFlagModal.options[idx];
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: \`✅ **Resolution Selected**\\n\\nYou selected Option \${idx + 1}: "\${selected.text}"\\n\\n*Rationale:* \${selected.rationale}\\n\\nProceeding with this choice.\`
                        }]);
                        setRedFlagModal(null);
                      }}
                      className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium mb-1">Option {idx + 1}</div>
                          <div className="text-slate-700 dark:text-slate-300">"{option.text}"</div>
                          <div className="text-sm text-slate-500 mt-1">
                            <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded">{option.style}</span>
                            <span className="ml-2">{option.rationale}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono">
                            {redFlagModal.voteCounts?.[idx]?.toFixed(1) || 0} votes
                          </div>
                          <div className="text-xs text-slate-400">
                            {((redFlagModal.voteCounts?.[idx] || 0) / (redFlagModal.voteCounts?.reduce((a,b) => a + b, 0) || 1) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-2">Voting Breakdown</h4>
                  <div className="space-y-1">
                    {redFlagModal.votes?.map((vote, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded">
                        <span className="font-medium">{vote.agent}</span>
                        <span>voted Option {vote.option_index + 1} ({(vote.confidence * 100).toFixed(0)}% confidence)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setRedFlagModal(null)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

`;

// Find the line before confirmation dialog and insert red flag modal
if (!content.includes('Red-Flag Resolution Modal (Test #137)')) {
  content = content.replace(confirmDialogEnd, redFlagModalJSX + '\n' + confirmDialogEnd);
  console.log('Added red-flag modal JSX');
}

// 3. Update the chat message handling to detect and show red-flag modal
// Find where 'type: done' is handled in the chat processing
const doneHandlerPattern = `if (data.type === 'done') {`;
const enhancedDoneHandler = `if (data.type === 'done') {
                      // Check if this is a red-flagged MAKER voting result
                      if (data.isRedFlagged && data.makerVoting) {
                        setRedFlagModal({
                          reason: data.makerVoting.redFlagReason,
                          entropy: data.makerVoting.entropy,
                          options: data.makerVoting.options || [],
                          votes: data.makerVoting.votes || [],
                          voteCounts: data.makerVoting.voteCounts || []
                        });
                      }`;

if (content.includes(doneHandlerPattern) && !content.includes('data.isRedFlagged')) {
  content = content.replace(doneHandlerPattern, enhancedDoneHandler);
  console.log('Added red-flag detection in done handler');
}

fs.writeFileSync(appPath, content);
console.log('Done! Red-flag resolution modal added.');
