import Dexie, { type Table } from 'dexie'

export interface SessionRecord {
  id: string
  user_id: string
  subject: string
  topic: string
  score: number
  total: number
  completed: boolean
  created_at: string
  synced: boolean
}

export interface LessonRecord {
  id: string
  user_id: string
  subject: string
  notes: string
  topics: string[]
  exam_type: string | null
  created_at: string
}

export interface SyncQueueRecord {
  id?: number
  table: string
  action: 'insert' | 'upsert'
  payload: Record<string, unknown>
  created_at: string
}

class StudyPalDB extends Dexie {
  sessions!: Table<SessionRecord>
  lessons!: Table<LessonRecord>
  syncQueue!: Table<SyncQueueRecord>

  constructor() {
    super('StudyPalDB')
    this.version(1).stores({
      sessions: 'id, user_id, subject, created_at, synced',
      lessons: 'id, user_id, subject, created_at',
      syncQueue: '++id, table, created_at',
    })
  }
}

export const db = new StudyPalDB()
