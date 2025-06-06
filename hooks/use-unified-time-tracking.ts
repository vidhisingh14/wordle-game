// hooks/use-unified-time-tracking.ts
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"

interface TimeStats {
  daily: number
  weekly: number
  monthly: number
  total?: number
  currentSession: number
}

export function useUnifiedTimeTracking() {
  const { user, isGuest } = useAuth()
  const [currentTime, setCurrentTime] = useState(0)
  const [timeStats, setTimeStats] = useState<TimeStats>({ 
    daily: 0, 
    weekly: 0, 
    monthly: 0,
    total: 0,
    currentSession: 0
  })
  const [isActive, setIsActive] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  // Generate date keys
  const getDateKeys = useCallback(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD
    const weekStart = getWeekStart(now)
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    return { today, weekStart, monthKey }
  }, [])

  // Load user-specific time stats from Supabase
  const loadUserTimeStats = useCallback(async () => {
    if (!user) return

    try {
      const { today, weekStart, monthKey } = getDateKeys()
      
      const { data: stats, error } = await supabase
        .from('user_time_stats')
        .select('*')
        .eq('user_id', user.id)
        .in('date_key', [today])
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading user time stats:', error)
        return
      }

      if (stats) {
        setTimeStats({
          daily: Math.floor(stats.daily_time / 1000),
          weekly: Math.floor(stats.weekly_time / 1000),
          monthly: Math.floor(stats.monthly_time / 1000),
          total: Math.floor(stats.total_time / 1000),
          currentSession: 0
        })
      }
    } catch (error) {
      console.error('Error loading user time stats:', error)
    }
  }, [user, getDateKeys])

  // Load browser-specific time stats (for guest users)
  const loadBrowserTimeStats = useCallback(() => {
    try {
      const timeDataString = localStorage.getItem("wordle-time-tracking")
      if (timeDataString) {
        const timeData = JSON.parse(timeDataString)
        const { today, weekStart, monthKey } = getDateKeys()

        setTimeStats({
          daily: Math.floor((timeData.daily?.[today] || 0) / 1000),
          weekly: Math.floor((timeData.weekly?.[weekStart] || 0) / 1000),
          monthly: Math.floor((timeData.monthly?.[monthKey] || 0) / 1000),
          currentSession: 0
        })
      }
    } catch (error) {
      console.error("Error loading browser time stats:", error)
    }
  }, [getDateKeys])

  // Save user session to Supabase
  const saveUserSession = useCallback(async (sessionDuration: number) => {
    if (!user || !sessionIdRef.current || !startTimeRef.current) return

    try {
      const { today, weekStart, monthKey } = getDateKeys()
      const startTime = new Date(startTimeRef.current).toISOString()
      const endTime = new Date().toISOString()

      // Save session
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .insert({
          id: sessionIdRef.current,
          user_id: user.id,
          start_time: startTime,
          end_time: endTime,
          duration: sessionDuration,
          date: today
        })

      if (sessionError) {
        console.error('Error saving session:', sessionError)
        return
      }

      // Update or create time stats
      const { data: existingStats } = await supabase
        .from('user_time_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_key', today)
        .single()

      const statsData = {
        user_id: user.id,
        daily_time: (existingStats?.daily_time || 0) + sessionDuration,
        weekly_time: (existingStats?.weekly_time || 0) + sessionDuration,
        monthly_time: (existingStats?.monthly_time || 0) + sessionDuration,
        total_time: (existingStats?.total_time || 0) + sessionDuration,
        last_active: endTime,
        date_key: today,
        week_key: weekStart,
        month_key: monthKey,
        updated_at: endTime
      }

      if (existingStats) {
        const { error: updateError } = await supabase
          .from('user_time_stats')
          .update(statsData)
          .eq('user_id', user.id)
          .eq('date_key', today)
      } else {
        const { error: insertError } = await supabase
          .from('user_time_stats')
          .insert(statsData)
      }

    } catch (error) {
      console.error('Error saving user session:', error)
    }
  }, [user, getDateKeys])

  // Save browser session (for guest users)
  const saveBrowserSession = useCallback((sessionDuration: number) => {
    try {
      const { today, weekStart, monthKey } = getDateKeys()
      const timeDataString = localStorage.getItem("wordle-time-tracking")
      const timeData = timeDataString ? JSON.parse(timeDataString) : {}

      // Update time periods
      timeData.daily = timeData.daily || {}
      timeData.daily[today] = (timeData.daily[today] || 0) + sessionDuration

      timeData.weekly = timeData.weekly || {}
      timeData.weekly[weekStart] = (timeData.weekly[weekStart] || 0) + sessionDuration

      timeData.monthly = timeData.monthly || {}
      timeData.monthly[monthKey] = (timeData.monthly[monthKey] || 0) + sessionDuration

      localStorage.setItem("wordle-time-tracking", JSON.stringify(timeData))
    } catch (error) {
      console.error("Error saving browser session:", error)
    }
  }, [getDateKeys])

  // Start tracking session
  const startSession = useCallback(() => {
    const now = Date.now()
    const sessionId = `session_${now}_${Math.random().toString(36).substr(2, 9)}`

    sessionIdRef.current = sessionId
    startTimeRef.current = now
    setCurrentTime(0)
    setIsActive(true)

    // Load existing stats
    if (user) {
      loadUserTimeStats()
    } else if (isGuest) {
      loadBrowserTimeStats()
    }

    // Start timer
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current || !isActive) return

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setCurrentTime(elapsed)

      // Update stats with current session included
      setTimeStats(prevStats => ({
        ...prevStats,
        currentSession: elapsed,
        daily: (prevStats.daily || 0),
        weekly: (prevStats.weekly || 0),
        monthly: (prevStats.monthly || 0)
      }))
    }, 1000)

  }, [user, isGuest, loadUserTimeStats, loadBrowserTimeStats, isActive])

  // End tracking session
  const endSession = useCallback(() => {
    if (!startTimeRef.current || !sessionIdRef.current) return

    const sessionDuration = Date.now() - startTimeRef.current

    // Clear timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Save session data
    if (user) {
      saveUserSession(sessionDuration)
    } else if (isGuest) {
      saveBrowserSession(sessionDuration)
    }

    // Reset state
    startTimeRef.current = null
    sessionIdRef.current = null
    setCurrentTime(0)
    setIsActive(false)
  }, [user, isGuest, saveUserSession, saveBrowserSession])

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false)
        endSession()
      } else {
        setIsActive(true)
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

  // Initialize session on mount
  useEffect(() => {
    startSession()
    return () => endSession()
  }, [user, isGuest]) // Restart when auth state changes

  return {
    currentTime,
    timeStats: {
      ...timeStats,
      currentSession: currentTime
    },
    isActive,
    startSession,
    endSession
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}