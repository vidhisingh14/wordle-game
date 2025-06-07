"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // SIMPLE: Get current user identifier
  const getUserId = useCallback(() => {
    try {
      // Check localStorage values
      const userData = localStorage.getItem('user')
      const guestMode = localStorage.getItem('guestMode')
      
      console.log('🔍 Checking user state:')
      console.log('  - userData:', userData)
      console.log('  - guestMode:', guestMode)
      
      // If explicitly in guest mode, return guest
      if (guestMode === 'true') {
        console.log('  → Guest mode detected')
        return 'guest_mode'
      }
      
      // If we have user data and NOT in guest mode, return authenticated user
      if (userData && guestMode !== 'true') {
        const parsed = JSON.parse(userData)
        const userId = `auth_${parsed.email}`
        console.log('  → Authenticated user:', userId)
        return userId
      }
      
      console.log('  → No user detected')
      return null
    } catch (error) {
      console.error('Error getting user ID:', error)
      return null
    }
  }, [])

  // SIMPLE: Get user object
  const getUser = useCallback(() => {
    try {
      const guestMode = localStorage.getItem('guestMode')
      
      // Check guest mode first
      if (guestMode === 'true') {
        return {
          id: 'guest_mode',
          email: 'guest@wordle.com',
          name: 'Guest User'
        }
      }
      
      // Then check for authenticated user
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsed = JSON.parse(userData)
        return {
          id: `auth_${parsed.email}`,
          email: parsed.email,
          name: parsed.name || parsed.user_metadata?.full_name
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }, [])

  // SIMPLE: Get storage key for user
  const getStorageKey = useCallback((userId: string) => {
    return `wordle_${userId}`
  }, [])

  // SIMPLE: Get today's date
  const getToday = useCallback(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  // SIMPLE: Load user's time data
  const loadTimeData = useCallback((userId: string) => {
    try {
      const key = getStorageKey(userId)
      const data = localStorage.getItem(key)
      
      if (data) {
        const parsed = JSON.parse(data)
        const today = getToday()
        
        setTimeStats({
          daily: Math.floor((parsed.daily || 0) / 1000),
          weekly: Math.floor((parsed.weekly || 0) / 1000),
          monthly: Math.floor((parsed.monthly || 0) / 1000),
          total: Math.floor((parsed.total || 0) / 1000),
          currentSession: 0
        })
        
        console.log(`📊 Loaded data for ${userId}:`, {
          daily: Math.floor((parsed.daily || 0) / 1000),
          weekly: Math.floor((parsed.weekly || 0) / 1000),
          monthly: Math.floor((parsed.monthly || 0) / 1000),
          total: Math.floor((parsed.total || 0) / 1000)
        })
      } else {
        // No data - start fresh
        setTimeStats({
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          currentSession: 0
        })
        console.log(`🆕 Fresh start for ${userId}`)
      }
    } catch (error) {
      console.error('Error loading time data:', error)
      setTimeStats({
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0,
        currentSession: 0
      })
    }
  }, [getStorageKey, getToday])

  // SIMPLE: Save session for user
  const saveSession = useCallback((userId: string, duration: number) => {
    if (duration < 1000) return
    
    try {
      const key = getStorageKey(userId)
      const existing = localStorage.getItem(key)
      const data = existing ? JSON.parse(existing) : {}
      
      // Add session duration to all time periods
      data.daily = (data.daily || 0) + duration
      data.weekly = (data.weekly || 0) + duration
      data.monthly = (data.monthly || 0) + duration
      data.total = (data.total || 0) + duration
      
      localStorage.setItem(key, JSON.stringify(data))
      
      // Update display immediately
      setTimeStats({
        daily: Math.floor(data.daily / 1000),
        weekly: Math.floor(data.weekly / 1000),
        monthly: Math.floor(data.monthly / 1000),
        total: Math.floor(data.total / 1000),
        currentSession: 0
      })
      
      console.log(`💾 Saved ${Math.floor(duration / 1000)}s for ${userId}`)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }, [getStorageKey])

  // SIMPLE: Start timer
  const startTimer = useCallback(() => {
    if (isActive || !user) return
    
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
  }, [isActive, user])

  // SIMPLE: Stop timer
  const stopTimer = useCallback(() => {
    if (!isActive || !startTimeRef.current || !user) return
    
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
  }, [isActive, user, saveSession])

  // SIMPLE: Initialize immediately
  useEffect(() => {
    const currentUser = getUser()
    console.log('👤 User:', currentUser)
    
    setUser(currentUser)
    
    if (currentUser) {
      loadTimeData(currentUser.id)
      // Start timer immediately
      setTimeout(() => {
        setIsActive(true)
        setCurrentTime(0)
        startTimeRef.current = Date.now()
        
        intervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
            setCurrentTime(elapsed)
          }
        }, 1000)
      }, 100)
    }
  }, []) // Only run once

  // SIMPLE: Watch for user changes by checking localStorage directly
  useEffect(() => {
    const checkUserChange = () => {
      const currentUserId = getUserId()
      const stateUserId = user?.id || null
      
      if (currentUserId !== stateUserId) {
        console.log(`🔄 User changed: ${stateUserId} → ${currentUserId}`)
        
        // Save current session
        if (isActive && startTimeRef.current && user) {
          const duration = Date.now() - startTimeRef.current
          if (duration >= 1000) {
            saveSession(user.id, duration)
          }
        }
        
        // Stop timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsActive(false)
        setCurrentTime(0)
        startTimeRef.current = null
        
        // Switch to new user
        const newUser = getUser()
        setUser(newUser)
        
        if (newUser) {
          loadTimeData(newUser.id)
          // Start timer for new user
          setTimeout(() => {
            setIsActive(true)
            setCurrentTime(0)
            startTimeRef.current = Date.now()
            
            intervalRef.current = setInterval(() => {
              if (startTimeRef.current) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
                setCurrentTime(elapsed)
              }
            }, 1000)
          }, 100)
        }
      }
    }
    
    // Check every 2 seconds
    const interval = setInterval(checkUserChange, 2000)
    
    return () => clearInterval(interval)
  }, [user, isActive, getUserId, getUser, loadTimeData, saveSession])

  // SIMPLE: Handle page visibility
  useEffect(() => {
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
  }, [user, startTimer, stopTimer])

  // SIMPLE: Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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