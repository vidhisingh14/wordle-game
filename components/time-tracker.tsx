"use client"

import { useState, useEffect } from "react"

export function TimeTracker() {
  const [currentTime, setCurrentTime] = useState(0)
  const [timeStats, setTimeStats] = useState({ daily: 0, weekly: 0, monthly: 0 })

  useEffect(() => {
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setCurrentTime(elapsed)

      try {
        // Update time stats with safe parsing
        const timeDataString = localStorage.getItem("wordle-time-tracking")
        const timeData = timeDataString ? JSON.parse(timeDataString) : {}

        const today = new Date().toDateString()
        const weekStart = getWeekStart(new Date())
        const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`

        setTimeStats({
          daily: Math.floor((timeData.daily?.[today] || 0) / 1000) + elapsed,
          weekly: Math.floor((timeData.weekly?.[weekStart] || 0) / 1000) + elapsed,
          monthly: Math.floor((timeData.monthly?.[monthKey] || 0) / 1000) + elapsed,
        })
      } catch (error) {
        console.error("Error updating time stats:", error)
        setTimeStats({
          daily: elapsed,
          weekly: elapsed,
          monthly: elapsed,
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="text-sm text-gray-400 space-y-1 font-wordle-normal">
      <div className="flex justify-between">
        <span>Session:</span>
        <span className="font-wordle-medium">{formatTime(currentTime)}</span>
      </div>
      <div className="flex justify-between">
        <span>Today:</span>
        <span className="font-wordle-medium">{formatTime(timeStats.daily)}</span>
      </div>
      <div className="flex justify-between">
        <span>This Week:</span>
        <span className="font-wordle-medium">{formatTime(timeStats.weekly)}</span>
      </div>
      <div className="flex justify-between">
        <span>This Month:</span>
        <span className="font-wordle-medium">{formatTime(timeStats.monthly)}</span>
      </div>
    </div>
  )
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff)).toDateString()
}
