"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GameNotificationProps {
  message: string
  type?: "error" | "success" | "warning" | "info"
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function GameNotification({ 
  message, 
  type = "error", 
  isVisible, 
  onClose, 
  duration = 2500 
}: GameNotificationProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const typeStyles = {
    error: "bg-red-500 text-white border-red-600",
    success: "bg-green-500 text-white border-green-600", 
    warning: "bg-yellow-500 text-white border-yellow-600",
    info: "bg-blue-500 text-white border-blue-600"
  }

  return (
    <div className={cn(
      "fixed top-20 left-1/2 transform -translate-x-1/2 z-50",
      "px-6 py-3 rounded-lg border-2 shadow-lg",
      "animate-in slide-in-from-top-4 duration-300",
      "max-w-xs text-center font-medium text-sm",
      typeStyles[type]
    )}>
      {message}
    </div>
  )
} 
