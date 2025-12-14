import { useState, useEffect, useCallback } from 'react'
import { useClient } from '../context/ClientContext'
import { useToast } from '../components/Toast'

// Agent definitions with full metadata
const agentDefinitions = [
  {
    id: 'email-sequence',
    name: 'Email Sequence Agent',
    icon: '📧',
    category: 'Copy',
    description: 'Generate email sequences including Welcome, Abandoned Cart, Post-Purchase, Re-engagement, Nurture, and Launch campaigns.',
    capabilities: [
      'Multi-email sequence generation (3-7 emails)',
      'Subject line A/B variants',
      'Preview text optimization',
      'CTA button copy variations',
      'HTML-ready output'
    ],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'landing-page',
    name: 'Landing Page Agent',
    icon: '📄',
    category: 'Copy',
    description: 'Generate complete landing page copy with Hero, Problem, Solution, Features, Social Proof, FAQ, and CTA sections.',
    capabilities: [
      'Full landing page copy',
      'Multiple headline variations',
      'SEO meta descriptions',
      'Above/below-fold optimization',
      'Mobile-first considerations'
    ],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'social-media',
    name: 'Social Media Agent',
    icon: '📱',
    category: 'Copy',
    description: 'Create content for Instagram, LinkedIn, Twitter/X, Facebook, TikTok and more with platform-specific formatting.',
    capabilities: [
      'Instagram posts & carousels',
      'Reels/TikTok scripts',
      'LinkedIn professional posts',
      'Twitter/X threads',
      'Platform character limits enforced'
    ],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'ad-copy',
    name: 'Ad Copy Agent',
    icon: '📢',
    category: 'Copy',
    description: 'Generate high-converting ad copy for Facebook, Instagram, Google, YouTube and native advertising platforms.',
    capabilities: [
      'Facebook/Instagram ads',
      'Google Ads headlines & descriptions',
      'YouTube ad scripts',
      'Multi-variant generation (5-10)',
      'Constitution compliance check'
    ],
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'video-script',
    name: 'Video Script Agent',
    icon: '🎬',
    category: 'Copy',
    description: 'Create video scripts for UGC, talking heads, product demos, and testimonials with timestamp-based structure.',
    capabilities: [
      'UGC-style scripts',
      'Talking head scripts',
      'Product demo scripts',
      'Hook → Problem → Solution → CTA',
      'B-roll recommendations'
    ],
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'content-strategy',
    name: 'Content Strategy Agent',
    icon: '📋',
    category: 'Strategic',
    description: 'Plan editorial calendars, content pillars, topic clusters, and content gap analysis for comprehensive strategy.',
    capabilities: [
      '30/60/90 day calendars',
      'Content pillar definition',
      'Topic clusters & keywords',
      'Content gap analysis',
      'Repurposing recommendations'
    ],
    color: 'from-teal-500 to-emerald-500'
  },
  {
    id: 'sms-whatsapp',
    name: 'SMS/WhatsApp Agent',
    icon: '💬',
    category: 'Copy',
    description: 'Create SMS campaigns under 160 characters and WhatsApp marketing messages with conversational flows.',
    capabilities: [
      'SMS (160 char limit)',
      'WhatsApp marketing messages',
      'Broadcast sequences',
      'Conversational flows',
      'Emoji optimization'
    ],
    color: 'from-green-500 to-lime-500'
  },
  {
    id: 'brand-voice',
    name: 'Brand Voice Analyzer',
    icon: '🎯',
    category: 'Strategic',
    description: 'Extract and analyze brand voice from existing content to create comprehensive writing style guides.',
    capabilities: [
      'Tone analysis',
      'Vocabulary patterns',
      'Writing style guide',
      'Competitor voice comparison',
      'Brand consistency checks'
    ],
    color: 'from-indigo-500 to-violet-500'
  },
  {
    id: 'icp-researcher',
    name: 'ICP Researcher',
    icon: '👤',
    category: 'Strategic',
    description: 'Deep dive into Ideal Customer Profile with pain points, desires, objections, and customer journey mapping.',
    capabilities: [
      'Pain points expansion',
      'Desire mapping',
      'Objection anticipation',
      'Customer journey mapping',
      'Persona card generation'
    ],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'competitor-spy',
    name: 'Competitor Spy',
    icon: '🕵️',
    category: 'Strategic',
    description: 'Analyze competitor ads, landing pages, and messaging patterns to identify weaknesses and opportunities.',
    capabilities: [
      'Ad library analysis',
      'Landing page teardowns',
      'Messaging extraction',
      'Weakness identification',
      'Differentiation opportunities'
    ],
    color: 'from-slate-500 to-gray-500'
  }
]

// Prompt presets for the Prompt Studio
const promptPresets = [
  { id: 'conversion', name: 'Conversion-focused', description: 'Direct, action-oriented copy' },
  { id: 'consultative', name: 'Consultative', description: 'Educational, trust-building approach' },
  { id: 'institutional', name: 'Institutional', description: 'Professional, brand-building tone' },
  { id: 'friendly', name: 'Friendly', description: 'Casual, relatable communication' },
  { id: 'urgent', name: 'Urgent', description: 'Time-sensitive, FOMO-driven copy' }
]

// Email types for Email Sequence Agent
const emailTypes = [
  { id: 'welcome', name: 'Welcome Email', description: 'Welcome new subscribers/customers' },
  { id: 'abandoned-cart', name: 'Abandoned Cart', description: 'Recover abandoned shopping carts' },
  { id: 'post-purchase', name: 'Post-Purchase', description: 'Thank you and upsell after purchase' },
  { id: 're-engagement', name: 'Re-engagement', description: 'Win back inactive subscribers' },
  { id: 'nurture', name: 'Nurture Sequence', description: 'Build relationship over time' },
  { id: 'launch', name: 'Launch Campaign', description: 'Product or service launch emails' }
]

// Social media content types
const socialMediaTypes = [
  { id: 'instagram-post', name: 'Instagram Post', description: 'Single image caption' },
  { id: 'instagram-carousel', name: 'Instagram Carousel', description: 'Multi-slide content' },
  { id: 'reels-tiktok', name: 'Reels/TikTok Script', description: 'Short-form video script' },
  { id: 'linkedin', name: 'LinkedIn Post', description: 'Professional post' },
  { id: 'twitter-thread', name: 'Twitter/X Thread', description: 'Multi-tweet thread' },
  { id: 'facebook-ad', name: 'Facebook Ad Copy', description: 'Primary text, headline, description' }
]

