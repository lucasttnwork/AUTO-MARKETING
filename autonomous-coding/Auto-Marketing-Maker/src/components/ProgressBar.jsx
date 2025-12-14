import { useState, useEffect } from 'react'

/**
 * Progress bar component for long-running operations
 * @param {number} progress - Current progress (0-100)
 * @param {boolean} animated - Whether to show animation for indeterminate progress
 * @param {string} label - Optional label to display
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {string} color - Color variant: 'blue' | 'green' | 'purple' | 'orange'
 * @param {boolean} showPercentage - Whether to show percentage text
 */
export default function ProgressBar({
  progress = 0,
  animated = false,
  label = '',
  size = 'md',
  color = 'blue',
  showPercentage = false,
  indeterminate = false
}) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Animate progress changes smoothly
  useEffect(() => {
    if (!indeterminate) {
      const timer = setTimeout(() => {
        setDisplayProgress(Math.min(100, Math.max(0, progress)))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [progress, indeterminate])

  // Size classes
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }

  // Color classes for the bar
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
  }

  // Track background color
  const trackClass = 'bg-slate-200 dark:bg-slate-700'

  return (
    <div className="w-full" role="progressbar" aria-valuenow={indeterminate ? undefined : displayProgress} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
              {Math.round(displayProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div className={`w-full ${trackClass} rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {indeterminate ? (
          // Indeterminate animation
          <div
            className={`h-full ${colorClasses[color]} rounded-full animate-progress-indeterminate`}
            style={{ width: '30%' }}
          />
        ) : (
          // Determinate progress
          <div
            className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300 ease-out ${animated ? 'animate-pulse' : ''}`}
            style={{ width: `${displayProgress}%` }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Task progress indicator with status and estimated time
 */
export function TaskProgressBar({
  status = 'pending',
  progress = 0,
  estimatedTime = null,
  elapsedTime = null,
  taskName = ''
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'in_progress': return 'blue'
      case 'completed': return 'green'
      case 'red_flagged': return 'orange'
      default: return 'purple'
    }
  }

  const isRunning = status === 'in_progress'
  const isComplete = status === 'completed'

  return (
    <div className="space-y-1">
      <ProgressBar
        progress={isComplete ? 100 : progress}
        color={getStatusColor()}
        size="md"
        showPercentage={isRunning || isComplete}
        indeterminate={isRunning && progress === 0}
        animated={isRunning}
        label={taskName}
      />
      {(estimatedTime || elapsedTime) && (
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          {elapsedTime && <span>Elapsed: {elapsedTime}</span>}
          {estimatedTime && <span>Est: {estimatedTime}</span>}
        </div>
      )}
    </div>
  )
}

/**
 * Circular progress indicator for agent status
 */
export function CircularProgress({
  progress = 0,
  size = 48,
  strokeWidth = 4,
  color = 'blue',
  showPercentage = true
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  const colorMap = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    purple: 'stroke-purple-500',
    orange: 'stroke-orange-500'
  }

  return (
    <div className="relative inline-flex items-center justify-center" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${colorMap[color]} transition-all duration-300 ease-out`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset
          }}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium tabular-nums">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
}
