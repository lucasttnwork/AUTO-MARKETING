import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useClient } from '../context/ClientContext'

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: '📊', description: 'View marketing overview and metrics' },
  { path: '/clients', label: 'Clients', icon: '👥', description: 'Manage your client portfolio' },
  { path: '/campaigns', label: 'Campaigns', icon: '🎯', description: 'Create and manage campaigns' },
  { path: '/tasks', label: 'Tasks', icon: '✓', description: 'View task queue and progress', badgeKey: 'tasks' },
  { path: '/intel', label: 'Intel', icon: '🔍', description: 'Market intelligence and research' },
  { path: '/agents', label: 'Agents', icon: '🤖', description: 'AI-powered content generation agents' },
  { path: '/reports', label: 'Reports', icon: '📈', description: 'Generate and view reports' },
]

const MIN_WIDTH = 200
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 256 // w-64 = 16rem = 256px

export default function Sidebar({ collapsed, setCollapsed, darkMode }) {
  const location = useLocation()
  const { selectedClient, selectClient, clients, loading } = useClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Badge counts state
  const [redFlagCount, setRedFlagCount] = useState(0)
  const [activeTaskCount, setActiveTaskCount] = useState(0)

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth')
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)

  // Fetch badge counts (red flags and active tasks)
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        // Fetch red flag count
        const redFlagResponse = await fetch('http://localhost:3001/api/agents/voting-sessions?is_red_flagged=true')
        if (redFlagResponse.ok) {
          const sessions = await redFlagResponse.json()
          // Count only unresolved red flags
          const unresolvedCount = sessions.filter(s => !s.resolved_at).length
          setRedFlagCount(unresolvedCount)
        }

        // Fetch active/in-progress task count
        const tasksResponse = await fetch('http://localhost:3001/api/tasks?status=in_progress')
        if (tasksResponse.ok) {
          const tasks = await tasksResponse.json()
          setActiveTaskCount(tasks.length)
        }
      } catch (error) {
        console.error('Failed to fetch badge counts:', error)
      }
    }

    // Initial fetch
    fetchBadgeCounts()

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchBadgeCounts, 30000)

    return () => clearInterval(interval)
  }, [])

  // Save width to localStorage when it changes
  useEffect(() => {
    if (!collapsed) {
      localStorage.setItem('sidebarWidth', sidebarWidth.toString())
    }
  }, [sidebarWidth, collapsed])

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return

    const newWidth = e.clientX
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth)
    }
  }, [isResizing])

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Start resizing
  const startResize = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      <aside
        ref={sidebarRef}
        style={{ width: collapsed ? '5rem' : `${sidebarWidth}px` }}
        className={`${
          collapsed ? '-translate-x-full md:translate-x-0' : ''
        } fixed md:relative z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 flex flex-col`}
      >
        {/* Resize Handle */}
        {!collapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-blue-500 transition-colors z-50"
            onMouseDown={startResize}
            id="sidebar-resize-handle"
          >
            {/* Visual indicator on hover */}
            <div className="absolute inset-y-0 -right-1 w-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      {/* Logo Area */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold text-lg">AMA</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold">A</span>
          </div>
        )}
      </div>

      {/* Client Quick-Switch Dropdown */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
              id="client-dropdown-button"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🏢</span>
                <div className="flex-1 min-w-0 text-left">
                  {loading ? (
                    <span className="text-sm text-slate-500">Loading...</span>
                  ) : selectedClient ? (
                    <>
                      <p className="text-sm font-medium truncate">{selectedClient.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Active Client</p>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">Select a client</span>
                  )}
                </div>
              </div>
              <span className={`text-sm transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {clients.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                    No clients available
                  </div>
                ) : (
                  clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        selectClient(client)
                        setDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                        selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      id={`client-option-${client.id}`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        {client.website_url && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.website_url}</p>
                        )}
                      </div>
                      {selectedClient?.id === client.id && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 py-4" role="navigation" aria-label="Main navigation">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path
          // Get badge counts based on badgeKey
          const showTaskBadges = item.badgeKey === 'tasks'
          const totalBadgeCount = showTaskBadges ? (activeTaskCount + redFlagCount) : 0
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={collapsed ? item.label : ''}
              aria-label={collapsed ? `${item.label}: ${item.description}${activeTaskCount > 0 ? `, ${activeTaskCount} active tasks` : ''}${redFlagCount > 0 ? `, ${redFlagCount} red flags` : ''}` : undefined}
              aria-describedby={!collapsed ? `nav-desc-${index}` : undefined}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
            >
              <span className="text-xl relative" aria-hidden="true">
                {item.icon}
                {/* Badges for collapsed state */}
                {collapsed && showTaskBadges && totalBadgeCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] ${redFlagCount > 0 ? 'bg-red-500' : 'bg-blue-500'} text-white text-xs font-bold rounded-full flex items-center justify-center px-1 ${redFlagCount > 0 ? 'animate-pulse' : ''}`}
                    id={`task-badge-collapsed-${index}`}
                  >
                    {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
                  </span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="font-medium flex-1">{item.label}</span>
                  {/* Task badges for expanded state - show both active tasks and red flags */}
                  {showTaskBadges && (
                    <div className="flex items-center gap-1">
                      {/* Active task badge (blue) */}
                      {activeTaskCount > 0 && (
                        <span
                          className="min-w-[20px] h-[20px] bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5"
                          id={`active-task-badge-${index}`}
                          aria-label={`${activeTaskCount} active tasks`}
                          title={`${activeTaskCount} active task${activeTaskCount !== 1 ? 's' : ''}`}
                        >
                          {activeTaskCount > 99 ? '99+' : activeTaskCount}
                        </span>
                      )}
                      {/* Red flag badge */}
                      {redFlagCount > 0 && (
                        <span
                          className="min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse"
                          id={`red-flag-badge-${index}`}
                          aria-label={`${redFlagCount} unresolved red flags`}
                          title={`${redFlagCount} red flag${redFlagCount !== 1 ? 's' : ''}`}
                        >
                          {redFlagCount > 99 ? '99+' : redFlagCount}
                        </span>
                      )}
                    </div>
                  )}
                  <span id={`nav-desc-${index}`} className="sr-only">{item.description}</span>
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          aria-expanded={!collapsed}
        >
          <span className="text-lg" aria-hidden="true">{collapsed ? '→' : '←'}</span>
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">user@ama.com</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mx-auto">
            U
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
