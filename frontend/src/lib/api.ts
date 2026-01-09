import { Task, User, AuthTokens, ApiError, SyncOperation } from '@/types'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Base API URL - configure based on environment
 */

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
/**
 * Base fetch function with error handling
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Response data
 * @throws ApiError on request failure
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false
): Promise<T> {
  const { tokens } = useAuthStore.getState()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  // Add auth header only if required and token exists
  if (requiresAuth && tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors', // Explicitly enable CORS
      credentials: 'omit', // Don't send cookies for cross-origin (Render doesn't need them)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }))

      const error: ApiError = {
        message: errorData.message || 'Request failed',
        status: response.status,
        code: errorData.code,
      }

      // Handle 401 Unauthorized - logout user
      if (response.status === 401 && requiresAuth) {
        useAuthStore.getState().logout()
      }

      throw error
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      } as ApiError
    }
    throw error
  }
}

/**
 * Custom fetch wrapper with authentication and error handling
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Response data
 * @throws ApiError on request failure
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchApi<T>(endpoint, options, true)
}

/**
 * API client for backend communication
 */
export const api = {
  /**
   * Authentication endpoints (no auth required for register/login)
   */
  auth: {
    /**
     * Register a new user
     */
    register: async (email: string, username: string, password: string) => {
      // Backend returns user directly for register, we need to login after
      const user = await fetchApi<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      })
      // Auto login after registration
      const loginResponse = await fetchApi<{ access_token: string; token_type: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      return {
        user: loginResponse.user,
        tokens: {
          accessToken: loginResponse.access_token,
          refreshToken: '', // Backend doesn't provide refresh token
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        } as AuthTokens
      }
    },

    /**
     * Login with username and password
     */
    login: async (username: string, password: string) => {
      const response = await fetchApi<{ access_token: string; token_type: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      return {
        user: response.user,
        tokens: {
          accessToken: response.access_token,
          refreshToken: '', // Backend doesn't provide refresh token
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        } as AuthTokens
      }
    },

    /**
     * Get current authenticated user
     */
    me: async () => {
      return fetchWithAuth<User>('/auth/me')
    },

    /**
     * Logout (client-side only - clear tokens)
     */
    logout: async () => {
      useAuthStore.getState().logout()
    },
  },

  /**
   * User endpoints
   */
  users: {
    /**
     * Sync user from frontend to backend
     */
    sync: async (userData: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
    }) => {
      return fetchApi('/users/sync', {
        method: 'POST',
        body: JSON.stringify({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          email_verified: userData.emailVerified,
          image: userData.image || null
        }),
      })
    },

    /**
     * Get user by ID
     */
    get: async (userId: string) => {
      return fetchApi(`/users/${userId}`)
    },
  },

  /**
   * Task CRUD endpoints
   */
  tasks: {
    /**
     * Get all tasks for authenticated user with optional filters
     */
    list: async (options?: {
      userId?: string;
      status?: string;
      priority?: string;
      sortBy?: string;
      order?: string;
    }) => {
      let url = '/tasks/'
      const params = new URLSearchParams()

      if (options?.userId) params.append('user_id', options.userId)
      if (options?.status) params.append('status', options.status)
      if (options?.priority) params.append('priority', options.priority)
      if (options?.sortBy) params.append('sort_by', options.sortBy)
      if (options?.order) params.append('order', options.order)

      if (params.toString()) {
        url += '?' + params.toString()
      }

      return fetchApi<Task[]>(url)
    },

    /**
     * Get a single task by ID
     */
    get: async (id: string, userId?: string) => {
      const params = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
      return fetchApi<Task>(`/tasks/${id}${params}`)
    },

    /**
     * Create a new task
     */
    create: async (data: {
      title: string;
      description?: string;
      priority?: string;
      status?: string;
      dueDate?: string;
      recursion?: string;
      category?: string;
      tags?: string[];
      userId?: string;
    }) => {
      return fetchApi<Task>('/tasks/', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          due_date: data.dueDate,
          recursion: data.recursion,
          category: data.category || 'General',
          tags: data.tags || [],
          user_id: data.userId
        }),
      })
    },

    /**
     * Update an existing task
     */
    update: async (id: string, data: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      completed: boolean;
      dueDate: string;
      recursion: string;
      category: string;
      tags: string[];
    }>, userId?: string) => {
      const params = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
      return fetchApi<Task>(`/tasks/${id}${params}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          completed: data.completed,
          due_date: data.dueDate,
          recursion: data.recursion,
          category: data.category,
          tags: data.tags
        }),
      })
    },

    /**
     * Delete a task (moves to trash)
     */
    delete: async (id: string, userId?: string) => {
      const params = userId ? `?user_id=${userId}` : ''
      return fetchApi<{ message: string; id: string }>(`/tasks/${id}${params}`, {
        method: 'DELETE',
      })
    },
  },

  /**
   * Trash/Bin endpoints
   */
  trash: {
    /**
     * Get all items in trash
     */
    list: async (userId?: string) => {
      const params = userId ? `?user_id=${userId}` : ''
      return fetchApi<Task[]>(`/trash/${params}`)
    },

    /**
     * Restore a task from trash
     */
    restore: async (trashId: string) => {
      return fetchApi<{ message: string; id: string }>(`/trash/${trashId}/restore`, {
        method: 'POST',
      })
    },

    /**
     * Permanently delete from trash
     */
    permanentDelete: async (trashId: string) => {
      return fetchApi<{ message: string; id: string }>(`/trash/${trashId}/permanent`, {
        method: 'DELETE',
      })
    },
  },

  /**
   * Offline sync endpoints
   */
  sync: {
    /**
     * Batch sync offline operations
     */
    syncOperations: async (operations: SyncOperation[]) => {
      return fetchWithAuth<{ synced: number; conflicts: Task[] }>('/sync/', {
        method: 'POST',
        body: JSON.stringify({ operations }),
      })
    },
  },

  /**
   * Push notification endpoints
   */
  push: {
    /**
     * Register push notification subscription
     */
    subscribe: async (subscription: PushSubscriptionJSON) => {
      return fetchWithAuth<void>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
      })
    },

    /**
     * Unregister push notification subscription
     */
    unsubscribe: async (endpoint: string) => {
      return fetchWithAuth<void>('/push/unsubscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
      })
    },
  },
}
