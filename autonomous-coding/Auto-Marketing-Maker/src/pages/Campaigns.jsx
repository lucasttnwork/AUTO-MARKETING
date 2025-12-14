import { useState, useEffect } from 'react'
import Calendar from '../components/Calendar'
import { useNavigate } from 'react-router-dom'

export default function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'calendar'
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    description: '',
    angle: '',
    offer_structure: {
      discount: '',
      bundle: '',
      guarantee: ''
    },
    budget_allocation: {
      total: '',
      facebook: '',
      google: '',
      tiktok: ''
    },
    schedule: {
      start_date: '',
      end_date: ''
    },
    funnel_map: {
      nodes: [],
      connections: []
    },
    ab_tests: [],
    status: 'draft'
  })
  const [submitting, setSubmitting] = useState(false)
  const [generatedAngles, setGeneratedAngles] = useState([])
  const [anglesLoading, setAnglesLoading] = useState(false)
  const [selectedAngleId, setSelectedAngleId] = useState(null)

  const wizardSteps = [
    { number: 1, title: 'Basic Info', subtitle: 'Campaign details' },
    { number: 2, title: 'Angle', subtitle: 'Marketing angle' },
    { number: 3, title: 'Offer', subtitle: 'Offer structure' },
    { number: 4, title: 'Budget', subtitle: 'Budget allocation' },
    { number: 5, title: 'Schedule', subtitle: 'Campaign dates' },
    { number: 6, title: 'Funnel', subtitle: 'Funnel mapping' },
    { number: 7, title: 'A/B Tests', subtitle: 'Test variants' },
    { number: 8, title: 'Review', subtitle: 'Finalize campaign' }
  ]

  // Funnel mapping state
  const [draggedNode, setDraggedNode] = useState(null)
  const funnelNodeTypes = [
    { id: 'ad', label: 'Ad', icon: '📢', color: 'from-blue-500 to-blue-600' },
    { id: 'landing_page', label: 'Landing Page', icon: '📄', color: 'from-purple-500 to-purple-600' },
    { id: 'email', label: 'Email', icon: '📧', color: 'from-green-500 to-green-600' },
    { id: 'conversion', label: 'Conversion', icon: '💰', color: 'from-amber-500 to-amber-600' },
    { id: 'retargeting', label: 'Retargeting', icon: '🎯', color: 'from-red-500 to-red-600' },
    { id: 'checkout', label: 'Checkout', icon: '🛒', color: 'from-indigo-500 to-indigo-600' }
  ]

  const handleDragStart = (e, nodeType) => {
    setDraggedNode(nodeType)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!draggedNode) return

    const canvas = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - canvas.left - 60 // center the node
    const y = e.clientY - canvas.top - 30

    const newNode = {
      id: `${draggedNode.id}_${Date.now()}`,
      type: draggedNode.id,
      label: draggedNode.label,
      icon: draggedNode.icon,
      color: draggedNode.color,
      x: Math.max(0, Math.min(x, canvas.width - 120)),
      y: Math.max(0, Math.min(y, canvas.height - 60))
    }

    setFormData(prev => ({
      ...prev,
      funnel_map: {
        ...prev.funnel_map,
        nodes: [...prev.funnel_map.nodes, newNode]
      }
    }))
    setDraggedNode(null)
  }

  const handleNodeDragStart = (e, nodeId) => {
    e.dataTransfer.setData('nodeId', nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleNodeDrop = (e) => {
    e.preventDefault()
    const nodeId = e.dataTransfer.getData('nodeId')
    if (!nodeId) return

    const canvas = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - canvas.left - 60
    const y = e.clientY - canvas.top - 30

    setFormData(prev => ({
      ...prev,
      funnel_map: {
        ...prev.funnel_map,
        nodes: prev.funnel_map.nodes.map(node =>
          node.id === nodeId
            ? { ...node, x: Math.max(0, Math.min(x, canvas.width - 120)), y: Math.max(0, Math.min(y, canvas.height - 60)) }
            : node
        )
      }
    }))
  }

  const [connectingFrom, setConnectingFrom] = useState(null)

  const handleStartConnection = (nodeId) => {
    setConnectingFrom(nodeId)
  }

  const handleCompleteConnection = (toNodeId) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      // Check if connection already exists
      const exists = formData.funnel_map.connections.some(
        conn => conn.from === connectingFrom && conn.to === toNodeId
      )
      if (!exists) {
        setFormData(prev => ({
          ...prev,
          funnel_map: {
            ...prev.funnel_map,
            connections: [...prev.funnel_map.connections, { from: connectingFrom, to: toNodeId }]
          }
        }))
      }
    }
    setConnectingFrom(null)
  }

  const removeNode = (nodeId) => {
    setFormData(prev => ({
      ...prev,
      funnel_map: {
        nodes: prev.funnel_map.nodes.filter(n => n.id !== nodeId),
        connections: prev.funnel_map.connections.filter(c => c.from !== nodeId && c.to !== nodeId)
      }
    }))
  }

  const removeConnection = (from, to) => {
    setFormData(prev => ({
      ...prev,
      funnel_map: {
        ...prev.funnel_map,
        connections: prev.funnel_map.connections.filter(c => !(c.from === from && c.to === to))
      }
    }))
  }

  useEffect(() => {
    fetchCampaigns()
    fetchClients()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/campaigns')
      const data = await response.json()
      setCampaigns(data)
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const generateAngles = async () => {
    if (!formData.client_id) {
      alert('Please select a client first')
      return
    }

    setAnglesLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/campaigns/generate-angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: formData.client_id,
          campaign_name: formData.name,
          campaign_description: formData.description
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedAngles(data.angles)
      } else {
        console.error('Failed to generate angles')
      }
    } catch (error) {
      console.error('Error generating angles:', error)
    } finally {
      setAnglesLoading(false)
    }
  }

  const selectAngle = (angle) => {
    setSelectedAngleId(angle.id)
    setFormData({
      ...formData,
      angle: `${angle.name}: ${angle.description}\n\nHook: ${angle.hook}\nTarget Audience: ${angle.target}`
    })
  }

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: parseInt(formData.client_id),
          name: formData.name,
          status: formData.status,
          angle: formData.angle || null,
          offer_structure: JSON.stringify(formData.offer_structure),
          budget_allocation: JSON.stringify(formData.budget_allocation),
          schedule: JSON.stringify(formData.schedule),
          funnel_map: JSON.stringify(formData.funnel_map),
          ab_tests: JSON.stringify(formData.ab_tests)
        })
      })

      if (response.ok) {
        await fetchCampaigns()
        setShowModal(false)
        setCurrentStep(1)
        setFormData({
          client_id: '',
          name: '',
          description: '',
          angle: '',
          offer_structure: { discount: '', bundle: '', guarantee: '' },
          budget_allocation: { total: '', facebook: '', google: '', tiktok: '' },
          schedule: { start_date: '', end_date: '' },
          funnel_map: { nodes: [], connections: [] },
          ab_tests: [],
          status: 'draft'
        })
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      case 'draft':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      case 'paused':
        return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-slate-400 dark:text-slate-500">Loading campaigns...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Campaigns</h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Create and manage marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Calendar View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            + New Campaign
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-bold tracking-tight mb-2">No campaigns yet</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Create your first campaign to start marketing
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            Create First Campaign
          </button>
        </div>
      ) : viewMode === 'calendar' ? (
        <Calendar
          campaigns={campaigns}
          onSelectCampaign={(campaign) => navigate(`/campaigns/${campaign.id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">
                  🎯
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <h3 className="text-lg font-bold tracking-tight mb-2">{campaign.name}</h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {getClientName(campaign.client_id)}
              </p>

              {/* Performance Metrics */}
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500 dark:text-slate-400 mb-1">Budget / Spend</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      ${campaign.total_spend ? campaign.total_spend.toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500 dark:text-slate-400 mb-1">ROAS</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {campaign.actual_roas ? `${campaign.actual_roas.toFixed(2)}x` : '-'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500 dark:text-slate-400 mb-1">Impressions</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {campaign.impressions ? campaign.impressions.toLocaleString() : '0'}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500 dark:text-slate-400 mb-1">Clicks</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {campaign.clicks ? campaign.clicks.toLocaleString() : '0'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
                >
                  View Details
                </button>
                <button className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Creation Wizard */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Wizard Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold tracking-tight">Create New Campaign</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Step-by-step campaign creation wizard
              </p>
            </div>

            {/* Step Indicators */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                {wizardSteps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                        currentStep === step.number
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : currentStep > step.number
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {currentStep > step.number ? '✓' : step.number}
                      </div>
                      <div className="text-xs mt-2 text-center">
                        <div className={`font-medium ${currentStep === step.number ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {index < wizardSteps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Wizard Content */}
            <form onSubmit={(e) => { e.preventDefault(); if (currentStep === 8) handleSubmit(e); else handleNext(); }} className="p-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client *</label>
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Black Friday 2024"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of the campaign goals and strategy"
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Angle */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* Generate Angles Button */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl">🎯</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Angle Generator</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Generate marketing angles based on client context</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={generateAngles}
                        disabled={anglesLoading || !formData.client_id}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {anglesLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </span>
                        ) : (
                          '🤖 Generate Angles'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Generated Angles Cards */}
                  {generatedAngles.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Select an Angle</label>
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                        {generatedAngles.map((angle) => (
                          <div
                            key={angle.id}
                            onClick={() => selectAngle(angle)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedAngleId === angle.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{angle.name}</h4>
                                  {selectedAngleId === angle.id && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">Selected</span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{angle.description}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                                    {angle.hook}
                                  </span>
                                  <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                    {angle.target}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Angle Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {generatedAngles.length > 0 ? 'Selected Angle (or customize below)' : 'Marketing Angle'}
                    </label>
                    <textarea
                      value={formData.angle}
                      onChange={(e) => setFormData({...formData, angle: e.target.value})}
                      placeholder="e.g., 'Exclusive Early Access for VIP Customers' or 'Problem-Solution Approach'"
                      rows="4"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Define the primary angle or approach for this campaign
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Offer Structure */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount/Promotion</label>
                    <input
                      type="text"
                      value={formData.offer_structure.discount}
                      onChange={(e) => setFormData({...formData, offer_structure: {...formData.offer_structure, discount: e.target.value}})}
                      placeholder="e.g., 30% off, Buy 2 Get 1 Free"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bundle Details</label>
                    <input
                      type="text"
                      value={formData.offer_structure.bundle}
                      onChange={(e) => setFormData({...formData, offer_structure: {...formData.offer_structure, bundle: e.target.value}})}
                      placeholder="e.g., Starter Pack + Bonus Items"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Guarantee</label>
                    <input
                      type="text"
                      value={formData.offer_structure.guarantee}
                      onChange={(e) => setFormData({...formData, offer_structure: {...formData.offer_structure, guarantee: e.target.value}})}
                      placeholder="e.g., 30-day money-back guarantee"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Budget Allocation */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Budget</label>
                    <input
                      type="number"
                      value={formData.budget_allocation.total}
                      onChange={(e) => setFormData({...formData, budget_allocation: {...formData.budget_allocation, total: e.target.value}})}
                      placeholder="e.g., 5000"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Facebook/Meta</label>
                      <input
                        type="number"
                        value={formData.budget_allocation.facebook}
                        onChange={(e) => setFormData({...formData, budget_allocation: {...formData.budget_allocation, facebook: e.target.value}})}
                        placeholder="2000"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Google Ads</label>
                      <input
                        type="number"
                        value={formData.budget_allocation.google}
                        onChange={(e) => setFormData({...formData, budget_allocation: {...formData.budget_allocation, google: e.target.value}})}
                        placeholder="2000"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">TikTok</label>
                      <input
                        type="number"
                        value={formData.budget_allocation.tiktok}
                        onChange={(e) => setFormData({...formData, budget_allocation: {...formData.budget_allocation, tiktok: e.target.value}})}
                        placeholder="1000"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Schedule */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📅</div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Campaign Schedule</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Set the start and end dates for your campaign. The end date must be after the start date.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={formData.schedule.start_date}
                        onChange={(e) => setFormData({...formData, schedule: {...formData.schedule, start_date: e.target.value}})}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        When the campaign should begin
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date *</label>
                      <input
                        type="date"
                        value={formData.schedule.end_date}
                        onChange={(e) => setFormData({...formData, schedule: {...formData.schedule, end_date: e.target.value}})}
                        min={formData.schedule.start_date || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        When the campaign should end
                      </p>
                    </div>
                  </div>
                  {formData.schedule.start_date && formData.schedule.end_date && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mt-4">
                      <div className="text-sm">
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">Campaign Duration</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {Math.ceil((new Date(formData.schedule.end_date) - new Date(formData.schedule.start_date)) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Funnel Mapping */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🔄</div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Funnel Mapping</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Drag elements from the toolbox to the canvas to build your marketing funnel. Click a node's connector to create connections between elements.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {/* Toolbox */}
                    <div className="w-40 flex-shrink-0">
                      <div className="text-sm font-medium mb-3">Funnel Elements</div>
                      <div className="space-y-2">
                        {funnelNodeTypes.map((nodeType) => (
                          <div
                            key={nodeType.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, nodeType)}
                            className={`p-3 rounded-lg bg-gradient-to-r ${nodeType.color} text-white cursor-move hover:shadow-lg transition-shadow flex items-center gap-2`}
                          >
                            <span className="text-lg">{nodeType.icon}</span>
                            <span className="text-sm font-medium">{nodeType.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Canvas */}
                    <div
                      className="flex-1 relative bg-slate-100 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 min-h-[400px]"
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        if (draggedNode) {
                          handleDrop(e)
                        } else {
                          handleNodeDrop(e)
                        }
                      }}
                    >
                      {formData.funnel_map.nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📥</div>
                            <p>Drag elements here to build your funnel</p>
                          </div>
                        </div>
                      )}

                      {/* SVG for connections */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {formData.funnel_map.connections.map((conn, index) => {
                          const fromNode = formData.funnel_map.nodes.find(n => n.id === conn.from)
                          const toNode = formData.funnel_map.nodes.find(n => n.id === conn.to)
                          if (!fromNode || !toNode) return null

                          const x1 = fromNode.x + 60
                          const y1 = fromNode.y + 30
                          const x2 = toNode.x + 60
                          const y2 = toNode.y + 30

                          return (
                            <g key={index}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#3b82f6"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                              />
                              <circle
                                cx={(x1 + x2) / 2}
                                cy={(y1 + y2) / 2}
                                r="8"
                                fill="#ef4444"
                                className="cursor-pointer pointer-events-auto"
                                onClick={() => removeConnection(conn.from, conn.to)}
                              />
                              <text
                                x={(x1 + x2) / 2}
                                y={(y1 + y2) / 2 + 4}
                                textAnchor="middle"
                                fill="white"
                                fontSize="12"
                                className="pointer-events-none"
                              >
                                ×
                              </text>
                            </g>
                          )
                        })}
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                          </marker>
                        </defs>
                      </svg>

                      {/* Nodes */}
                      {formData.funnel_map.nodes.map((node) => (
                        <div
                          key={node.id}
                          draggable
                          onDragStart={(e) => handleNodeDragStart(e, node.id)}
                          className={`absolute w-[120px] p-3 rounded-lg bg-gradient-to-r ${node.color} text-white cursor-move shadow-lg transition-transform hover:scale-105`}
                          style={{ left: node.x, top: node.y }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{node.icon}</span>
                            <span className="text-sm font-medium truncate">{node.label}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNode(node.id)
                              }}
                              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (connectingFrom === node.id) {
                                  setConnectingFrom(null)
                                } else if (connectingFrom) {
                                  handleCompleteConnection(node.id)
                                } else {
                                  handleStartConnection(node.id)
                                }
                              }}
                              className={`text-xs px-2 py-0.5 rounded ${
                                connectingFrom === node.id
                                  ? 'bg-green-500 text-white'
                                  : connectingFrom
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white/20 hover:bg-white/30'
                              }`}
                            >
                              {connectingFrom === node.id ? 'Cancel' : connectingFrom ? 'Connect' : 'Link'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funnel Summary */}
                  {(formData.funnel_map.nodes.length > 0 || formData.funnel_map.connections.length > 0) && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mt-4">
                      <div className="text-sm">
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">Funnel Summary</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {formData.funnel_map.nodes.length} elements, {formData.funnel_map.connections.length} connections
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 7: A/B Testing */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🧪</div>
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">A/B Test Configuration</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Create and configure test variants to optimize your campaign performance. Each variant can have different copy, images, or offers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Variants List */}
                  <div className="space-y-4">
                    {formData.ab_tests.map((test, testIndex) => (
                      <div key={test.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium text-lg">Test #{testIndex + 1}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{test.name || 'Unnamed Test'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                ab_tests: prev.ab_tests.filter((_, i) => i !== testIndex)
                              }))
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove Test
                          </button>
                        </div>

                        {/* Test Name */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Test Name</label>
                          <input
                            type="text"
                            value={test.name}
                            onChange={(e) => {
                              const newTests = [...formData.ab_tests]
                              newTests[testIndex].name = e.target.value
                              setFormData(prev => ({ ...prev, ab_tests: newTests }))
                            }}
                            placeholder="e.g., Headline Test, CTA Test"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Variants */}
                        <div className="grid grid-cols-2 gap-4">
                          {test.variants.map((variant, variantIndex) => (
                            <div key={variant.id} className={`p-4 rounded-lg border-2 ${
                              variantIndex === 0
                                ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                            }`}>
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  variantIndex === 0 ? 'bg-blue-500' : 'bg-orange-500'
                                }`}>
                                  {String.fromCharCode(65 + variantIndex)}
                                </span>
                                <span className="font-medium">Variant {String.fromCharCode(65 + variantIndex)}</span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Headline</label>
                                  <input
                                    type="text"
                                    value={variant.headline}
                                    onChange={(e) => {
                                      const newTests = [...formData.ab_tests]
                                      newTests[testIndex].variants[variantIndex].headline = e.target.value
                                      setFormData(prev => ({ ...prev, ab_tests: newTests }))
                                    }}
                                    placeholder="Enter headline"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Body Copy</label>
                                  <textarea
                                    value={variant.body}
                                    onChange={(e) => {
                                      const newTests = [...formData.ab_tests]
                                      newTests[testIndex].variants[variantIndex].body = e.target.value
                                      setFormData(prev => ({ ...prev, ab_tests: newTests }))
                                    }}
                                    placeholder="Enter body copy"
                                    rows="2"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">CTA Button</label>
                                  <input
                                    type="text"
                                    value={variant.cta}
                                    onChange={(e) => {
                                      const newTests = [...formData.ab_tests]
                                      newTests[testIndex].variants[variantIndex].cta = e.target.value
                                      setFormData(prev => ({ ...prev, ab_tests: newTests }))
                                    }}
                                    placeholder="e.g., Shop Now, Learn More"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Traffic Split (%)</label>
                                  <input
                                    type="number"
                                    value={variant.traffic_split}
                                    onChange={(e) => {
                                      const newTests = [...formData.ab_tests]
                                      newTests[testIndex].variants[variantIndex].traffic_split = parseInt(e.target.value) || 0
                                      setFormData(prev => ({ ...prev, ab_tests: newTests }))
                                    }}
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create Variant Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newTest = {
                        id: `test_${Date.now()}`,
                        name: '',
                        variants: [
                          { id: `var_a_${Date.now()}`, headline: '', body: '', cta: '', traffic_split: 50 },
                          { id: `var_b_${Date.now() + 1}`, headline: '', body: '', cta: '', traffic_split: 50 }
                        ],
                        status: 'draft',
                        created_at: new Date().toISOString()
                      }
                      setFormData(prev => ({
                        ...prev,
                        ab_tests: [...prev.ab_tests, newTest]
                      }))
                    }}
                    className="w-full py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    <span>Create Variant</span>
                  </button>

                  {/* A/B Test Summary */}
                  {formData.ab_tests.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mt-4">
                      <div className="text-sm">
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">A/B Test Summary</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {formData.ab_tests.length} test(s) configured with {formData.ab_tests.reduce((acc, test) => acc + test.variants.length, 0)} total variants
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 8: Review */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <h3 className="font-bold tracking-tight mb-3">Campaign Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Client</div>
                        <div className="font-medium">{clients.find(c => c.id === parseInt(formData.client_id))?.name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Campaign Name</div>
                        <div className="font-medium">{formData.name || 'N/A'}</div>
                      </div>
                      {formData.description && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</div>
                          <div className="font-medium text-slate-700 dark:text-slate-300">{formData.description}</div>
                        </div>
                      )}
                      {formData.angle && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Marketing Angle</div>
                          <div className="font-medium text-slate-700 dark:text-slate-300">{formData.angle}</div>
                        </div>
                      )}
                      {(formData.offer_structure.discount || formData.offer_structure.bundle || formData.offer_structure.guarantee) && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Offer Structure</div>
                          <div className="space-y-1">
                            {formData.offer_structure.discount && (
                              <div className="text-slate-700 dark:text-slate-300">• Discount: {formData.offer_structure.discount}</div>
                            )}
                            {formData.offer_structure.bundle && (
                              <div className="text-slate-700 dark:text-slate-300">• Bundle: {formData.offer_structure.bundle}</div>
                            )}
                            {formData.offer_structure.guarantee && (
                              <div className="text-slate-700 dark:text-slate-300">• Guarantee: {formData.offer_structure.guarantee}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {formData.budget_allocation.total && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Budget Allocation</div>
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">Total: ${formData.budget_allocation.total}</div>
                            {formData.budget_allocation.facebook && (
                              <div className="text-slate-700 dark:text-slate-300">• Facebook/Meta: ${formData.budget_allocation.facebook}</div>
                            )}
                            {formData.budget_allocation.google && (
                              <div className="text-slate-700 dark:text-slate-300">• Google Ads: ${formData.budget_allocation.google}</div>
                            )}
                            {formData.budget_allocation.tiktok && (
                              <div className="text-slate-700 dark:text-slate-300">• TikTok: ${formData.budget_allocation.tiktok}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {(formData.schedule.start_date || formData.schedule.end_date) && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Campaign Schedule</div>
                          <div className="space-y-1">
                            {formData.schedule.start_date && (
                              <div className="text-slate-700 dark:text-slate-300">• Start Date: {new Date(formData.schedule.start_date).toLocaleDateString()}</div>
                            )}
                            {formData.schedule.end_date && (
                              <div className="text-slate-700 dark:text-slate-300">• End Date: {new Date(formData.schedule.end_date).toLocaleDateString()}</div>
                            )}
                            {formData.schedule.start_date && formData.schedule.end_date && (
                              <div className="text-slate-700 dark:text-slate-300 font-medium">
                                • Duration: {Math.ceil((new Date(formData.schedule.end_date) - new Date(formData.schedule.start_date)) / (1000 * 60 * 60 * 24))} days
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(formData.funnel_map.nodes.length > 0) && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Funnel Map</div>
                          <div className="space-y-1">
                            <div className="text-slate-700 dark:text-slate-300">
                              • {formData.funnel_map.nodes.length} elements: {formData.funnel_map.nodes.map(n => n.label).join(' → ')}
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              • {formData.funnel_map.connections.length} connections
                            </div>
                          </div>
                        </div>
                      )}
                      {formData.ab_tests.length > 0 && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">A/B Tests</div>
                          <div className="space-y-1">
                            <div className="text-slate-700 dark:text-slate-300">
                              • {formData.ab_tests.length} test(s) configured
                            </div>
                            {formData.ab_tests.map((test, i) => (
                              <div key={test.id} className="text-slate-700 dark:text-slate-300">
                                • {test.name || `Test #${i + 1}`}: {test.variants.length} variants
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setCurrentStep(1)
                    setFormData({
                      client_id: '',
                      name: '',
                      description: '',
                      angle: '',
                      offer_structure: { discount: '', bundle: '', guarantee: '' },
                      budget_allocation: { total: '', facebook: '', google: '', tiktok: '' },
                      schedule: { start_date: '', end_date: '' },
                      funnel_map: { nodes: [], connections: [] },
                      ab_tests: [],
                      status: 'draft'
                    })
                    setConnectingFrom(null)
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
                    disabled={submitting}
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || (currentStep === 1 && (!formData.client_id || !formData.name))}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : currentStep === 8 ? 'Create Campaign' : 'Next Step'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
