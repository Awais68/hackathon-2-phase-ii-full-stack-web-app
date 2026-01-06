import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Task, SyncOperation } from '@/types'

/**
 * IndexedDB schema definition
 */
interface TaskDB extends DBSchema {
  tasks: {
    key: string
    value: Task
    indexes: { 'by-updated': string }
  }
  syncQueue: {
    key: string
    value: SyncOperation
    indexes: { 'by-timestamp': string }
  }
}

/**
 * Database name and version
 */
const DB_NAME = 'task-manager-db'
const DB_VERSION = 1

/**
 * IndexedDB database instance
 */
let dbInstance: IDBPDatabase<TaskDB> | null = null

/**
 * Initialize IndexedDB with schema
 * @returns Database instance
 */
export async function initDB(): Promise<IDBPDatabase<TaskDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<TaskDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('by-updated', 'updatedAt')
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
        syncStore.createIndex('by-timestamp', 'timestamp')
      }
    },
  })

  return dbInstance
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

/**
 * Task storage operations
 */
export const taskDB = {
  /**
   * Get all tasks from IndexedDB
   */
  async getAll(): Promise<Task[]> {
    const db = await initDB()
    return db.getAll('tasks')
  },

  /**
   * Get a single task by ID
   */
  async get(id: string): Promise<Task | undefined> {
    const db = await initDB()
    return db.get('tasks', id)
  },

  /**
   * Save or update a task in IndexedDB
   */
  async put(task: Task): Promise<void> {
    const db = await initDB()
    await db.put('tasks', task)
  },

  /**
   * Delete a task from IndexedDB
   */
  async delete(id: string): Promise<void> {
    const db = await initDB()
    await db.delete('tasks', id)
  },

  /**
   * Clear all tasks from IndexedDB
   */
  async clear(): Promise<void> {
    const db = await initDB()
    await db.clear('tasks')
  },

  /**
   * Bulk save tasks (used for initial sync)
   */
  async bulkPut(tasks: Task[]): Promise<void> {
    const db = await initDB()
    const tx = db.transaction('tasks', 'readwrite')
    await Promise.all(tasks.map((task) => tx.store.put(task)))
    await tx.done
  },
}

/**
 * Sync queue operations
 */
export const syncQueueDB = {
  /**
   * Get all pending sync operations
   */
  async getAll(): Promise<SyncOperation[]> {
    const db = await initDB()
    return db.getAll('syncQueue')
  },

  /**
   * Get unsynced operations only
   */
  async getUnsynced(): Promise<SyncOperation[]> {
    const db = await initDB()
    const all = await db.getAll('syncQueue')
    return all.filter((op) => !op.synced)
  },

  /**
   * Add an operation to the sync queue
   */
  async add(operation: SyncOperation): Promise<void> {
    const db = await initDB()
    await db.put('syncQueue', operation)
  },

  /**
   * Mark an operation as synced
   */
  async markSynced(id: string): Promise<void> {
    const db = await initDB()
    const operation = await db.get('syncQueue', id)
    if (operation) {
      operation.synced = true
      await db.put('syncQueue', operation)
    }
  },

  /**
   * Remove an operation from the queue
   */
  async delete(id: string): Promise<void> {
    const db = await initDB()
    await db.delete('syncQueue', id)
  },

  /**
   * Clear all sync operations
   */
  async clear(): Promise<void> {
    const db = await initDB()
    await db.clear('syncQueue')
  },

  /**
   * Clear synced operations (cleanup)
   */
  async clearSynced(): Promise<void> {
    const db = await initDB()
    const all = await db.getAll('syncQueue')
    const tx = db.transaction('syncQueue', 'readwrite')
    await Promise.all(
      all
        .filter((op) => op.synced)
        .map((op) => tx.store.delete(op.id))
    )
    await tx.done
  },
}
