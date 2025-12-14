import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header({ darkMode, setDarkMode, onMenuClick, onNewClient, onNewCampaign }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const notificationRef = useRef(null)

  // Global search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ clients: [], campaigns: [], tasks: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const navigate = useNavigate()

  // Quick actions dropdown state
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const quickActionsRef = useRef(null)

  // User profile menu state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setQuickActionsOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    if (notificationsOpen || searchOpen || quickActionsOpen || profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen, searchOpen, quickActionsOpen, profileMenuOpen])

  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Keyboard shortcut for search (Ctrl/Cmd + /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/notifications?userId=1')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ clients: [], campaigns: [], tasks: [] })
      return
    }

    setSearchLoading(true)
    try {
      // Search clients, campaigns, and tasks in parallel
      const [clientsRes, campaignsRes, tasksRes] = await Promise.all([
        fetch(`http://localhost:3001/api/clients?search=${encodeURIComponent(query)}`),
        fetch(`http://localhost:3001/api/campaigns?search=${encodeURIComponent(query)}`),
        fetch(`http://localhost:3001/api/tasks?search=${encodeURIComponent(query)}`)
      ])

      const [clientsData, campaignsData, tasksData] = await Promise.all([
        clientsRes.json(),
        campaignsRes.json(),
        tasksRes.json()
      ])

      // Filter results client-side if API doesn't support search param
      const filterByQuery = (items, fields) => {
        const lowerQuery = query.toLowerCase()
        return (items || []).filter(item =>
          fields.some(field =>
            item[field] && item[field].toLowerCase().includes(lowerQuery)
          )
        ).slice(0, 5) // Limit to 5 results per category
      }

      setSearchResults({
        clients: filterByQuery(clientsData.clients || clientsData, ['name', 'website_url']),
        campaigns: filterByQuery(campaignsData.campaigns || campaignsData, ['name', 'angle']),
        tasks: filterByQuery(tasksData.tasks || tasksData, ['description', 'type'])
      })
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults({ clients: [], campaigns: [], tasks: [] })
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery)
      } else {
        setSearchResults({ clients: [], campaigns: [], tasks: [] })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  const handleResultClick = (type, item) => {
    setSearchOpen(false)
    setSearchQuery('')

    switch (type) {
      case 'client':
        navigate(`/clients`)
        break
      case 'campaign':
        navigate(`/campaigns`)
        break
      case 'task':
        navigate(`/tasks`)
        break
    }
  }

  const totalResults = searchResults.clients.length + searchResults.campaigns.length + searchResults.tasks.length

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}/read`, { method: 'PUT' })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const dismissNotification = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}`, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('http://localhost:3001/api/notifications/read-all?userId=1', { method: 'PUT' })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'red_flag':
        return '🚩'
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      case 'task':
        return '📋'
      default:
        return '🔔'
    }
  }

  const getNotificationStyle = (type, isRead) => {
    const baseStyle = isRead
      ? 'bg-white dark:bg-slate-800'
      : 'bg-blue-50 dark:bg-slate-700/50'

    switch (type) {
      case 'red_flag':
        return `${baseStyle} border-l-4 border-red-500`
      case 'success':
        return `${baseStyle} border-l-4 border-green-500`
      case 'warning':
        return `${baseStyle} border-l-4 border-amber-500`
      default:
        return `${baseStyle} border-l-4 border-blue-500`
    }
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'just now'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Quick action handlers
  const handleNewClient = () => {
    setQuickActionsOpen(false)
    if (onNewClient) {
      onNewClient()
    } else {
      navigate('/clients')
      // Trigger add client modal event after navigation
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openAddClientModal'))
      }, 100)
    }
  }

  const handleNewCampaign = () => {
    setQuickActionsOpen(false)
    if (onNewCampaign) {
      onNewCampaign()
    } else {
      navigate('/campaigns')
      // Trigger add campaign modal event after navigation
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openAddCampaignModal'))
      }, 100)
    }
  }

  // Logout handler
  const handleLogout = () => {
    setProfileMenuOpen(false)
    // Clear session storage
    sessionStorage.clear()
    localStorage.removeItem('ama_session')
    localStorage.removeItem('ama_user')
    // Navigate to login
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-6" role="banner">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger menu */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">AMA Platform</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hidden sm:flex items-center gap-2"
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:inline">
              Search...
            </span>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
              ⌘/
            </kbd>
          </button>

          {/* Search Dropdown */}
          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              {/* Search Input */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clients, campaigns, tasks..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search query"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-[24rem] overflow-y-auto">
                {!searchQuery ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">Start typing to search...</p>
                    <p className="text-xs mt-1">Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> to close</p>
                  </div>
                ) : searchLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Searching...</p>
                  </div>
                ) : totalResults === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <>
                    {/* Clients Section */}
                    {searchResults.clients.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Clients
                        </div>
                        {searchResults.clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => handleResultClick('client', client)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                          >
                            <span className="text-xl">👤</span>
                            <div>
                              <div className="font-medium text-sm">{client.name}</div>
                              {client.website_url && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">{client.website_url}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Campaigns Section */}
                    {searchResults.campaigns.length > 0 && (
                      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Campaigns
                        </div>
                        {searchResults.campaigns.map((campaign) => (
                          <button
                            key={campaign.id}
                            onClick={() => handleResultClick('campaign', campaign)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                          >
                            <span className="text-xl">🎯</span>
                            <div>
                              <div className="font-medium text-sm">{campaign.name}</div>
                              {campaign.angle && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">{campaign.angle}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tasks Section */}
                    {searchResults.tasks.length > 0 && (
                      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Tasks
                        </div>
                        {searchResults.tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleResultClick('task', task)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                          >
                            <span className="text-xl">📋</span>
                            <div>
                              <div className="font-medium text-sm">{task.description?.substring(0, 50) || task.type}</div>
                              {task.status && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">{task.status}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 max-h-[32rem] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[24rem] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">🔔</div>
                    <p className="text-slate-500 dark:text-slate-400">No notifications</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${getNotificationStyle(notification.type, notification.is_read)}`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id)
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium ${notification.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                dismissNotification(notification.id)
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              aria-label="Dismiss notification"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_label && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                {notification.action_label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-center">
                  <button
                    onClick={() => window.location.href = '/tasks'}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions Dropdown */}
        <div className="relative" ref={quickActionsRef}>
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Quick actions"
            aria-expanded={quickActionsOpen}
            aria-haspopup="true"
            data-testid="quick-actions-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium hidden md:inline">New</span>
          </button>

          {/* Quick Actions Dropdown Menu */}
          {quickActionsOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-2">
                <button
                  onClick={handleNewClient}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  data-testid="new-client-button"
                >
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-medium text-sm">New Client</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Onboard a new client</div>
                  </div>
                </button>

                <button
                  onClick={handleNewCampaign}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  data-testid="new-campaign-button"
                >
                  <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-medium text-sm">New Campaign</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Create a marketing campaign</div>
                  </div>
                </button>

                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

                <button
                  onClick={() => {
                    setQuickActionsOpen(false)
                    navigate('/tasks')
                    setTimeout(() => window.dispatchEvent(new CustomEvent('openAddTaskModal')), 100)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  data-testid="new-task-button"
                >
                  <span className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-medium text-sm">New Task</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Add a task to queue</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={darkMode}
        >
          <span aria-hidden="true">{darkMode ? '☀️ Light' : '🌙 Dark'}</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="User profile menu"
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
            data-testid="user-profile-button"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              {/* User Info */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    U
                  </div>
                  <div>
                    <div className="font-medium">User</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">user@ama.com</div>
                  </div>
                </div>
              </div>

              {/* Menu Options */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  data-testid="settings-menu-item"
                >
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Settings</span>
                </button>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm">Profile</span>
                </button>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    window.open('https://docs.ama-platform.com', '_blank')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Help & Documentation</span>
                </button>

                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-400"
                  data-testid="logout-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
