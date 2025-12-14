/**
 * Skeleton loader components for loading states
 * Provides visual placeholders while content is loading
 */

// Base skeleton component with pulse animation
export function Skeleton({ className = '', children }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}

// Text skeleton - single line of text
export function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return <Skeleton className={`${width} ${height}`} />
}

// Circular skeleton - for avatars
export function SkeletonCircle({ size = 'w-10 h-10' }) {
  return <Skeleton className={`${size} rounded-full`} />
}

// Metric card skeleton - matches dashboard metric cards
export function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <SkeletonCircle size="w-12 h-12" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="w-16 h-10" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  )
}

// Client card skeleton
export function SkeletonClientCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start gap-4">
        <SkeletonCircle size="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-24 h-5 rounded-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-full h-4" />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
        <Skeleton className="flex-1 h-9 rounded-lg" />
        <Skeleton className="flex-1 h-9 rounded-lg" />
      </div>
    </div>
  )
}

// Campaign card skeleton
export function SkeletonCampaignCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <SkeletonCircle size="w-10 h-10" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-16 h-5" />
        </div>
        <div className="space-y-1">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-16 h-5" />
        </div>
        <div className="space-y-1">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-16 h-5" />
        </div>
      </div>
    </div>
  )
}

// Task card skeleton
export function SkeletonTaskCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start gap-3">
        <SkeletonCircle size="w-8 h-8" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-1/2 h-3" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
    </div>
  )
}

// Activity feed item skeleton
export function SkeletonActivityItem() {
  return (
    <div className="flex items-start gap-3 p-4">
      <SkeletonCircle size="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
  )
}

// Table row skeleton
export function SkeletonTableRow({ columns = 4 }) {
  return (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="w-full h-4" />
        </td>
      ))}
    </tr>
  )
}

// Full dashboard skeleton
export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6" role="status" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-64 h-4" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>

      {/* Activity and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <Skeleton className="w-32 h-6 mb-4" />
          <div className="space-y-4">
            <SkeletonActivityItem />
            <SkeletonActivityItem />
            <SkeletonActivityItem />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <Skeleton className="w-32 h-6 mb-4" />
          <div className="space-y-3">
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading content, please wait...</span>
    </div>
  )
}

// Clients page skeleton
export function SkeletonClientsPage() {
  return (
    <div className="p-6 space-y-6" role="status" aria-label="Loading clients">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="w-32 h-8" />
          <Skeleton className="w-48 h-4" />
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonClientCard />
        <SkeletonClientCard />
        <SkeletonClientCard />
      </div>

      <span className="sr-only">Loading content, please wait...</span>
    </div>
  )
}

export default Skeleton
