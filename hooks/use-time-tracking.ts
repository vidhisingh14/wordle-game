"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useTimeTracking() {
  const [currentTime, setCurrentTime] = useState(0)
  const [timeStats, setTimeStats] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)

  // Load existing time data
  const loadTimeData = useCallback(() => {
    try {
      const timeDataString = localStorage.getItem("wordle-time-tracking")
      if (timeDataString) {
        const timeData = JSON.parse(timeDataString)
        const today = new Date().toDateString()
        const weekStart = getWeekStart(new Date())
        const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`

        setTimeStats({
          daily: Math.floor((timeData.daily?.[today] || 0) / 1000),
          weekly: Math.floor((timeData.weekly?.[weekStart] || 0) / 1000),
          monthly: Math.floor((timeData.monthly?.[monthKey] || 0) / 1000),
        })
      }
    } catch (error) {
      console.error("Error loading time data:", error)
    }
  }, [])

  // Start time tracking session
  const startSession = useCallback(() => {
    console.log("Starting time tracking session...")

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set start time and mark as active
    startTimeRef.current = Date.now()
    isActiveRef.current = true
    setCurrentTime(0)

    // Load existing time data
    loadTimeData()

    // Start the timer interval
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current || !isActiveRef.current) return

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setCurrentTime(elapsed)

      console.log(`Timer update: ${elapsed}s`)

      // Update time stats with current session included
      try {
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
      }
    }, 1000)

    console.log("Time tracking started successfully")
  }, [loadTimeData])

  // End session and save data
  const endSession = useCallback(() => {
    console.log("Ending time tracking session...")

    if (!startTimeRef.current || !isActiveRef.current) {
      console.log("No active session to end")
      return
    }

    const endTime = Date.now()
    const sessionDuration = endTime - startTimeRef.current

    try {
      // Get existing time data
      const timeDataString = localStorage.getItem("wordle-time-tracking")
      const timeData = timeDataString ? JSON.parse(timeDataString) : {}

      // Update time periods
      const today = new Date().toDateString()
      timeData.daily = timeData.daily || {}
      timeData.daily[today] = (timeData.daily[today] || 0) + sessionDuration

      const weekStart = getWeekStart(new Date())
      timeData.weekly = timeData.weekly || {}
      timeData.weekly[weekStart] = (timeData.weekly[weekStart] || 0) + sessionDuration

      const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`
      timeData.monthly = timeData.monthly || {}
      timeData.monthly[monthKey] = (timeData.monthly[monthKey] || 0) + sessionDuration

      // Save updated data
      localStorage.setItem("wordle-time-tracking", JSON.stringify(timeData))
      console.log(`Session saved. Duration: ${Math.floor(sessionDuration / 1000)}s`)
    } catch (error) {
      console.error("Error saving time tracking data:", error)
    }

    // Clear interval and reset
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    startTimeRef.current = null
    isActiveRef.current = false
    setCurrentTime(0)
  }, [])

  // Initialize on mount
  useEffect(() => {
    loadTimeData()
    startSession()

    // Cleanup on unmount
    return () => {
      endSession()
    }
  }, []) // Empty dependency array to run only once

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden - pausing timer")
        isActiveRef.current = false
      } else {
        console.log("Page visible - resuming timer")
        isActiveRef.current = true
        if (!startTimeRef.current) {
          startSession()
        }
      }
    }

    const handleBeforeUnload = () => {
      endSession()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [startSession, endSession])

  return {
    startSession,
    endSession,
    currentTime,
    timeStats,
    isActive: isActiveRef.current,
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff)).toDateString()
}
