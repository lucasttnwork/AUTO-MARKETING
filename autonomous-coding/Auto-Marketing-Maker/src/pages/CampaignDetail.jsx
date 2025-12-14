import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Technical Setup State
  const [selectedPixelType, setSelectedPixelType] = useState('meta')
  const [pixelId, setPixelId] = useState('')
  const [generatedPixelCode, setGeneratedPixelCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  // UTM Builder State
  const [utmBaseUrl, setUtmBaseUrl] = useState('')
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmTerm, setUtmTerm] = useState('')
  const [utmContent, setUtmContent] = useState('')
  const [generatedUtmUrl, setGeneratedUtmUrl] = useState('')
  const [utmCopied, setUtmCopied] = useState(false)

  // A/B Test State
  const [abTests, setAbTests] = useState([])
  const [showCreateVariant, setShowCreateVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({
    name: '',
    headline: '',
    description: '',
    cta: '',
    image_url: ''
  })
  const [selectedTest, setSelectedTest] = useState(null)

  // Launch Checklist State
  const [showConfetti, setShowConfetti] = useState(false)
  const [showLaunchChecklist, setShowLaunchChecklist] = useState(false)

  // Audience Builder State
  const [audienceType, setAudienceType] = useState('lookalike')
  const [audiences, setAudiences] = useState([])
  const [showAudienceModal, setShowAudienceModal] = useState(false)
  const [audienceForm, setAudienceForm] = useState({
    name: '',
    type: 'lookalike',
    // Lookalike fields
    sourceAudience: '',
    similarityPercentage: 1,
    country: 'United States',
    // Custom fields
    customType: 'customer_list',
    pixelEvent: '',
    // Interest fields
    interests: [],
    demographics: {
      ageMin: 18,
      ageMax: 65,
      gender: 'all'
    },
    locations: []
  })

  // Automated Rules State
  const [automatedRules, setAutomatedRules] = useState([])
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState({
    name: '',
    metric: 'roas',
    operator: 'less_than',
    threshold: '',
    action: 'pause',
    frequency: 'daily',
    enabled: true
  })

  // Scaling Recommendations State
  const [scalingRecommendations, setScalingRecommendations] = useState(null)
  const [scalingLoading, setScalingLoading] = useState(false)

  // Campaign Structure Builder State
  const [campaignStructure, setCampaignStructure] = useState({
    name: '',
    objective: 'conversions',
    adSets: []
  })
  const [showAddAdSet, setShowAddAdSet] = useState(false)
  const [showAddAd, setShowAddAd] = useState(null) // stores adSet index when open
  const [newAdSet, setNewAdSet] = useState({
    name: '',
    budget: '',
    targetAudience: '',
    placement: 'automatic',
    schedule: 'continuous'
  })
  const [newAd, setNewAd] = useState({
    name: '',
    type: 'image',
    headline: '',
    description: '',
    cta: 'Learn More'
  })

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}`)
      const data = await response.json()
      setCampaign(data)

      // Fetch client info
      if (data.client_id) {
        const clientResponse = await fetch(`http://localhost:3001/api/clients/${data.client_id}`)
        const clientData = await clientResponse.json()
        setClient(clientData)
      }

      // Pre-fill campaign name for UTM
      if (data.name) {
        setUtmCampaign(data.name.toLowerCase().replace(/\s+/g, '_'))
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLaunch = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        console.log('Campaign launched successfully:', data.message)
        // Trigger confetti animation
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      } else {
        const error = await response.json()
        console.error('Failed to launch campaign:', error)
        alert(`Failed to launch campaign: ${error.error}`)
      }
    } catch (error) {
      console.error('Launch error:', error)
      alert('Failed to launch campaign. Please try again.')
    }
  }

  const handlePause = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        console.log('Campaign paused successfully:', data.message)
      } else {
        const error = await response.json()
        console.error('Failed to pause campaign:', error)
        alert(`Failed to pause campaign: ${error.error}`)
      }
    } catch (error) {
      console.error('Pause error:', error)
      alert('Failed to pause campaign. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('Campaign deleted successfully')
        navigate('/campaigns')
      } else {
        const error = await response.json()
        console.error('Failed to delete campaign:', error)
        alert(`Failed to delete campaign: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete campaign. Please try again.')
    }
  }

  // Generate Pixel Code
  const generatePixelCode = () => {
    if (!pixelId.trim()) {
      alert('Please enter a Pixel ID')
      return
    }

    let code = ''
    if (selectedPixelType === 'meta') {
      code = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`
    } else if (selectedPixelType === 'google') {
      code = `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixelId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${pixelId}');
</script>
<!-- End Google Analytics -->`
    } else if (selectedPixelType === 'tiktok') {
      code = `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`
    }

    setGeneratedPixelCode(code)
  }

  // Copy pixel code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPixelCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Generate UTM URL
  const generateUtmUrl = () => {
    if (!utmBaseUrl.trim()) {
      alert('Please enter a base URL')
      return
    }

    let url = utmBaseUrl.trim()
    // Add https:// if no protocol specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const params = new URLSearchParams()
    if (utmSource.trim()) params.append('utm_source', utmSource.trim())
    if (utmMedium.trim()) params.append('utm_medium', utmMedium.trim())
    if (utmCampaign.trim()) params.append('utm_campaign', utmCampaign.trim())
    if (utmTerm.trim()) params.append('utm_term', utmTerm.trim())
    if (utmContent.trim()) params.append('utm_content', utmContent.trim())

    const separator = url.includes('?') ? '&' : '?'
    const finalUrl = params.toString() ? `${url}${separator}${params.toString()}` : url

    setGeneratedUtmUrl(finalUrl)
  }

  // Copy UTM URL to clipboard
  const copyUtmUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUtmUrl)
      setUtmCopied(true)
      setTimeout(() => setUtmCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Audience Builder Functions
  const resetAudienceForm = () => {
    setAudienceForm({
      name: '',
      type: audienceType,
      sourceAudience: '',
      similarityPercentage: 1,
      country: 'United States',
      customType: 'customer_list',
      pixelEvent: '',
      interests: [],
      demographics: { ageMin: 18, ageMax: 65, gender: 'all' },
      locations: []
    })
  }

  const handleCreateAudience = () => {
    if (!audienceForm.name.trim()) {
      alert('Please enter an audience name')
      return
    }

    const newAudience = {
      id: Date.now(),
      ...audienceForm,
      type: audienceType,
      createdAt: new Date().toISOString(),
      status: 'active',
      estimatedSize: audienceType === 'lookalike'
        ? Math.floor(audienceForm.similarityPercentage * 1000000 / 10)
        : audienceType === 'custom'
          ? Math.floor(Math.random() * 50000) + 10000
          : Math.floor(Math.random() * 500000) + 100000
    }

    setAudiences([...audiences, newAudience])
    resetAudienceForm()
    setShowAudienceModal(false)
  }

  const handleAddInterest = (interest) => {
    if (interest.trim() && !audienceForm.interests.includes(interest.trim())) {
      setAudienceForm({
        ...audienceForm,
        interests: [...audienceForm.interests, interest.trim()]
      })
    }
  }

  const handleRemoveInterest = (index) => {
    setAudienceForm({
      ...audienceForm,
      interests: audienceForm.interests.filter((_, i) => i !== index)
    })
  }

  const handleAddLocation = (location) => {
    if (location.trim() && !audienceForm.locations.includes(location.trim())) {
      setAudienceForm({
        ...audienceForm,
        locations: [...audienceForm.locations, location.trim()]
      })
    }
  }

  const handleRemoveLocation = (index) => {
    setAudienceForm({
      ...audienceForm,
      locations: audienceForm.locations.filter((_, i) => i !== index)
    })
  }

  const deleteAudience = (id) => {
    setAudiences(audiences.filter(a => a.id !== id))
  }

  // Automated Rules Functions
  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      metric: 'roas',
      operator: 'less_than',
      threshold: '',
      action: 'pause',
      frequency: 'daily',
      enabled: true
    })
  }

  const handleCreateRule = () => {
    if (!ruleForm.name.trim() || !ruleForm.threshold) return

    const newRule = {
      id: Date.now(),
      ...ruleForm,
      threshold: parseFloat(ruleForm.threshold),
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0
    }

    setAutomatedRules([...automatedRules, newRule])
    resetRuleForm()
    setShowRuleModal(false)
  }

  const toggleRule = (id) => {
    setAutomatedRules(automatedRules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const deleteRule = (id) => {
    setAutomatedRules(automatedRules.filter(rule => rule.id !== id))
  }

  const getRuleMetricLabel = (metric) => {
    const labels = {
      roas: 'ROAS',
      cpa: 'CPA',
      ctr: 'CTR',
      impressions: 'Impressions',
      clicks: 'Clicks',
      conversions: 'Conversions',
      spend: 'Spend',
      cpm: 'CPM'
    }
    return labels[metric] || metric
  }

  const getRuleOperatorLabel = (operator) => {
    const labels = {
      less_than: '<',
      greater_than: '>',
      less_than_or_equal: '≤',
      greater_than_or_equal: '≥',
      equals: '='
    }
    return labels[operator] || operator
  }

  const getRuleActionLabel = (action) => {
    const labels = {
      pause: 'Pause Campaign',
      increase_budget: 'Increase Budget 10%',
      decrease_budget: 'Decrease Budget 10%',
      send_alert: 'Send Alert',
      increase_bid: 'Increase Bid 10%',
      decrease_bid: 'Decrease Bid 10%'
    }
    return labels[action] || action
  }

  // Campaign Structure Builder Functions
  const handleAddAdSet = () => {
    if (!newAdSet.name.trim()) return

    const adSet = {
      id: Date.now(),
      ...newAdSet,
      ads: []
    }

    setCampaignStructure(prev => ({
      ...prev,
      adSets: [...prev.adSets, adSet]
    }))

    setNewAdSet({
      name: '',
      budget: '',
      targetAudience: '',
      placement: 'automatic',
      schedule: 'continuous'
    })
    setShowAddAdSet(false)
  }

  const handleAddAd = (adSetIndex) => {
    if (!newAd.name.trim()) return

    const ad = {
      id: Date.now(),
      ...newAd
    }

    setCampaignStructure(prev => ({
      ...prev,
      adSets: prev.adSets.map((adSet, index) =>
        index === adSetIndex
          ? { ...adSet, ads: [...adSet.ads, ad] }
          : adSet
      )
    }))

    setNewAd({
      name: '',
      type: 'image',
      headline: '',
      description: '',
      cta: 'Learn More'
    })
    setShowAddAd(null)
  }

  const handleDeleteAdSet = (adSetId) => {
    setCampaignStructure(prev => ({
      ...prev,
      adSets: prev.adSets.filter(adSet => adSet.id !== adSetId)
    }))
  }

  const handleDeleteAd = (adSetIndex, adId) => {
    setCampaignStructure(prev => ({
      ...prev,
      adSets: prev.adSets.map((adSet, index) =>
        index === adSetIndex
          ? { ...adSet, ads: adSet.ads.filter(ad => ad.id !== adId) }
          : adSet
      )
    }))
  }

  const updateCampaignStructureName = (name) => {
    setCampaignStructure(prev => ({
      ...prev,
      name
    }))
  }

  const updateCampaignStructureObjective = (objective) => {
    setCampaignStructure(prev => ({
      ...prev,
      objective
    }))
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

  // Calculate A/B test winner
  const getTestWinner = (tests) => {
    if (!tests || tests.length < 2) return null
    const sorted = [...tests].sort((a, b) => {
      const aRate = a.impressions > 0 ? (a.conversions / a.impressions) * 100 : 0
      const bRate = b.impressions > 0 ? (b.conversions / b.impressions) * 100 : 0
      return bRate - aRate
    })
    const winner = sorted[0]
    const second = sorted[1]
    const winnerRate = winner.impressions > 0 ? (winner.conversions / winner.impressions) * 100 : 0
    const secondRate = second.impressions > 0 ? (second.conversions / second.impressions) * 100 : 0
    const lift = secondRate > 0 ? ((winnerRate - secondRate) / secondRate) * 100 : 0
    return { winner, lift, confidence: lift > 10 ? 95 : lift > 5 ? 85 : 70 }
  }

  // Launch Checklist computation
  const getLaunchChecklist = () => {
    if (!campaign) return []

    let offerData = {}
    let budgetData = {}
    let scheduleData = {}

    try {
      offerData = campaign.offer_structure ? JSON.parse(campaign.offer_structure) : {}
    } catch (e) {}
    try {
      budgetData = campaign.budget_allocation ? JSON.parse(campaign.budget_allocation) : {}
    } catch (e) {}
    try {
      scheduleData = campaign.schedule ? JSON.parse(campaign.schedule) : {}
    } catch (e) {}

    return [
      {
        id: 'name',
        label: 'Campaign name is set',
        description: 'Your campaign needs a descriptive name',
        complete: Boolean(campaign.name && campaign.name.trim()),
        category: 'basic'
      },
      {
        id: 'client',
        label: 'Client is assigned',
        description: 'Campaign must be linked to a client',
        complete: Boolean(campaign.client_id),
        category: 'basic'
      },
      {
        id: 'angle',
        label: 'Marketing angle is defined',
        description: 'Define your campaign\'s unique messaging angle',
        complete: Boolean(campaign.angle && campaign.angle.trim()),
        category: 'strategy'
      },
      {
        id: 'budget',
        label: 'Budget is allocated',
        description: 'Set your total campaign budget',
        complete: Boolean(budgetData.total && parseFloat(budgetData.total) > 0),
        category: 'budget'
      },
      {
        id: 'schedule_start',
        label: 'Start date is set',
        description: 'Define when your campaign will begin',
        complete: Boolean(scheduleData.start_date),
        category: 'schedule'
      },
      {
        id: 'schedule_end',
        label: 'End date is set',
        description: 'Define when your campaign will end',
        complete: Boolean(scheduleData.end_date),
        category: 'schedule'
      },
      {
        id: 'offer',
        label: 'Offer structure is configured',
        description: 'Set up your discount, bundle, or guarantee',
        complete: Boolean(offerData.discount || offerData.bundle || offerData.guarantee),
        category: 'strategy'
      },
      {
        id: 'target_roas',
        label: 'Target ROAS is defined',
        description: 'Set your return on ad spend goal',
        complete: Boolean(campaign.target_roas && parseFloat(campaign.target_roas) > 0),
        category: 'goals'
      }
    ]
  }

  const checklistItems = getLaunchChecklist()
  const completedItems = checklistItems.filter(item => item.complete)
  const incompleteItems = checklistItems.filter(item => !item.complete)
  const allChecklistComplete = incompleteItems.length === 0

  // Enhanced launch handler with checklist validation
  const handleLaunchWithChecklist = () => {
    if (!allChecklistComplete) {
      setShowLaunchChecklist(true)
      return
    }
    handleLaunch()
  }

  // Initialize mock A/B tests if none exist
  useEffect(() => {
    if (activeTab === 'abtests' && abTests.length === 0) {
      // Create mock A/B test data for demonstration
      setAbTests([
        {
          id: 1,
          name: 'Variant A',
          headline: 'Get 50% Off Today!',
          description: 'Limited time offer on all products',
          cta: 'Shop Now',
          impressions: 15420,
          clicks: 892,
          conversions: 156,
          status: 'running'
        },
        {
          id: 2,
          name: 'Variant B',
          headline: 'Exclusive Member Deal',
          description: 'Special savings just for you',
          cta: 'Claim Offer',
          impressions: 14890,
          clicks: 1024,
          conversions: 189,
          status: 'running'
        }
      ])
    }
  }, [activeTab, abTests.length])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-slate-400 dark:text-slate-500">Loading campaign...</div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-slate-400 dark:text-slate-500">Campaign not found</div>
          <button
            onClick={() => navigate('/campaigns')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'scaling', label: 'Scaling', icon: '🚀' },
    { id: 'creatives', label: 'Creatives', icon: '🎨' },
    { id: 'structure', label: 'Structure', icon: '🏗️' },
    { id: 'abtests', label: 'A/B Tests', icon: '🧪' },
    { id: 'technical', label: 'Technical Setup', icon: '🔧' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  // Fetch scaling recommendations
  const fetchScalingRecommendations = async () => {
    setScalingLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/scaling-recommendations`)
      if (response.ok) {
        const data = await response.json()
        setScalingRecommendations(data)
      }
    } catch (error) {
      console.error('Failed to fetch scaling recommendations:', error)
    } finally {
      setScalingLoading(false)
    }
  }

  // Fetch A/B tests
  const fetchAbTests = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/ab-tests`)
      if (response.ok) {
        const data = await response.json()
        setAbTests(data)
      }
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error)
    }
  }

  // Create A/B test variant
  const handleCreateVariant = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/ab-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant)
      })
      if (response.ok) {
        const data = await response.json()
        setAbTests([...abTests, data])
        setNewVariant({ name: '', headline: '', description: '', cta: '', image_url: '' })
        setShowCreateVariant(false)
      }
    } catch (error) {
      console.error('Failed to create variant:', error)
    }
  }

  // Parse JSON fields
  let offerStructure = {}
  let budgetAllocation = {}
  let schedule = {}

  try {
    offerStructure = campaign.offer_structure ? JSON.parse(campaign.offer_structure) : {}
  } catch (e) { console.error('Failed to parse offer_structure:', e) }

  try {
    budgetAllocation = campaign.budget_allocation ? JSON.parse(campaign.budget_allocation) : {}
  } catch (e) { console.error('Failed to parse budget_allocation:', e) }

  try {
    schedule = campaign.schedule ? JSON.parse(campaign.schedule) : {}
  } catch (e) { console.error('Failed to parse schedule:', e) }

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-2"
        >
          <span>←</span> Back to Campaigns
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-3xl">
              🎯
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{campaign.name}</h1>
              <div className="flex items-center gap-3">
                {client && (
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {client.name}
                  </p>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/campaigns`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Campaign
            </button>
            {campaign.status === 'draft' && (
              <button
                onClick={handleLaunchWithChecklist}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                {!allChecklistComplete && (
                  <span className="w-5 h-5 bg-amber-500 rounded-full text-xs flex items-center justify-center">
                    {incompleteItems.length}
                  </span>
                )}
                Launch
              </button>
            )}
            {campaign.status === 'active' && (
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Pause
              </button>
            )}
            {campaign.status === 'paused' && (
              <button
                onClick={handleLaunchWithChecklist}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Resume
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Total Spend</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  ${campaign.total_spend ? campaign.total_spend.toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Budget: ${budgetAllocation.total || '0'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">ROAS</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {campaign.actual_roas ? `${campaign.actual_roas.toFixed(2)}x` : '-'}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {campaign.target_roas ? `Target: ${campaign.target_roas}x` : 'No target set'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Impressions</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {campaign.impressions ? campaign.impressions.toLocaleString() : '0'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total views</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Clicks</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {campaign.clicks ? campaign.clicks.toLocaleString() : '0'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {campaign.impressions && campaign.clicks
                    ? `CTR: ${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`
                    : 'No data'}
                </div>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold tracking-tight mb-4">Campaign Information</h3>
                <div className="space-y-3">
                  {campaign.angle && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Marketing Angle</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{campaign.angle}</div>
                    </div>
                  )}
                  {schedule.start_date && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start Date</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {new Date(schedule.start_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {schedule.end_date && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">End Date</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {new Date(schedule.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {campaign.created_at && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Created</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {new Date(campaign.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {campaign.launched_at && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Launched</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {new Date(campaign.launched_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Offer Structure */}
              {(offerStructure.discount || offerStructure.bundle || offerStructure.guarantee) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold tracking-tight mb-4">Offer Structure</h3>
                  <div className="space-y-3">
                    {offerStructure.discount && (
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Discount</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{offerStructure.discount}</div>
                      </div>
                    )}
                    {offerStructure.bundle && (
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bundle</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{offerStructure.bundle}</div>
                      </div>
                    )}
                    {offerStructure.guarantee && (
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Guarantee</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{offerStructure.guarantee}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Budget Allocation */}
              {budgetAllocation.total && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold tracking-tight mb-4">Budget Allocation</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Budget</div>
                      <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        ${budgetAllocation.total}
                      </div>
                    </div>
                    {budgetAllocation.facebook && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Facebook/Meta</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${budgetAllocation.facebook}
                        </div>
                      </div>
                    )}
                    {budgetAllocation.google && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Google Ads</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${budgetAllocation.google}
                        </div>
                      </div>
                    )}
                    {budgetAllocation.tiktok && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">TikTok</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${budgetAllocation.tiktok}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-bold tracking-tight mb-2">Performance Analytics</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Detailed performance metrics and charts will be displayed here
            </p>
          </div>
        )}

        {/* Scaling Recommendations Tab */}
        {activeTab === 'scaling' && (
          <div className="space-y-6" id="scaling-recommendations-tab">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    🚀 Scaling Protocol Recommendations
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Data-driven recommendations to scale your campaign performance
                  </p>
                </div>
                <button
                  onClick={fetchScalingRecommendations}
                  disabled={scalingLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                  id="request-scaling-btn"
                >
                  {scalingLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Analyzing...
                    </span>
                  ) : (
                    'Request Recommendations'
                  )}
                </button>
              </div>
            </div>

            {scalingLoading && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Analyzing campaign performance data...</p>
              </div>
            )}

            {!scalingLoading && !scalingRecommendations && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Get Scaling Recommendations</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Click "Request Recommendations" to analyze your campaign data and receive actionable scaling strategies
                </p>
              </div>
            )}

            {scalingRecommendations && (
              <>
                {/* Performance Metrics Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="scaling-metrics">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    📊 Current Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600" id="scaling-roas">
                        {scalingRecommendations.metrics.roas}x
                      </div>
                      <div className="text-sm text-slate-500">ROAS</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600" id="scaling-ctr">
                        {scalingRecommendations.metrics.ctr}%
                      </div>
                      <div className="text-sm text-slate-500">CTR</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600" id="scaling-conversion-rate">
                        {scalingRecommendations.metrics.conversionRate}%
                      </div>
                      <div className="text-sm text-slate-500">Conv. Rate</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600" id="scaling-cpa">
                        ${scalingRecommendations.metrics.cpa}
                      </div>
                      <div className="text-sm text-slate-500">CPA</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <div className={`text-2xl font-bold ${
                        scalingRecommendations.performanceLevel === 'high' ? 'text-green-600' :
                        scalingRecommendations.performanceLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`} id="scaling-performance-level">
                        {scalingRecommendations.performanceLevel.charAt(0).toUpperCase() + scalingRecommendations.performanceLevel.slice(1)}
                      </div>
                      <div className="text-sm text-slate-500">Performance</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" id="recommendations-list">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    💡 Scaling Recommendations
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full">
                      {scalingRecommendations.recommendations.length}
                    </span>
                  </h3>
                  {scalingRecommendations.recommendations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <span className="text-4xl block mb-2">✨</span>
                      <p>Your campaign needs more data to generate recommendations.</p>
                      <p className="text-sm">Continue running ads to accumulate performance data.</p>
                    </div>
                  ) : (
                    <div className="space-y-4" id="scaling-recommendations-items">
                      {scalingRecommendations.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            rec.priority === 'critical' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20' :
                            rec.priority === 'high' ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' :
                            'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                          }`}
                          id={`recommendation-${idx}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                rec.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                rec.priority === 'high' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{rec.title}</h4>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{rec.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Action:</span>
                              <span className="font-medium text-slate-900 dark:text-white">{rec.action}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Expected Impact:</span>
                              <span className="font-medium text-green-600">{rec.expectedImpact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generation Timestamp */}
                <div className="text-center text-sm text-slate-500">
                  Last analyzed: {new Date(scalingRecommendations.generatedAt).toLocaleString()}
                </div>
              </>
            )}
          </div>
        )}

        {/* Creatives Tab */}
        {activeTab === 'creatives' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold tracking-tight mb-2">Creative Assets</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Campaign creatives and variations will be displayed here
            </p>
          </div>
        )}

        {/* Technical Setup Tab */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            {/* Pixel Installation Code Generator */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                <span className="text-2xl">📍</span>
                Pixel Installation Code Generator
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Generate tracking pixel code for your advertising platforms. Copy and paste into your website's &lt;head&gt; section.
              </p>

              {/* Pixel Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Pixel Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedPixelType('meta')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPixelType === 'meta'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">📘</div>
                    <div className="font-medium">Meta Pixel</div>
                    <div className="text-xs text-slate-500">Facebook & Instagram</div>
                  </button>
                  <button
                    onClick={() => setSelectedPixelType('google')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPixelType === 'google'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔍</div>
                    <div className="font-medium">Google Analytics</div>
                    <div className="text-xs text-slate-500">GA4 Tag</div>
                  </button>
                  <button
                    onClick={() => setSelectedPixelType('tiktok')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPixelType === 'tiktok'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">🎵</div>
                    <div className="font-medium">TikTok Pixel</div>
                    <div className="text-xs text-slate-500">TikTok Ads</div>
                  </button>
                </div>
              </div>

              {/* Pixel ID Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {selectedPixelType === 'meta' && 'Meta Pixel ID'}
                  {selectedPixelType === 'google' && 'Google Analytics Measurement ID'}
                  {selectedPixelType === 'tiktok' && 'TikTok Pixel ID'}
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    placeholder={
                      selectedPixelType === 'meta' ? 'e.g., 123456789012345' :
                      selectedPixelType === 'google' ? 'e.g., G-XXXXXXXXXX' :
                      'e.g., CXXXXXXXXXXXXXXX'
                    }
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={generatePixelCode}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Generate Pixel Code
                  </button>
                </div>
              </div>

              {/* Generated Code Output */}
              {generatedPixelCode && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Generated Code</label>
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                        codeCopied
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {codeCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    <code>{generatedPixelCode}</code>
                  </pre>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Paste this code in the &lt;head&gt; section of your website, just before the closing &lt;/head&gt; tag.
                  </p>
                </div>
              )}
            </div>

            {/* UTM Parameter Builder */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                UTM Parameter Builder
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Create campaign URLs with UTM parameters for tracking in Google Analytics and other platforms.
              </p>

              {/* UTM Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Base URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utmBaseUrl}
                    onChange={(e) => setUtmBaseUrl(e.target.value)}
                    placeholder="https://example.com/landing-page"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* UTM Source */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign Source <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="e.g., facebook, google, newsletter"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">The referrer (e.g., google, newsletter)</p>
                </div>

                {/* UTM Medium */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign Medium <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="e.g., cpc, banner, email"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Marketing medium (e.g., cpc, banner, email)</p>
                </div>

                {/* UTM Campaign */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="e.g., black_friday_2024"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Product, promo code, or slogan</p>
                </div>

                {/* UTM Term */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign Term <span className="text-slate-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    placeholder="e.g., running+shoes"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Identify paid search keywords</p>
                </div>

                {/* UTM Content */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Campaign Content <span className="text-slate-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    placeholder="e.g., logolink, textlink, variation_a"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Differentiate ads or links pointing to the same URL</p>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateUtmUrl}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Generate UTM URL
              </button>

              {/* Generated UTM URL */}
              {generatedUtmUrl && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Generated URL</label>
                    <button
                      onClick={copyUtmUrl}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                        utmCopied
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {utmCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all">
                    {generatedUtmUrl}
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Use this URL in your campaigns to track traffic in Google Analytics.
                  </p>
                </div>
              )}
            </div>

            {/* Audience Builder */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    Audience Builder
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Create and manage targeting audiences for your campaigns
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetAudienceForm()
                    setShowAudienceModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  + Create Audience
                </button>
              </div>

              {/* Audience Type Tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'lookalike', label: 'Lookalike', icon: '🎯', desc: 'Similar to existing customers' },
                  { id: 'custom', label: 'Custom', icon: '📋', desc: 'From customer list or pixel' },
                  { id: 'interest', label: 'Interest-based', icon: '❤️', desc: 'Based on interests & demos' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAudienceType(tab.id)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      audienceType === tab.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{tab.icon}</div>
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{tab.desc}</div>
                  </button>
                ))}
              </div>

              {/* Saved Audiences List */}
              {audiences.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Saved Audiences ({audiences.length})</h4>
                  <div className="space-y-3">
                    {audiences.filter(a => a.type === audienceType).map((audience) => (
                      <div
                        key={audience.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                            audience.type === 'lookalike' ? 'bg-blue-100 dark:bg-blue-900' :
                            audience.type === 'custom' ? 'bg-green-100 dark:bg-green-900' :
                            'bg-purple-100 dark:bg-purple-900'
                          }`}>
                            {audience.type === 'lookalike' ? '🎯' : audience.type === 'custom' ? '📋' : '❤️'}
                          </div>
                          <div>
                            <div className="font-medium">{audience.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {audience.type === 'lookalike' && `${audience.similarityPercentage}% similarity • ${audience.country}`}
                              {audience.type === 'custom' && `${audience.customType === 'customer_list' ? 'Customer List' : 'Pixel Event'}`}
                              {audience.type === 'interest' && `${audience.interests.length} interests • ${audience.demographics.ageMin}-${audience.demographics.ageMax} years`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">{audience.estimatedSize?.toLocaleString()}</div>
                            <div className="text-xs text-slate-500">Est. reach</div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            {audience.status}
                          </span>
                          <button
                            onClick={() => deleteAudience(audience.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {audiences.filter(a => a.type === audienceType).length === 0 && (
                      <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                        No {audienceType} audiences created yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Create Tips */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {audienceType === 'lookalike' && 'Lookalike Audience Tips'}
                  {audienceType === 'custom' && 'Custom Audience Tips'}
                  {audienceType === 'interest' && 'Interest-based Audience Tips'}
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  {audienceType === 'lookalike' && (
                    <>
                      <li>• Choose a high-quality source audience (customers, converters)</li>
                      <li>• Lower similarity (1%) = more precise, higher similarity (10%) = larger reach</li>
                      <li>• Start with 1-2% similarity for best results</li>
                    </>
                  )}
                  {audienceType === 'custom' && (
                    <>
                      <li>• Customer lists should include email or phone numbers</li>
                      <li>• Pixel events track specific actions on your website</li>
                      <li>• Use for retargeting past visitors or purchasers</li>
                    </>
                  )}
                  {audienceType === 'interest' && (
                    <>
                      <li>• Combine multiple related interests for better targeting</li>
                      <li>• Use demographics to narrow down your ideal customer</li>
                      <li>• Test different interest combinations</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Automated Rules */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    Automated Rules
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Set performance thresholds and automated actions
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetRuleForm()
                    setShowRuleModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  + Create Rule
                </button>
              </div>

              {/* Active Rules List */}
              {automatedRules.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {automatedRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-lg border ${
                        rule.enabled
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${rule.enabled ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>
                              {rule.name}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              rule.enabled
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {rule.enabled ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                            <span className="font-medium">When</span>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                              {getRuleMetricLabel(rule.metric)}
                            </span>
                            <span>{getRuleOperatorLabel(rule.operator)}</span>
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                              {rule.threshold}
                            </span>
                            <span className="mx-1">→</span>
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
                              {getRuleActionLabel(rule.action)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                            Checks: {rule.frequency} • Triggers: {rule.triggerCount}
                            {rule.lastTriggered && ` • Last: ${new Date(rule.lastTriggered).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              rule.enabled
                                ? 'hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600'
                                : 'hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600'
                            }`}
                            title={rule.enabled ? 'Pause Rule' : 'Enable Rule'}
                          >
                            {rule.enabled ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-4">
                  <div className="text-4xl mb-3">🤖</div>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">No automated rules yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Create rules to automatically optimize your campaigns based on performance
                  </p>
                </div>
              )}

              {/* Quick Rule Templates */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Rule Templates
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setRuleForm({
                        name: 'Low ROAS Alert',
                        metric: 'roas',
                        operator: 'less_than',
                        threshold: '2.0',
                        action: 'pause',
                        frequency: 'daily',
                        enabled: true
                      })
                      setShowRuleModal(true)
                    }}
                    className="p-3 text-left bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="text-sm font-medium">Pause Low ROAS</div>
                    <div className="text-xs text-slate-500">ROAS &lt; 2.0 → Pause</div>
                  </button>
                  <button
                    onClick={() => {
                      setRuleForm({
                        name: 'High CPA Alert',
                        metric: 'cpa',
                        operator: 'greater_than',
                        threshold: '50',
                        action: 'decrease_budget',
                        frequency: 'daily',
                        enabled: true
                      })
                      setShowRuleModal(true)
                    }}
                    className="p-3 text-left bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="text-sm font-medium">High CPA Control</div>
                    <div className="text-xs text-slate-500">CPA &gt; $50 → Reduce Budget</div>
                  </button>
                  <button
                    onClick={() => {
                      setRuleForm({
                        name: 'Strong Performance Boost',
                        metric: 'roas',
                        operator: 'greater_than',
                        threshold: '5.0',
                        action: 'increase_budget',
                        frequency: 'daily',
                        enabled: true
                      })
                      setShowRuleModal(true)
                    }}
                    className="p-3 text-left bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="text-sm font-medium">Scale Winners</div>
                    <div className="text-xs text-slate-500">ROAS &gt; 5.0 → Increase Budget</div>
                  </button>
                  <button
                    onClick={() => {
                      setRuleForm({
                        name: 'Low CTR Warning',
                        metric: 'ctr',
                        operator: 'less_than',
                        threshold: '1.0',
                        action: 'send_alert',
                        frequency: 'daily',
                        enabled: true
                      })
                      setShowRuleModal(true)
                    }}
                    className="p-3 text-left bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="text-sm font-medium">CTR Monitor</div>
                    <div className="text-xs text-slate-500">CTR &lt; 1% → Send Alert</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Checklist Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <span>✅</span> Launch Checklist
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Verify all requirements before launch
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    {completedItems.length} of {checklistItems.length} complete
                  </span>
                  <span className={`font-medium ${allChecklistComplete ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {Math.round((completedItems.length / checklistItems.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${allChecklistComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${(completedItems.length / checklistItems.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Quick Preview */}
              <div className="space-y-2 mb-4">
                {checklistItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.complete ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className={item.complete ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium'}>
                      {item.label}
                    </span>
                  </div>
                ))}
                {checklistItems.length > 4 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 pl-6">
                    +{checklistItems.length - 4} more items
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLaunchChecklist(true)}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
              >
                View Full Checklist →
              </button>
            </div>
          </div>
        )}

        {/* Campaign Structure Tab */}
        {activeTab === 'structure' && (
          <div className="space-y-6">
            {/* Campaign Structure Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                Campaign Structure Builder
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Build your campaign hierarchy: Campaign &gt; Ad Sets &gt; Ads. This structure follows Meta's campaign architecture.
              </p>

              {/* Campaign Level */}
              <div className="border-2 border-blue-500 dark:border-blue-400 rounded-xl p-6 bg-blue-50 dark:bg-blue-900/20 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-700 dark:text-blue-300">Campaign Level</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Set campaign objective and name</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Campaign Name</label>
                    <input
                      type="text"
                      value={campaignStructure.name || campaign?.name || ''}
                      onChange={(e) => updateCampaignStructureName(e.target.value)}
                      placeholder="Enter campaign name"
                      className="w-full px-4 py-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Campaign Objective</label>
                    <select
                      value={campaignStructure.objective}
                      onChange={(e) => updateCampaignStructureObjective(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="awareness">Awareness</option>
                      <option value="traffic">Traffic</option>
                      <option value="engagement">Engagement</option>
                      <option value="leads">Leads</option>
                      <option value="app_promotion">App Promotion</option>
                      <option value="sales">Sales</option>
                      <option value="conversions">Conversions</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ad Sets Level */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="text-xl">📁</span>
                    Ad Sets ({campaignStructure.adSets.length})
                  </h4>
                  <button
                    onClick={() => setShowAddAdSet(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Ad Set
                  </button>
                </div>

                {/* Add Ad Set Form */}
                {showAddAdSet && (
                  <div className="border-2 border-dashed border-purple-400 dark:border-purple-500 rounded-xl p-6 bg-purple-50 dark:bg-purple-900/20">
                    <h5 className="font-bold text-purple-700 dark:text-purple-300 mb-4">New Ad Set</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Ad Set Name *</label>
                        <input
                          type="text"
                          value={newAdSet.name}
                          onChange={(e) => setNewAdSet({ ...newAdSet, name: e.target.value })}
                          placeholder="e.g., Women 25-34 - Interest"
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Daily Budget</label>
                        <input
                          type="text"
                          value={newAdSet.budget}
                          onChange={(e) => setNewAdSet({ ...newAdSet, budget: e.target.value })}
                          placeholder="e.g., $50"
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Target Audience</label>
                        <input
                          type="text"
                          value={newAdSet.targetAudience}
                          onChange={(e) => setNewAdSet({ ...newAdSet, targetAudience: e.target.value })}
                          placeholder="e.g., Lookalike 1%"
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Placement</label>
                        <select
                          value={newAdSet.placement}
                          onChange={(e) => setNewAdSet({ ...newAdSet, placement: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="automatic">Automatic Placements</option>
                          <option value="feed">Feed Only</option>
                          <option value="stories">Stories Only</option>
                          <option value="reels">Reels Only</option>
                          <option value="manual">Manual Selection</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowAddAdSet(false)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAdSet}
                        disabled={!newAdSet.name.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                      >
                        Create Ad Set
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Ad Sets */}
                {campaignStructure.adSets.map((adSet, adSetIndex) => (
                  <div key={adSet.id} className="border-2 border-purple-500 dark:border-purple-400 rounded-xl p-6 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📁</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-purple-700 dark:text-purple-300">{adSet.name}</h5>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {adSet.budget && `Budget: ${adSet.budget}`} {adSet.targetAudience && `• Audience: ${adSet.targetAudience}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddAd(adSetIndex)}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                        >
                          + Add Ad
                        </button>
                        <button
                          onClick={() => handleDeleteAdSet(adSet.id)}
                          className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Add Ad Form */}
                    {showAddAd === adSetIndex && (
                      <div className="border-2 border-dashed border-green-400 dark:border-green-500 rounded-xl p-4 bg-green-50 dark:bg-green-900/20 mb-4">
                        <h6 className="font-bold text-green-700 dark:text-green-300 mb-3">New Ad</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Ad Name *</label>
                            <input
                              type="text"
                              value={newAd.name}
                              onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                              placeholder="e.g., Creative A - Lifestyle Image"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Ad Type</label>
                            <select
                              value={newAd.type}
                              onChange={(e) => setNewAd({ ...newAd, type: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            >
                              <option value="image">Single Image</option>
                              <option value="video">Video</option>
                              <option value="carousel">Carousel</option>
                              <option value="collection">Collection</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Headline</label>
                            <input
                              type="text"
                              value={newAd.headline}
                              onChange={(e) => setNewAd({ ...newAd, headline: e.target.value })}
                              placeholder="Your ad headline"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">CTA Button</label>
                            <select
                              value={newAd.cta}
                              onChange={(e) => setNewAd({ ...newAd, cta: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            >
                              <option value="Learn More">Learn More</option>
                              <option value="Shop Now">Shop Now</option>
                              <option value="Sign Up">Sign Up</option>
                              <option value="Get Offer">Get Offer</option>
                              <option value="Book Now">Book Now</option>
                              <option value="Contact Us">Contact Us</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowAddAd(null)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddAd(adSetIndex)}
                            disabled={!newAd.name.trim()}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm disabled:cursor-not-allowed"
                          >
                            Create Ad
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ads List */}
                    {adSet.ads.length > 0 ? (
                      <div className="space-y-2 ml-8">
                        {adSet.ads.map((ad) => (
                          <div key={ad.id} className="flex items-center justify-between border border-green-400 dark:border-green-500 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">
                                  {ad.type === 'video' ? '🎬' : ad.type === 'carousel' ? '🎠' : '🖼️'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-green-700 dark:text-green-300 text-sm">{ad.name}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {ad.type.charAt(0).toUpperCase() + ad.type.slice(1)} • {ad.cta}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteAd(adSetIndex, ad.id)}
                              className="px-2 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-purple-600 dark:text-purple-400 ml-8 italic">No ads yet. Click "+ Add Ad" to create one.</p>
                    )}
                  </div>
                ))}

                {campaignStructure.adSets.length === 0 && !showAddAdSet && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
                    <div className="text-4xl mb-3">📁</div>
                    <h4 className="font-bold text-lg mb-2">No Ad Sets Yet</h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Start building your campaign structure by adding your first ad set.
                    </p>
                    <button
                      onClick={() => setShowAddAdSet(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Create First Ad Set
                    </button>
                  </div>
                )}
              </div>

              {/* Structure Summary */}
              {campaignStructure.adSets.length > 0 && (
                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <span>📋</span> Structure Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Campaign</div>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{campaignStructure.adSets.length}</div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">Ad Sets</div>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {campaignStructure.adSets.reduce((total, adSet) => total + adSet.ads.length, 0)}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">Ads</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* A/B Tests Tab */}
        {activeTab === 'abtests' && (
          <div className="space-y-6">
            {/* A/B Test Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight">A/B Test Variants</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create and manage test variants to optimize performance
                </p>
              </div>
              <button
                onClick={() => setShowCreateVariant(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                + Create Variant
              </button>
            </div>

            {/* Winner Analysis */}
            {abTests.length >= 2 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                    🏆
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 dark:text-green-100 mb-1">
                      Test Results Analysis
                    </h4>
                    {(() => {
                      const result = getTestWinner(abTests)
                      if (!result) return null
                      return (
                        <div className="space-y-2">
                          <p className="text-green-800 dark:text-green-200">
                            <span className="font-semibold">{result.winner.name}</span> is the current winner with a{' '}
                            <span className="font-semibold">{result.lift.toFixed(1)}% lift</span> in conversion rate
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-green-700 dark:text-green-300">Confidence Level:</span>
                              <span className={`font-bold ${result.confidence >= 95 ? 'text-green-600' : result.confidence >= 85 ? 'text-amber-600' : 'text-slate-600'}`}>
                                {result.confidence}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-700 dark:text-green-300">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                result.confidence >= 95
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                              }`}>
                                {result.confidence >= 95 ? 'Statistically Significant' : 'Needs More Data'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Variants Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {abTests.map((test, index) => {
                const conversionRate = test.impressions > 0 ? ((test.conversions / test.impressions) * 100).toFixed(2) : '0.00'
                const ctr = test.impressions > 0 ? ((test.clicks / test.impressions) * 100).toFixed(2) : '0.00'
                const isWinner = getTestWinner(abTests)?.winner?.id === test.id

                return (
                  <div
                    key={test.id}
                    className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-6 transition-all ${
                      isWinner
                        ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-900'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-blue-500' : 'bg-purple-500'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="font-bold">{test.name}</span>
                        {isWinner && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            Winner
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.status === 'running'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {test.status}
                      </span>
                    </div>

                    {/* Creative Preview */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{test.headline}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{test.description}</p>
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded">{test.cta}</span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{test.impressions?.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Impressions</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{ctr}%</div>
                        <div className="text-xs text-slate-500">CTR</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{conversionRate}%</div>
                        <div className="text-xs text-slate-500">Conv. Rate</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Create Variant Modal */}
            {showCreateVariant && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
                  <h3 className="text-xl font-bold tracking-tight mb-4">Create New Variant</h3>
                  <form onSubmit={handleCreateVariant} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Variant Name *</label>
                      <input
                        type="text"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                        placeholder="e.g., Variant C"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Headline *</label>
                      <input
                        type="text"
                        value={newVariant.headline}
                        onChange={(e) => setNewVariant({...newVariant, headline: e.target.value})}
                        placeholder="e.g., Limited Time Offer!"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={newVariant.description}
                        onChange={(e) => setNewVariant({...newVariant, description: e.target.value})}
                        placeholder="Brief description of the offer"
                        rows="2"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Call to Action *</label>
                      <input
                        type="text"
                        value={newVariant.cta}
                        onChange={(e) => setNewVariant({...newVariant, cta: e.target.value})}
                        placeholder="e.g., Shop Now"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateVariant(false)}
                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium"
                      >
                        Create Variant
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold tracking-tight mb-2">Campaign Settings</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Campaign configuration and advanced settings will be displayed here
            </p>
          </div>
        )}
      </div>

      {/* Launch Checklist Modal */}
      {showLaunchChecklist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Launch Checklist</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Complete all items before launching your campaign
                  </p>
                </div>
                <button
                  onClick={() => setShowLaunchChecklist(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Overview */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    {completedItems.length} of {checklistItems.length} requirements complete
                  </span>
                  <span className={`font-bold ${allChecklistComplete ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {Math.round((completedItems.length / checklistItems.length) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${allChecklistComplete ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                    style={{ width: `${(completedItems.length / checklistItems.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Incomplete Items Section */}
              {incompleteItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Incomplete ({incompleteItems.length})
                  </h4>
                  <div className="space-y-3">
                    {incompleteItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{item.label}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{item.description}</div>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs font-medium capitalize">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Items Section */}
              {completedItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Complete ({completedItems.length})
                  </h4>
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{item.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {allChecklistComplete ? (
                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      All requirements met - Ready to launch!
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Complete all items to enable launch
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLaunchChecklist(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (allChecklistComplete) {
                        handleLaunch()
                        setShowLaunchChecklist(false)
                      }
                    }}
                    disabled={!allChecklistComplete}
                    className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      allChecklistComplete
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Launch Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audience Builder Modal */}
      {showAudienceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Create New Audience</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Configure your audience targeting settings
                  </p>
                </div>
                <button
                  onClick={() => setShowAudienceModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Audience Type Selection in Modal */}
              <div className="flex gap-2 mt-4">
                {[
                  { id: 'lookalike', label: 'Lookalike', icon: '🎯' },
                  { id: 'custom', label: 'Custom', icon: '📋' },
                  { id: 'interest', label: 'Interest', icon: '❤️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAudienceType(tab.id)
                      setAudienceForm({ ...audienceForm, type: tab.id })
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      audienceType === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Common: Audience Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Audience Name *</label>
                <input
                  type="text"
                  value={audienceForm.name}
                  onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })}
                  placeholder="e.g., High-Value Customers Lookalike"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lookalike Configuration */}
              {audienceType === 'lookalike' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Source Audience *</label>
                    <select
                      value={audienceForm.sourceAudience}
                      onChange={(e) => setAudienceForm({ ...audienceForm, sourceAudience: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select source audience...</option>
                      <option value="all_customers">All Customers</option>
                      <option value="high_value">High-Value Customers (Top 20%)</option>
                      <option value="recent_purchasers">Recent Purchasers (30 days)</option>
                      <option value="converters">Website Converters</option>
                      <option value="engaged_users">Engaged Users</option>
                      <option value="email_subscribers">Email Subscribers</option>
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose the seed audience to find similar people
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Similarity Percentage: {audienceForm.similarityPercentage}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={audienceForm.similarityPercentage}
                      onChange={(e) => setAudienceForm({ ...audienceForm, similarityPercentage: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>1% (Most Similar)</span>
                      <span>10% (Largest Reach)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Country</label>
                    <select
                      value={audienceForm.country}
                      onChange={(e) => setAudienceForm({ ...audienceForm, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Brazil">Brazil</option>
                    </select>
                  </div>
                </>
              )}

              {/* Custom Audience Configuration */}
              {audienceType === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Audience Source *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAudienceForm({ ...audienceForm, customType: 'customer_list' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          audienceForm.customType === 'customer_list'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-2xl mb-2">📋</div>
                        <div className="font-medium">Customer List</div>
                        <div className="text-xs text-slate-500">Upload emails or phones</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudienceForm({ ...audienceForm, customType: 'pixel_event' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          audienceForm.customType === 'pixel_event'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-2xl mb-2">🔗</div>
                        <div className="font-medium">Pixel Event</div>
                        <div className="text-xs text-slate-500">Track website actions</div>
                      </button>
                    </div>
                  </div>

                  {audienceForm.customType === 'customer_list' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Customer List</label>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-3">📄</div>
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                          Drag & drop your CSV file here
                        </p>
                        <p className="text-xs text-slate-500">or click to browse</p>
                        <input type="file" accept=".csv" className="hidden" />
                        <button className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                          Select File
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Include columns: email, phone, first_name, last_name (email or phone required)
                      </p>
                    </div>
                  )}

                  {audienceForm.customType === 'pixel_event' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Pixel Event *</label>
                      <select
                        value={audienceForm.pixelEvent}
                        onChange={(e) => setAudienceForm({ ...audienceForm, pixelEvent: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select event...</option>
                        <option value="PageView">Page View</option>
                        <option value="ViewContent">View Content</option>
                        <option value="AddToCart">Add to Cart</option>
                        <option value="InitiateCheckout">Initiate Checkout</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Lead">Lead</option>
                        <option value="CompleteRegistration">Complete Registration</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        People who triggered this event on your website
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Interest-based Configuration */}
              {audienceType === 'interest' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Interests & Behaviors</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Type an interest and press Enter..."
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddInterest(e.target.value)
                            e.target.value = ''
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {audienceForm.interests.map((interest, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2"
                        >
                          {interest}
                          <button onClick={() => handleRemoveInterest(i)} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Fitness', 'Technology', 'Fashion', 'Travel', 'Food & Dining', 'Business', 'Entertainment', 'Health'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleAddInterest(suggestion)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Age</label>
                      <input
                        type="number"
                        min="13"
                        max="65"
                        value={audienceForm.demographics.ageMin}
                        onChange={(e) => setAudienceForm({
                          ...audienceForm,
                          demographics: { ...audienceForm.demographics, ageMin: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Age</label>
                      <input
                        type="number"
                        min="13"
                        max="65"
                        value={audienceForm.demographics.ageMax}
                        onChange={(e) => setAudienceForm({
                          ...audienceForm,
                          demographics: { ...audienceForm.demographics, ageMax: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Gender</label>
                      <select
                        value={audienceForm.demographics.gender}
                        onChange={(e) => setAudienceForm({
                          ...audienceForm,
                          demographics: { ...audienceForm.demographics, gender: e.target.value }
                        })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Locations</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add city, state, or country..."
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddLocation(e.target.value)
                            e.target.value = ''
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {audienceForm.locations.map((location, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center gap-2"
                        >
                          📍 {location}
                          <button onClick={() => handleRemoveLocation(i)} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Estimated reach: <span className="font-bold">
                    {audienceType === 'lookalike'
                      ? `${(audienceForm.similarityPercentage * 100000).toLocaleString()} - ${(audienceForm.similarityPercentage * 150000).toLocaleString()}`
                      : audienceType === 'custom'
                        ? '10,000 - 50,000'
                        : `${(audienceForm.interests.length * 50000 + 100000).toLocaleString()}`
                    }
                  </span> people
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAudienceModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAudience}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                  >
                    Create Audience
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated Rules Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Create Automated Rule</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Set conditions and actions for automatic optimization
                  </p>
                </div>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Rule Name *</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g., Low ROAS Pause"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Condition Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span>📊</span> When this condition is met:
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  {/* Metric */}
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Metric</label>
                    <select
                      value={ruleForm.metric}
                      onChange={(e) => setRuleForm({ ...ruleForm, metric: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="roas">ROAS</option>
                      <option value="cpa">CPA ($)</option>
                      <option value="ctr">CTR (%)</option>
                      <option value="cpm">CPM ($)</option>
                      <option value="impressions">Impressions</option>
                      <option value="clicks">Clicks</option>
                      <option value="conversions">Conversions</option>
                      <option value="spend">Spend ($)</option>
                    </select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Condition</label>
                    <select
                      value={ruleForm.operator}
                      onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="less_than">is less than</option>
                      <option value="greater_than">is greater than</option>
                      <option value="less_than_or_equal">is ≤</option>
                      <option value="greater_than_or_equal">is ≥</option>
                      <option value="equals">equals</option>
                    </select>
                  </div>

                  {/* Threshold */}
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ruleForm.threshold}
                      onChange={(e) => setRuleForm({ ...ruleForm, threshold: e.target.value })}
                      placeholder="2.0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Preview */}
                {ruleForm.metric && ruleForm.threshold && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <span className="text-slate-600 dark:text-slate-400">When </span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{getRuleMetricLabel(ruleForm.metric)}</span>
                    <span className="text-slate-600 dark:text-slate-400"> {getRuleOperatorLabel(ruleForm.operator)} </span>
                    <span className="font-medium text-purple-700 dark:text-purple-300">{ruleForm.threshold}</span>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span>⚡</span> Then do this:
                </h4>

                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Action</label>
                  <select
                    value={ruleForm.action}
                    onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pause">Pause Campaign</option>
                    <option value="increase_budget">Increase Budget by 10%</option>
                    <option value="decrease_budget">Decrease Budget by 10%</option>
                    <option value="increase_bid">Increase Bid by 10%</option>
                    <option value="decrease_bid">Decrease Bid by 10%</option>
                    <option value="send_alert">Send Alert Notification</option>
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium mb-2">Check Frequency</label>
                <select
                  value={ruleForm.frequency}
                  onChange={(e) => setRuleForm({ ...ruleForm, frequency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How often this rule should be evaluated
                </p>
              </div>

              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium">Enable Rule Immediately</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Rule will start checking after creation
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRuleForm({ ...ruleForm, enabled: !ruleForm.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    ruleForm.enabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      ruleForm.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  disabled={!ruleForm.name.trim() || !ruleForm.threshold}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
          {/* Create confetti pieces */}
          {[...Array(150)].map((_, i) => {
            const colors = ['#FF6B35', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B', '#14B8A6'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const animationDelay = Math.random() * 2;
            const animationDuration = 3 + Math.random() * 2;
            const size = 8 + Math.random() * 8;
            const rotation = Math.random() * 360;
            
            return (
              <div
                key={i}
                className="absolute confetti-piece"
                style={{
                  left: `${left}%`,
                  top: '-20px',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  transform: `rotate(${rotation}deg)`,
                  animation: `confetti-fall ${animationDuration}s ease-out ${animationDelay}s forwards`,
                }}
              />
            );
          })}
          <style>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(0) rotate(0deg) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg) scale(0.5);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}