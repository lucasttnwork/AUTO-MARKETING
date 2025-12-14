import { useState, useEffect } from 'react'
import ProgressBar, { TaskProgressBar } from '../components/ProgressBar'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [clients, setClients] = useState([])
  const [campaigns, setCampaigns] = useState([])

  // SOP Management State
  const [sops, setSops] = useState([])
  const [selectedSop, setSelectedSop] = useState(null)
  const [showLearnModal, setShowLearnModal] = useState(false)
  const [newBestPractice, setNewBestPractice] = useState('')
  const [sopLoading, setSopLoading] = useState(false)
  const [sopUpdateResult, setSopUpdateResult] = useState(null)

  // Client-specific SOP Override State
  const [clientOverrides, setClientOverrides] = useState([])
  const [selectedClientForOverride, setSelectedClientForOverride] = useState(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideSteps, setOverrideSteps] = useState('')
  const [overrideDescription, setOverrideDescription] = useState('')
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [sopExecutionResult, setSopExecutionResult] = useState(null)
  const [executionHistory, setExecutionHistory] = useState([])
  const [activeExecution, setActiveExecution] = useState(null)
  const [showExecutionHistory, setShowExecutionHistory] = useState(false)

  const tabs = [
    { id: 'all', label: 'All Tasks', icon: '📋' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'in_progress', label: 'In Progress', icon: '🔄' },
    { id: 'completed', label: 'Completed', icon: '✅' },
    { id: 'red_flagged', label: 'Red Flagged', icon: '🚩' },
    { id: 'blocked', label: 'Blocked', icon: '🚫' },
    { id: 'sops', label: 'SOPs', icon: '📚' }
  ]

  useEffect(() => {
    fetchTasks()
    fetchClients()
    fetchCampaigns()
    fetchSops()

    // Set up SSE connection for real-time task updates
    const eventSource = new EventSource('http://localhost:3001/api/tasks/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'initial') {
          // Set initial tasks from SSE stream
          setTasks(data.tasks)
          setLoading(false)
        } else if (data.type === 'task_created') {
          // Add new task to the list
          setTasks(prev => [data.task, ...prev])
        } else if (data.type === 'task_started' || data.type === 'task_completed' || data.type === 'task_red_flagged') {
          // Update existing task
          setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t))
          // Update selected task if it's the one being updated
          if (selectedTask && selectedTask.id === data.task.id) {
            setSelectedTask(data.task)
          }
        } else if (data.type === 'task_deleted') {
          // Remove task from list
          setTasks(prev => prev.filter(t => t.id !== data.task.id))
          if (selectedTask && selectedTask.id === data.task.id) {
            setSelectedTask(null)
          }
        }
        // Ignore heartbeat and connected messages
      } catch (error) {
        console.error('SSE message parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // Fallback to polling if SSE fails
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [selectedTask])

  // Fetch client overrides when SOP is selected
  useEffect(() => {
    if (selectedSop && clients.length > 0) {
      fetchClientOverrides(selectedSop.id)
      setSopExecutionResult(null)
    }
  }, [selectedSop, clients])

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
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

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/campaigns')
      const data = await response.json()
      setCampaigns(data)
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    }
  }

  // Fetch SOPs
  const fetchSops = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sops')
      const data = await response.json()
      setSops(data)
    } catch (error) {
      console.error('Failed to fetch SOPs:', error)
    }
  }

  // Learn from best practice - auto-update SOP
  const handleLearnFromBestPractice = async () => {
    if (!selectedSop || !newBestPractice.trim()) return

    setSopLoading(true)
    setSopUpdateResult(null)

    try {
      const response = await fetch(`http://localhost:3001/api/sops/${selectedSop.id}/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          best_practice: newBestPractice.trim(),
          performance_data: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSopUpdateResult({
          success: true,
          message: result.message,
          previousVersion: result.previous_version,
          newVersion: result.new_version,
          auditLog: result.audit_log
        })
        // Refresh SOPs list
        await fetchSops()
        // Update selected SOP
        setSelectedSop(result)
        setNewBestPractice('')
      } else {
        const error = await response.json()
        setSopUpdateResult({
          success: false,
          message: error.message || 'Failed to update SOP'
        })
      }
    } catch (error) {
      console.error('Failed to learn from best practice:', error)
      setSopUpdateResult({
        success: false,
        message: 'Failed to connect to server'
      })
    } finally {
      setSopLoading(false)
    }
  }

  // Fetch client overrides and execution history for selected SOP
  useEffect(() => {
    if (selectedSop) {
      fetchExecutionHistory(selectedSop.id)
    }
  }, [selectedSop])

  // Fetch client overrides for selected SOP
  const fetchClientOverrides = async (sopId) => {
    if (!sopId) return
    try {
      // Fetch overrides for all clients for this SOP
      const allOverrides = []
      for (const client of clients) {
        const response = await fetch(`http://localhost:3001/api/clients/${client.id}/sop-overrides`)
        if (response.ok) {
          const data = await response.json()
          const sopOverride = data.find(o => o.sop_id === sopId)
          if (sopOverride) {
            allOverrides.push({ ...sopOverride, client_name: client.name })
          }
        }
      }
      setClientOverrides(allOverrides)
    } catch (error) {
      console.error('Failed to fetch client overrides:', error)
    }
  }

  // Create client-specific SOP override
  const handleCreateOverride = async () => {
    if (!selectedSop || !selectedClientForOverride || !overrideSteps.trim()) return

    setOverrideLoading(true)
    try {
      // Parse steps from textarea (one step per line)
      const stepsArray = overrideSteps.split('\n').filter(s => s.trim()).map((s, idx) => ({
        order: idx + 1,
        action: s.trim()
      }))

      const response = await fetch(`http://localhost:3001/api/clients/${selectedClientForOverride}/sop-overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sop_id: selectedSop.id,
          custom_steps: stepsArray,
          override_description: overrideDescription.trim() || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSopUpdateResult({
          success: true,
          message: `Client-specific override created successfully for ${clients.find(c => c.id == selectedClientForOverride)?.name || 'client'}`
        })
        setShowOverrideModal(false)
        setOverrideSteps('')
        setOverrideDescription('')
        setSelectedClientForOverride(null)
        await fetchClientOverrides(selectedSop.id)
      } else {
        const error = await response.json()
        setSopUpdateResult({
          success: false,
          message: error.error || 'Failed to create override'
        })
      }
    } catch (error) {
      console.error('Failed to create client override:', error)
      setSopUpdateResult({
        success: false,
        message: 'Failed to connect to server'
      })
    } finally {
      setOverrideLoading(false)
    }
  }

  // Execute SOP for a specific client (will use override if exists)
  const handleExecuteSopForClient = async (clientId) => {
    if (!selectedSop || !clientId) return

    setOverrideLoading(true)
    setSopExecutionResult(null)
    setActiveExecution(null)
    try {
      // Use tracked execution endpoint
      const response = await fetch(`http://localhost:3001/api/sops/${selectedSop.id}/execute-tracked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId })
      })

      if (response.ok) {
        const result = await response.json()
        setActiveExecution(result)
        setSopExecutionResult({
          success: true,
          ...result
        })
        // Start simulating step execution
        simulateStepExecution(result)
      } else {
        const error = await response.json()
        setSopExecutionResult({
          success: false,
          message: error.error || 'Execution failed'
        })
      }
    } catch (error) {
      console.error('Failed to execute SOP:', error)
      setSopExecutionResult({
        success: false,
        message: 'Failed to connect to server'
      })
    } finally {
      setOverrideLoading(false)
    }
  }

  // Simulate step execution with progress updates
  const simulateStepExecution = async (execution) => {
    if (!execution || !execution.steps || execution.steps.length === 0) return

    const steps = [...execution.steps]
    for (let i = 0; i < steps.length; i++) {
      // Mark step as in_progress
      await fetch(`http://localhost:3001/api/sop-executions/${execution.id}/steps/${i + 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      })

      steps[i] = { ...steps[i], status: 'in_progress', started_at: new Date().toISOString() }
      setActiveExecution(prev => ({ ...prev, steps: [...steps], completed_steps: i }))

      // Wait a moment to simulate processing
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mark step as completed
      const result = await fetch(`http://localhost:3001/api/sop-executions/${execution.id}/steps/${i + 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      const stepResult = await result.json()

      steps[i] = { ...steps[i], status: 'completed', completed_at: new Date().toISOString() }
      setActiveExecution(prev => ({
        ...prev,
        steps: [...steps],
        completed_steps: stepResult.completed_steps,
        status: stepResult.execution_complete ? 'completed' : 'in_progress'
      }))
    }

    // Refresh execution history
    fetchExecutionHistory(execution.sop_id)
  }

  // Fetch execution history for selected SOP
  const fetchExecutionHistory = async (sopId) => {
    if (!sopId) return
    try {
      const response = await fetch(`http://localhost:3001/api/sops/${sopId}/executions?limit=10`)
      if (response.ok) {
        const history = await response.json()
        setExecutionHistory(history)
      }
    } catch (error) {
      console.error('Failed to fetch execution history:', error)
    }
  }

  // Mark campaign result as best practice
  const handleMarkAsBestPractice = async (elementId) => {
    try {
      const response = await fetch('http://localhost:3001/api/performance/mark-best-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element_id: elementId })
      })

      if (response.ok) {
        alert('Marked as best practice!')
      }
    } catch (error) {
      console.error('Failed to mark as best practice:', error)
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/start`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchTasks()
        if (selectedTask && selectedTask.id === taskId) {
          const updated = await response.json()
          setSelectedTask(updated.task || updated)
        }
      }
    } catch (error) {
      console.error('Failed to start task:', error)
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ git_commit_sha: `task-${taskId}-${Date.now()}` })
      })
      if (response.ok) {
        await fetchTasks()
        if (selectedTask && selectedTask.id === taskId) {
          const updated = await response.json()
          setSelectedTask(updated.task || updated)
        }
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'red_flagged':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'blocked':
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'in_progress': return '🔄'
      case 'completed': return '✅'
      case 'red_flagged': return '🚩'
      case 'blocked': return '🚫'
      default: return '📋'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'creative':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'technical':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
      case 'strategic':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
      case 'optimization':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
    }
  }

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-red-600 dark:text-red-400'
    if (priority >= 5) return 'text-amber-600 dark:text-amber-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  const getPriorityLabel = (priority) => {
    if (priority >= 8) return 'High'
    if (priority >= 5) return 'Medium'
    return 'Low'
  }

  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'creator': return '🎨'
      case 'strategist': return '🧠'
      case 'critic': return '🔍'
      case 'spy': return '🕵️'
      case 'copywriter': return '✍️'
      case 'designer': return '🖼️'
      case 'videoscript': return '🎬'
      default: return '🤖'
    }
  }

  const getAgentName = (agent) => {
    if (!agent) return 'Unassigned'
    return agent.charAt(0).toUpperCase() + agent.slice(1) + ' Agent'
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  const getCampaignName = (campaignId) => {
    if (!campaignId) return null
    const campaign = campaigns.find(c => c.id === campaignId)
    return campaign ? campaign.name : 'Unknown Campaign'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTasks = activeTab === 'all'
    ? tasks
    : tasks.filter(task => task.status === activeTab)

  const getTabCount = (tabId) => {
    if (tabId === 'all') return tasks.length
    if (tabId === 'sops') return sops.length
    return tasks.filter(t => t.status === tabId).length
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-slate-400 dark:text-slate-500">Loading tasks...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Track and manage your task queue
        </p>
      </div>

      {/* Task Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-xl">⏳</div>
            <div>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Pending</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xl">🔄</div>
            <div>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">In Progress</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-xl">🚩</div>
            <div>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'red_flagged').length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Red Flagged</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {getTabCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {/* SOPs Tab Content */}
      {activeTab === 'sops' ? (
        <div className="space-y-6" id="sops-management-section">
          {/* SOP Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xl">📚</div>
                <div>
                  <div className="text-2xl font-bold">{sops.length}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total SOPs</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-xl">✅</div>
                <div>
                  <div className="text-2xl font-bold">{sops.filter(s => s.is_active).length}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Active SOPs</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-xl">🎓</div>
                <div>
                  <div className="text-2xl font-bold">{sops.reduce((acc, s) => acc + (s.steps?.filter(step => step.is_best_practice)?.length || 0), 0)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Best Practices Learned</div>
                </div>
              </div>
            </div>
          </div>

          {/* SOP Update Result Alert */}
          {sopUpdateResult && (
            <div className={`p-4 rounded-lg border ${
              sopUpdateResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`} id="sop-update-result">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sopUpdateResult.success ? '✅' : '❌'}</span>
                  <div>
                    <div className="font-medium">{sopUpdateResult.success ? 'SOP Updated Successfully!' : 'Update Failed'}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{sopUpdateResult.message}</div>
                    {sopUpdateResult.success && sopUpdateResult.auditLog && (
                      <div className="text-xs text-slate-500 mt-1" id="audit-log-entry">
                        Version {sopUpdateResult.previousVersion} → {sopUpdateResult.newVersion} | {sopUpdateResult.auditLog.change}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSopUpdateResult(null)}
                  className="text-slate-400 hover:text-slate-600"
                >✕</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOPs List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📚</span> Standard Operating Procedures
                <button
                  onClick={fetchSops}
                  className="ml-auto px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  🔄 Refresh
                </button>
              </h2>

              {sops.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">📄</div>
                  <p>No SOPs created yet</p>
                </div>
              ) : (
                <div className="space-y-3" id="sops-list">
                  {sops.map(sop => (
                    <div
                      key={sop.id}
                      onClick={() => setSelectedSop(sop)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSop?.id === sop.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      id={`sop-item-${sop.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{sop.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{sop.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded">{sop.category}</span>
                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded" id={`sop-version-${sop.id}`}>
                              v{sop.version}
                            </span>
                            <span className="text-xs text-slate-400">
                              {sop.steps?.length || 0} steps
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sop.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}>
                          {sop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SOP Details & Auto-Update */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🎓</span> Learn from Best Practices
              </h2>

              {!selectedSop ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">👈</div>
                  <p>Select an SOP to view details and add best practices</p>
                </div>
              ) : (
                <div className="space-y-4" id="sop-detail-panel">
                  {/* Selected SOP Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">{selectedSop.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{selectedSop.description}</p>

                    {/* Current Steps */}
                    <h4 className="font-medium text-sm text-slate-500 mb-2">Current Steps:</h4>
                    <ul className="space-y-2 mb-4" id="sop-steps-list">
                      {selectedSop.steps?.map((step, idx) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm p-2 rounded ${
                          step.is_best_practice
                            ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                            : 'bg-white dark:bg-slate-800'
                        }`}>
                          <span className="text-slate-400 font-mono">{step.order || idx + 1}.</span>
                          <span className="flex-1">{step.action || step}</span>
                          {step.is_best_practice && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                              ⭐ Best Practice
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Add Best Practice Form */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <span>🚀</span> Auto-Update: Add Best Practice
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Enter a successful campaign strategy or technique to add to this SOP. The SOP will be automatically updated with version control.
                    </p>
                    <textarea
                      value={newBestPractice}
                      onChange={(e) => setNewBestPractice(e.target.value)}
                      placeholder="e.g., 'Always include urgency element in abandoned cart emails - increases recovery by 25%'"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
                      rows={3}
                      id="best-practice-input"
                    />
                    <button
                      onClick={handleLearnFromBestPractice}
                      disabled={sopLoading || !newBestPractice.trim()}
                      className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      id="trigger-sop-auto-update-btn"
                    >
                      {sopLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Updating SOP...
                        </>
                      ) : (
                        <>
                          <span>🎓</span> Learn & Update SOP
                        </>
                      )}
                    </button>
                  </div>

                  {/* Version History Info */}
                  <div className="text-xs text-slate-400 mt-4 flex items-center justify-between">
                    <span>Current Version: v{selectedSop.version}</span>
                    <span>Last Updated: {selectedSop.updated_at ? new Date(selectedSop.updated_at).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  {/* Client-Specific Overrides Section */}
                  <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4" id="client-sop-overrides-section">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span>🎯</span> Client-Specific Overrides
                      </h4>
                      <button
                        onClick={() => setShowOverrideModal(true)}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        id="create-client-override-btn"
                      >
                        + Create Override
                      </button>
                    </div>

                    {/* List of existing overrides */}
                    {clientOverrides.length > 0 ? (
                      <div className="space-y-2 mb-4" id="client-overrides-list">
                        {clientOverrides.map(override => (
                          <div
                            key={override.id}
                            className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-blue-800 dark:text-blue-300">
                                {override.client_name}
                              </span>
                              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                v{override.version} • {override.custom_steps?.length || 0} steps
                              </span>
                            </div>
                            {override.override_description && (
                              <p className="text-xs text-slate-500 mt-1">{override.override_description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mb-4">No client-specific overrides yet. All clients use the global SOP.</p>
                    )}

                    {/* Execute SOP for Client */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                      <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <span>▶️</span> Execute SOP for Client
                      </h4>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                          id="execute-sop-client-select"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) handleExecuteSopForClient(parseInt(e.target.value))
                          }}
                        >
                          <option value="">Select a client...</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.name} {clientOverrides.find(o => o.client_id === client.id) ? '(has override)' : '(global SOP)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Active Execution Progress */}
                      {activeExecution && (
                        <div className="mt-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" id="sop-execution-progress">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                              <span>{activeExecution.status === 'completed' ? '✅' : '⏳'}</span>
                              Execution Progress
                            </h5>
                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                              {activeExecution.completed_steps}/{activeExecution.total_steps} steps
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-3">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${(activeExecution.completed_steps / activeExecution.total_steps) * 100}%` }}
                            />
                          </div>

                          {/* Steps List */}
                          <div className="space-y-2" id="execution-steps-list">
                            {activeExecution.steps?.map((step, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 p-2 rounded text-xs ${
                                  step.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                                  step.status === 'in_progress' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                                  'bg-slate-50 dark:bg-slate-800'
                                }`}
                                id={`execution-step-${idx + 1}`}
                              >
                                <span className="w-5 h-5 flex items-center justify-center">
                                  {step.status === 'completed' ? '✅' :
                                   step.status === 'in_progress' ? '🔄' :
                                   step.status === 'failed' ? '❌' :
                                   '⏸️'}
                                </span>
                                <span className="flex-1 font-medium">{step.step_action || step.action}</span>
                                {step.completed_at && (
                                  <span className="text-slate-400">
                                    {new Date(step.completed_at).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Execution Info */}
                          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                            <span>
                              {activeExecution.using_override
                                ? `Using client override (v${activeExecution.override_version})`
                                : `Using global SOP (v${activeExecution.global_sop_version})`
                              }
                            </span>
                            <span>Started: {new Date(activeExecution.started_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Execution History */}
                      {executionHistory.length > 0 && (
                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                          <button
                            onClick={() => setShowExecutionHistory(!showExecutionHistory)}
                            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                            id="toggle-execution-history"
                          >
                            <span className="flex items-center gap-2">
                              <span>📜</span> Execution History ({executionHistory.length})
                            </span>
                            <span>{showExecutionHistory ? '▼' : '▶'}</span>
                          </button>

                          {showExecutionHistory && (
                            <div className="mt-3 space-y-2" id="execution-history-list">
                              {executionHistory.map(exec => (
                                <div
                                  key={exec.id}
                                  className={`p-2 rounded text-xs border ${
                                    exec.status === 'completed'
                                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                                      : exec.status === 'failed'
                                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {exec.status === 'completed' ? '✅' : exec.status === 'failed' ? '❌' : '⏳'}
                                      {' '}{exec.client_name || 'No client'} - {exec.completed_steps}/{exec.total_steps} steps
                                    </span>
                                    <span className="text-slate-400">
                                      {new Date(exec.started_at).toLocaleDateString()} {new Date(exec.started_at).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Legacy Execution Result (fallback) */}
                      {sopExecutionResult && !activeExecution && (
                        <div className={`mt-3 p-3 rounded-lg ${
                          sopExecutionResult.success
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`} id="sop-execution-result">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{sopExecutionResult.success ? '✅' : '❌'}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {sopExecutionResult.success ? sopExecutionResult.message : 'Execution Failed'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Client Override Modal */}
          {showOverrideModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" id="create-override-modal">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">Create Client-Specific Override</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Create custom steps for this SOP that will be used instead of the global SOP when executing for the selected client.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Client</label>
                    <select
                      value={selectedClientForOverride || ''}
                      onChange={(e) => setSelectedClientForOverride(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      id="override-client-select"
                    >
                      <option value="">Select a client...</option>
                      {clients.filter(c => !clientOverrides.find(o => o.client_id === c.id)).map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Steps (one per line)</label>
                    <textarea
                      value={overrideSteps}
                      onChange={(e) => setOverrideSteps(e.target.value)}
                      placeholder="Step 1: Custom action for this client&#10;Step 2: Another custom step&#10;Step 3: Final step"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
                      rows={5}
                      id="override-steps-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description (optional)</label>
                    <input
                      type="text"
                      value={overrideDescription}
                      onChange={(e) => setOverrideDescription(e.target.value)}
                      placeholder="Why this client needs custom steps..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      id="override-description-input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowOverrideModal(false)
                      setOverrideSteps('')
                      setOverrideDescription('')
                      setSelectedClientForOverride(null)
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOverride}
                    disabled={overrideLoading || !selectedClientForOverride || !overrideSteps.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    id="save-override-btn"
                  >
                    {overrideLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Override'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            {activeTab === 'all' ? 'No tasks yet' : `No ${activeTab.replace('_', ' ')} tasks`}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Tasks will appear here when campaigns are created
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                        {task.description}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          {getClientName(task.client_id)}
                        </span>
                        {getCampaignName(task.campaign_id) && (
                          <>
                            <span className="text-slate-400 dark:text-slate-500">•</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {getCampaignName(task.campaign_id)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar for In-Progress Tasks */}
                  {task.status === 'in_progress' && (
                    <div className="mt-3">
                      <ProgressBar
                        progress={task.progress || 0}
                        indeterminate={!task.progress || task.progress === 0}
                        color="blue"
                        size="md"
                        showPercentage={task.progress > 0}
                        animated
                        label={task.progress > 0 ? `Processing: ${task.progress}%` : 'Processing...'}
                      />
                    </div>
                  )}

                  {/* Completed Task Progress */}
                  {task.status === 'completed' && (
                    <div className="mt-3">
                      <ProgressBar
                        progress={100}
                        color="green"
                        size="sm"
                        showPercentage
                        label="Completed"
                      />
                    </div>
                  )}

                  {/* Task Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {/* Type Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(task.type)}`}>
                      {task.type}
                    </span>

                    {/* Priority */}
                    <div className={`flex items-center gap-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      <span>⚡</span>
                      <span>Priority: {task.priority} ({getPriorityLabel(task.priority)})</span>
                    </div>

                    {/* Assigned Agent */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>{getAgentIcon(task.assigned_agent)}</span>
                      <span>{getAgentName(task.assigned_agent)}</span>
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                      <span>🕐</span>
                      <span>Created: {formatDate(task.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getStatusColor(selectedTask.status)}`}>
                    {getStatusIcon(selectedTask.status)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Task Details</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Task #{selectedTask.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold tracking-tight mb-2">{selectedTask.description}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedTask.type)}`}>
                    {selectedTask.type}
                  </span>
                </div>
              </div>

              {/* Progress Section for In-Progress Tasks */}
              {selectedTask.status === 'in_progress' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <span className="animate-spin">🔄</span>
                    Task In Progress
                  </h4>
                  <ProgressBar
                    progress={selectedTask.progress || 0}
                    indeterminate={!selectedTask.progress || selectedTask.progress === 0}
                    color="blue"
                    size="lg"
                    showPercentage={selectedTask.progress > 0}
                    animated
                    label={selectedTask.progress > 0 ? 'Processing...' : 'Waiting for agent response...'}
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    The agent is currently working on this task. Progress will update automatically.
                  </p>
                </div>
              )}

              {/* Completed Progress */}
              {selectedTask.status === 'completed' && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                    <span>✅</span>
                    Task Completed
                  </h4>
                  <ProgressBar
                    progress={100}
                    color="green"
                    size="lg"
                    showPercentage
                    label="Finished"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Client</div>
                  <div className="font-medium">{getClientName(selectedTask.client_id)}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Campaign</div>
                  <div className="font-medium">{getCampaignName(selectedTask.campaign_id) || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Priority</div>
                  <div className={`font-medium flex items-center gap-2 ${getPriorityColor(selectedTask.priority)}`}>
                    <span>⚡ {selectedTask.priority}</span>
                    <span className="text-xs">({getPriorityLabel(selectedTask.priority)})</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned Agent</div>
                  <div className="font-medium flex items-center gap-2">
                    <span>{getAgentIcon(selectedTask.assigned_agent)}</span>
                    <span>{getAgentName(selectedTask.assigned_agent)}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-3">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Created</span>
                    <span className="font-medium">{formatDate(selectedTask.created_at)}</span>
                  </div>
                  {selectedTask.started_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Started</span>
                      <span className="font-medium">{formatDate(selectedTask.started_at)}</span>
                    </div>
                  )}
                  {selectedTask.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Completed</span>
                      <span className="font-medium">{formatDate(selectedTask.completed_at)}</span>
                    </div>
                  )}
                  {selectedTask.git_commit_sha && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Git Commit</span>
                      <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                        {selectedTask.git_commit_sha.substring(0, 12)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
                {selectedTask.status === 'pending' && (
                  <button
                    onClick={() => handleStartTask(selectedTask.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start Task
                  </button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteTask(selectedTask.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                {selectedTask.status === 'red_flagged' && (
                  <button
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Resolve Red Flag
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