// Ad copy types
const adCopyTypes = [
  { id: 'facebook-instagram', name: 'Facebook/Instagram Ad', description: 'Meta platform ads' },
  { id: 'google-ads', name: 'Google Ads', description: 'Headlines and descriptions' },
  { id: 'youtube', name: 'YouTube Ad Script', description: 'Pre-roll or mid-roll ads' },
  { id: 'native', name: 'Native Ad', description: 'Editorial style ads' }
]

// Video script types
const videoScriptTypes = [
  { id: 'ugc', name: 'UGC-Style', description: 'User-generated content style' },
  { id: 'talking-head', name: 'Talking Head', description: 'Presenter-focused script' },
  { id: 'product-demo', name: 'Product Demo', description: 'Demonstration video' },
  { id: 'testimonial', name: 'Testimonial', description: 'Customer story framework' }
]

// Content strategy types
const contentStrategyTypes = [
  { id: 'editorial-calendar', name: 'Editorial Calendar', description: '30/60/90 day content calendar with topics and schedule' },
  { id: 'content-pillars', name: 'Content Pillars', description: 'Define core content themes and categories' },
  { id: 'topic-clusters', name: 'Topic Clusters', description: 'SEO-focused topic clusters and keywords' },
  { id: 'content-gap', name: 'Content Gap Analysis', description: 'Identify missing content opportunities' }
]

// SMS/WhatsApp types
const smsWhatsappTypes = [
  { id: 'sms-campaign', name: 'SMS Campaign', description: 'Promotional SMS under 160 characters with opt-out' },
  { id: 'sms-reminder', name: 'SMS Reminder', description: 'Appointment/cart reminder messages' },
  { id: 'whatsapp-promo', name: 'WhatsApp Promo', description: 'Promotional WhatsApp messages with rich media' },
  { id: 'whatsapp-flow', name: 'WhatsApp Flow', description: 'Conversational WhatsApp message sequences' }
]

// Get content types for a specific agent
const getContentTypesForAgent = (agentId) => {
  switch (agentId) {
    case 'email-sequence': return emailTypes
    case 'social-media': return socialMediaTypes
    case 'ad-copy': return adCopyTypes
    case 'video-script': return videoScriptTypes
    case 'content-strategy': return contentStrategyTypes
    case 'sms-whatsapp': return smsWhatsappTypes
    default: return null
  }
}

