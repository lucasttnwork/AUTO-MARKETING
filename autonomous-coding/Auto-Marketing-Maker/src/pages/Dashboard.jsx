import { useState, useEffect, useRef } from 'react'
import { SkeletonMetricCard, SkeletonActivityItem, Skeleton } from '../components/Skeleton'
import ProgressBar from '../components/ProgressBar'

export default function Dashboard() {
  const [stats, setStats] = useState({
    clientCount: 0,
    campaignCount: 0,
    activeTasks: 0,
    completedTasks: 0
  })
  const [agentActivities, setAgentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [trendsData, setTrendsData] = useState(null)
  const [trendsLoading, setTrendsLoading] = useState(true)

  // Ref for activity feed scroll container
  const activityFeedRef = useRef(null)
  const lastActivityIdRef = useRef(null)

  useEffect(() => {
    // Fetch dashboard stats
    fetch('http://localhost:3001/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Fetch performance trends
    fetch('http://localhost:3001/api/dashboard/trends?days=7')
      .then(res => res.json())
      .then(data => {
        setTrendsData(data)
        setTrendsLoading(false)
      })
      .catch(() => {
        setTrendsLoading(false)
      })

    // Set up SSE connection for real-time agent activity updates
    const eventSource = new EventSource('http://localhost:3001/api/agents/activity-stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'initial') {
          // Set initial activities from SSE stream
          setAgentActivities(data.activities || [])
          setActivitiesLoading(false)
          // Track the last activity ID
          if (data.activities && data.activities.length > 0) {
            lastActivityIdRef.current = data.activities[0].id
          }
        } else if (data.type === 'agent_completed' || data.type === 'agent_started') {
          // Add new activity to the top of the list (keep only 5)
          setAgentActivities(prev => [data.activity, ...prev].slice(0, 5))
          // Track the new activity ID and scroll to top smoothly
          lastActivityIdRef.current = data.activity.id
          // Smooth scroll to show new activity
          setTimeout(() => {
            if (activityFeedRef.current) {
              activityFeedRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
            }
          }, 100)
        }
        // Ignore heartbeat and connected messages
      } catch (error) {
        console.error('Agent activity SSE parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Agent activity SSE error:', error)
      // Fallback to REST API if SSE fails
      eventSource.close()
      fetch('http://localhost:3001/api/agents/activity-feed?limit=5')
        .then(res => res.json())
        .then(data => {
          setAgentActivities(data.activities || [])
          setActivitiesLoading(false)
        })
        .catch(() => {
          setActivitiesLoading(false)
        })
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [])

  // Format time ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'just now'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Get icon for agent type
  const getAgentIcon = (agentType) => {
    const icons = {
      strategist: '🎯',
      creator: '🎨',
      critic: '📝',
      spy: '🔍',
      super: '🤖'
    }
    return icons[agentType] || '🤖'
  }

  // Get description for agent activity
  const getActivityDescription = (activity) => {
    const agentNames = {
      strategist: 'Strategist Agent',
      creator: 'Creator Agent',
      critic: 'Critic Agent',
      spy: 'Spy Agent',
      super: 'Super Agent'
    }
    const name = agentNames[activity.agent_type] || 'Agent'
    const status = activity.status === 'completed' ? 'completed task' : 'execution failed'
    return `${name} ${status}`
  }

  // Get task description from activity
  const getTaskDescription = (activity) => {
    if (activity.task_description) return activity.task_description
    if (activity.input_data?.prompt) return activity.input_data.prompt.slice(0, 50) + (activity.input_data.prompt.length > 50 ? '...' : '')
    return 'Processed request'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Overview of your marketing operations
        </p>
      </div>

      {/* Metric Cards */}
      <section aria-labelledby="metrics-heading" className="mb-8">
        <h2 id="metrics-heading" className="sr-only">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            <MetricCard
              icon="👥"
              label="Total Clients"
              value={stats.clientCount}
              trend="+2 this month"
              trendUp={true}
            />
            <MetricCard
              icon="🎯"
              label="Active Campaigns"
              value={stats.campaignCount}
              trend="+5 this week"
              trendUp={true}
            />
            <MetricCard
              icon="⏳"
              label="Active Tasks"
              value={stats.activeTasks}
              trend="3 in progress"
              trendUp={false}
            />
            <MetricCard
              icon="✓"
              label="Completed Tasks"
              value={stats.completedTasks}
              trend="+12 today"
              trendUp={true}
            />
          </>
        )}
        </div>
      </section>

      {/* Performance Trends Chart */}
      <section aria-labelledby="trends-heading" className="mb-8">
        <h2 id="trends-heading" className="sr-only">Performance Trends</h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Performance Trends</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Last 7 days overview</p>
            </div>
            {trendsData?.summary && (
              <div className="flex gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Avg ROAS</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">{trendsData.summary.avg_roas}x</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Avg CTR</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{trendsData.summary.avg_ctr}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Avg CPC</div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">${trendsData.summary.avg_cpc}</div>
                </div>
              </div>
            )}
          </div>

          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm text-slate-500">Loading chart...</span>
              </div>
            </div>
          ) : trendsData?.trends ? (
            <PerformanceChart data={trendsData.trends} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <span>No trend data available</span>
            </div>
          )}
        </div>
      </section>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" aria-labelledby="agent-activity-heading">
          <h2 id="agent-activity-heading" className="text-xl font-bold tracking-tight mb-4">Agent Activity</h2>
          <div
            ref={activityFeedRef}
            className="space-y-4 max-h-96 overflow-y-auto scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            {activitiesLoading ? (
              <div role="status" aria-label="Loading activities">
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <span className="sr-only">Loading activities...</span>
              </div>
            ) : agentActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-slate-500 dark:text-slate-400">No recent agent activity</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Agent executions will appear here</p>
              </div>
            ) : (
              agentActivities.map((activity, idx) => (
                <ActivityItem
                  key={activity.id || idx}
                  icon={getAgentIcon(activity.agent_type)}
                  title={getActivityDescription(activity)}
                  description={getTaskDescription(activity)}
                  time={formatTimeAgo(activity.created_at)}
                  status={activity.status}
                  tokens={activity.tokens_used}
                  executionTime={activity.execution_time_ms}
                  isNew={activity.id === lastActivityIdRef.current && idx === 0}
                />
              ))
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="text-xl font-bold tracking-tight mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickActionButton icon="👥" label="Add New Client" />
            <QuickActionButton icon="🎯" label="Create Campaign" />
            <QuickActionButton icon="📊" label="View Reports" />
            <QuickActionButton icon="🔍" label="Market Research" />
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, trend, trendUp }) {
  return (
    <article
      className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl" aria-hidden="true">{icon}</span>
        <div
          className={`text-xs px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
          aria-label={`Trend: ${trend}`}
        >
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-semibold tabular-nums mb-1" aria-label={`${value} ${label}`}>{value}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{label}</div>
      </div>
    </article>
  )
}

function ActivityItem({ icon, title, description, time, status, tokens, executionTime, progress, isNew }) {
  const isInProgress = status === 'in_progress' || status === 'running'

  return (
    <div className={`flex gap-3 transition-all duration-500 ease-out ${isNew ? 'animate-slide-in-down' : ''}`}
      style={isNew ? {
        animation: 'slideInDown 0.5s ease-out forwards'
      } : {}}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition-all duration-300 ${
        status === 'completed'
          ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
          : isInProgress
          ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 ring-2 ring-blue-400 ring-opacity-60 animate-pulse-ring'
          : 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30'
      }`}
        style={isInProgress ? {
          boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)',
          animation: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        } : {}}
      >
        {isInProgress ? <span className="animate-spin">{icon}</span> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm">{title}</p>
          {status === 'completed' && (
            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
              completed
            </span>
          )}
          {status === 'failed' && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
              failed
            </span>
          )}
          {isInProgress && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded animate-pulse">
              running
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-1">{description}</p>

        {/* Progress bar for running activities */}
        {isInProgress && (
          <div className="my-2">
            <ProgressBar
              progress={progress || 0}
              indeterminate={!progress || progress === 0}
              color="blue"
              size="sm"
              animated
            />
          </div>
        )}

        {/* Completed progress bar */}
        {status === 'completed' && (
          <div className="my-2">
            <ProgressBar
              progress={100}
              color="green"
              size="sm"
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span>{time}</span>
          {tokens > 0 && <span>{tokens} tokens</span>}
          {executionTime > 0 && <span>{executionTime}ms</span>}
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ icon, label }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={label}
    >
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}

function PerformanceChart({ data }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [activeMetric, setActiveMetric] = useState('roas')

  const chartWidth = 700
  const chartHeight = 200
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Get metric config
  const metrics = {
    roas: { label: 'ROAS', color: '#22c55e', suffix: 'x', format: v => v.toFixed(2) },
    ctr: { label: 'CTR', color: '#3b82f6', suffix: '%', format: v => v.toFixed(2) },
    cpc: { label: 'CPC', color: '#a855f7', suffix: '', format: v => '$' + v.toFixed(2) }
  }

  const currentMetric = metrics[activeMetric]

  // Calculate scales
  const values = data.map(d => d[activeMetric])
  const minValue = Math.min(...values) * 0.9
  const maxValue = Math.max(...values) * 1.1
  const valueRange = maxValue - minValue || 1

  // Generate points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((d[activeMetric] - minValue) / valueRange) * innerHeight,
    data: d
  }))

  // Generate path
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')

  // Generate area path
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`

  // Generate Y-axis labels
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y: padding.top + innerHeight - pct * innerHeight,
    value: minValue + pct * valueRange
  }))

  // Format date for X-axis
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <div className="flex gap-2">
        {Object.entries(metrics).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeMetric === key
                ? 'text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            style={activeMetric === key ? { backgroundColor: config.color } : {}}
            aria-label={`Show ${config.label} trend`}
            aria-pressed={activeMetric === key}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-64"
          aria-label={`${currentMetric.label} performance chart over the last 7 days`}
          role="img"
        >
          {/* Grid lines */}
          <g className="text-slate-200 dark:text-slate-700">
            {yAxisLabels.map((label, i) => (
              <line
                key={i}
                x1={padding.left}
                y1={label.y}
                x2={chartWidth - padding.right}
                y2={label.y}
                stroke="currentColor"
                strokeDasharray="4,4"
                opacity="0.5"
              />
            ))}
          </g>

          {/* Y-axis labels */}
          <g className="text-xs fill-slate-500 dark:fill-slate-400">
            {yAxisLabels.map((label, i) => (
              <text
                key={i}
                x={padding.left - 8}
                y={label.y + 4}
                textAnchor="end"
                aria-hidden="true"
              >
                {currentMetric.format(label.value)}{currentMetric.suffix}
              </text>
            ))}
          </g>

          {/* X-axis labels */}
          <g className="text-xs fill-slate-500 dark:fill-slate-400">
            {points.map((point, i) => (
              <text
                key={i}
                x={point.x}
                y={chartHeight - 10}
                textAnchor="middle"
                aria-hidden="true"
              >
                {formatDate(point.data.date)}
              </text>
            ))}
          </g>

          {/* Area gradient */}
          <defs>
            <linearGradient id={`areaGradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentMetric.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={currentMetric.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#areaGradient-${activeMetric})`}
            className="transition-all duration-300"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={currentMetric.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? 6 : 4}
                fill={currentMetric.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Invisible larger hitbox */}
              <circle
                cx={point.x}
                cy={point.y}
                r={20}
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={padding.left - 35}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${padding.left - 35}, ${chartHeight / 2})`}
            className="text-xs fill-slate-500 dark:fill-slate-400 font-medium"
            aria-hidden="true"
          >
            {currentMetric.label}
          </text>
          <text
            x={chartWidth / 2}
            y={chartHeight - 2}
            textAnchor="middle"
            className="text-xs fill-slate-500 dark:fill-slate-400 font-medium"
            aria-hidden="true"
          >
            Date
          </text>
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none z-10 transform -translate-x-1/2"
            style={{
              left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
              top: `${((points[hoveredPoint].y - 15) / chartHeight) * 100}%`,
              transform: 'translate(-50%, -100%)'
            }}
            role="tooltip"
          >
            <div className="font-medium">{formatDate(points[hoveredPoint].data.date)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentMetric.color }}></span>
              <span>{currentMetric.label}: {currentMetric.format(points[hoveredPoint].data[activeMetric])}{currentMetric.suffix}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Impressions: {points[hoveredPoint].data.impressions.toLocaleString()}
            </div>
            {/* Tooltip arrow */}
            <div
              className="absolute w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"
              style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}
