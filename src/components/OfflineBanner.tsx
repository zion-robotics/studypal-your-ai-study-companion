import { useOfflineSync } from '@/hooks/useOfflineSync'

export function OfflineBanner() {
  const { isOnline } = useOfflineSync()
  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2
      bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-4 backdrop-blur-sm">
      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-300 tracking-wide">
        You're offline — StudyPal is running from local data
      </p>
    </div>
  )
}
