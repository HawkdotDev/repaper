import { storageService, STORAGE_KEYS } from './storageService'
import { APP_VERSION } from '../utils/version'

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: 'update' | 'backup' | 'system' | 'tip'
}

const DEFAULT_ONBOARDING_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: `Repaper v${APP_VERSION} Live`,
    description:
      'Updated with sleek modern styling, disk write-back, and fast workspace navigation.',
    time: 'Just now',
    read: false,
    type: 'update'
  },
  {
    id: '2',
    title: 'Workspace Autosave Active',
    description: 'Local note changes are continuously secured to your file system.',
    time: '12m ago',
    read: false,
    type: 'backup'
  },
  {
    id: '3',
    title: 'Graph Indexer Initialized',
    description: 'All internal markdown links and cross-references are indexed.',
    time: '1h ago',
    read: true,
    type: 'system'
  },
  {
    id: '4',
    title: 'Pro Tip: Quick Switcher',
    description: 'Press Ctrl+P anywhere to jump between documents instantly.',
    time: '3h ago',
    read: true,
    type: 'tip'
  }
]

type NotificationListener = (notifications: NotificationItem[]) => void

class NotificationService {
  private notifications: NotificationItem[] = []
  private listeners: Set<NotificationListener> = new Set()

  constructor() {
    this.load()
  }

  private load(): void {
    const stored = storageService.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS)
    if (stored && Array.isArray(stored)) {
      this.notifications = stored
    } else {
      this.notifications = DEFAULT_ONBOARDING_NOTIFICATIONS
      this.save()
    }
  }

  private save(): void {
    storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
    this.notify()
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.notifications])
      } catch (err) {
        console.warn('Error in notification listener:', err)
      }
    })
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications]
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener)
    listener([...this.notifications])
    return () => {
      this.listeners.delete(listener)
    }
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'time' | 'read'>): NotificationItem {
    const newNotification: NotificationItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      time: 'Just now',
      read: false
    }

    this.notifications = [newNotification, ...this.notifications].slice(0, 50) // Max 50 notifications
    this.save()
    return newNotification
  }

  public markAsRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    this.save()
  }

  public toggleRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    this.save()
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }))
    this.save()
  }

  public removeNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.save()
  }

  public clearAll(): void {
    this.notifications = []
    this.save()
  }

  public resetToDefaults(): void {
    this.notifications = DEFAULT_ONBOARDING_NOTIFICATIONS
    this.save()
  }
}

export const notificationService = new NotificationService()
