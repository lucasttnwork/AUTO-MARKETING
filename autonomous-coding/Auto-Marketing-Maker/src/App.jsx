import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ClientProvider, useClient } from './context/ClientContext'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Tasks from './pages/Tasks'
import Intel from './pages/Intel'
import Reports from './pages/Reports'
import Agents from './pages/Agents'
import Settings from './pages/Settings'
import Login from './pages/Login'
import useSwipeGesture from './hooks/useSwipeGesture'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  // Start collapsed on mobile (< 768px)
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // Super Agent task control state
  const [taskStatus, setTaskStatus] = useState(null) // null, 'running', 'paused', 'cancelled'
  const [pausedContent, setPausedContent] = useState('')
  const [cancelConfirmDialog, setCancelConfirmDialog] = useState(null)
  const abortControllerRef = useRef(null)
  const pauseRef = useRef(false)
  const currentMessageIndexRef = useRef(null)

  // Super Agent model selector state
  const [chatModels, setChatModels] = useState([])
  const [chatSelectedModel, setChatSelectedModel] = useState('default')

  // Function to announce messages to screen readers
  const announce = (message, priority = 'polite') => {
    setAnnouncement('')
    // Small delay to ensure screen readers pick up the change
    setTimeout(() => setAnnouncement(message), 100)
  }

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch available AI models for Super Agent chat
  useEffect(() => {
    const fetchChatModels = async () => {
      // Create AbortController for cancellation
                    const controller = new AbortController()
                    abortControllerRef.current = controller

                    try {
        const response = await fetch('http://localhost:3001/api/models')
        if (response.ok) {
          const models = await response.json()
          setChatModels(models.filter(m => m.is_active))
        }
      } catch (error) {
        console.error('Error fetching AI models for chat:', error)
      }
    }
    fetchChatModels()
  }, [])

  // Super Agent enhancements state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [redFlagModal, setRedFlagModal] = useState(null)
  const [explainMode, setExplainMode] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [chatDocked, setChatDocked] = useState(false)

  // Refs for focus management
  const commandPaletteInputRef = useRef(null)
  const confirmDialogRef = useRef(null)
  const lastFocusedElementRef = useRef(null)

  // Command palette commands
  const commands = [
    { id: 'create-campaign', name: 'Create New Campaign', icon: '🎯', category: 'Campaigns' },
    { id: 'add-client', name: 'Add New Client', icon: '👥', category: 'Clients' },
    { id: 'view-reports', name: 'View Reports', icon: '📊', category: 'Reports' },
    { id: 'market-research', name: 'Run Market Research', icon: '🔍', category: 'Intel' },
    { id: 'delete-campaign', name: 'Delete Campaign', icon: '🗑️', category: 'Campaigns', critical: true },
    { id: 'pause-all', name: 'Pause All Campaigns', icon: '⏸️', category: 'Campaigns', critical: true },
    { id: 'generate-report', name: 'Generate Weekly Report', icon: '📈', category: 'Reports' },
    { id: 'competitor-analysis', name: 'Competitor Analysis', icon: '🕵️', category: 'Intel' },
    { id: 'optimize-ads', name: 'Optimize Ad Creatives', icon: '✨', category: 'AI' },
    { id: 'explain-mode', name: 'Toggle Explain Mode', icon: '💡', category: 'Settings' },
  ]

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(commandFilter.toLowerCase()) ||
    cmd.category.toLowerCase().includes(commandFilter.toLowerCase())
  )

  // Handle command selection
  const executeCommand = useCallback((command) => {
    if (command.critical) {
      setConfirmDialog({
        title: `Confirm: ${command.name}`,
        message: `Are you sure you want to ${command.name.toLowerCase()}? This action may have significant impact.`,
        onConfirm: () => {
          setConfirmDialog(null)
          setCommandPaletteOpen(false)
          setMessages(prev => [...prev,
            { role: 'system', content: `Executing: ${command.name}...` }
          ])
        },
        onCancel: () => setConfirmDialog(null)
      })
    } else if (command.id === 'explain-mode') {
      setExplainMode(!explainMode)
      setCommandPaletteOpen(false)
    } else {
      setCommandPaletteOpen(false)
      if (explainMode) {
        setMessages(prev => [...prev,
          { role: 'assistant', content: `Let me explain how "${command.name}" works before executing:\n\n1. This command will ${command.category === 'Campaigns' ? 'work with your campaigns' : command.category === 'Reports' ? 'generate or view reports' : 'process your request'}\n2. It typically takes a few seconds to complete\n3. You'll see the results displayed in the relevant section\n\nReady to proceed? Type "yes" or "do it" to execute.` }
        ])
      } else {
        setMessages(prev => [...prev,
          { role: 'system', content: `Executing: ${command.name}...` }
        ])
      }
    }
  }, [explainMode])

  // Focus management for command palette
  useEffect(() => {
    if (commandPaletteOpen) {
      lastFocusedElementRef.current = document.activeElement
      // Focus the input after modal opens
      setTimeout(() => commandPaletteInputRef.current?.focus(), 0)
    } else if (lastFocusedElementRef.current && !confirmDialog) {
      // Return focus to the element that opened the modal
      lastFocusedElementRef.current.focus()
    }
  }, [commandPaletteOpen])

  // Focus management for confirmation dialog
  useEffect(() => {
    if (confirmDialog) {
      lastFocusedElementRef.current = document.activeElement
      setTimeout(() => confirmDialogRef.current?.focus(), 0)
    } else if (lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus()
    }
  }, [confirmDialog])

  // Focus trap function for modals
  const handleFocusTrap = (e, containerRef) => {
    if (!containerRef?.current) return
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  // Keyboard shortcut for command palette (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
        setCommandFilter('')
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setConfirmDialog(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Voice input handler
  const toggleVoiceInput = useCallback(() => {
    if (!voiceActive) {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => setVoiceActive(true)
        recognition.onend = () => setVoiceActive(false)
        recognition.onerror = () => setVoiceActive(false)
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInputMessage(transcript)
          setVoiceActive(false)
        }

        recognition.start()
      } else {
        alert('Voice input is not supported in this browser')
      }
    }
  }, [voiceActive])

  // Task control handlers for Super Agent
  const handlePauseTask = useCallback(() => {
    if (taskStatus === 'running') {
      pauseRef.current = true
      setTaskStatus('paused')
      // Save current content for resume
      if (currentMessageIndexRef.current !== null) {
        const currentContent = messages[currentMessageIndexRef.current]?.content || ''
        setPausedContent(currentContent)
      }
      announce('Task paused')
    }
  }, [taskStatus, messages])

  const handleResumeTask = useCallback(() => {
    if (taskStatus === 'paused') {
      pauseRef.current = false
      setTaskStatus('running')
      announce('Task resumed')
    }
  }, [taskStatus])

  const handleCancelTask = useCallback(() => {
    setCancelConfirmDialog({
      title: 'Cancel Task',
      message: 'Are you sure you want to cancel the current task? This action cannot be undone.',
      onConfirm: () => {
        // Abort the fetch request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        setTaskStatus('cancelled')
        setIsLoading(false)
        pauseRef.current = false
        // Update the message to show cancellation
        if (currentMessageIndexRef.current !== null) {
          setMessages(prev => {
            const newMessages = [...prev]
            const currentContent = newMessages[currentMessageIndexRef.current]?.content || ''
            newMessages[currentMessageIndexRef.current] = {
              role: 'assistant',
              content: currentContent + '\n\n⚠️ *Task cancelled by user*'
            }
            return newMessages
          })
        }
        setCancelConfirmDialog(null)
        announce('Task cancelled')
      },
      onCancel: () => setCancelConfirmDialog(null)
    })
  }, [])

  // Layout component that conditionally renders sidebar/header
  const AppLayout = ({ children }) => {
    const { selectedClient } = useClient()
    const location = useLocation()
    const isLoginPage = location.pathname === '/login'

    // Swipe gesture handling for mobile sidebar navigation
    const swipeGestures = useSwipeGesture({
      threshold: 50,
      timeout: 500,
      onSwipeRight: () => {
        // Open sidebar on swipe right (only on mobile)
        if (window.innerWidth < 768 && collapsed) {
          setCollapsed(false)
          announce('Sidebar opened')
        }
      },
      onSwipeLeft: () => {
        // Close sidebar on swipe left (only on mobile)
        if (window.innerWidth < 768 && !collapsed) {
          setCollapsed(true)
          announce('Sidebar closed')
        }
      },
      enabled: window.innerWidth < 768 // Only enable on mobile
    })

    if (isLoginPage) {
      return <div className="min-h-screen">{children}</div>
    }

    return (
      <>
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            const main = document.getElementById('main-content')
            main?.focus()
            main?.scrollIntoView()
            announce('Skipped to main content')
          }}
        >
          Skip to main content
        </a>
        <div
          className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors flex"
          onTouchStart={swipeGestures.onTouchStart}
          onTouchMove={swipeGestures.onTouchMove}
          onTouchEnd={swipeGestures.onTouchEnd}
        >
          {/* Sidebar */}
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} darkMode={darkMode} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <Header darkMode={darkMode} setDarkMode={setDarkMode} onMenuClick={() => setCollapsed(false)} />

            {/* Page Content */}
            <main id="main-content" className="flex-1 overflow-y-auto" role="main" tabIndex={-1} aria-label="Main content">
              {children}
            </main>
          </div>

          {/* Super Agent Floating Button */}
          <button
            onClick={() => {
              setChatOpen(!chatOpen)
              announce(chatOpen ? 'Super Agent chat closed' : 'Super Agent chat opened')
            }}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white text-2xl hover:scale-110 z-50"
            aria-label={chatOpen ? 'Close Super Agent Chat' : 'Open Super Agent Chat'}
            aria-expanded={chatOpen}
          >
            <span aria-hidden="true">{chatOpen ? '✕' : '🤖'}</span>
          </button>

          {/* Command Palette (Test #131) */}
          {commandPaletteOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center pt-[20vh]"
              onClick={() => setCommandPaletteOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="command-palette-title"
              onKeyDown={(e) => handleFocusTrap(e, commandPaletteInputRef)}
            >
              <div
                ref={commandPaletteInputRef}
                className="w-[32rem] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <label htmlFor="command-search" className="sr-only">Search commands</label>
                  <input
                    id="command-search"
                    type="text"
                    value={commandFilter}
                    onChange={(e) => setCommandFilter(e.target.value)}
                    placeholder="Type a command or search..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    autoFocus
                    aria-describedby="command-palette-hint"
                  />
                  <div id="command-palette-hint" className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>Press ↑↓ to navigate, Enter to select, Esc to close</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded" aria-hidden="true">⌘K</span>
                  </div>
                </div>
                <div className="max-h-[40vh] overflow-y-auto" role="listbox" aria-label="Available commands">
                  {filteredCommands.length === 0 ? (
                    <div className="p-8 text-center text-slate-500" role="status" aria-live="polite">No commands found</div>
                  ) : (
                    filteredCommands.map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
                        role="option"
                        aria-label={`${cmd.name} - ${cmd.category}${cmd.critical ? ' - Critical action' : ''}`}
                      >
                        <span className="text-2xl" aria-hidden="true">{cmd.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{cmd.name}</div>
                          <div className="text-xs text-slate-500">{cmd.category}</div>
                        </div>
                        {cmd.critical && (
                          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded" aria-hidden="true">Critical</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Red-Flag Resolution Modal (Test #137) */}
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
                          content: `✅ **Resolution Selected**\n\nYou selected Option ${idx + 1}: "${selected.text}"\n\n*Rationale:* ${selected.rationale}\n\nProceeding with this choice.`
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


          {/* Confirmation Dialog (Test #133) */}
          {confirmDialog && (
            <div
              className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-desc"
              onKeyDown={(e) => handleFocusTrap(e, confirmDialogRef)}
            >
              <div
                ref={confirmDialogRef}
                className="w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6"
                tabIndex={-1}
              >
                <h3 id="confirm-dialog-title" className="text-xl font-bold mb-2">{confirmDialog.title}</h3>
                <p id="confirm-dialog-desc" className="text-slate-600 dark:text-slate-400 mb-6">{confirmDialog.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={confirmDialog.onCancel}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Cancel action"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Confirm action"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Task Confirmation Dialog */}
          {cancelConfirmDialog && (
            <div
              className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-dialog-title"
              aria-describedby="cancel-dialog-desc"
            >
              <div className="w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 id="cancel-dialog-title" className="text-xl font-bold mb-2 flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  {cancelConfirmDialog.title}
                </h3>
                <p id="cancel-dialog-desc" className="text-slate-600 dark:text-slate-400 mb-6">{cancelConfirmDialog.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelConfirmDialog.onCancel}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Keep running"
                  >
                    Keep Running
                  </button>
                  <button
                    onClick={cancelConfirmDialog.onConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    aria-label="Cancel task"
                  >
                    Cancel Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Super Agent Chat Panel */}
          {chatOpen && (
            <div className={`fixed bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-40 overflow-hidden transition-all duration-300 ${
              chatDocked
                ? 'top-0 right-0 h-full w-96 rounded-none border-r-0 border-t-0 border-b-0'
                : chatMinimized
                  ? 'bottom-24 right-6 w-72 h-auto rounded-2xl animate-slide-in-up'
                  : 'bottom-24 right-6 w-96 h-[32rem] rounded-2xl animate-slide-in-up'
            }`}>
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => chatMinimized && setChatMinimized(false)}>
                    <h3 className="font-bold tracking-tight text-lg">Super Agent</h3>
                    {!chatMinimized && !chatDocked && (
                      <p className="text-xs text-blue-100 leading-relaxed hidden sm:block">Your AI marketing assistant</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {explainMode && !chatMinimized && (
                      <span className="px-2 py-1 text-xs bg-white/20 rounded">Explain Mode</span>
                    )}
                    {/* Dock/Undock Button - only show when not minimized */}
                    {!chatMinimized && (
                      <button
                        onClick={() => {
                          setChatDocked(!chatDocked)
                          announce(chatDocked ? 'Super Agent undocked' : 'Super Agent docked to right side')
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label={chatDocked ? 'Undock Super Agent' : 'Dock Super Agent to right side'}
                        title={chatDocked ? 'Undock (Float)' : 'Dock to Right'}
                      >
                        {chatDocked ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        )}
                      </button>
                    )}
                    {/* Minimize/Maximize Button - only show when not docked */}
                    {!chatDocked && (
                      <button
                        onClick={() => {
                          setChatMinimized(!chatMinimized)
                          announce(chatMinimized ? 'Super Agent maximized' : 'Super Agent minimized')
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label={chatMinimized ? 'Maximize Super Agent' : 'Minimize Super Agent'}
                        title={chatMinimized ? 'Maximize' : 'Minimize'}
                      >
                        {chatMinimized ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </button>
                    )}
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setChatOpen(false)
                        setChatMinimized(false)
                        setChatDocked(false)
                        announce('Super Agent chat closed')
                      }}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      aria-label="Close Super Agent"
                      title="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Minimized state indicator */}
                {chatMinimized && messages.length > 0 && (
                  <div className="mt-2 text-xs text-blue-100 truncate">
                    {messages[messages.length - 1]?.content?.substring(0, 40)}...
                  </div>
                )}
              </div>

              {/* Content Area - Hidden when minimized */}
              {!chatMinimized && (
                <>
                  {/* Context Indicator */}
                  {selectedClient && (
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {selectedClient.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                          {selectedClient.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Active Context
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Context loaded"></div>
                    </div>
                  )}

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-500 py-8">
                    <div className="text-4xl mb-3">👋</div>
                    <p className="text-sm">Hello! I'm your Super Agent.</p>
                    <p className="text-xs mt-1">Ask me anything about your marketing campaigns!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Control Buttons - shown when task is running or paused */}
                {(taskStatus === 'running' || taskStatus === 'paused') && (
                  <div className="flex justify-center gap-2 mt-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-2">
                      {taskStatus === 'running' ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Running
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Paused
                        </>
                      )}
                    </span>
                    {taskStatus === 'running' ? (
                      <button
                        type="button"
                        onClick={handlePauseTask}
                        className="px-3 py-1.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors flex items-center gap-1"
                        aria-label="Pause task"
                        title="Pause Task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResumeTask}
                        className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
                        aria-label="Resume task"
                        title="Resume Task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCancelTask}
                      className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                      aria-label="Cancel task"
                      title="Cancel Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                {/* Model Selector */}
                <div className="mb-3 flex items-center gap-2">
                  <label htmlFor="chat-model-selector" className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    AI Model:
                  </label>
                  <select
                    id="chat-model-selector"
                    value={chatSelectedModel}
                    onChange={(e) => setChatSelectedModel(e.target.value)}
                    className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="default">🎯 Default</option>
                    {chatModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.display_name} {model.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!inputMessage.trim() || isLoading) return

                    const userMessage = inputMessage.trim()
                    setInputMessage('')
                    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
                    setIsLoading(true)
                    setTaskStatus('running')
                    pauseRef.current = false

                    // Add placeholder message for streaming
                    const messageIndex = messages.length + 1
                    currentMessageIndexRef.current = messageIndex
                    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

                    // Determine which model to send
                    const modelToUse = chatSelectedModel === 'default' ? null : chatSelectedModel

                    // Create AbortController for cancellation
                    const controller = new AbortController()
                    abortControllerRef.current = controller

                    try {
                      const response = await fetch('http://localhost:3001/api/agent/chat/stream', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: userMessage, modelId: modelToUse }),
                        signal: controller.signal
                      })

                      const reader = response.body.getReader()
                      const decoder = new TextDecoder()

                      while (true) {
                        // Check for pause - wait while paused
                        while (pauseRef.current) {
                          await new Promise(resolve => setTimeout(resolve, 100))
                        }

                        const { done, value } = await reader.read()
                        if (done) break

                        const chunk = decoder.decode(value)
                        const lines = chunk.split('\n')

                        for (const line of lines) {
                          if (line.startsWith('data: ')) {
                            // Create AbortController for cancellation
                    const controller = new AbortController()
                    abortControllerRef.current = controller

                    try {
                              const data = JSON.parse(line.slice(6))

                              if (data.type === 'content') {
                                setMessages(prev => {
                                  const newMessages = [...prev]
                                  newMessages[messageIndex] = {
                                    role: 'assistant',
                                    content: (newMessages[messageIndex]?.content || '') + data.content
                                  }
                                  return newMessages
                                })
                              } else if (data.type === 'error') {
                                setMessages(prev => {
                                  const newMessages = [...prev]
                                  newMessages[messageIndex] = {
                                    role: 'assistant',
                                    content: 'Sorry, I encountered an error: ' + data.error
                                  }
                                  return newMessages
                                })
                              } else if (data.type === 'done' && data.isRedFlagged && data.makerVoting) {
                                // Show red-flag resolution modal for high entropy voting
                                setRedFlagModal({
                                  reason: data.makerVoting.redFlagReason,
                                  entropy: data.makerVoting.entropy,
                                  options: data.makerVoting.options || [],
                                  votes: data.makerVoting.votes || [],
                                  voteCounts: data.makerVoting.voteCounts || []
                                })
                              }
                            } catch (parseError) {
                              console.error('Error parsing SSE data:', parseError)
                            }
                          }
                        }
                      }
                    } catch (error) {
                      // Check if this was an intentional abort (cancellation)
                      if (error.name === 'AbortError') {
                        console.log('Task cancelled by user')
                      } else {
                        console.error('Stream error:', error)
                        setMessages(prev => {
                          const newMessages = [...prev]
                          newMessages[messageIndex] = {
                            role: 'assistant',
                            content: 'Sorry, I encountered an error. Please try again.'
                          }
                          return newMessages
                        })
                      }
                    } finally {
                      setIsLoading(false)
                      setTaskStatus(null)
                      abortControllerRef.current = null
                      currentMessageIndexRef.current = null
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  {/* Voice Input Toggle (Test #132) */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      voiceActive
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                    title={voiceActive ? 'Listening...' : 'Voice Input'}
                  >
                    🎤
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
                </>
              )}
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <BrowserRouter>
      <ClientProvider>
        <ToastProvider>
        <div className={darkMode ? 'dark' : ''}>
          {/* Screen Reader Announcements - Live Region */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {announcement}
          </div>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/campaigns/:id" element={<CampaignDetail />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/intel" element={<Intel />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </div>
        </ToastProvider>
      </ClientProvider>
    </BrowserRouter>
  )
}

export default App
