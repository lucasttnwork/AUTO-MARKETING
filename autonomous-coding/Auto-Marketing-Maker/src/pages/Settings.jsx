import { useState, useEffect } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'system',
    notifications: true,
    emailDigest: 'weekly',
    agentBehavior: 'balanced',
    autoSave: true,
    fontSize: 16, // Default font size in pixels
    density: 'comfortable' // 'compact', 'comfortable', 'spacious'
  })

  const [apiKeys, setApiKeys] = useState({
    anthropic: '••••••••••••••••',
    meta: '',
    google: ''
  })

  const [saved, setSaved] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [backupInProgress, setBackupInProgress] = useState(false)
  const [backupComplete, setBackupComplete] = useState(false)

  // AI Provider Configuration state
  const [aiModels, setAiModels] = useState([])
  const [defaultProvider, setDefaultProvider] = useState('openrouter')
  const [showAddModelModal, setShowAddModelModal] = useState(false)
  const [newModel, setNewModel] = useState({ model_string: '', provider: 'openrouter', display_name: '', description: '' })
  const [modelToDelete, setModelToDelete] = useState(null)
  const [modelsLoading, setModelsLoading] = useState(true)

  // Human-in-the-loop checkpoint configuration
  const [hitlConfig, setHitlConfig] = useState({
    enabled: true,
    checkpoints: {
      campaignLaunch: true,
      budgetChanges: true,
      creativeApproval: true,
      audienceTargeting: true,
      agentVoting: true,
      sopExecution: false
    },
    autoExecuteThreshold: 0.85, // Confidence threshold for auto-execution
    requireApprovalAbove: 1000, // Require approval for actions above this budget
    notifyOnRedFlag: true
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ama_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
  }, [])

  // Fetch AI models from the backend
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/models')
        if (response.ok) {
          const models = await response.json()
          setAiModels(models)
          // Set default provider from the default model
          const defaultModel = models.find(m => m.is_default === 1)
          if (defaultModel) {
            setDefaultProvider(defaultModel.provider)
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI models:', error)
      } finally {
        setModelsLoading(false)
      }
    }
    fetchModels()

    // Load saved default provider preference
    const savedProvider = localStorage.getItem('ama_default_provider')
    if (savedProvider) {
      setDefaultProvider(savedProvider)
    }
  }, [])

  // Apply font size when settings change
  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.fontSize}px`
    // Also save to localStorage on font size change for persistence
    localStorage.setItem('ama_font_size', settings.fontSize.toString())
  }, [settings.fontSize])

  // Apply density when settings change
  useEffect(() => {
    document.documentElement.setAttribute('data-density', settings.density)
    localStorage.setItem('ama_density', settings.density)
  }, [settings.density])

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('ama_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleBackupData = async () => {
    setBackupInProgress(true)
    setBackupComplete(false)

    try {
      // Simulate backup process - gather all data
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Collect all data from localStorage and create backup
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        settings: settings,
        apiKeys: { ...apiKeys, anthropic: '***REDACTED***' }, // Redact sensitive data
        localStorage: {},
        database: {
          clients: [],
          campaigns: [],
          tasks: [],
          conversations: [],
          creativeAssets: []
        }
      }

      // Collect localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ama_')) {
          backupData.localStorage[key] = localStorage.getItem(key)
        }
      }

      // Fetch data from backend
      try {
        const clientsRes = await fetch('http://localhost:3001/api/clients')
        if (clientsRes.ok) {
          backupData.database.clients = await clientsRes.json()
        }

        const campaignsRes = await fetch('http://localhost:3001/api/campaigns')
        if (campaignsRes.ok) {
          backupData.database.campaigns = await campaignsRes.json()
        }

        const tasksRes = await fetch('http://localhost:3001/api/tasks')
        if (tasksRes.ok) {
          backupData.database.tasks = await tasksRes.json()
        }
      } catch (e) {
        console.log('Could not fetch all database data:', e)
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ama-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setBackupComplete(true)
      setTimeout(() => setBackupComplete(false), 5000)
    } catch (error) {
      console.error('Backup failed:', error)
      alert('Backup failed. Please try again.')
    } finally {
      setBackupInProgress(false)
    }
  }

  const fontSizeLabels = {
    14: 'Small',
    16: 'Default',
    18: 'Large',
    20: 'Extra Large'
  }

  // AI Model handlers
  const handleProviderChange = (provider) => {
    setDefaultProvider(provider)
    localStorage.setItem('ama_default_provider', provider)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleAddModel = async () => {
    if (!newModel.model_string || !newModel.display_name) {
      alert('Please fill in model string and display name')
      return
    }
    try {
      const response = await fetch('http://localhost:3001/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      })
      if (response.ok) {
        const createdModel = await response.json()
        setAiModels(prev => [...prev, createdModel])
        setShowAddModelModal(false)
        setNewModel({ model_string: '', provider: 'openrouter', display_name: '', description: '' })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add model')
      }
    } catch (error) {
      console.error('Failed to add model:', error)
      alert('Failed to add model')
    }
  }

  const handleSetDefaultModel = async (modelId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      })
      if (response.ok) {
        // Update local state
        setAiModels(prev => prev.map(m => ({ ...m, is_default: m.id === modelId ? 1 : 0 })))
        const model = aiModels.find(m => m.id === modelId)
        if (model) setDefaultProvider(model.provider)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to set default model:', error)
    }
  }

  const handleToggleModelActive = async (modelId, currentActive) => {
    try {
      const response = await fetch(`http://localhost:3001/api/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: currentActive ? 0 : 1 })
      })
      if (response.ok) {
        setAiModels(prev => prev.map(m => m.id === modelId ? { ...m, is_active: currentActive ? 0 : 1 } : m))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to toggle model status')
      }
    } catch (error) {
      console.error('Failed to toggle model:', error)
    }
  }

  const handleDeleteModel = async () => {
    if (!modelToDelete) return
    try {
      const response = await fetch(`http://localhost:3001/api/models/${modelToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        setAiModels(prev => prev.filter(m => m.id !== modelToDelete))
        setModelToDelete(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete model')
      }
    } catch (error) {
      console.error('Failed to delete model:', error)
    }
  }

  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', '/'], description: 'Open search' },
      { keys: ['Ctrl', 'D'], description: 'Go to dashboard' },
      { keys: ['Ctrl', 'C'], description: 'Go to clients' },
      { keys: ['Ctrl', 'M'], description: 'Go to campaigns' },
    ]},
    { category: 'Actions', items: [
      { keys: ['Ctrl', 'N'], description: 'Create new item' },
      { keys: ['Ctrl', 'S'], description: 'Save current item' },
      { keys: ['Ctrl', 'E'], description: 'Edit selected item' },
      { keys: ['Del'], description: 'Delete selected item' },
    ]},
    { category: 'Super Agent', items: [
      { keys: ['Ctrl', 'Space'], description: 'Open Super Agent chat' },
      { keys: ['Escape'], description: 'Close modals and panels' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ]},
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Manage your account and preferences</p>

      {saved && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Settings saved successfully!
        </div>
      )}

      {/* Account Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            U
          </div>
          <div>
            <div className="font-medium text-lg">User</div>
            <div className="text-slate-500 dark:text-slate-400">user@ama.com</div>
          </div>
          <button className="ml-auto px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Edit Profile
          </button>
        </div>
      </section>

      {/* Display Preferences Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>
        <div className="space-y-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred appearance</div>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">Font Size</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Adjust text size across the application</div>
              </div>
              <span className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {fontSizeLabels[settings.fontSize] || `${settings.fontSize}px`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">A</span>
              <input
                type="range"
                min="14"
                max="20"
                step="2"
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                aria-label="Font size slider"
              />
              <span className="text-lg text-slate-500">A</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1 px-2">
              <span>Small</span>
              <span>Default</span>
              <span>Large</span>
              <span>Extra Large</span>
            </div>
          </div>

          {/* Density */}
          <div>
            <div className="mb-3">
              <div className="font-medium">Display Density</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Adjust spacing between UI elements</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['compact', 'comfortable', 'spacious'].map((density) => (
                <button
                  key={density}
                  onClick={() => setSettings({ ...settings, density })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    settings.density === density
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex flex-col gap-${density === 'compact' ? '0.5' : density === 'comfortable' ? '1' : '2'}`}>
                      <div className={`bg-slate-300 dark:bg-slate-600 rounded ${density === 'compact' ? 'h-1 w-8' : density === 'comfortable' ? 'h-1.5 w-10' : 'h-2 w-12'}`}></div>
                      <div className={`bg-slate-300 dark:bg-slate-600 rounded ${density === 'compact' ? 'h-1 w-6' : density === 'comfortable' ? 'h-1.5 w-8' : 'h-2 w-10'}`}></div>
                      <div className={`bg-slate-300 dark:bg-slate-600 rounded ${density === 'compact' ? 'h-1 w-7' : density === 'comfortable' ? 'h-1.5 w-9' : 'h-2 w-11'}`}></div>
                    </div>
                    <span className="text-xs font-medium capitalize mt-2">{density}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notification Preferences Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-6">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Push Notifications</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Receive alerts and updates in the browser</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.notifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={settings.notifications}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  settings.notifications ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Digest</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">How often to receive email summaries</div>
            </div>
            <select
              value={settings.emailDigest}
              onChange={(e) => setSettings({ ...settings, emailDigest: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Save</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Automatically save changes</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.autoSave ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={settings.autoSave}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  settings.autoSave ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Agent Behavior Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Agent Behavior</h2>
        <div className="space-y-4">
          <div className="font-medium">Agent Response Style</div>
          <div className="grid grid-cols-3 gap-4">
            {['conservative', 'balanced', 'aggressive'].map((style) => (
              <button
                key={style}
                onClick={() => setSettings({ ...settings, agentBehavior: style })}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  settings.agentBehavior === style
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="font-medium capitalize">{style}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {style === 'conservative' && 'Careful, asks more questions'}
                  {style === 'balanced' && 'Default balanced approach'}
                  {style === 'aggressive' && 'Fast, takes more initiative'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Human-in-the-Loop Checkpoints Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6" id="hitl-settings">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Human-in-the-Loop Checkpoints</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure when human review is required before agent actions</p>
          </div>
          <button
            onClick={() => setHitlConfig({ ...hitlConfig, enabled: !hitlConfig.enabled })}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              hitlConfig.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            role="switch"
            aria-checked={hitlConfig.enabled}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                hitlConfig.enabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {hitlConfig.enabled && (
          <div className="space-y-6">
            {/* Checkpoint Toggles */}
            <div>
              <div className="font-medium mb-3">Review Checkpoints</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select which operations require human approval before execution</p>
              <div className="space-y-3">
                {[
                  { key: 'campaignLaunch', label: 'Campaign Launch', description: 'Require approval before launching any campaign' },
                  { key: 'budgetChanges', label: 'Budget Changes', description: 'Review budget modifications above threshold' },
                  { key: 'creativeApproval', label: 'Creative Approval', description: 'Review AI-generated creative assets' },
                  { key: 'audienceTargeting', label: 'Audience Targeting', description: 'Approve audience segment changes' },
                  { key: 'agentVoting', label: 'Agent Congress Voting', description: 'Review high-entropy voting decisions' },
                  { key: 'sopExecution', label: 'SOP Execution', description: 'Approve before executing standard operating procedures' }
                ].map((checkpoint) => (
                  <div key={checkpoint.key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{checkpoint.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{checkpoint.description}</div>
                    </div>
                    <button
                      onClick={() => setHitlConfig({
                        ...hitlConfig,
                        checkpoints: { ...hitlConfig.checkpoints, [checkpoint.key]: !hitlConfig.checkpoints[checkpoint.key] }
                      })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        hitlConfig.checkpoints[checkpoint.key] ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      role="switch"
                      aria-checked={hitlConfig.checkpoints[checkpoint.key]}
                      id={`checkpoint-${checkpoint.key}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                          hitlConfig.checkpoints[checkpoint.key] ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-Execute Threshold */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">Auto-Execute Confidence Threshold</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Automatically execute actions above this confidence level</div>
                </div>
                <span className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {Math.round(hitlConfig.autoExecuteThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={hitlConfig.autoExecuteThreshold}
                onChange={(e) => setHitlConfig({ ...hitlConfig, autoExecuteThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                id="auto-execute-threshold"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>50% (More reviews)</span>
                <span>100% (Fewer reviews)</span>
              </div>
            </div>

            {/* Budget Approval Threshold */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">Budget Approval Threshold</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Require approval for actions affecting budgets above this amount</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={hitlConfig.requireApprovalAbove}
                  onChange={(e) => setHitlConfig({ ...hitlConfig, requireApprovalAbove: parseInt(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="budget-approval-threshold"
                />
              </div>
            </div>

            {/* Notification on Red Flag */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-medium">Notify on Red Flags</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Send immediate notifications when agent encounters issues</div>
              </div>
              <button
                onClick={() => setHitlConfig({ ...hitlConfig, notifyOnRedFlag: !hitlConfig.notifyOnRedFlag })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  hitlConfig.notifyOnRedFlag ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                role="switch"
                aria-checked={hitlConfig.notifyOnRedFlag}
                id="notify-red-flag"
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    hitlConfig.notifyOnRedFlag ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Save HITL Settings Button */}
            <div className="pt-4">
              <button
                onClick={() => {
                  localStorage.setItem('ama_hitl_config', JSON.stringify(hitlConfig))
                  setSaved(true)
                  setTimeout(() => setSaved(false), 3000)
                }}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
                id="save-hitl-config"
              >
                Save Checkpoint Configuration
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Keyboard Shortcuts Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {showShortcuts ? 'Hide Shortcuts' : 'View All Shortcuts'}
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">?</kbd> anywhere to view keyboard shortcuts
        </p>

        {showShortcuts && (
          <div className="space-y-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx}>
                            <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono font-medium">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && <span className="mx-1 text-slate-400">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Provider Configuration Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6" id="ai-provider-config">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">AI Provider Configuration</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage AI models and default providers</p>
          </div>
          <button
            onClick={() => setShowAddModelModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            id="add-custom-model-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Model
          </button>
        </div>

        {/* Default Provider Selector */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Default Provider</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Select the default AI provider for generations</div>
            </div>
            <select
              value={defaultProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="default-provider-selector"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
        </div>

        {/* Model Library */}
        <div>
          <h3 className="font-medium mb-4">Model Library</h3>
          {modelsLoading ? (
            <div className="text-center py-8 text-slate-500">Loading models...</div>
          ) : aiModels.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No models configured</div>
          ) : (
            <div className="space-y-3" id="model-library-list">
              {aiModels.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    model.is_default === 1
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  } ${model.is_active === 0 ? 'opacity-50' : ''}`}
                  id={`model-card-${model.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-lg">{model.display_name}</span>
                        {model.is_default === 1 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                            Default
                          </span>
                        )}
                        {model.is_active === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-mono truncate">{model.model_string}</div>
                      {model.description && (
                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{model.description}</div>
                      )}
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          model.provider === 'anthropic'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`} id={`provider-badge-${model.id}`}>
                          {model.provider === 'anthropic' ? '🔶 Anthropic' : '🟢 OpenRouter'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {model.is_default !== 1 && (
                        <button
                          onClick={() => handleSetDefaultModel(model.id)}
                          className="px-3 py-1.5 text-sm border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          id={`set-default-btn-${model.id}`}
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleModelActive(model.id, model.is_active)}
                        className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          model.is_active === 1
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            : 'border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                        disabled={model.is_default === 1}
                        title={model.is_default === 1 ? 'Cannot deactivate default model' : ''}
                        id={`toggle-active-btn-${model.id}`}
                      >
                        {model.is_active === 1 ? 'Deactivate' : 'Activate'}
                      </button>
                      {model.is_default !== 1 && (
                        <button
                          onClick={() => setModelToDelete(model.id)}
                          className="px-3 py-1.5 text-sm border border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          id={`delete-btn-${model.id}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add Custom Model Modal */}
      {showAddModelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" id="add-model-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Add Custom Model</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Provider</label>
                <select
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="new-model-provider"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2">Model String</label>
                <input
                  type="text"
                  value={newModel.model_string}
                  onChange={(e) => setNewModel({ ...newModel, model_string: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., meta-llama/llama-3.1-70b"
                  id="new-model-string"
                />
                <p className="text-xs text-slate-500 mt-1">The model identifier used by the provider</p>
              </div>
              <div>
                <label className="block font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={newModel.display_name}
                  onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Llama 3.1 70B"
                  id="new-model-display-name"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the model"
                  rows={2}
                  id="new-model-description"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModelModal(false)
                  setNewModel({ model_string: '', provider: 'openrouter', display_name: '', description: '' })
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModel}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
                id="save-new-model-btn"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modelToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" id="delete-confirmation-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Delete Model?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this model? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModelToDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteModel}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                id="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Keys</h2>
        <div className="space-y-4">
          {/* Anthropic API Key */}
          <div>
            <label className="block font-medium mb-2">Anthropic API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
              />
              <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Verify
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required for AI agent functionality</p>
          </div>

          {/* Meta API Key */}
          <div>
            <label className="block font-medium mb-2">Meta Marketing API Key</label>
            <input
              type="password"
              value={apiKeys.meta}
              onChange={(e) => setApiKeys({ ...apiKeys, meta: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Meta API key"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - for Meta Ad integrations</p>
          </div>
        </div>
      </section>

      {/* Data & Backup Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data & Backup</h2>
        <div className="space-y-6">
          {/* Backup Data */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">System Backup</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Create a complete backup of your data including settings, clients, campaigns, and tasks
              </div>
            </div>
            <button
              onClick={handleBackupData}
              disabled={backupInProgress}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                backupInProgress
                  ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              {backupInProgress ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Backup Data</span>
                </>
              )}
            </button>
          </div>

          {backupComplete && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Backup completed successfully! Check your downloads folder.</span>
            </div>
          )}

          {/* Backup Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">What's included in the backup:</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Application settings and preferences
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Client information and brand profiles
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Campaign data and configurations
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tasks and project history
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-slate-500 dark:text-slate-400">API keys are redacted for security</span>
              </li>
            </ul>
          </div>

          {/* Restore Data */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-medium">Restore from Backup</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Import a previously created backup file
              </div>
            </div>
            <button
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Restore Backup</span>
            </button>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
