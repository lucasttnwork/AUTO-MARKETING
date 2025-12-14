const fs = require('fs');

// Read the Intel.jsx file
let content = fs.readFileSync('src/pages/Intel.jsx', 'utf8');

// 1. Add state variables after selectedTrend
const newStates = `
  const [iterationBrief, setIterationBrief] = useState(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)`;

content = content.replace(
  'const [selectedTrend, setSelectedTrend] = useState(null)',
  'const [selectedTrend, setSelectedTrend] = useState(null)' + newStates
);

// 2. Add the generate iteration brief function after handleUpdateSettings
const newFunction = `

  const handleGenerateIterationBrief = async () => {
    setGeneratingBrief(true)
    try {
      const res = await fetch('http://localhost:3001/api/intel/iteration-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (data.success && data.brief) {
        setIterationBrief(data.brief)
        setShowBriefModal(true)
      }
    } catch (error) {
      console.error('Failed to generate iteration brief:', error)
    } finally {
      setGeneratingBrief(false)
    }
  }
`;

// Find the spot after handleUpdateSettings
const updateSettingsEnd = content.indexOf('setShowSettingsModal(false)');
if (updateSettingsEnd > 0) {
  // Find the end of this function (closing brace)
  let braceCount = 0;
  let idx = updateSettingsEnd;
  let foundStart = false;
  while (idx < content.length) {
    if (content[idx] === '{') {
      braceCount++;
      foundStart = true;
    }
    if (content[idx] === '}') {
      braceCount--;
      if (foundStart && braceCount === 0) {
        // Found the end of catch block, move past the closing brace of the function
        idx += 1;
        while (idx < content.length && content[idx] !== '}') idx++;
        idx += 1; // past the function closing brace
        break;
      }
    }
    idx++;
  }
  content = content.slice(0, idx) + newFunction + content.slice(idx);
}

// 3. Add the Generate Brief button in the patterns tab (before the headline formulas section)
const patternsTabButton = `{/* Generate Iteration Brief Section */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>📋</span> Generate Iteration Brief
                </h2>
                <p className="mt-1 text-indigo-100">
                  Create an actionable creative brief based on the winning patterns below
                </p>
              </div>
              <button
                onClick={handleGenerateIterationBrief}
                disabled={generatingBrief}
                className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                id="generate-iteration-brief-btn"
              >
                {generatingBrief ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Brief
                  </>
                )}
              </button>
            </div>
          </div>

          `;

// Insert before the Headline Formulas section
content = content.replace(
  `{/* Headline Formulas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="winning-patterns">`,
  patternsTabButton + `{/* Headline Formulas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="winning-patterns">`
);

// 4. Add the iteration brief modal before the closing </div> of the component
const briefModal = `
      {/* Iteration Brief Modal */}
      {showBriefModal && iterationBrief && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBriefModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} id="iteration-brief-modal">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📋</span> {iterationBrief.summary}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Generated: {new Date(iterationBrief.generated_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setShowBriefModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Winning Elements Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <span>🏆</span> Winning Elements Identified
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm" id="winning-elements">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Best Headline:</span>
                  <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                    {iterationBrief.winning_elements.headline_formula.name} ({iterationBrief.winning_elements.headline_formula.effectiveness})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Top CTAs:</span>
                  <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                    {iterationBrief.winning_elements.top_ctas.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Recommended Format:</span>
                  <span className="ml-2 font-medium text-slate-700 dark:text-slate-200 capitalize">
                    {iterationBrief.winning_elements.recommended_format}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Key Themes:</span>
                  <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                    {iterationBrief.winning_elements.themes_to_use.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span>💡</span> Specific Recommendations
              </h3>
              <div className="space-y-3" id="recommendations-list">
                {iterationBrief.recommendations.map((rec, idx) => (
                  <div key={idx} className={\`p-4 rounded-lg border \${
                    rec.priority === 'High'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  }\`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={\`px-2 py-0.5 text-xs font-medium rounded \${
                        rec.priority === 'High'
                          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                      }\`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{rec.action}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{rec.rationale}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 italic">Example: {rec.example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Creative Direction */}
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                <span>🎨</span> Creative Direction
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-slate-700 dark:text-slate-300">Hook Strategy:</span> <span className="text-slate-600 dark:text-slate-400">{iterationBrief.creative_direction.hook_strategy}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">Body Strategy:</span> <span className="text-slate-600 dark:text-slate-400">{iterationBrief.creative_direction.body_strategy}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">CTA Strategy:</span> <span className="text-slate-600 dark:text-slate-400">{iterationBrief.creative_direction.cta_strategy}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">Format Focus:</span> <span className="text-slate-600 dark:text-slate-400">{iterationBrief.creative_direction.format_focus}</span></div>
              </div>
            </div>

            {/* Agent Instructions */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800" id="agent-instructions">
              <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                <span>🤖</span> Agent Instructions (Actionable)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-white dark:bg-slate-700 rounded">
                  <span className="font-medium text-purple-700 dark:text-purple-300">Copy Agent:</span>
                  <p className="text-slate-600 dark:text-slate-400">{iterationBrief.agent_instructions.copy_agent}</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-700 rounded">
                  <span className="font-medium text-purple-700 dark:text-purple-300">Video Agent:</span>
                  <p className="text-slate-600 dark:text-slate-400">{iterationBrief.agent_instructions.video_agent}</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-700 rounded">
                  <span className="font-medium text-purple-700 dark:text-purple-300">Ad Copy Agent:</span>
                  <p className="text-slate-600 dark:text-slate-400">{iterationBrief.agent_instructions.ad_copy_agent}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBriefModal(false)}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close Brief
              </button>
            </div>
          </div>
        </div>
      )}
`;

// Find the end of the component (last closing tag)
const lastDiv = content.lastIndexOf('    </div>');
if (lastDiv > 0) {
  content = content.slice(0, lastDiv) + briefModal + '\n    </div>' + content.slice(lastDiv + 10);
}

// Write back
fs.writeFileSync('src/pages/Intel.jsx', content);
console.log('Added iteration brief UI to src/pages/Intel.jsx');
