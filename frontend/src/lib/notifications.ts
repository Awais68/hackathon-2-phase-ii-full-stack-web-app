import { api } from './api'

/**
 * VAPID public key for push notifications
 * This should match the key on your backend
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || ''

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Push notification manager
 */
export const pushNotifications = {
  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  },

  /**
   * Get current notification permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied'
    }
    return Notification.permission
  },

  /**
   * Request notification permission from user
   * @returns Permission status
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    const permission = await Notification.requestPermission()
    return permission
  },

  /**
   * Subscribe to push notifications
   * Requests permission if not already granted
   * @returns Subscription object or null if failed
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      // Check support
      if (!this.isSupported()) {
        console.warn('Push notifications not supported')
        return null
      }

      // Request permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return null
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // Create new subscription
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        })
      }

      // Send subscription to backend
      await api.push.subscribe(subscription.toJSON())

      console.log('Push notification subscription successful')
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      if (!this.isSupported()) {
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()

        // Notify backend
        await api.push.unsubscribe(subscription.endpoint)

        console.log('Push notification unsubscription successful')
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
    }
  },

  /**
   * Show a local notification (for testing)
   */
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) {
      return
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      return
    }

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options,
    })
  },

  /**
   * Check if user has an active subscription
   */
  async hasSubscription(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      return !!subscription
    } catch {
      return false
    }
  },
}
