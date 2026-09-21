import { useState, useRef, useCallback, useEffect } from 'react'

export interface SidebarResizeState {
  sidebarWidth: number
  rightSidebarWidth: number
  isResizingLeft: boolean
  isResizingRight: boolean
  startLeftResize: (e: React.MouseEvent) => void
  startRightResize: (e: React.MouseEvent) => void
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>
  setRightSidebarWidth: React.Dispatch<React.SetStateAction<number>>
}

export const DEFAULT_SIDEBAR_WIDTH = 312 // increased by 20% (260 * 1.20 = 312)
export const MIN_SIDEBAR_WIDTH = 229 // was 208, increased by 10% (208 * 1.10 = 228.8 ≈ 229px)
export const MAX_SIDEBAR_WIDTH = 550
export const MIN_RIGHT_SIDEBAR_WIDTH = 160
export const MAX_RIGHT_SIDEBAR_WIDTH = 400

export function useSidebarResize(
  initialLeftWidth = DEFAULT_SIDEBAR_WIDTH,
  initialRightWidth = 220
): SidebarResizeState {
  const [sidebarWidth, setSidebarWidth] = useState<number>(() =>
    Math.max(MIN_SIDEBAR_WIDTH, initialLeftWidth)
  )
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(initialRightWidth)

  const isResizingLeftRef = useRef<boolean>(false)
  const isResizingRightRef = useRef<boolean>(false)

  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false)
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false)

  // Auto-clamp sidebar widths when window resizes small
  useEffect(() => {
    const handleWindowResize = (): void => {
      setSidebarWidth((prev) => {
        const maxAllowed = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 300))
        return Math.max(MIN_SIDEBAR_WIDTH, Math.min(prev, maxAllowed))
      })
      setRightSidebarWidth((prev) => {
        const maxAllowed = Math.max(MIN_RIGHT_SIDEBAR_WIDTH, Math.min(MAX_RIGHT_SIDEBAR_WIDTH, window.innerWidth - 350))
        return Math.min(prev, maxAllowed)
      })
    }

    window.addEventListener('resize', handleWindowResize)
    return (): void => window.removeEventListener('resize', handleWindowResize)
  }, [])

  const startLeftResize = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    isResizingLeftRef.current = true
    setIsResizingLeft(true)

    let rafId: number | null = null

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingLeftRef.current) return
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        rafId = null
        if (!isResizingLeftRef.current) return
        const maxAllowed = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 300))
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(maxAllowed, moveEvent.clientX))
        setSidebarWidth(newWidth)
      })
    }

    const handleMouseUp = (): void => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      isResizingLeftRef.current = false
      setIsResizingLeft(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  const startRightResize = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    isResizingRightRef.current = true
    setIsResizingRight(true)

    let rafId: number | null = null

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isResizingRightRef.current) return
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        rafId = null
        if (!isResizingRightRef.current) return
        const maxAllowed = Math.max(MIN_RIGHT_SIDEBAR_WIDTH, Math.min(MAX_RIGHT_SIDEBAR_WIDTH, window.innerWidth - 350))
        const newWidth = Math.max(MIN_RIGHT_SIDEBAR_WIDTH, Math.min(maxAllowed, window.innerWidth - moveEvent.clientX))
        setRightSidebarWidth(newWidth)
      })
    }

    const handleMouseUp = (): void => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      isResizingRightRef.current = false
      setIsResizingRight(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  return {
    sidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    startLeftResize,
    startRightResize,
    setSidebarWidth,
    setRightSidebarWidth
  }
}
