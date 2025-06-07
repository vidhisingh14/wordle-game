"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface TimeStats {
  daily: number
  weekly: number
  monthly: number
  total: number
  currentSession: number
}

interface User {
  id: string
  email: string
  name?: string
}

export function useTimeTracking() {
  const [currentTime, setCurrentTime] = useState(0)
  const [timeStats, setTimeStats] = useState<TimeStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    currentSession: 0
  })
  const [isActive, setIsActive] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const supabase = createClientComponentClient()

  // Wait for client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get current user from Supabase
  const getUser = useCallback(async () => {
    if (!isClient) return null
    
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error getting user:', error)
        return null
      }
      
      if (authUser) {
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name
        }
      }
      
      // Check for guest mode in localStorage as fallback
      const guestMode = localStorage.getItem('guestMode')
      if (guestMode === 'true') {
        return {
          id: 'guest_mode',
          email: 'guest@wordle.com',
          name: 'Guest User'
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }, [supabase, isClient])

  // Load user's time data from Supabase
  const loadTimeData = useCallback(async (userId: string) => {
    if (!isClient || userId === 'guest_mode') {
      // For guest mode, use localStorage
      try {
        const data = localStorage.getItem(`wordle_${userId}`)
        if (data) {
          const parsed = JSON.parse(data)
          setTimeStats({
            daily: Math.floor((parsed.daily || 0) / 1000),
            weekly: Math.floor((parsed.weekly || 0) / 1000),
            monthly: Math.floor((parsed.monthly || 0) / 1000),
            total: Math.floor((parsed.total || 0) / 1000),
            currentSession: 0
          })
        }
      } catch (error) {
        console.error('Error loading guest data:', error)
      }
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .rpc('get_user_time_summary', { 
          p_user_id: userId,
          p_date: today
        })
      
      if (error) {
        console.error('Error loading time data:', error)
        return
      }
      
      if (data && data.length > 0) {
        const stats = data[0]
        setTimeStats({
          daily: stats.daily_seconds || 0,
          weekly: stats.weekly_seconds || 0,
          monthly: stats.monthly_seconds || 0,
          total: stats.total_seconds || 0,
          currentSession: 0
        })
      } else {
        setTimeStats({
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          currentSession: 0
        })
      }
    } catch (error) {
      console.error('Error loading time data:', error)
    }
  }, [supabase, isClient])

  // Save session to Supabase or localStorage
  const saveSession = useCallback(async (userId: string, duration: number) => {
    if (duration < 1000) return
    
    if (!isClient) return
    
    if (userId === 'guest_mode') {
      // Save to localStorage for guest
      try {
        const key = `wordle_${userId}`
        const existing = localStorage.getItem(key)
        const data = existing ? JSON.parse(existing) : {}
        
        data.daily = (data.daily || 0) + duration
        data.weekly = (data.weekly || 0) + duration
        data.monthly = (data.monthly || 0) + duration
        data.total = (data.total || 0) + duration
        
        localStorage.setItem(key, JSON.stringify(data))
        
        setTimeStats({
          daily: Math.floor(data.daily / 1000),
          weekly: Math.floor(data.weekly / 1000),
          monthly: Math.floor(data.monthly / 1000),
          total: Math.floor(data.total / 1000),
          currentSession: 0
        })
      } catch (error) {
        console.error('Error saving guest session:', error)
      }
      return
    }

    try {
      const now = new Date()
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Insert session record
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          start_time: new Date(now.getTime() - duration).toISOString(),
          end_time: now.toISOString(),
          duration: Math.floor(duration / 1000), // Convert to seconds
          date: now.toISOString().split('T')[0]
        })

      if (sessionError) {
        console.error('Error saving session:', sessionError)
        return
      }

      // Update user time stats
      const today = now.toISOString().split('T')[0]
      const weekStart = getWeekStart(now)
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const yearKey = now.getFullYear().toString()

      const { error: statsError } = await supabase
        .from('user_time_stats')
        .upsert({
          user_id: userId,
          date_key: today,
          week_key: weekStart,
          month_key: monthKey,
          year_key: yearKey,
          daily_time: duration,
          weekly_time: duration,
          monthly_time: duration,
          total_time: duration,
          session_count: 1,
          last_active: now.toISOString()
        }, {
          onConflict: 'user_id,date_key',
          ignoreDuplicates: false
        })

      if (statsError) {
        console.error('Error updating stats:', statsError)
      }

      console.log(`💾 Saved ${Math.floor(duration / 1000)}s for ${userId}`)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }, [supabase, isClient])

  // Helper function to get week start (Monday)
  const getWeekStart = (date: Date): string => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  }

  // Start timer
  const startTimer = useCallback(() => {
    if (isActive || !user || !isClient) return
    
    console.log(`▶️ Starting timer for ${user.id}`)
    setIsActive(true)
    setCurrentTime(0)
    startTimeRef.current = Date.now()
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setCurrentTime(elapsed)
      }
    }, 1000)
  }, [isActive, user, isClient])

  // Stop timer
  const stopTimer = useCallback(() => {
    if (!isActive || !startTimeRef.current || !user || !isClient) return
    
    console.log(`⏹️ Stopping timer for ${user.id}`)
    setIsActive(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    const duration = Date.now() - startTimeRef.current
    startTimeRef.current = null
    setCurrentTime(0)
    
    if (duration >= 1000) {
      saveSession(user.id, duration)
    }
  }, [isActive, user, saveSession, isClient])

  // Initialize user and start timer
  useEffect(() => {
    if (!isClient) return

    const initializeUser = async () => {
      const currentUser = await getUser()
      console.log('👤 User:', currentUser)
      
      setUser(currentUser)
      
      if (currentUser) {
        await loadTimeData(currentUser.id)
        
        // Start timer after a short delay
        setTimeout(() => {
          if (!isActive) {
            setIsActive(true)
            setCurrentTime(0)
            startTimeRef.current = Date.now()
            
            intervalRef.current = setInterval(() => {
              if (startTimeRef.current) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
                setCurrentTime(elapsed)
              }
            }, 1000)
          }
        }, 100)
      }
    }

    initializeUser()
  }, [isClient]) // Only depend on isClient

  // Handle page visibility changes
  useEffect(() => {
    if (!isClient) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer()
      } else if (user) {
        startTimer()
      }
    }
    
    const handleBeforeUnload = () => {
      stopTimer()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user, startTimer, stopTimer, isClient])

  // Listen for auth changes
  useEffect(() => {
    if (!isClient) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_OUT') {
        // Stop current timer and clear user
        stopTimer()
        setUser(null)
        setTimeStats({
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          currentSession: 0
        })
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Load new user data
        const newUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name
        }
        setUser(newUser)
        await loadTimeData(newUser.id)
        startTimer()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, startTimer, stopTimer, loadTimeData, isClient])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Don't return anything until client-side hydration is complete
  if (!isClient) {
    return {
      currentTime: 0,
      timeStats: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0,
        currentSession: 0
      },
      isActive: false,
      user: null,
      connectionStatus: 'offline' as const
    }
  }

  return {
    currentTime,
    timeStats: {
      ...timeStats,
      currentSession: currentTime
    },
    isActive,
    user,
    connectionStatus: 'offline' as const
  }
}