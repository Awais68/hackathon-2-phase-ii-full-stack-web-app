import { Task, SyncOperation } from '@/types'
import { taskDB, syncQueueDB } from './db'
import { api } from './api'
import { useTaskStore } from '@/stores/useTaskStore'

/**
 * Generate a unique ID for sync operations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Sync manager for offline-first architecture
 * Handles queueing operations and syncing with backend
 */
export const syncManager = {
  /**
   * Create a task offline
   * Saves to IndexedDB and queues sync operation
   */
  async createTaskOffline(
    data: Pick<Task, 'title' | 'description'>
  ): Promise<Task> {
    const tempId = generateId()
    const now = new Date().toISOString()

    const task: Task = {
      id: tempId,
      title: data.title,
      description: data.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
      userId: 'temp', // Will be set by backend
      version: 1,
    }

    // Save to IndexedDB
    await taskDB.put(task)

    // Queue sync operation
    const operation: SyncOperation = {
      id: generateId(),
      operation: 'create',
      taskId: task.id,
      data: task,
      timestamp: now,
      synced: false,
    }
    await syncQueueDB.add(operation)

    // Update UI store
    useTaskStore.getState().addTask(task)

    return task
  },

  /**
   * Update a task offline
   * Updates IndexedDB and queues sync operation
   */
  async updateTaskOffline(id: string, updates: Partial<Task>): Promise<void> {
    const task = await taskDB.get(id)
    if (!task) {
      throw new Error('Task not found')
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: task.version + 1,
    }

    // Save to IndexedDB
    await taskDB.put(updatedTask)

    // Queue sync operation
    const operation: SyncOperation = {
      id: generateId(),
      operation: 'update',
      taskId: id,
      data: updates,
      timestamp: updatedTask.updatedAt,
      synced: false,
    }
    await syncQueueDB.add(operation)

    // Update UI store
    useTaskStore.getState().updateTask(id, updates)
  },

  /**
   * Delete a task offline
   * Removes from IndexedDB and queues sync operation
   */
  async deleteTaskOffline(id: string): Promise<void> {
    // Queue sync operation first (before deletion)
    const operation: SyncOperation = {
      id: generateId(),
      operation: 'delete',
      taskId: id,
      data: {},
      timestamp: new Date().toISOString(),
      synced: false,
    }
    await syncQueueDB.add(operation)

    // Remove from IndexedDB
    await taskDB.delete(id)

    // Update UI store
    useTaskStore.getState().deleteTask(id)
  },

  /**
   * Sync pending operations with backend
   * @returns Number of operations synced and any conflicts
   */
  async syncWithBackend(): Promise<{
    synced: number
    conflicts: Task[]
  }> {
    const { setSyncStatus, setOffline } = useTaskStore.getState()

    try {
      setSyncStatus('syncing')

      // Get unsynced operations
      const operations = await syncQueueDB.getUnsynced()

      if (operations.length === 0) {
        setSyncStatus('success')
        return { synced: 0, conflicts: [] }
      }

      // Send to backend
      const result = await api.sync.syncOperations(operations)

      // Mark operations as synced
      await Promise.all(
        operations.map((op) => syncQueueDB.markSynced(op.id))
      )

      // Clean up old synced operations
      await syncQueueDB.clearSynced()

      setSyncStatus('success')
      setOffline(false)

      return result
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncStatus('error')
      setOffline(true)
      return { synced: 0, conflicts: [] }
    }
  },

  /**
   * Load tasks from IndexedDB on app start
   * Falls back to API if online
   */
  async loadTasks(): Promise<void> {
    const { setTasks, setLoading, setError, setOffline } = useTaskStore.getState()

    try {
      setLoading(true)

      // Try to load from API first (online)
      try {
        const tasks = await api.tasks.list()
        setTasks(tasks)

        // Update IndexedDB cache
        await taskDB.bulkPut(tasks)

        setOffline(false)
      } catch (apiError) {
        // Fallback to IndexedDB (offline)
        console.log('Loading from IndexedDB (offline)')
        const tasks = await taskDB.getAll()
        setTasks(tasks)
        setOffline(true)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  },

  /**
   * Resolve a conflict by choosing a version
   * @param taskId - Task ID with conflict
   * @param useLocal - true to keep local version, false to use remote
   */
  async resolveConflict(taskId: string, useLocal: boolean): Promise<void> {
    if (useLocal) {
      // Local wins - force update to backend
      const localTask = await taskDB.get(taskId)
      if (localTask) {
        await api.tasks.update(taskId, localTask)
      }
    } else {
      // Remote wins - fetch from backend and overwrite local
      const remoteTask = await api.tasks.get(taskId)
      await taskDB.put(remoteTask)
      useTaskStore.getState().updateTask(taskId, remoteTask)
    }
  },

  /**
   * Check if we're online and sync automatically
   */
  async autoSync(): Promise<void> {
    if (navigator.onLine) {
      await this.syncWithBackend()
    }
  },
}

/**
 * Setup automatic sync on network reconnection
 */
export function setupAutoSync(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    console.log('Network online - syncing...')
    syncManager.autoSync()
  })

  window.addEventListener('offline', () => {
    console.log('Network offline')
    useTaskStore.getState().setOffline(true)
  })

  // Initial sync check
  useTaskStore.getState().setOffline(!navigator.onLine)
}
