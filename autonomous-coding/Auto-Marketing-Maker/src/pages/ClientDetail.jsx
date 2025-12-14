import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showIcpWizard, setShowIcpWizard] = useState(false)
  const [swotData, setSwotData] = useState(null)
  const [swotLoading, setSwotLoading] = useState(false)
  const [swotEditMode, setSwotEditMode] = useState(false)
  const [editingSwot, setEditingSwot] = useState(null)
  const [competitorsData, setCompetitorsData] = useState([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const [brandAbsorptionData, setBrandAbsorptionData] = useState(null)
  const [brandAbsorptionLoading, setBrandAbsorptionLoading] = useState(false)
  const [brandAbsorptionProgress, setBrandAbsorptionProgress] = useState('')
  const [icpData, setIcpData] = useState({
    // Demographics
    ageRange: '',
    gender: '',
    location: '',
    incomeLevel: '',
    education: '',
    // Psychographics
    interests: '',
    values: '',
    lifestyle: '',
    painPoints: '',
    desires: ''
  })

  useEffect(() => {
    fetchClientDetails()
    fetchClientCampaigns()
  }, [id])

  useEffect(() => {
    // Load ICP data from client when available
    if (client && client.icp_data) {
      try {
        const parsedIcp = typeof client.icp_data === 'string'
          ? JSON.parse(client.icp_data)
          : client.icp_data
        setIcpData({
          ageRange: parsedIcp.ageRange || '',
          gender: parsedIcp.gender || '',
          location: parsedIcp.location || '',
          incomeLevel: parsedIcp.incomeLevel || '',
          education: parsedIcp.education || '',
          interests: parsedIcp.interests || '',
          values: parsedIcp.values || '',
          lifestyle: parsedIcp.lifestyle || '',
          painPoints: parsedIcp.painPoints || '',
          desires: parsedIcp.desires || ''
        })
      } catch (error) {
        console.error('Error parsing ICP data:', error)
      }
    }
  }, [client])

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
  }, [client])

  // Load competitors data from client when available
  useEffect(() => {
    if (client && client.competitors_data) {
      try {
        const parsedCompetitors = typeof client.competitors_data === 'string'
          ? JSON.parse(client.competitors_data)
          : client.competitors_data
        if (Array.isArray(parsedCompetitors) && parsedCompetitors.length > 0) {
          setCompetitorsData(parsedCompetitors)
        }
      } catch (error) {
        console.error('Error parsing competitors data:', error)
      }
    }
  }, [client])

  // Load brand absorption data from client when available
  useEffect(() => {
    if (client && client.brand_absorption_data) {
      try {
        const parsedData = typeof client.brand_absorption_data === 'string'
          ? JSON.parse(client.brand_absorption_data)
          : client.brand_absorption_data
        if (parsedData.brandVoice) {
          setBrandAbsorptionData(parsedData)
        }
      } catch (error) {
        console.error('Error parsing brand absorption data:', error)
      }
    }
  }, [client])

  // Function to trigger brand absorption with streaming progress
  const handleBrandAbsorption = async (regenerate = false) => {
    setBrandAbsorptionLoading(true)
    setBrandAbsorptionProgress('Starting brand absorption...')

    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}/absorb/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.message) {
                setBrandAbsorptionProgress(data.message)
              }
              if (data.brandAbsorption) {
                setBrandAbsorptionData(data.brandAbsorption)
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Brand absorption error:', error)
      setBrandAbsorptionProgress('Error: ' + error.message)
    } finally {
      setBrandAbsorptionLoading(false)
      // Refresh client data to get the saved brand absorption
      fetchClientDetails()
    }
  }

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else {
        console.error('Failed to fetch client')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientCampaigns = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns?client_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this client?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        navigate('/clients')
      }
    } catch (error) {
      console.error('Error archiving client:', error)
    }
  }

  const handleSaveIcp = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icp_data: icpData
        })
      })

      if (response.ok) {
        const updatedClient = await response.json()
        setClient(updatedClient)
        setShowIcpWizard(false)
        alert('ICP data saved successfully!')
      } else {
        alert('Failed to save ICP data')
      }
    } catch (error) {
      console.error('Error saving ICP data:', error)
      alert('Error saving ICP data')
    }
  }

  const handleIcpChange = (field, value) => {
    setIcpData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGenerateCompetitors = async (regenerate = false) => {
    setCompetitorsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate })
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitorsData(data.competitors)
        // Update client with new competitors data
        if (data.client) {
          setClient(data.client)
        }
      } else {
        alert('Failed to generate competitor analysis')
      }
    } catch (error) {
      console.error('Error generating competitors:', error)
      alert('Error generating competitor analysis')
    } finally {
      setCompetitorsLoading(false)
    }
  }

  const handleGenerateSwot = async (regenerate = false) => {
    setSwotLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}/swot`, {
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
      const response = await fetch(`http://localhost:3001/api/clients/${id}/swot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swot: updatedSwot })
      })

      if (response.ok) {
        const data = await response.json()
        setSwotData(data.swot)
        setSwotEditMode(false)
        setEditingSwot(null)
        alert('SWOT analysis saved successfully!')
      } else {
        alert('Failed to save SWOT analysis')
      }
    } catch (error) {
      console.error('Error saving SWOT:', error)
      alert('Error saving SWOT analysis')
    }
  }

  const startSwotEdit = () => {
    setEditingSwot({
      strengths: [...(swotData.strengths || [])],
      weaknesses: [...(swotData.weaknesses || [])],
      opportunities: [...(swotData.opportunities || [])],
      threats: [...(swotData.threats || [])],
      summary: swotData.summary || ''
    })
    setSwotEditMode(true)
  }

  const cancelSwotEdit = () => {
    setSwotEditMode(false)
    setEditingSwot(null)
  }

  const updateSwotItem = (category, index, value) => {
    setEditingSwot(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) => i === index ? value : item)
    }))
  }

  const addSwotItem = (category) => {
    setEditingSwot(prev => ({
      ...prev,
      [category]: [...prev[category], '']
    }))
  }

  const removeSwotItem = (category, index) => {
    setEditingSwot(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }))
  }

  const saveSwotEdits = () => {
    const cleanedSwot = {
      ...editingSwot,
      strengths: editingSwot.strengths.filter(s => s.trim()),
      weaknesses: editingSwot.weaknesses.filter(s => s.trim()),
      opportunities: editingSwot.opportunities.filter(s => s.trim()),
      threats: editingSwot.threats.filter(s => s.trim()),
      generatedAt: new Date().toISOString()
    }
    handleSaveSwot(cleanedSwot)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Client not found</h2>
          <Link to="/clients" className="text-blue-400 hover:text-blue-300">
            ← Back to Clients
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
    { id: 'brand-voice', label: 'Brand Voice', icon: '🎨' },
    { id: 'icp', label: 'ICP', icon: '👥' },
    { id: 'competitors', label: 'Competitors', icon: '🎯' },
    { id: 'swot', label: 'SWOT', icon: '📊' }
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/clients" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Clients
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {client.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                  {client.status}
                </span>
                {client.website_url && (
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    🔗 {client.website_url}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {/* TODO: Edit functionality */}}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
            >
              ✏️ Edit
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`http://localhost:3001/api/clients/${id}/export`);
                  if (response.ok) {
                    const data = await response.json();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    alert('Client data exported successfully!');
                  } else {
                    alert('Failed to export client data');
                  }
                } catch (error) {
                  console.error('Export error:', error);
                  alert('Error exporting client data');
                }
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
            >
              📤 Export Data
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
            >
              📦 Archive
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 mb-4">
              Client Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400">Client Name</label>
                <p className="text-slate-100 mt-1">{client.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Website</label>
                <p className="text-slate-100 mt-1">
                  {client.website_url ? (
                    <a
                      href={client.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {client.website_url}
                    </a>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Status</label>
                <p className="text-slate-100 mt-1 capitalize">{client.status}</p>
              </div>

              {client.custom_instructions && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Custom Instructions</label>
                  <p className="text-slate-100 mt-1 leading-relaxed">{client.custom_instructions}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-400">Created</label>
                <p className="text-slate-100 mt-1">
                  {new Date(client.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Last Updated</label>
                <p className="text-slate-100 mt-1">
                  {new Date(client.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Campaigns
              </h2>
              <Link
                to="/campaigns"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                + New Campaign
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No campaigns yet</p>
                <Link
                  to="/campaigns"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Create your first campaign →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100">{campaign.name}</h3>
                        {campaign.description && (
                          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                            {campaign.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-500/10 text-green-400'
                              : campaign.status === 'draft'
                              ? 'bg-slate-500/10 text-slate-400'
                              : campaign.status === 'paused'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {campaign.status}
                          </span>
                          {campaign.target_roas && (
                            <span className="text-sm text-slate-400">
                              Target ROAS: {campaign.target_roas}x
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/campaigns`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'brand-voice' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Brand Voice
              </h2>
              {brandAbsorptionData && (
                <button
                  onClick={() => handleBrandAbsorption(true)}
                  disabled={brandAbsorptionLoading}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-all disabled:opacity-50"
                >
                  🔄 Regenerate
                </button>
              )}
            </div>

            {/* Loading/Progress State */}
            {brandAbsorptionLoading && (
              <div className="bg-slate-700/50 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <div>
                    <p className="text-slate-100 font-medium">Brand Absorption in Progress</p>
                    <p className="text-slate-400 text-sm">{brandAbsorptionProgress}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-purple-500 animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            )}

            {/* No Data - Show Trigger Button */}
            {!brandAbsorptionData && !brandAbsorptionLoading && (
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Extract Brand Voice</h3>
                  <p className="text-slate-400 mb-4">
                    Analyze your client's brand to extract tone, messaging pillars, and communication guidelines.
                  </p>
                  <button
                    onClick={() => handleBrandAbsorption(false)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                  >
                    🤖 Generate Brand Voice Analysis
                  </button>
                </div>

                <div className="text-sm text-slate-500">
                  <p className="leading-relaxed">
                    The brand voice analysis will extract tone, messaging pillars, and values
                    from the client's website and existing content to ensure consistent
                    messaging across all campaigns.
                  </p>
                </div>
              </div>
            )}

            {/* Brand Absorption Data Display */}
            {brandAbsorptionData && !brandAbsorptionLoading && (
              <div className="space-y-6">
                {/* Brand Voice Overview */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>🎯</span> Brand Voice
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Tone</p>
                      <p className="text-slate-100">{brandAbsorptionData.brandVoice?.tone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Formality Level</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                            style={{width: `${(parseInt(brandAbsorptionData.brandVoice?.formality) || 5) * 10}%`}}
                          ></div>
                        </div>
                        <span className="text-slate-300 text-sm">{brandAbsorptionData.brandVoice?.formality}/10</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Personality Traits</p>
                      <div className="flex flex-wrap gap-2">
                        {brandAbsorptionData.brandVoice?.personality?.map((trait, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Emotional Appeal</p>
                      <p className="text-slate-100">{brandAbsorptionData.brandVoice?.emotionalAppeal || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Messaging Pillars */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>📌</span> Messaging Pillars
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {brandAbsorptionData.messagingPillars?.map((pillar, i) => (
                      <div key={i} className="bg-slate-600/50 rounded-lg p-4">
                        <h4 className="font-medium text-orange-400 mb-1">{pillar.pillar}</h4>
                        <p className="text-slate-300 text-sm">{pillar.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Values */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>💎</span> Brand Values
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {brandAbsorptionData.values?.map((value, i) => (
                      <span key={i} className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Communication Guidelines */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>📝</span> Communication Guidelines
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                        <span>✅</span> Do's
                      </h4>
                      <ul className="space-y-2">
                        {brandAbsorptionData.communicationGuidelines?.dos?.map((item, i) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                        <span>❌</span> Don'ts
                      </h4>
                      <ul className="space-y-2">
                        {brandAbsorptionData.communicationGuidelines?.donts?.map((item, i) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Vocabulary Style */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>💬</span> Vocabulary Style
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Preferred Words</p>
                      <div className="flex flex-wrap gap-1">
                        {brandAbsorptionData.vocabularyStyle?.preferredWords?.map((word, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Words to Avoid</p>
                      <div className="flex flex-wrap gap-1">
                        {brandAbsorptionData.vocabularyStyle?.avoidWords?.map((word, i) => (
                          <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs line-through">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Jargon Level</p>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded capitalize">
                        {brandAbsorptionData.vocabularyStyle?.jargonLevel || 'low'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Examples */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>✨</span> Content Examples
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Headlines</p>
                      <div className="space-y-2">
                        {brandAbsorptionData.contentExamples?.headlines?.map((headline, i) => (
                          <div key={i} className="bg-slate-600/50 rounded p-3 text-slate-100 italic">
                            "{headline}"
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Taglines</p>
                      <div className="flex flex-wrap gap-2">
                        {brandAbsorptionData.contentExamples?.taglines?.map((tagline, i) => (
                          <span key={i} className="px-3 py-2 bg-orange-500/20 text-orange-300 rounded-lg italic">
                            "{tagline}"
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Call-to-Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {brandAbsorptionData.contentExamples?.cta?.map((cta, i) => (
                          <span key={i} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium">
                            {cta}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extraction Info */}
                {brandAbsorptionData.extractedAt && (
                  <p className="text-xs text-slate-500 text-right">
                    Extracted: {new Date(brandAbsorptionData.extractedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'icp' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Ideal Customer Profile (ICP)
              </h2>
              {!showIcpWizard && (
                <button
                  onClick={() => setShowIcpWizard(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  {icpData.ageRange || icpData.interests ? '✏️ Edit ICP' : '👥 Define ICP'}
                </button>
              )}
            </div>

            {showIcpWizard ? (
              <div className="space-y-6">
                {/* Demographics Section */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>📊</span>
                    Demographics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Age Range *
                      </label>
                      <input
                        type="text"
                        value={icpData.ageRange}
                        onChange={(e) => handleIcpChange('ageRange', e.target.value)}
                        placeholder="e.g., 25-45"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Gender
                      </label>
                      <select
                        value={icpData.gender}
                        onChange={(e) => handleIcpChange('gender', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="all">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={icpData.location}
                        onChange={(e) => handleIcpChange('location', e.target.value)}
                        placeholder="e.g., USA, UK, Global"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Income Level
                      </label>
                      <input
                        type="text"
                        value={icpData.incomeLevel}
                        onChange={(e) => handleIcpChange('incomeLevel', e.target.value)}
                        placeholder="e.g., $50k-$100k"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Education
                      </label>
                      <input
                        type="text"
                        value={icpData.education}
                        onChange={(e) => handleIcpChange('education', e.target.value)}
                        placeholder="e.g., High School, Bachelor's, Master's"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Psychographics Section */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <span>🧠</span>
                    Psychographics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Interests *
                      </label>
                      <textarea
                        value={icpData.interests}
                        onChange={(e) => handleIcpChange('interests', e.target.value)}
                        placeholder="What are your ideal customers interested in? (hobbies, activities, topics)"
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Values *
                      </label>
                      <textarea
                        value={icpData.values}
                        onChange={(e) => handleIcpChange('values', e.target.value)}
                        placeholder="What do they care about? (sustainability, innovation, family, success)"
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Lifestyle *
                      </label>
                      <textarea
                        value={icpData.lifestyle}
                        onChange={(e) => handleIcpChange('lifestyle', e.target.value)}
                        placeholder="Describe their daily life and habits"
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pain Points *
                      </label>
                      <textarea
                        value={icpData.painPoints}
                        onChange={(e) => handleIcpChange('painPoints', e.target.value)}
                        placeholder="What problems are they facing? What frustrates them?"
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Desires *
                      </label>
                      <textarea
                        value={icpData.desires}
                        onChange={(e) => handleIcpChange('desires', e.target.value)}
                        placeholder="What do they want to achieve? What are their goals and aspirations?"
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowIcpWizard(false)}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveIcp}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    💾 Save ICP Data
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {icpData.ageRange || icpData.interests ? (
                  // Display existing ICP data
                  <div className="space-y-6">
                    {/* Demographics Display */}
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <span>📊</span>
                        Demographics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {icpData.ageRange && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Age Range</label>
                            <p className="text-slate-100 mt-1">{icpData.ageRange}</p>
                          </div>
                        )}
                        {icpData.gender && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Gender</label>
                            <p className="text-slate-100 mt-1 capitalize">{icpData.gender}</p>
                          </div>
                        )}
                        {icpData.location && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Location</label>
                            <p className="text-slate-100 mt-1">{icpData.location}</p>
                          </div>
                        )}
                        {icpData.incomeLevel && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Income Level</label>
                            <p className="text-slate-100 mt-1">{icpData.incomeLevel}</p>
                          </div>
                        )}
                        {icpData.education && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-400">Education</label>
                            <p className="text-slate-100 mt-1">{icpData.education}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Psychographics Display */}
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <span>🧠</span>
                        Psychographics
                      </h3>
                      <div className="space-y-4">
                        {icpData.interests && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Interests</label>
                            <p className="text-slate-100 mt-1 leading-relaxed">{icpData.interests}</p>
                          </div>
                        )}
                        {icpData.values && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Values</label>
                            <p className="text-slate-100 mt-1 leading-relaxed">{icpData.values}</p>
                          </div>
                        )}
                        {icpData.lifestyle && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Lifestyle</label>
                            <p className="text-slate-100 mt-1 leading-relaxed">{icpData.lifestyle}</p>
                          </div>
                        )}
                        {icpData.painPoints && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Pain Points</label>
                            <p className="text-slate-100 mt-1 leading-relaxed">{icpData.painPoints}</p>
                          </div>
                        )}
                        {icpData.desires && (
                          <div>
                            <label className="text-sm font-medium text-slate-400">Desires</label>
                            <p className="text-slate-100 mt-1 leading-relaxed">{icpData.desires}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Empty state
                  <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                    <p className="text-slate-400 mb-4">
                      No ICP defined yet
                    </p>
                    <div className="text-sm text-slate-500">
                      <p className="leading-relaxed">
                        The Ideal Customer Profile (ICP) defines your target audience including
                        demographics, psychographics, pain points, and desires. This ensures
                        campaigns are precisely targeted to reach the right people.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'competitors' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Competitor Analysis
              </h2>
              <button
                onClick={() => handleGenerateCompetitors(competitorsData.length > 0)}
                disabled={competitorsLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {competitorsLoading ? '⏳ Analyzing...' : competitorsData.length > 0 ? '🔄 Re-analyze' : '🔍 Analyze Competitors'}
              </button>
            </div>

            {competitorsData.length > 0 ? (
              <div className="space-y-4">
                {competitorsData.map((competitor, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">{competitor.name}</h3>
                        {competitor.website && (
                          <a
                            href={competitor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300"
                          >
                            {competitor.website}
                          </a>
                        )}
                      </div>
                      {competitor.estimatedMarketShare && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                          ~{competitor.estimatedMarketShare} Market Share
                        </span>
                      )}
                    </div>

                    {competitor.description && (
                      <p className="text-slate-400 mb-4">{competitor.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {competitor.strengths && competitor.strengths.length > 0 && (
                        <div className="bg-green-500/10 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-green-400 mb-2">💪 Strengths</h4>
                          <ul className="space-y-1">
                            {competitor.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-green-400">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                        <div className="bg-red-500/10 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-red-400 mb-2">⚠️ Weaknesses</h4>
                          <ul className="space-y-1">
                            {competitor.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {competitor.primaryChannels && competitor.primaryChannels.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">📢 Primary Marketing Channels</h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.primaryChannels.map((channel, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-600/50 text-slate-300 rounded text-xs">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {competitor.analyzedAt && (
                      <p className="text-xs text-slate-500 mt-4">
                        Analyzed: {new Date(competitor.analyzedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  No Competitor Analysis Yet
                </h3>
                <p className="text-slate-400 mb-4 max-w-md mx-auto">
                  Analyze your client's competitors to understand the competitive landscape,
                  identify opportunities, and develop winning strategies.
                </p>
                <button
                  onClick={() => handleGenerateCompetitors(false)}
                  disabled={competitorsLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {competitorsLoading ? '⏳ Analyzing...' : '🔍 Analyze Competitors'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'swot' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                SWOT Analysis
              </h2>
              <div className="flex gap-2">
                {swotData && !swotEditMode && (
                  <button
                    onClick={startSwotEdit}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
                  >
                    ✏️ Edit SWOT
                  </button>
                )}
                {!swotEditMode && (
                  <button
                    onClick={() => handleGenerateSwot(!swotData)}
                    disabled={swotLoading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {swotLoading ? '⏳ Generating...' : swotData ? '🔄 Regenerate SWOT' : '📊 Generate SWOT'}
                  </button>
                )}
              </div>
            </div>

            {swotEditMode && editingSwot ? (
              <div className="space-y-6">
                {/* Edit Mode SWOT Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths Edit */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <span>💪</span> Strengths
                    </h3>
                    <div className="space-y-2">
                      {editingSwot.strengths.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateSwotItem('strengths', idx, e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter strength..."
                          />
                          <button
                            onClick={() => removeSwotItem('strengths', idx)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSwotItem('strengths')}
                        className="w-full px-3 py-2 border border-dashed border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                      >
                        + Add Strength
                      </button>
                    </div>
                  </div>

                  {/* Weaknesses Edit */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Weaknesses
                    </h3>
                    <div className="space-y-2">
                      {editingSwot.weaknesses.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateSwotItem('weaknesses', idx, e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Enter weakness..."
                          />
                          <button
                            onClick={() => removeSwotItem('weaknesses', idx)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSwotItem('weaknesses')}
                        className="w-full px-3 py-2 border border-dashed border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        + Add Weakness
                      </button>
                    </div>
                  </div>

                  {/* Opportunities Edit */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                      <span>🚀</span> Opportunities
                    </h3>
                    <div className="space-y-2">
                      {editingSwot.opportunities.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateSwotItem('opportunities', idx, e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter opportunity..."
                          />
                          <button
                            onClick={() => removeSwotItem('opportunities', idx)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSwotItem('opportunities')}
                        className="w-full px-3 py-2 border border-dashed border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
                      >
                        + Add Opportunity
                      </button>
                    </div>
                  </div>

                  {/* Threats Edit */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                      <span>⚡</span> Threats
                    </h3>
                    <div className="space-y-2">
                      {editingSwot.threats.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateSwotItem('threats', idx, e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter threat..."
                          />
                          <button
                            onClick={() => removeSwotItem('threats', idx)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSwotItem('threats')}
                        className="w-full px-3 py-2 border border-dashed border-amber-500/50 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                      >
                        + Add Threat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Edit */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <span>📝</span> Summary
                  </h3>
                  <textarea
                    value={editingSwot.summary}
                    onChange={(e) => setEditingSwot(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter SWOT summary..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={cancelSwotEdit}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSwotEdits}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            ) : swotData ? (
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
      </div>
    </div>
  )
}
