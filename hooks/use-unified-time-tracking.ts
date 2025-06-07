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
  const [isLoading, setIsLoading] = useState(true)
  
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
    if (!user) {
      console.log('❌ No user found, skipping stats load')
      return
    }

    try {
      console.log('📊 Loading stats for user:', user.id)
      setIsLoading(true)
      const { today, weekStart, monthKey } = getDateKeys()
      console.log('📅 Date keys:', { today, weekStart, monthKey })
      
      // First, try to get aggregated stats
      const { data: stats, error } = await supabase
        .from('user_time_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_key', today)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading user time stats:', error)
      }

      if (stats) {
        // Use existing aggregated stats
        console.log('✅ Found aggregated stats:', stats)
        setTimeStats({
          daily: Math.floor(stats.daily_time / 1000),
          weekly: Math.floor(stats.weekly_time / 1000),
          monthly: Math.floor(stats.monthly_time / 1000),
          total: Math.floor(stats.total_time / 1000),
          currentSession: 0
        })
        setIsLoading(false)
        return
      }

      // Fallback: Calculate stats from time_sessions if no aggregated stats exist
      console.log('⚠ No aggregated stats found, calculating from sessions...')
      
      // Get all sessions for this user
      const { data: sessions, error: sessionsError } = await supabase
        .from('time_sessions')
        .select('duration, date, start_time')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })

      if (sessionsError) {
        console.error('❌ Error loading time sessions:', sessionsError)
        setIsLoading(false)
        return
      }

      console.log('📋 Found sessions:', sessions?.length || 0)

      if (!sessions || sessions.length === 0) {
        // No sessions found - new user
        console.log('🆕 No sessions found - new user')
        setTimeStats({
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          currentSession: 0
        })
        setIsLoading(false)
        return
      }

      // Calculate stats from sessions
      let dailyTime = 0
      let weeklyTime = 0
      let monthlyTime = 0
      let totalTime = 0

      const todayStr = today
      const weekStartStr = weekStart
      const monthStr = monthKey

      sessions.forEach(session => {
        const sessionDate = session.date
        const sessionTime = session.start_time
        const duration = session.duration || 0

        totalTime += duration

        // Daily calculation
        if (sessionDate === todayStr) {
          dailyTime += duration
        }

        // Weekly calculation (sessions from this week)
        if (sessionDate >= weekStartStr && sessionDate <= todayStr) {
          weeklyTime += duration
        }

        // Monthly calculation
        const sessionMonth = sessionTime ? sessionTime.substring(0, 7) : sessionDate.substring(0, 7) // YYYY-MM
        if (sessionMonth === monthStr) {
          monthlyTime += duration
        }
      })

      const calculatedStats = {
        daily: Math.floor(dailyTime / 1000),
        weekly: Math.floor(weeklyTime / 1000),
        monthly: Math.floor(monthlyTime / 1000),
        total: Math.floor(totalTime / 1000),
        currentSession: 0
      }

      console.log('🧮 Calculated stats from sessions:', calculatedStats)

      setTimeStats(calculatedStats)
      setIsLoading(false)
    } catch (error) {
      console.error('💥 Unhandled error loading user time stats:', error)
      setIsLoading(false)
    }
  }, [user, getDateKeys])

  // Load browser-specific time stats (for guest users)
  const loadBrowserTimeStats = useCallback(() => {
    try {
      setIsLoading(true)
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
      } else {
        // No browser data found - keep zeros
        setTimeStats({
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          currentSession: 0
        })
      }
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading browser time stats:", error)
      setIsLoading(false)
    }
  }, [getDateKeys])

  // FIXED: Save user session using proper increment logic
  const saveUserSession = useCallback(async (sessionDuration: number) => {
    if (!user || !sessionIdRef.current || !startTimeRef.current) {
      console.error('saveUserSession: Missing required values')
      return
    }

    try {
      const { today, weekStart, monthKey } = getDateKeys()
      const startTime = new Date(startTimeRef.current).toISOString()
      const endTime = new Date().toISOString()

      // First, save the session
      const sessionData = {
        id: sessionIdRef.current,
        session_id: sessionIdRef.current,
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        duration: sessionDuration,
        date: today
      }

      const { error: sessionError } = await supabase
        .from('time_sessions')
        .insert(sessionData)

      if (sessionError) {
        console.error('Error saving session:', sessionError)
        console.error('Session data that failed:', sessionData)
        return
      }

      // Get existing stats to increment them
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_time_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_key', today)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching existing stats:', fetchError)
        return
      }

      // Calculate new totals by adding session duration to existing values
      const newStats = {
        user_id: user.id,
        date_key: today,
        week_key: weekStart,
        month_key: monthKey,
        year_key: new Date().getFullYear().toString(),
        daily_time: (existingStats?.daily_time || 0) + sessionDuration,
        weekly_time: (existingStats?.weekly_time || 0) + sessionDuration,
        monthly_time: (existingStats?.monthly_time || 0) + sessionDuration,
        total_time: (existingStats?.total_time || 0) + sessionDuration,
        last_active: endTime,
        updated_at: endTime
      }

      // Use upsert to insert or update
      const { error: upsertError } = await supabase
        .from('user_time_stats')
        .upsert(newStats, {
          onConflict: 'user_id,date_key',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('Error upserting user_time_stats:', upsertError)
        return
      }

      // Update local state directly instead of reloading from database
      setTimeStats(prevStats => ({
        daily: Math.floor(newStats.daily_time / 1000),
        weekly: Math.floor(newStats.weekly_time / 1000),
        monthly: Math.floor(newStats.monthly_time / 1000),
        total: Math.floor(newStats.total_time / 1000),
        currentSession: 0
      }))

    } catch (error) {
      console.error('Unhandled error in saveUserSession:', error)
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
    // Prevent starting multiple sessions
    if (startTimeRef.current || intervalRef.current) {
      return
    }

    const now = Date.now()
    const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : `${now}-${Math.random().toString(36).substr(2, 9)}`

    sessionIdRef.current = sessionId
    startTimeRef.current = now
    setCurrentTime(0)
    setIsActive(true)

    // Start timer
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current || !isActive) return

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setCurrentTime(elapsed)

      setTimeStats(prevStats => ({
        ...prevStats,
        currentSession: elapsed
      }))
    }, 1000)

  }, [isActive])

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
        if (startTimeRef.current || sessionIdRef.current) {
          const sessionDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0
          
          // Clear timer
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }

          // Save session data
          if (user && sessionDuration > 0) {
            saveUserSession(sessionDuration)
          } else if (isGuest && sessionDuration > 0) {
            saveBrowserSession(sessionDuration)
          }

          // Reset state
          startTimeRef.current = null
          sessionIdRef.current = null
          setCurrentTime(0)
          setIsActive(false)
        }
      } else {
        // Only start session if not already running
        if (!startTimeRef.current && !intervalRef.current) {
          setIsActive(true)
          
          const now = Date.now()
          const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `${now}-${Math.random().toString(36).substr(2, 9)}`

          sessionIdRef.current = sessionId
          startTimeRef.current = now
          setCurrentTime(0)

          // Start timer
          intervalRef.current = setInterval(() => {
            if (!startTimeRef.current) return

            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
            setCurrentTime(elapsed)

            setTimeStats(prevStats => ({
              ...prevStats,
              currentSession: elapsed
            }))
          }, 1000)
        }
      }
    }

    const handleBeforeUnload = () => {
      if (startTimeRef.current || sessionIdRef.current) {
        const sessionDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0
        
        // Clear timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // Save session data
        if (user && sessionDuration > 0) {
          saveUserSession(sessionDuration)
        } else if (isGuest && sessionDuration > 0) {
          saveBrowserSession(sessionDuration)
        }

        // Reset state
        startTimeRef.current = null
        sessionIdRef.current = null
        setCurrentTime(0)
        setIsActive(false)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      handleBeforeUnload() // Clean up on unmount
    }
  }, [user, isGuest, saveUserSession, saveBrowserSession])

  // Initialize session on mount and when auth state changes
  useEffect(() => {
    const initializeTracking = async () => {
      console.log('🔄 Initializing time tracking...', { user: user?.id, isGuest })
      
      // First, load existing stats
      if (user) {
        console.log('👤 Loading user stats for:', user.id)
        await loadUserTimeStats()
      } else if (isGuest) {
        console.log('👻 Loading guest stats from localStorage')
        loadBrowserTimeStats()
      } else {
        console.log('⏳ No user or guest mode detected, waiting...')
        return
      }
      
      // Then start the session after stats are loaded
      console.log('▶ Starting new session...')
      startSession()
    }

    initializeTracking()
    return () => {
      console.log('🛑 Cleaning up time tracking...')
      endSession()
    }
  }, [user, isGuest])

  return {
    currentTime,
    timeStats: {
      ...timeStats,
      currentSession: currentTime
    },
    isActive,
    isLoading,
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