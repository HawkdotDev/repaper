import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  ShieldCheck,
  Layers,
  Info,
  CheckCircle2,
  X
} from 'lucide-react'


import { notificationService, NotificationItem } from '../../../services/notificationService'

interface NotificationsMenuProps {
  buttonClassName?: string
  dropUp?: boolean
}

function NotificationsMenuComponent({ buttonClassName, dropUp = false }: NotificationsMenuProps): React.JSX.Element {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    notificationService.getNotifications()
  )
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return notificationService.subscribe(setNotifications)
  }, [])

  const updatePos = useCallback(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const menuWidth = 280
      let left = dropUp ? rect.left : rect.right - menuWidth
      if (left < 10) left = 10
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10
      }
      setMenuPos({
        top: dropUp ? rect.top : rect.bottom + 4,
        left
      })
    }
  }, [dropUp])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      updatePos()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', updatePos)
      window.addEventListener('scroll', updatePos, true)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [showMenu, updatePos])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = (): void => {
    notificationService.markAllAsRead()
  }

  const handleToggleRead = (id: string): void => {
    notificationService.toggleRead(id)
  }

  const handleDismiss = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    notificationService.removeNotification(id)
  }

  const handleClearAll = (): void => {
    notificationService.clearAll()
  }

  const handleResetDefaults = (): void => {
    notificationService.resetToDefaults()
  }

  const renderIcon = (type: NotificationItem['type']): React.JSX.Element => {
    switch (type) {
      case 'update':
        return <Sparkles size={13} className="text-zinc-300 shrink-0" />
      case 'backup':
        return <ShieldCheck size={13} className="text-zinc-300 shrink-0" />
      case 'system':
        return <Layers size={13} className="text-zinc-300 shrink-0" />
      case 'tip':
      default:
        return <Info size={13} className="text-zinc-300 shrink-0" />
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={
          buttonClassName
            ? `${buttonClassName} relative ${showMenu ? 'active' : ''}`
            : `action-pill-btn w-6.5 h-6.5 p-0 justify-center relative ${showMenu ? 'active' : ''}`
        }
        onClick={(): void => {
          if (!showMenu) updatePos()
          setShowMenu((prev) => !prev)
        }}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell
          size={buttonClassName ? 16 : 14}
          strokeWidth={1.75}
          className={showMenu ? 'text-zinc-200' : 'text-zinc-500'}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-zinc-200 rounded-none ring-1 ring-[#0E0E11]" />
        )}
      </button>

      {/* NOTIFICATIONS DROPDOWN POPOVER */}
      {showMenu &&
        menuPos &&
        createPortal(
          <div
            ref={dropdownRef}
            className="widgets-dropdown-menu view-dropdown-menu notifications-dropdown-menu"
            style={{
              position: 'fixed',
              ...(dropUp
                ? { bottom: `${Math.max(10, window.innerHeight - menuPos.top)}px`, top: 'auto' }
                : { top: `${menuPos.top}px`, bottom: 'auto' }),
              left: `${menuPos.left}px`,
              right: 'auto',
              marginTop: 0,
              zIndex: 99999
            }}
          >
            {/* Header */}
            <div className="widgets-dropdown-header">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-300">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.2">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-none transition-colors"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    aria-label="Mark all as read"
                  >
                    <CheckCheck size={13} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 rounded-none transition-colors"
                    onClick={handleClearAll}
                    title="Clear all notifications"
                    aria-label="Clear all notifications"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* List of Notifications */}
            <div className="widgets-dropdown-list max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-7 px-3 text-center flex flex-col items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} className="text-zinc-500" />
                  <span className="widget-title text-zinc-400">All caught up!</span>
                  <span className="widget-desc">No new notifications</span>
                  <button
                    type="button"
                    className="mt-2 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                    onClick={handleResetDefaults}
                  >
                    Restore demo notifications
                  </button>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={(): void => handleToggleRead(item.id)}
                    className={`widget-menu-item group ${!item.read ? 'bg-white/2' : 'opacity-65'}`}
                    title={item.description}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="shrink-0 flex items-center justify-center">
                        {renderIcon(item.type)}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`widget-title truncate ${
                              !item.read ? 'text-zinc-100 font-semibold' : 'text-zinc-400 font-normal'
                            }`}
                          >
                            {item.title}
                          </span>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 bg-zinc-200 rounded-none shrink-0" />
                          )}
                        </div>
                        <span className="widget-desc truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[9.5px] font-mono text-zinc-500 group-hover:hidden">
                        {item.time}
                      </span>
                      <button
                        type="button"
                        className="hidden group-hover:flex items-center justify-center text-zinc-400 hover:text-white p-0.5 hover:bg-white/10 transition-colors"
                        onClick={(e): void => handleDismiss(item.id, e)}
                        title="Dismiss"
                        aria-label="Dismiss notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default React.memo(NotificationsMenuComponent)
