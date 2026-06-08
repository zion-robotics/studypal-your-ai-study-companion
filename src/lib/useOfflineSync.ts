import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const flushQueue = useCallback(async () => {
    const queue = await db.syncQueue.toArray()
    if (queue.length === 0) return
    for (const item of queue) {
      try {
        await (supabase.from(item.table) as any)[item.action](item.payload)
        await db.syncQueue.delete(item.id!)
      } catch (err) {
        console.error('Sync failed for item', item.id, err)
      }
    }
  }, [])

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); flushQueue(); }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [flushQueue])

  return { isOnline }
}
