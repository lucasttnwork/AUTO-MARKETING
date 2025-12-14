import { useState, useEffect } from 'react'

export default function Intel() {
  const [activeTab, setActiveTab] = useState('market')
  const [marketIntel, setMarketIntel] = useState([])
  const [patterns, setPatterns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [competitorName, setCompetitorName] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [trendAlerts, setTrendAlerts] = useState([])
  const [trendSettings, setTrendSettings] = useState(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [detectingTrends, setDetectingTrends] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedTrend, setSelectedTrend] = useState(null)
  const [iterationBrief, setIterationBrief] = useState(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [competitorSwot, setCompetitorSwot] = useState(null)
  const [generatingSwot, setGeneratingSwot] = useState(false)
  const [showSwotModal, setShowSwotModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'market') {
      fetchMarketIntel()
      fetchPatterns()
    } else if (activeTab === 'trends') {
      fetchTrendAlerts()
      fetchTrendSettings()
    }
  }, [activeTab])

  const fetchMarketIntel = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/intel?limit=50')
      const data = await res.json()
      setMarketIntel(data || [])
    } catch (error) {
      console.error('Failed to fetch market intel:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatterns = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/intel/patterns')
      const data = await res.json()
      setPatterns(data)
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
    }
  }

  const handleScrape = async () => {
    if (!competitorName.trim()) return
    setScraping(true)
    try {
      const res = await fetch('http://localhost:3001/api/intel/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitor_name: competitorName,
          platform: 'meta',
          limit: 10
        })
      })
      const data = await res.json()
      if (data.ads_found > 0) {
        fetchMarketIntel()
        setCompetitorName('')
      }
    } catch (error) {
      console.error('Failed to scrape:', error)
    } finally {
      setScraping(false)
    }
  }

  const handleAnalyze = async (competitor) => {
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('http://localhost:3001/api/intel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_name: competitor })
      })
      const data = await res.json()
      setAnalysis(data)
    } catch (error) {
      console.error('Failed to analyze:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Trend-related functions
  const fetchTrendAlerts = async () => {
    setLoadingTrends(true)
    try {
      const res = await fetch('http://localhost:3001/api/intel/trends/alerts')
      const data = await res.json()
      setTrendAlerts(data || [])
    } catch (error) {
      console.error('Failed to fetch trend alerts:', error)
    } finally {
      setLoadingTrends(false)
    }
  }

  const fetchTrendSettings = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/intel/trends/settings')
      const data = await res.json()
      setTrendSettings(data)
    } catch (error) {
      console.error('Failed to fetch trend settings:', error)
    }
  }

  const handleDetectTrends = async () => {
    setDetectingTrends(true)
    try {
      const res = await fetch('http://localhost:3001/api/intel/trends/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        fetchTrendAlerts()
      }
    } catch (error) {
      console.error('Failed to detect trends:', error)
    } finally {
      setDetectingTrends(false)
    }
  }

  const handleAcknowledgeTrend = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/intel/trends/alerts/${id}/acknowledge`, {
        method: 'PUT'
      })
      fetchTrendAlerts()
      setSelectedTrend(null)
    } catch (error) {
      console.error('Failed to acknowledge trend:', error)
    }
  }

  const handleUpdateSettings = async (newSettings) => {
    try {
      await fetch('http://localhost:3001/api/intel/trends/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      setTrendSettings(newSettings)
      setShowSettingsModal(false)
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
  }

  const getTrendTypeIcon = (type) => {
    switch (type) {
      case 'competitor_activity': return '👁️'
      case 'ad_type_shift': return '📹'
      case 'cta_shift': return '🔘'
      case 'theme_surge': return '📈'
      case 'emerging_pattern': return '✨'
      case 'performance_change': return '📊'
      default: return '🔔'
    }
  }

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

  const handleGenerateCompetitorSwot = async (competitorName) => {
    setGeneratingSwot(true)
    try {
      const res = await fetch('http://localhost:3001/api/intel/competitor-swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_name: competitorName })
      })
      const data = await res.json()
      if (data.success && data.swot) {
        setCompetitorSwot(data.swot)
        setShowSwotModal(true)
      }
    } catch (error) {
      console.error('Failed to generate competitor SWOT:', error)
    } finally {
      setGeneratingSwot(false)
    }
  }

  // Get unique competitors
  const competitors = [...new Set(marketIntel.map(i => i.competitor_name).filter(Boolean))]

  const tabs = [
    { id: 'market', name: 'Market Intel', icon: '🔍' },
    { id: 'patterns', name: 'Winning Patterns', icon: '🏆' },
    { id: 'trends', name: 'Trend Alerts', icon: '📈', badge: trendAlerts.filter(t => !t.is_acknowledged).length || null }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Market Intelligence</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Competitor analysis and winning creative patterns
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.name}
            {tab.badge && (
              <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] text-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Market Intel Tab */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Scrape New Competitor */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🔍</span> Scrape Competitor Ads
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                placeholder="Enter competitor name (e.g., Nike, Adidas)"
                id="competitor-input"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !competitorName.trim()}
                id="scrape-btn"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {scraping ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scraping...
                  </span>
                ) : (
                  'Scrape Meta Ads'
                )}
              </button>
            </div>
          </div>

          {/* Competitor Overview */}
          {competitors.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📊</span> Competitor Monitoring Dashboard
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="competitor-cards">
                {competitors.map(comp => {
                  const compAds = marketIntel.filter(i => i.competitor_name === comp)
                  const activeAds = compAds.filter(a => a.status === 'active').length
                  return (
                    <div
                      key={comp}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">{comp}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {compAds.length} ads tracked
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1 mb-3">
                        {activeAds} active
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnalyze(comp)}
                          className="flex-1 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          📊 Analyze
                        </button>
                        <button
                          onClick={() => handleGenerateCompetitorSwot(comp)}
                          disabled={generatingSwot}
                          className="flex-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                          id={`swot-btn-${comp.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {generatingSwot ? '⏳' : '🎯'} SWOT
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analyzing && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="animate-pulse text-4xl mb-4">🔬</div>
              <p className="text-slate-600 dark:text-slate-400">Analyzing competitor ads...</p>
            </div>
          )}

          {analysis && !analyzing && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="analysis-results">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📈</span> Analysis: {analysis.competitor}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Winning Patterns */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Extracted Hooks</h3>
                  <div className="space-y-2" id="extracted-hooks">
                    {analysis.winning_patterns?.headlines?.map((hook, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                        <span>🎯</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{hook}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Ad Type Distribution */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Ad Types</h3>
                  <div className="space-y-2">
                    {Object.entries(analysis.winning_patterns?.ad_types || {}).map(([type, pct]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-20 capitalize">{type}</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-12">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Common Themes */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Common Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.common_themes?.map((theme, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Recommendations */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations?.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-green-500">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Intel List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 animate-pulse">🔍</div>
              <p className="text-slate-500">Loading market intel...</p>
            </div>
          ) : marketIntel.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-bold mb-2">No Market Intel Yet</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Enter a competitor name above to start gathering intel
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Scraped Ads ({marketIntel.length})
              </h2>
              <div className="space-y-3" id="intel-list">
                {marketIntel.slice(0, 20).map(intel => (
                  <div key={intel.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          intel.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                        }`}>
                          {intel.status || 'unknown'}
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {intel.competitor_name}
                        </span>
                        <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-600 rounded">
                          {intel.ad_type || 'ad'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {intel.scraped_at ? new Date(intel.scraped_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      {intel.headline}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {intel.body_copy}
                    </div>
                    {intel.cta && (
                      <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                        CTA: {intel.cta}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && patterns && (
        <div className="space-y-6">
          {/* Generate Iteration Brief Section */}
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

          {/* Headline Formulas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="winning-patterns">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📝</span> Winning Headline Formulas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patterns.headline_formulas?.map((formula, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formula.pattern}</span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                      {(formula.effectiveness * 100).toFixed(0)}% effective
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{formula.example}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🔘</span> CTA Performance
            </h2>
            <div className="space-y-3">
              {patterns.cta_performance?.map((cta, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300">{cta.cta}</span>
                  <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${(cta.ctr / 4) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-slate-600 dark:text-slate-400">{cta.ctr}% CTR</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Type Trends */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📊</span> Ad Type Trends
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(patterns.ad_type_trends || {}).map(([type, data]) => (
                <div key={type} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white capitalize mb-1">{type}</div>
                  <div className="text-lg text-slate-600 dark:text-slate-400">{data.share}% share</div>
                  <div className={`text-sm mt-2 ${
                    data.trend === 'increasing' ? 'text-green-600' :
                    data.trend === 'decreasing' ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {data.trend === 'increasing' ? '📈 Increasing' :
                     data.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Themes */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🎯</span> Top Performing Themes
            </h2>
            <div className="flex flex-wrap gap-3">
              {patterns.top_performing_themes?.map((theme, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-300 rounded-lg font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Trend Settings & Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>📈</span> Trend Detection
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  id="trend-settings-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configure Thresholds
                </button>
                <button
                  onClick={handleDetectTrends}
                  disabled={detectingTrends}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  id="detect-trends-btn"
                >
                  {detectingTrends ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Detect Trends
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Automatically analyze market intel to detect emerging trends, competitor activity shifts, and creative pattern changes.
            </p>
            {trendSettings && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Min Confidence:</span>{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{(trendSettings.min_confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Activity Threshold:</span>{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{trendSettings.competitor_activity_threshold} ads</span>
                </div>
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Alerts:</span>{' '}
                  <span className={`font-medium ${trendSettings.alerts_enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trendSettings.alerts_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Trend Alerts List */}
          {loadingTrends ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 animate-pulse">📈</div>
              <p className="text-slate-500">Loading trend alerts...</p>
            </div>
          ) : trendAlerts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-6xl mb-4">📈</div>
              <h2 className="text-xl font-bold mb-2">No Trend Alerts Yet</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Click "Detect Trends" to analyze your market intel data for emerging patterns
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🔔</span> Active Alerts ({trendAlerts.filter(t => !t.is_acknowledged).length} unacknowledged)
              </h2>
              <div className="space-y-3" id="trend-alerts-list">
                {trendAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedTrend(alert)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      alert.is_acknowledged
                        ? 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600 opacity-60'
                        : getSeverityColor(alert.severity)
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTrendTypeIcon(alert.trend_type)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{alert.trend_name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                              alert.severity === 'critical' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                              alert.severity === 'warning' ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' :
                              'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                            }`}>
                              {alert.severity}
                            </span>
                            {alert.is_acknowledged && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                Acknowledged
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{alert.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Confidence: {(alert.confidence_score * 100).toFixed(0)}%</span>
                            <span>Detected: {new Date(alert.detected_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trend Detail Modal */}
      {selectedTrend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTrend(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} id="trend-detail-modal">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTrendTypeIcon(selectedTrend.trend_type)}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTrend.trend_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      selectedTrend.severity === 'critical' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                      selectedTrend.severity === 'warning' ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' :
                      'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    }`}>
                      {selectedTrend.severity}
                    </span>
                    <span className="text-sm text-slate-500">Confidence: {(selectedTrend.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTrend(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Description</h3>
                <p className="text-slate-600 dark:text-slate-400">{selectedTrend.description}</p>
              </div>

              {selectedTrend.recommended_action && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-1 flex items-center gap-2">
                    <span>💡</span> Recommended Action
                  </h3>
                  <p className="text-indigo-700 dark:text-indigo-400">{selectedTrend.recommended_action}</p>
                </div>
              )}

              {selectedTrend.data && Object.keys(selectedTrend.data).length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Trend Data</h3>
                  <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="text-slate-700 dark:text-slate-300">{JSON.stringify(selectedTrend.data, null, 2)}</pre>
                  </div>
                </div>
              )}

              {selectedTrend.related_competitors && selectedTrend.related_competitors.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Related Competitors</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrend.related_competitors.map((comp, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500">
                  <span>Detected: {new Date(selectedTrend.detected_at).toLocaleString()}</span>
                  {selectedTrend.acknowledged_at && (
                    <span className="ml-4">Acknowledged: {new Date(selectedTrend.acknowledged_at).toLocaleString()}</span>
                  )}
                </div>
                {!selectedTrend.is_acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeTrend(selectedTrend.id)}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    id="acknowledge-trend-btn"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && trendSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()} id="trend-settings-modal">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Trend Detection Settings</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              handleUpdateSettings({
                min_confidence: parseFloat(formData.get('min_confidence')) / 100,
                competitor_activity_threshold: parseInt(formData.get('competitor_activity_threshold')),
                cta_shift_threshold: parseInt(formData.get('cta_shift_threshold')),
                theme_surge_threshold: parseInt(formData.get('theme_surge_threshold')),
                check_frequency_hours: parseInt(formData.get('check_frequency_hours')),
                alerts_enabled: formData.get('alerts_enabled') === 'on' ? 1 : 0
              })
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Minimum Confidence (%)
                  </label>
                  <input
                    type="number"
                    name="min_confidence"
                    defaultValue={(trendSettings.min_confidence * 100).toFixed(0)}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    id="min-confidence-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Competitor Activity Threshold (ads)
                  </label>
                  <input
                    type="number"
                    name="competitor_activity_threshold"
                    defaultValue={trendSettings.competitor_activity_threshold}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    id="activity-threshold-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CTA Shift Threshold (%)
                  </label>
                  <input
                    type="number"
                    name="cta_shift_threshold"
                    defaultValue={trendSettings.cta_shift_threshold}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Theme Surge Threshold (%)
                  </label>
                  <input
                    type="number"
                    name="theme_surge_threshold"
                    defaultValue={trendSettings.theme_surge_threshold}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Check Frequency (hours)
                  </label>
                  <input
                    type="number"
                    name="check_frequency_hours"
                    defaultValue={trendSettings.check_frequency_hours}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="alerts_enabled"
                    id="alerts-enabled-checkbox"
                    defaultChecked={trendSettings.alerts_enabled}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="alerts-enabled-checkbox" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enable Trend Alerts
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                  id="save-settings-btn"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <div key={idx} className={`p-4 rounded-lg border ${
                    rec.priority === 'High'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        rec.priority === 'High'
                          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                      }`}>
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

      {/* Competitor SWOT Modal */}
      {showSwotModal && competitorSwot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSwotModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} id="competitor-swot-modal">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> Competitor SWOT: {competitorSwot.competitor}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Analyzed {competitorSwot.analyzed_ads} ads • {new Date(competitorSwot.analyzed_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setShowSwotModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">&times;</button>
            </div>

            {/* Competitive Position Summary */}
            {competitorSwot.competitive_position && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3">📈 Competitive Position</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Threat Level:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      competitorSwot.competitive_position.threat_level === 'High'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : competitorSwot.competitive_position.threat_level === 'Medium'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`} id="threat-level">
                      {competitorSwot.competitive_position.threat_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Market Activity:</span>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                      {competitorSwot.competitive_position.market_activity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Ad Diversity:</span>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                      {competitorSwot.competitive_position.ad_diversity}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SWOT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="swot-quadrants">
              {/* Strengths */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800" id="swot-strengths">
                <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                  <span>💪</span> Strengths
                </h3>
                <ul className="space-y-2">
                  {competitorSwot.strengths?.map((item, idx) => (
                    <li key={idx} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800" id="swot-weaknesses">
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Weaknesses
                </h3>
                <ul className="space-y-2">
                  {competitorSwot.weaknesses?.map((item, idx) => (
                    <li key={idx} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800" id="swot-opportunities">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <span>🚀</span> Opportunities
                </h3>
                <ul className="space-y-2">
                  {competitorSwot.opportunities?.map((item, idx) => (
                    <li key={idx} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Threats */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800" id="swot-threats">
                <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <span>⚡</span> Threats
                </h3>
                <ul className="space-y-2">
                  {competitorSwot.threats?.map((item, idx) => (
                    <li key={idx} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            {competitorSwot.recommendations && competitorSwot.recommendations.length > 0 && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 mb-6" id="swot-recommendations">
                <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <span>💡</span> Strategic Recommendations
                </h3>
                <ul className="space-y-2">
                  {competitorSwot.recommendations.map((item, idx) => (
                    <li key={idx} className="text-sm text-purple-700 dark:text-purple-400 flex items-start gap-2">
                      <span className="font-bold text-purple-500">{idx + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowSwotModal(false)}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close SWOT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
