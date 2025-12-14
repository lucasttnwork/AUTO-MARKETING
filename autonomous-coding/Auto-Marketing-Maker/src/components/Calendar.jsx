import { useState, useMemo } from 'react'

export default function Calendar({ campaigns = [], onSelectCampaign }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' or 'week'

  // Get first day of current month
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  }, [currentDate])

  // Get last day of current month
  const lastDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  }, [currentDate])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = []
    const startDayOfWeek = firstDayOfMonth.getDay()

    // Add empty days for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(firstDayOfMonth)
      prevDate.setDate(prevDate.getDate() - (startDayOfWeek - i))
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Add days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true
      })
    }

    // Add empty days for next month
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(lastDayOfMonth)
      nextDate.setDate(nextDate.getDate() + i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }, [firstDayOfMonth, lastDayOfMonth, currentDate])

  // Get campaigns for a specific date
  const getCampaignsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return campaigns.filter(campaign => {
      try {
        const schedule = typeof campaign.schedule === 'string'
          ? JSON.parse(campaign.schedule)
          : campaign.schedule
        if (!schedule?.start_date || !schedule?.end_date) return false
        return dateStr >= schedule.start_date && dateStr <= schedule.end_date
      } catch {
        return false
      }
    })
  }

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Get campaign color based on status
  const getCampaignColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'draft':
        return 'bg-slate-400'
      case 'paused':
        return 'bg-amber-500'
      case 'completed':
        return 'bg-blue-500'
      default:
        return 'bg-slate-400'
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const dayCampaigns = getCampaignsForDate(date)
          const dayIsToday = isToday(date)

          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border-b border-r border-slate-200 dark:border-slate-700 ${
                !isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900/30' : ''
              } ${index % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    dayIsToday
                      ? 'bg-blue-600 text-white'
                      : isCurrentMonth
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Campaign indicators */}
              <div className="space-y-1">
                {dayCampaigns.slice(0, 3).map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => onSelectCampaign?.(campaign)}
                    className={`w-full text-left px-2 py-1 rounded text-xs text-white truncate ${getCampaignColor(campaign.status)} hover:opacity-80 transition-opacity`}
                    title={campaign.name}
                  >
                    {campaign.name}
                  </button>
                ))}
                {dayCampaigns.length > 3 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 px-2">
                    +{dayCampaigns.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-400"></div>
            <span className="text-slate-600 dark:text-slate-400">Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Paused</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
