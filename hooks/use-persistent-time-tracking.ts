"use client"

import { useCallback, useRef, useEffect } from "react"

interface TimeSession {
  id: string
  startTime: number
  endTime?: number
  duration: number
  date: string
  browserFingerprint: string
}

interface TimeData {
  sessions: TimeSession[]
  totalTime: number
  lastActiveTime: number
  browserFingerprint: string
}

export function usePersistentTimeTracking() {
  const sessionIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate browser fingerprint for identification
  const generateBrowserFingerprint = useCallback(() => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    ctx?.fillText("fingerprint", 10, 10)
    const canvasFingerprint = canvas.toDataURL()

    const fingerprint = btoa(
      navigator.userAgent +
        navigator.language +
        screen.width +
        "x" +
        screen.height +
        new Date().getTimezoneOffset() +
        canvasFingerprint.slice(-50),
    ).slice(0, 32)

    return fingerprint
  }, [])

  // Get or create time data for this browser
  const getTimeData = useCallback((): TimeData => {
    try {
      const stored = localStorage.getItem("wordle-persistent-time")
      const fingerprint = generateBrowserFingerprint()

      if (stored) {
        const data = JSON.parse(stored) as TimeData
        // Update fingerprint if it's changed (same browser, different session)
        data.browserFingerprint = fingerprint
        return data
      }

      return {
        sessions: [],
        totalTime: 0,
        lastActiveTime: Date.now(),
        browserFingerprint: fingerprint,
      }
    } catch (error) {
      console.error("Error reading time data:", error)
      return {
        sessions: [],
        totalTime: 0,
        lastActiveTime: Date.now(),
        browserFingerprint: generateBrowserFingerprint(),
      }
    }
  }, [generateBrowserFingerprint])

  // Save time data
  const saveTimeData = useCallback((data: TimeData) => {
    try {
      localStorage.setItem("wordle-persistent-time", JSON.stringify(data))
    } catch (error) {
      console.error("Error saving time data:", error)
    }
  }, [])

  // Start a new session
  const startSession = useCallback(() => {
    const now = Date.now()
    const sessionId = `session_${now}_${Math.random().toString(36).substr(2, 9)}`

    sessionIdRef.current = sessionId
    startTimeRef.current = now

    // Update last active time
    const timeData = getTimeData()
    timeData.lastActiveTime = now
    saveTimeData(timeData)

    // Start heartbeat to track active time
    heartbeatIntervalRef.current = setInterval(() => {
      const currentData = getTimeData()
      currentData.lastActiveTime = Date.now()
      saveTimeData(currentData)
    }, 30000) // Update every 30 seconds

    console.log(`Started session: ${sessionId}`)
  }, [getTimeData, saveTimeData])

  // End current session
  const endSession = useCallback(() => {
    if (!sessionIdRef.current || !startTimeRef.current) return

    const endTime = Date.now()
    const duration = endTime - startTimeRef.current

    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    // Save session data
    const timeData = getTimeData()
    const session: TimeSession = {
      id: sessionIdRef.current,
      startTime: startTimeRef.current,
      endTime,
      duration,
      date: new Date().toDateString(),
      browserFingerprint: timeData.browserFingerprint,
    }

    timeData.sessions.push(session)
    timeData.totalTime += duration
    timeData.lastActiveTime = endTime
    saveTimeData(timeData)

    console.log(`Ended session: ${sessionIdRef.current}, Duration: ${Math.floor(duration / 1000)}s`)

    sessionIdRef.current = null
    startTimeRef.current = null
  }, [getTimeData, saveTimeData])

  // Get current session time
  const getCurrentSessionTime = useCallback(() => {
    if (!startTimeRef.current) return 0
    return Math.floor((Date.now() - startTimeRef.current) / 1000)
  }, [])

  // Get time statistics
  const getTimeStats = useCallback(() => {
    const timeData = getTimeData()
    const now = new Date()
    const today = now.toDateString()
    const weekStart = getWeekStart(now)
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`

    // Calculate current session time
    const currentSessionTime = getCurrentSessionTime()

    // Filter sessions by time period
    const todaySessions = timeData.sessions.filter((s) => s.date === today)
    const weekSessions = timeData.sessions.filter((s) => {
      const sessionDate = new Date(s.startTime)
      return sessionDate >= new Date(weekStart)
    })
    const monthSessions = timeData.sessions.filter((s) => {
      const sessionDate = new Date(s.startTime)
      return sessionDate.getFullYear() === now.getFullYear() && sessionDate.getMonth() === now.getMonth()
    })

    // Calculate totals
    const dailyTime = todaySessions.reduce((sum, s) => sum + s.duration, 0)
    const weeklyTime = weekSessions.reduce((sum, s) => sum + s.duration, 0)
    const monthlyTime = monthSessions.reduce((sum, s) => sum + s.duration, 0)

    return {
      currentSession: currentSessionTime,
      daily: Math.floor(dailyTime / 1000) + currentSessionTime,
      weekly: Math.floor(weeklyTime / 1000) + currentSessionTime,
      monthly: Math.floor(monthlyTime / 1000) + currentSessionTime,
      totalSessions: timeData.sessions.length,
      totalTime: Math.floor(timeData.totalTime / 1000) + currentSessionTime,
      lastActive: timeData.lastActiveTime,
      browserFingerprint: timeData.browserFingerprint,
    }
  }, [getTimeData, getCurrentSessionTime])

  // Clear all time data
  const clearTimeData = useCallback(() => {
    try {
      localStorage.removeItem("wordle-persistent-time")
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      sessionIdRef.current = null
      startTimeRef.current = null
    } catch (error) {
      console.error("Error clearing time data:", error)
    }
  }, [])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, end current session
        endSession()
      } else {
        // Page is visible, start new session
        startSession()
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
      endSession()
    }
  }, [startSession, endSession])

  return {
    startSession,
    endSession,
    getTimeStats,
    clearTimeData,
    getCurrentSessionTime,
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff)).toDateString()
}
