const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDetail.jsx', 'utf8');

// Add useEffect for SWOT data after ICP useEffect (after line with }, [client]))
const icpEffectEnd = '}, [client])';
const swotEffect = `}, [client])

  // Load SWOT data from client when available
  useEffect(() => {
    if (client && client.swot_data) {
      try {
        const parsedSwot = typeof client.swot_data === 'string'
          ? JSON.parse(client.swot_data)
          : client.swot_data
        if (parsedSwot.strengths) {
          setSwotData(parsedSwot)
        }
      } catch (error) {
        console.error('Error parsing SWOT data:', error)
      }
    }
  }, [client])`;

content = content.replace(icpEffectEnd, swotEffect);

// Add generateSwot function after handleIcpChange function
const handleIcpChangeFn = `const handleIcpChange = (field, value) => {
    setIcpData(prev => ({
      ...prev,
      [field]: value
    }))
  }`;

const handleIcpChangeWithSwot = `const handleIcpChange = (field, value) => {
    setIcpData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGenerateSwot = async (regenerate = false) => {
    setSwotLoading(true)
    try {
      const response = await fetch(\`http://localhost:3001/api/clients/\${id}/swot\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate })
      })

      if (response.ok) {
        const data = await response.json()
        setSwotData(data.swot)
        // Update client with new swot data
        if (data.client) {
          setClient(data.client)
        }
      } else {
        alert('Failed to generate SWOT analysis')
      }
    } catch (error) {
      console.error('Error generating SWOT:', error)
      alert('Error generating SWOT analysis')
    } finally {
      setSwotLoading(false)
    }
  }

  const handleSaveSwot = async (updatedSwot) => {
    try {
      const response = await fetch(\`http://localhost:3001/api/clients/\${id}/swot\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swot: updatedSwot })
      })

      if (response.ok) {
        const data = await response.json()
        setSwotData(data.swot)
        alert('SWOT analysis saved successfully!')
      } else {
        alert('Failed to save SWOT analysis')
      }
    } catch (error) {
      console.error('Error saving SWOT:', error)
      alert('Error saving SWOT analysis')
    }
  }`;

content = content.replace(handleIcpChangeFn, handleIcpChangeWithSwot);

// Now add SWOT tab content - find where ICP tab content ends
// Looking for: {activeTab === 'icp' && ( ... closing tags
// We need to add the SWOT tab content after the ICP tab content

// Find the pattern for closing of a tab content block followed by </div> </div>
const pattern = /(\{activeTab === 'icp' && \([\s\S]*?\n        \)\}\n)(\s*<\/div>\n\s*<\/div>\n\s*\))/;

const swotTabContent = `$1
        {activeTab === 'swot' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                SWOT Analysis
              </h2>
              <button
                onClick={() => handleGenerateSwot(!swotData)}
                disabled={swotLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {swotLoading ? '⏳ Generating...' : swotData ? '🔄 Regenerate SWOT' : '📊 Generate SWOT'}
              </button>
            </div>

            {swotData ? (
              <div className="space-y-6">
                {/* SWOT Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <span>💪</span> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {swotData.strengths && swotData.strengths.map((item, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Weaknesses
                    </h3>
                    <ul className="space-y-2">
                      {swotData.weaknesses && swotData.weaknesses.map((item, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                      <span>🚀</span> Opportunities
                    </h3>
                    <ul className="space-y-2">
                      {swotData.opportunities && swotData.opportunities.map((item, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                      <span>⚡</span> Threats
                    </h3>
                    <ul className="space-y-2">
                      {swotData.threats && swotData.threats.map((item, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Summary */}
                {swotData.summary && (
                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <span>📝</span> Summary
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{swotData.summary}</p>
                  </div>
                )}

                {/* Generated timestamp */}
                {swotData.generatedAt && (
                  <p className="text-sm text-slate-500 text-center">
                    Generated: {new Date(swotData.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  No SWOT Analysis Yet
                </h3>
                <p className="text-slate-400 mb-4 max-w-md mx-auto">
                  Generate a comprehensive SWOT analysis to identify your client's
                  Strengths, Weaknesses, Opportunities, and Threats.
                </p>
                <button
                  onClick={() => handleGenerateSwot(false)}
                  disabled={swotLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {swotLoading ? '⏳ Generating...' : '📊 Generate SWOT Analysis'}
                </button>
              </div>
            )}
          </div>
        )}
$2`;

content = content.replace(pattern, swotTabContent);

fs.writeFileSync('src/pages/ClientDetail.jsx', content);
console.log('Successfully updated ClientDetail.jsx with SWOT functionality');