export default function Agents() {
  const { selectedClient, clients, selectClient } = useClient()
  const toast = useToast()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('conversion')
  const [selectedContentType, setSelectedContentType] = useState(null)
  const [sequenceLength, setSequenceLength] = useState(5)
  const [generateABVariants, setGenerateABVariants] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [brief, setBrief] = useState('')
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [wasCancelled, setWasCancelled] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const [generationCount, setGenerationCount] = useState(0)
  const [generationHistory, setGenerationHistory] = useState([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)
  const [clientContext, setClientContext] = useState(null)
  const [showClientSelector, setShowClientSelector] = useState(false)
  const [activeTab, setActiveTab] = useState('agents') // 'agents', 'configuration', or 'congress'
  const [agentConfigurations, setAgentConfigurations] = useState({})

  // AI Model selection state
  const [availableModels, setAvailableModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('default') // 'default' means use system default
  const [modelsLoading, setModelsLoading] = useState(false)
  const [editingAgentConfig, setEditingAgentConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2000,
    defaultPreset: 'conversion'
  })
  const [configSaved, setConfigSaved] = useState(false)

  // Agent Congress / MAKER Framework state
  const [votingThreshold, setVotingThreshold] = useState(2) // ahead-by-k threshold
  const [votingSessions, setVotingSessions] = useState([])
  const [congressLoading, setCongressLoading] = useState(false)
  const [thresholdSaved, setThresholdSaved] = useState(false)

  // Agent Performance Analytics state
  const [agentAnalytics, setAgentAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  // Compliance check state
  const [complianceStatus, setComplianceStatus] = useState(null)
  const [complianceLoading, setComplianceLoading] = useState(false)

  // Custom Prompt Presets state
  const [savedPresets, setSavedPresets] = useState([])
  const [selectedSavedPreset, setSelectedSavedPreset] = useState('')
  const [showSavePresetModal, setShowSavePresetModal] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [presetsLoading, setPresetsLoading] = useState(false)

  // Campaign alignment state
  const [selectedCampaign, setSelectedCampaign] = useState('all') // 'all' or specific campaign id
  const [showTopHooks, setShowTopHooks] = useState(true)
  const [inspiredByHooks, setInspiredByHooks] = useState([]) // Hooks that inspired the generation

  // Load agent configurations from localStorage on mount
  useEffect(() => {
    const savedConfigs = localStorage.getItem('ama_agent_configurations')
    if (savedConfigs) {
      try {
        setAgentConfigurations(JSON.parse(savedConfigs))
      } catch (e) {
        console.error('Failed to parse saved agent configurations:', e)
      }
    }
    // Load voting threshold from localStorage
    const savedThreshold = localStorage.getItem('ama_voting_threshold')
    if (savedThreshold) {
      setVotingThreshold(parseInt(savedThreshold) || 2)
    }
  }, [])

  // Fetch available AI models on mount
  useEffect(() => {
    fetchAvailableModels()
  }, [])

  const fetchAvailableModels = async () => {
    setModelsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/models')
      if (response.ok) {
        const models = await response.json()
        setAvailableModels(models.filter(m => m.is_active))
      }
    } catch (error) {
      console.error('Error fetching AI models:', error)
    } finally {
      setModelsLoading(false)
    }
  }

  // Fetch voting sessions and analytics for Agent Congress tab
  useEffect(() => {
    if (activeTab === 'congress') {
      fetchVotingSessions()
      fetchAgentAnalytics()
    }
  }, [activeTab])

  const fetchVotingSessions = async () => {
    setCongressLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/agents/voting-sessions')
      if (response.ok) {
        const data = await response.json()
        setVotingSessions(data)
      }
    } catch (error) {
      console.error('Error fetching voting sessions:', error)
    } finally {
      setCongressLoading(false)
    }
  }

  const handleSaveVotingThreshold = () => {
    localStorage.setItem('ama_voting_threshold', votingThreshold.toString())
    setThresholdSaved(true)
    setTimeout(() => setThresholdSaved(false), 3000)
    toast.success(`Voting threshold saved: k = ${votingThreshold}`)
  }

  // Fetch agent analytics
  const fetchAgentAnalytics = async (startDate = '', endDate = '') => {
    setAnalyticsLoading(true)
    try {
      let url = 'http://localhost:3001/api/agents/analytics'
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (params.toString()) url += '?' + params.toString()

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAgentAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching agent analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Handle date range filter change
  const handleDateRangeChange = (field, value) => {
    const newRange = { ...analyticsDateRange, [field]: value }
    setAnalyticsDateRange(newRange)
  }

  // Apply date filter
  const applyDateFilter = () => {
    fetchAgentAnalytics(analyticsDateRange.startDate, analyticsDateRange.endDate)
  }

  // Clear date filter
  const clearDateFilter = () => {
    setAnalyticsDateRange({ startDate: '', endDate: '' })
    fetchAgentAnalytics()
  }

  // Fetch saved presets for client
  const fetchSavedPresets = useCallback(async () => {
    if (!selectedClient?.id) return
    setPresetsLoading(true)
    try {
      const url = `http://localhost:3001/api/presets?client_id=${selectedClient.id}`
      const response = await fetch(url)
      if (response.ok) {
        const presets = await response.json()
        setSavedPresets(presets)
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    } finally {
      setPresetsLoading(false)
    }
  }, [selectedClient?.id])

  // Load presets when client changes
  useEffect(() => {
    if (selectedClient?.id) {
      fetchSavedPresets()
    }
  }, [selectedClient?.id, fetchSavedPresets])

  // Save custom prompt as preset
  const handleSavePreset = async () => {
    if (!newPresetName.trim() || !customPrompt.trim() || !selectedClient?.id) {
      toast.error('Please enter a preset name and custom instructions')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          name: newPresetName.trim(),
          prompt_text: customPrompt,
          agent_type: selectedAgent?.id || null
        })
      })

      if (response.ok) {
        toast.success(`Preset "${newPresetName}" saved successfully`)
        setShowSavePresetModal(false)
        setNewPresetName('')
        fetchSavedPresets()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save preset')
      }
    } catch (error) {
      console.error('Error saving preset:', error)
      toast.error('Failed to save preset')
    }
  }

  // Load a saved preset
  const handleLoadPreset = (presetId) => {
    if (!presetId) {
      setCustomPrompt('')
      setSelectedSavedPreset('')
      return
    }
    const preset = savedPresets.find(p => p.id === parseInt(presetId))
    if (preset) {
      setCustomPrompt(preset.prompt_text)
      setSelectedSavedPreset(presetId)
      setShowCustomPrompt(true)
      toast.success(`Loaded preset: ${preset.name}`)
    }
  }

  // Delete a preset
  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('Are you sure you want to delete this preset?')) return

    try {
      const response = await fetch(`http://localhost:3001/api/presets/${presetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Preset deleted')
        if (selectedSavedPreset === presetId.toString()) {
          setSelectedSavedPreset('')
        }
        fetchSavedPresets()
      } else {
        toast.error('Failed to delete preset')
      }
    } catch (error) {
      console.error('Error deleting preset:', error)
      toast.error('Failed to delete preset')
    }
  }

  // Get quality score color
  const getQualityScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
    return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }

  // Get agent icon by type
  const getAgentIcon = (agentType) => {
    const icons = {
      creator: '✏️',
      strategist: '🎯',
      critic: '🔍',
      copywriter: '📝',
      designer: '🎨',
      videoscript: '🎬',
      email: '📧',
      social: '📱'
    }
    return icons[agentType] || '🤖'
  }

  // Calculate entropy quality label
  const getEntropyLabel = (entropy) => {
    if (entropy < 0.3) return { label: 'High Consensus', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' }
    if (entropy < 0.6) return { label: 'Moderate Agreement', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' }
    return { label: 'High Disagreement', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' }
  }

  // Fetch client context when client is selected
  useEffect(() => {
    if (selectedClient) {
      fetchClientContext(selectedClient.id)
    }
  }, [selectedClient])

  // Keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard shortcuts when on agents tab and agent is selected
      if (activeTab !== 'agents' || !selectedAgent) return

      const isMod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+Enter - Generate
      if (isMod && e.key === 'Enter') {
        e.preventDefault()
        if (!isGenerating && selectedClient && brief.trim()) {
          handleGenerate()
        }
      }

      // Cmd/Ctrl+C when output exists - Copy to clipboard (only when no text is selected)
      if (isMod && e.key === 'c' && output && !window.getSelection().toString()) {
        e.preventDefault()
        copyToClipboard()
      }

      // Cmd/Ctrl+S - Save to assets
      if (isMod && e.key === 's') {
        e.preventDefault()
        if (output && selectedClient && selectedAgent) {
          handleSaveToAssets()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, selectedAgent, selectedClient, brief, output, isGenerating])

  const fetchClientContext = async (clientId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/agents/context/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClientContext(data)
      }
    } catch (error) {
      console.error('Error fetching client context:', error)
    }
  }

  const handleAgentSelect = (agent) => {
    if (!selectedClient) {
      setShowClientSelector(true)
      return
    }
    setSelectedAgent(agent)
    setOutput('')
    setBrief('')
    setGenerationCount(0) // Reset generation count for new agent
    // Reset content type and set default if agent has content types
    const contentTypes = getContentTypesForAgent(agent.id)
    setSelectedContentType(contentTypes ? contentTypes[0].id : null)
  }

  const handleGenerate = async () => {
    if (!selectedClient) {
      setShowClientSelector(true)
      return
    }

    if (!brief.trim()) {
      toast.warning('Please provide a brief for the agent.')
      return
    }

    // Create new AbortController for this generation
    const controller = new AbortController()
    setAbortController(controller)
    setIsGenerating(true)
    setOutput('')
    setWasCancelled(false)
    setGenerationError(null)
    setComplianceStatus(null)
    setInspiredByHooks([]) // Reset inspired hooks
    setGenerationCount(prev => prev + 1)

    // Get top performing hooks to include as inspiration
    const topHooks = clientContext?.topPerformers?.filter(p => p.element_type === 'hook') || []
    if (topHooks.length > 0) {
      setInspiredByHooks(topHooks.slice(0, 3))
    }

    let fullOutput = ''

    try {
      // Determine which model to use
      const modelToUse = selectedModel === 'default' ? null : selectedModel

      // Get selected campaign data for alignment
      const campaignToAlign = selectedCampaign !== 'all'
        ? clientContext?.activeCampaigns?.find(c => c.id === parseInt(selectedCampaign))
        : null

      const response = await fetch('http://localhost:3001/api/agents/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent.id,
          clientId: selectedClient.id,
          brief: brief,
          preset: selectedPreset,
          contentType: selectedContentType,
          sequenceLength: sequenceLength,
          generateABVariants: generateABVariants,
          customPrompt: showCustomPrompt ? customPrompt : null,
          modelId: modelToUse,
          campaignId: selectedCampaign !== 'all' ? parseInt(selectedCampaign) : null,
          campaignAngle: campaignToAlign?.angle ? JSON.parse(campaignToAlign.angle) : null,
          topHooks: topHooks.slice(0, 5).map(h => h.element_value)
        }),
        signal: controller.signal
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content') {
                fullOutput += data.content
                setOutput(fullOutput)
              } else if (data.type === 'error') {
                setOutput(`Error: ${data.error}`)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Add to history only if completed successfully
      setGenerationHistory(prev => [{
        id: Date.now(),
        agentType: selectedAgent.name,
        agentId: selectedAgent.id,
        clientName: selectedClient.name,
        clientId: selectedClient.id,
        brief: brief.substring(0, 100) + (brief.length > 100 ? '...' : ''),
        fullBrief: brief,
        timestamp: new Date().toLocaleString(),
        preview: fullOutput.substring(0, 150) + '...',
        fullOutput: fullOutput
      }, ...prev.slice(0, 19)])

      // Run compliance check on generated content
      if (fullOutput && selectedClient) {
        setComplianceLoading(true)
        try {
          const complianceResponse = await fetch('http://localhost:3001/api/constitution/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: selectedClient.id,
              content: fullOutput
            })
          })
          const complianceData = await complianceResponse.json()
          setComplianceStatus(complianceData)
        } catch (complianceError) {
          console.error('Compliance check error:', complianceError)
          setComplianceStatus({ error: 'Failed to check compliance' })
        } finally {
          setComplianceLoading(false)
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        // Generation was cancelled - keep partial output
        setWasCancelled(true)
        toast.info('Generation cancelled. Partial output preserved.')
        // Add cancelled generation to history with partial output
        if (fullOutput.length > 0) {
          setGenerationHistory(prev => [{
            id: Date.now(),
            agentType: selectedAgent.name,
            agentId: selectedAgent.id,
            clientName: selectedClient.name,
            clientId: selectedClient.id,
            brief: brief.substring(0, 100) + (brief.length > 100 ? '...' : ''),
            fullBrief: brief,
            timestamp: new Date().toLocaleString(),
            preview: '[Cancelled] ' + fullOutput.substring(0, 130) + '...',
            fullOutput: fullOutput,
            wasCancelled: true
          }, ...prev.slice(0, 19)])
        }
      } else {
        console.error('Generation error:', error)
        const errorMessage = error.message || 'An unknown error occurred'
        setGenerationError({
          message: errorMessage,
          timestamp: new Date().toLocaleString()
        })
        setOutput('')
        toast.error('Error generating content. Check the error message and try again.')
      }
    } finally {
      setIsGenerating(false)
      setAbortController(null)
    }
  }

  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleRetryGeneration = () => {
    setGenerationError(null)
    handleGenerate()
  }

  const handleSaveToAssets = async () => {
    if (!output || !selectedClient || !selectedAgent) {
      toast.warning('Please generate content first before saving.')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/agents/save-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          agentType: selectedAgent.id,
          content: output,
          brief: brief
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Content saved to client assets!')
      } else {
        toast.error('Failed to save content. Please try again.')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Error saving content. Please try again.')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output)
      toast.success('Copied to clipboard!')
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('Failed to copy to clipboard.')
    }
  }

  const handleEditAgentConfig = (agent) => {
    setEditingAgentConfig(agent)
    const existingConfig = agentConfigurations[agent.id] || {}
    setConfigForm({
      systemPrompt: existingConfig.systemPrompt || getDefaultSystemPrompt(agent),
      temperature: existingConfig.temperature ?? 0.7,
      maxTokens: existingConfig.maxTokens ?? 2000,
      defaultPreset: existingConfig.defaultPreset || 'conversion'
    })
  }

  const getDefaultSystemPrompt = (agent) => {
    return `You are the ${agent.name}, a specialized AI agent for ${agent.category.toLowerCase()} content creation.

Your capabilities include:
${agent.capabilities.map(cap => `- ${cap}`).join('\n')}

Always maintain brand voice consistency and follow the client's guidelines.`
  }

  const handleSaveAgentConfig = () => {
    if (!editingAgentConfig) return

    const updatedConfigs = {
      ...agentConfigurations,
      [editingAgentConfig.id]: {
        ...configForm,
        updatedAt: new Date().toISOString()
      }
    }
    setAgentConfigurations(updatedConfigs)
    localStorage.setItem('ama_agent_configurations', JSON.stringify(updatedConfigs))
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 3000)
  }

  const handleResetAgentConfig = (agentId) => {
    const { [agentId]: removed, ...rest } = agentConfigurations
    setAgentConfigurations(rest)
    localStorage.setItem('ama_agent_configurations', JSON.stringify(rest))
    if (editingAgentConfig?.id === agentId) {
      const agent = agentDefinitions.find(a => a.id === agentId)
      setConfigForm({
        systemPrompt: getDefaultSystemPrompt(agent),
        temperature: 0.7,
        maxTokens: 2000,
        defaultPreset: 'conversion'
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agents Hub</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          AI-powered content generation agents with full client context
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === 'agents'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🤖 Agents
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === 'configuration'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          id="configuration-tab"
        >
          ⚙️ Configuration
        </button>
        <button
          onClick={() => setActiveTab('congress')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === 'congress'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          id="congress-tab"
        >
          🏛️ Agent Congress
        </button>
      </div>

      {/* Agents Tab Content */}
      {activeTab === 'agents' && (
        <>
          {/* Client Selector Banner */}
          {!selectedClient && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Select a client to get started</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Agents require client context to generate relevant content. Please select a client from the sidebar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Client Context Card */}
      {selectedClient && clientContext && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">{selectedClient.name}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Context loaded: Brand voice, ICP, Performance data</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              ✓ Ready
            </span>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Cards Grid */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Available Agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="agents-grid">
            {agentDefinitions.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentSelect(agent)}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                  selectedAgent?.id === agent.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
                id={`agent-card-${agent.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-sm`}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{agent.name}</h3>
                      <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                        {agent.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{agent.description}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAgentSelect(agent)
                  }}
                  className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }`}
                  id={`generate-btn-${agent.id}`}
                >
                  {selectedAgent?.id === agent.id ? 'Selected' : 'Generate'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Panel */}
        <div className="lg:col-span-1">
          {selectedAgent ? (
            <div className="sticky top-6 space-y-4">
              {/* Selected Agent Header */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center text-xl`}>
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{selectedAgent.name}</h3>
                    <p className="text-xs text-slate-500">{selectedAgent.category} Agent</p>
                  </div>
                </div>

                {/* Content Type Selector (for agents with multiple content types) */}
                {getContentTypesForAgent(selectedAgent.id) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {selectedAgent.id === 'email-sequence' ? 'Email Type' :
                       selectedAgent.id === 'social-media' ? 'Platform/Format' :
                       selectedAgent.id === 'ad-copy' ? 'Ad Platform' :
                       selectedAgent.id === 'video-script' ? 'Script Type' : 'Content Type'}
                    </label>
                    <select
                      value={selectedContentType || ''}
                      onChange={(e) => setSelectedContentType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      id="content-type-selector"
                    >
                      {getContentTypesForAgent(selectedAgent.id).map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {getContentTypesForAgent(selectedAgent.id).find(t => t.id === selectedContentType)?.description || ''}
                    </p>
                  </div>
                )}

                {/* Sequence Length Selector (for email sequences) */}
                {selectedAgent.id === 'email-sequence' && (selectedContentType === 'nurture' || selectedContentType === 'launch') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Number of Emails in Sequence
                    </label>
                    <select
                      value={sequenceLength}
                      onChange={(e) => setSequenceLength(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      id="sequence-length-selector"
                    >
                      {[3, 4, 5, 6, 7].map(num => (
                        <option key={num} value={num}>{num} emails</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose how many emails to include in your sequence
                    </p>
                  </div>
                )}

                {/* A/B Variants Toggle - for email sequence agent */}
                {selectedAgent.id === 'email-sequence' && (
                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateABVariants}
                        onChange={(e) => setGenerateABVariants(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        id="ab-variants-toggle"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Generate A/B Subject Line Variants
                      </span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 ml-7">
                      Generate 3 different subject line approaches (curiosity, benefit, urgency)
                    </p>
                  </div>
                )}

                {/* Prompt Preset Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tone Preset
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    id="preset-selector"
                  >
                    {promptPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </select>
                </div>

                {/* AI Model Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    id="model-selector"
                    disabled={modelsLoading}
                  >
                    <option value="default">🎯 Use Default Model</option>
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.display_name} {model.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedModel === 'default'
                      ? 'Will use the system default model'
                      : `Selected: ${availableModels.find(m => m.id === parseInt(selectedModel))?.model_string || ''}`
                    }
                  </p>
                </div>

                {/* Campaign Alignment Selector */}
                {clientContext?.activeCampaigns?.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Align with Campaign
                    </label>
                    <select
                      value={selectedCampaign}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      id="campaign-selector"
                    >
                      <option value="all">📊 All Campaigns (General)</option>
                      {clientContext.activeCampaigns.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>
                          🎯 {campaign.name}
                        </option>
                      ))}
                    </select>
                    {selectedCampaign !== 'all' && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1" id="campaign-alignment-hint">
                        Content will align with: {
                          (() => {
                            const camp = clientContext.activeCampaigns.find(c => c.id === parseInt(selectedCampaign))
                            if (camp?.angle) {
                              try {
                                return JSON.parse(camp.angle)
                              } catch { return 'Campaign angle' }
                            }
                            return 'Campaign objectives'
                          })()
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Top Performing Hooks Section */}
                {clientContext?.topPerformers?.filter(p => p.element_type === 'hook').length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                        🔥 Top Performing Hooks
                      </h4>
                      <button
                        onClick={() => setShowTopHooks(!showTopHooks)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                        id="toggle-top-hooks"
                      >
                        {showTopHooks ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showTopHooks && (
                      <div className="space-y-2" id="top-hooks-list">
                        {clientContext.topPerformers
                          .filter(p => p.element_type === 'hook')
                          .slice(0, 3)
                          .map((hook, idx) => (
                            <div key={hook.id} className="text-xs p-2 bg-white dark:bg-slate-800 rounded border border-amber-100 dark:border-amber-800">
                              <div className="flex items-start gap-2">
                                <span className="text-amber-500">#{idx + 1}</span>
                                <div className="flex-1">
                                  <p className="text-slate-700 dark:text-slate-300 font-medium">{hook.element_value}</p>
                                  <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                    <span>ROAS: {hook.roas}x</span>
                                    <span>•</span>
                                    <span>CTR: {hook.ctr}%</span>
                                    <span>•</span>
                                    <span>Score: {hook.performance_score}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                        <p className="text-xs text-amber-600 dark:text-amber-400 italic" id="inspiration-hint">
                          ✨ These proven hooks will inspire your generation
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Prompt Toggle */}
                <button
                  onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
                >
                  {showCustomPrompt ? '− Hide custom prompt' : '+ Add custom instructions'}
                </button>

                {showCustomPrompt && (
                  <div className="mb-4">
                    {/* Saved Presets Dropdown */}
                    {savedPresets.length > 0 && (
                      <div className="mb-2 flex gap-2 items-center">
                        <select
                          id="preset-dropdown"
                          value={selectedSavedPreset}
                          onChange={(e) => handleLoadPreset(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        >
                          <option value="">Select a saved preset...</option>
                          {savedPresets.map(preset => (
                            <option key={preset.id} value={preset.id}>{preset.name}</option>
                          ))}
                        </select>
                        {selectedSavedPreset && (
                          <button
                            onClick={() => handleDeletePreset(parseInt(selectedSavedPreset))}
                            className="px-2 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="Delete preset"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}

                    <textarea
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value)
                        setSelectedSavedPreset('') // Clear selection when editing
                      }}
                      placeholder="Add custom instructions for the agent..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none h-20"
                      id="custom-prompt-input"
                    />

                    {/* Save as Preset Button */}
                    {customPrompt.trim() && (
                      <button
                        onClick={() => setShowSavePresetModal(true)}
                        className="mt-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        id="save-preset-button"
                      >
                        💾 Save as Preset
                      </button>
                    )}
                  </div>
                )}

                {/* Brief Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Brief / Input
                  </label>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder={`Describe what you want the ${selectedAgent.name} to create...`}
                    className="w-full px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none h-32"
                    id="brief-input"
                  />
                </div>

                {/* Generate Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedClient || !brief.trim()}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      isGenerating || !selectedClient || !brief.trim()
                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                    }`}
                    id="main-generate-btn"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Generating...
                      </span>
                    ) : !selectedClient ? (
                      'Select a Client First'
                    ) : (
                      `Generate with ${selectedAgent.name}`
                    )}
                  </button>
                  {isGenerating && (
                    <button
                      onClick={handleCancelGeneration}
                      className="py-3 px-4 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg"
                      id="cancel-generation-btn"
                      title="Cancel generation"
                    >
                      <span className="flex items-center justify-center gap-2">
                        ✕ Stop
                      </span>
                    </button>
                  )}
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3" id="keyboard-shortcuts-hint">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">⌘/Ctrl+Enter</kbd>
                    <span>Generate</span>
                  </span>
                  {output && (
                    <>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">⌘/Ctrl+C</kbd>
                        <span>Copy</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">⌘/Ctrl+S</kbd>
                        <span>Save</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Cancelled indicator */}
                {wasCancelled && output && (
                  <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2" id="cancelled-indicator">
                    <span>⚠️</span>
                    <span>Generation was cancelled. Partial output shown below.</span>
                  </div>
                )}

                {/* Error indicator with Retry button */}
                {generationError && (
                  <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl" id="error-indicator">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">❌</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">Generation Failed</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3" id="error-message">
                          {generationError.message}
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-3">
                          Occurred at: {generationError.timestamp}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleRetryGeneration}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            id="retry-generation-btn"
                          >
                            🔄 Retry Generation
                          </button>
                          <button
                            onClick={() => setGenerationError(null)}
                            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Preview */}
              {output && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Generated Output</h4>
                      {generationCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full" id="generation-count">
                          #{generationCount}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Copy to clipboard"
                        id="copy-to-clipboard-btn"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => setOutput('')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Clear"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap" id="output-preview">
                    {output}
                  </div>

                  {/* Compliance Status Indicator */}
                  {(complianceStatus || complianceLoading) && (
                    <div className="mt-3 p-3 rounded-lg border" id="compliance-status">
                      {complianceLoading ? (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <span className="animate-spin">⏳</span>
                          <span className="text-sm">Checking compliance...</span>
                        </div>
                      ) : complianceStatus?.error ? (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <span>⚠️</span>
                          <span className="text-sm">{complianceStatus.error}</span>
                        </div>
                      ) : complianceStatus?.passed ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <span className="text-lg">✅</span>
                            <span className="font-medium">Compliance Check Passed</span>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                            {complianceStatus.rules_checked} constitution rule(s) checked. No violations found.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <span className="text-lg">❌</span>
                            <span className="font-medium">Compliance Issues Found</span>
                          </div>
                          <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                            {complianceStatus.rules_checked} rule(s) checked. {complianceStatus.violations?.length || 0} violation(s) detected.
                          </p>
                          {complianceStatus.violations && complianceStatus.violations.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {complianceStatus.violations.map((v, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs p-2 rounded ${
                                    v.severity === 'block'
                                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                  }`}
                                  id={`violation-${idx}`}
                                >
                                  <span className="font-medium">{v.severity === 'block' ? '🚫' : '⚠️'} {v.rule_name}:</span>
                                  <span className="ml-1">{v.violation}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                            Please regenerate or manually edit the content to address these issues before saving.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 py-2 px-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      id="regenerate-btn"
                    >
                      {isGenerating ? '⏳ Generating...' : '🔄 Regenerate'}
                    </button>
                    <button
                      onClick={handleSaveToAssets}
                      className="flex-1 py-2 px-3 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      id="save-to-assets-btn"
                    >
                      💾 Save to Assets
                    </button>
                  </div>

                  {/* Inspired By Indicator */}
                  {inspiredByHooks.length > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg" id="inspired-by-section">
                      <h5 className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-1">
                        ✨ Inspired by Top Performers
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {inspiredByHooks.map((hook, idx) => (
                          <span
                            key={hook.id || idx}
                            className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full"
                            title={`ROAS: ${hook.roas}x • CTR: ${hook.ctr}%`}
                          >
                            "{hook.element_value.length > 30 ? hook.element_value.substring(0, 30) + '...' : hook.element_value}"
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">
                        Based on proven hooks from performance memory
                      </p>
                    </div>
                  )}

                  {/* Campaign Alignment Indicator */}
                  {selectedCampaign !== 'all' && clientContext?.activeCampaigns && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg" id="campaign-alignment-indicator">
                      <h5 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-1">
                        🎯 Aligned with Campaign
                      </h5>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {clientContext.activeCampaigns.find(c => c.id === parseInt(selectedCampaign))?.name || 'Selected campaign'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-center">
              <div className="text-4xl mb-3">👈</div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Select an Agent</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose an agent from the grid to start generating content
              </p>
            </div>
          )}

          {/* Generation History */}
          {generationHistory.length > 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" id="generation-history-panel">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  📜 Generation History
                </h4>
                <span className="text-xs text-slate-500">{generationHistory.length} items</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto" id="history-list">
                {generationHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-lg text-sm cursor-pointer transition-all border ${
                      selectedHistoryItem?.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedHistoryItem(item)}
                    id={`history-item-${idx}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.agentType}</span>
                      <span className="text-xs text-slate-500">{item.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        {item.clientName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1">{item.preview}</p>
                  </div>
                ))}
              </div>

              {/* Selected History Item Details */}
              {selectedHistoryItem && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700" id="history-detail-panel">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-slate-900 dark:text-white">Full Output</h5>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBrief(selectedHistoryItem.fullBrief)
                          toast.success('Brief loaded - ready to regenerate')
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-1"
                        id="reuse-brief-btn"
                      >
                        🔄 Reuse Brief
                      </button>
                      <button
                        onClick={() => {
                          setOutput(selectedHistoryItem.fullOutput)
                          toast.success('Output loaded to preview')
                        }}
                        className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center gap-1"
                        id="view-output-btn"
                      >
                        👁️ View Output
                      </button>
                      <button
                        onClick={() => setSelectedHistoryItem(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono" id="history-full-output">
                      {selectedHistoryItem.fullOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Configuration Tab Content */}
      {activeTab === 'configuration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List for Configuration */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Select Agent to Configure</h2>
            <div className="space-y-2" id="agent-config-list">
              {agentDefinitions.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleEditAgentConfig(agent)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    editingAgentConfig?.id === agent.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'
                  }`}
                  id={`config-agent-${agent.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl`}>
                      {agent.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{agent.name}</div>
                      <div className="text-xs text-slate-500">{agent.category}</div>
                    </div>
                    {agentConfigurations[agent.id] && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Customized
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Editor */}
          <div className="lg:col-span-2">
            {editingAgentConfig ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${editingAgentConfig.color} flex items-center justify-center text-2xl`}>
                      {editingAgentConfig.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{editingAgentConfig.name}</h3>
                      <p className="text-sm text-slate-500">Configure agent behavior and prompts</p>
                    </div>
                  </div>
                  {agentConfigurations[editingAgentConfig.id] && (
                    <button
                      onClick={() => handleResetAgentConfig(editingAgentConfig.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>

                {configSaved && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Configuration saved successfully!
                  </div>
                )}

                {/* System Prompt */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    System Prompt
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Customize the agent's base instructions and behavior
                  </p>
                  <textarea
                    value={configForm.systemPrompt}
                    onChange={(e) => setConfigForm({ ...configForm, systemPrompt: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm resize-none h-48"
                    placeholder="Enter custom system prompt..."
                    id="system-prompt-input"
                  />
                </div>

                {/* Temperature */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Temperature
                    </label>
                    <span className="text-sm font-medium text-blue-600">{configForm.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={configForm.temperature}
                    onChange={(e) => setConfigForm({ ...configForm, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>More Focused</span>
                    <span>More Creative</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Max Output Tokens
                  </label>
                  <select
                    value={configForm.maxTokens}
                    onChange={(e) => setConfigForm({ ...configForm, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={1000}>1,000 tokens (Short)</option>
                    <option value={2000}>2,000 tokens (Medium)</option>
                    <option value={4000}>4,000 tokens (Long)</option>
                    <option value={8000}>8,000 tokens (Very Long)</option>
                  </select>
                </div>

                {/* Default Preset */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Default Tone Preset
                  </label>
                  <select
                    value={configForm.defaultPreset}
                    onChange={(e) => setConfigForm({ ...configForm, defaultPreset: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    id="default-preset-select"
                  >
                    {promptPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.name} - {preset.description}</option>
                    ))}
                  </select>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveAgentConfig}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors"
                  id="save-config-btn"
                >
                  Save Configuration
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
                <div className="text-5xl mb-4">⚙️</div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Agent Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Select an agent from the list to customize its system prompt, temperature, and other settings.
                  Custom configurations will be used when generating content with that agent.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Congress Tab Content */}
      {activeTab === 'congress' && (
        <div className="space-y-6">
          {/* Voting Threshold Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  ⚖️ Voting Threshold Configuration
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Configure the MAKER framework first-to-ahead-by-k voting threshold
                </p>
              </div>
              {thresholdSaved && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  ✓ Saved
                </span>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="voting-threshold" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ahead-by-K Threshold (k)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="voting-threshold"
                      min="1"
                      max="5"
                      value={votingThreshold}
                      onChange={(e) => setVotingThreshold(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="w-12 h-10 flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg text-lg" id="threshold-value">
                      {votingThreshold}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>1 (Faster decisions)</span>
                    <span>5 (More consensus)</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <p><strong>Current Setting:</strong> An option wins when it's ahead by {votingThreshold} vote{votingThreshold > 1 ? 's' : ''}</p>
                <p className="text-xs">Lower values = faster decisions but less consensus. Higher values = more thorough voting but slower resolution.</p>
              </div>
            </div>

            <button
              onClick={handleSaveVotingThreshold}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
              id="save-threshold-btn"
            >
              Save Voting Threshold
            </button>
          </div>

          {/* Entropy Monitoring Dashboard */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="entropy-monitoring">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  📊 Entropy Monitoring
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Decision quality metrics from MAKER voting sessions
                </p>
              </div>
              <button
                onClick={fetchVotingSessions}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white" id="total-sessions">
                  {votingSessions.length}
                </div>
                <div className="text-sm text-slate-500">Total Sessions</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600" id="resolved-sessions">
                  {votingSessions.filter(s => !s.is_red_flagged).length}
                </div>
                <div className="text-sm text-slate-500">Auto-Resolved</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600" id="flagged-sessions">
                  {votingSessions.filter(s => s.is_red_flagged).length}
                </div>
                <div className="text-sm text-slate-500">Red-Flagged</div>
              </div>
            </div>

            {/* Average Entropy Indicator */}
            {votingSessions.length > 0 && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Average Entropy Score</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getEntropyLabel(votingSessions.reduce((acc, s) => acc + (s.entropy_score || 0), 0) / votingSessions.length).color
                  }`}>
                    {getEntropyLabel(votingSessions.reduce((acc, s) => acc + (s.entropy_score || 0), 0) / votingSessions.length).label}
                  </span>
                </div>
                <div className="relative h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 h-full w-1 bg-white shadow-lg"
                    style={{
                      left: `${Math.min(100, (votingSessions.reduce((acc, s) => acc + (s.entropy_score || 0), 0) / votingSessions.length) * 100)}%`
                    }}
                    id="entropy-indicator"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0% (Perfect Consensus)</span>
                  <span>100% (Total Disagreement)</span>
                </div>
              </div>
            )}

            {/* Voting Sessions List */}
            <div className="space-y-3" id="voting-sessions-list">
              {congressLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-500">Loading voting sessions...</p>
                </div>
              ) : votingSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="text-4xl mb-2 block">🗳️</span>
                  <p>No voting sessions yet</p>
                  <p className="text-sm">Voting sessions will appear here as agents make decisions</p>
                </div>
              ) : (
                votingSessions.slice(0, 10).map((session, idx) => (
                  <div
                    key={session.id || idx}
                    className={`p-4 rounded-lg border ${
                      session.is_red_flagged
                        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                    id={`session-${session.id || idx}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {session.voting_type || 'first-to-ahead-by-k'}
                          </span>
                          {session.is_red_flagged && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                              🚩 Red-Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {session.red_flag_reason || 'Voting session completed'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Created: {new Date(session.created_at).toLocaleString()}</span>
                          {session.winner_index !== null && (
                            <span className="text-green-600">Winner: Option {session.winner_index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEntropyLabel(session.entropy_score || 0).color}`} id={`entropy-badge-${session.id || idx}`}>
                          {((session.entropy_score || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">entropy</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Agent Performance Analytics */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="agent-performance-analytics">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  📈 Agent Performance Analytics
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Track agent success rates, execution times, and quality scores
                </p>
              </div>
              <button
                onClick={() => fetchAgentAnalytics(analyticsDateRange.startDate, analyticsDateRange.endDate)}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {/* Date Range Filter */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6" id="date-range-filter">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">📅 Filter by Date Range</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400">From:</label>
                  <input
                    type="date"
                    value={analyticsDateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    id="analytics-start-date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400">To:</label>
                  <input
                    type="date"
                    value={analyticsDateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    id="analytics-end-date"
                  />
                </div>
                <button
                  onClick={applyDateFilter}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  id="apply-date-filter-btn"
                >
                  Apply Filter
                </button>
                {(analyticsDateRange.startDate || analyticsDateRange.endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="px-4 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    id="clear-date-filter-btn"
                  >
                    Clear
                  </button>
                )}
              </div>
              {agentAnalytics?.dateRange && (
                <div className="mt-2 text-xs text-slate-500">
                  Showing data from: {agentAnalytics.dateRange.start} to {agentAnalytics.dateRange.end}
                </div>
              )}
            </div>

            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-500">Loading analytics...</p>
              </div>
            ) : agentAnalytics ? (
              <>
                {/* Overall Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" id="overall-analytics">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600" id="total-executions">
                      {agentAnalytics.overall.totalExecutions}
                    </div>
                    <div className="text-sm text-slate-500">Total Executions</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600" id="overall-success-rate">
                      {agentAnalytics.overall.avgSuccessRate}%
                    </div>
                    <div className="text-sm text-slate-500">Avg Success Rate</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600" id="overall-quality-score">
                      {agentAnalytics.overall.avgQualityScore}
                    </div>
                    <div className="text-sm text-slate-500">Avg Quality Score</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600" id="total-tokens">
                      {(agentAnalytics.overall.totalTokensUsed / 1000).toFixed(1)}K
                    </div>
                    <div className="text-sm text-slate-500">Total Tokens</div>
                  </div>
                </div>

                {/* Individual Agent Analytics */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Agent Performance by Type</h3>
                <div className="space-y-3" id="agent-analytics-list">
                  {agentAnalytics.agents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <span className="text-4xl mb-2 block">📊</span>
                      <p>No agent executions found</p>
                      <p className="text-sm">Agent analytics will appear here as agents run tasks</p>
                    </div>
                  ) : (
                    agentAnalytics.agents.map((agent, idx) => (
                      <div
                        key={agent.agentType}
                        className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        id={`agent-analytics-${agent.agentType}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getAgentIcon(agent.agentType)}</span>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white capitalize">
                                {agent.agentType} Agent
                              </div>
                              <div className="text-xs text-slate-500">
                                {agent.totalExecutions} execution{agent.totalExecutions !== 1 ? 's' : ''} • Last: {agent.lastExecution ? new Date(agent.lastExecution).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityScoreColor(agent.qualityScore)}`} id={`quality-score-${agent.agentType}`}>
                            Quality: {agent.qualityScore}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600" id={`success-rate-${agent.agentType}`}>
                              {agent.successRate}%
                            </div>
                            <div className="text-xs text-slate-500">Success Rate</div>
                            <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${agent.successRate}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600" id={`avg-exec-time-${agent.agentType}`}>
                              {agent.avgExecutionTime}ms
                            </div>
                            <div className="text-xs text-slate-500">Avg Exec Time</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600" id={`avg-tokens-${agent.agentType}`}>
                              {agent.avgTokensUsed}
                            </div>
                            <div className="text-xs text-slate-500">Avg Tokens</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                              {agent.successfulExecutions}/{agent.totalExecutions}
                            </div>
                            <div className="text-xs text-slate-500">Successful/Total</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <span className="text-4xl mb-2 block">📈</span>
                <p>Loading agent analytics...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowSavePresetModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Save as Preset</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Save this custom prompt as a reusable preset for {selectedClient?.name || 'the current client'}.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preset Name
              </label>
              <input
                type="text"
                id="preset-name-input"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., Client X Special Tone"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prompt Preview
              </label>
              <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto">
                {customPrompt}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSavePresetModal(false)
                  setNewPresetName('')
                }}
                className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  newPresetName.trim()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed'
                }`}
                id="confirm-save-preset"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Selection Modal */}
      {showClientSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowClientSelector(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Select a Client</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Choose a client to load their context for content generation.
            </p>
            <div className="space-y-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    selectClient(client)
                    setShowClientSelector(false)
                  }}
                  className="w-full p-3 flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.website_url || 'No website'}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowClientSelector(false)}
              className="mt-4 w-full py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
