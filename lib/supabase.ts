// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface TimeSession {
  id: string
  user_id: string
  session_id: string
  start_time: string
  end_time?: string
  duration: number
  date: string
  created_at: string
  updated_at: string
}

export interface UserTimeStats {
  id: string
  user_id: string
  daily_time: number
  weekly_time: number
  monthly_time: number
  total_time: number
  session_count?: number
  average_session_duration?: number
  longest_session_duration?: number
  last_active: string
  first_play_date?: string
  streak_days?: number
  last_streak_date?: string
  date_key: string
  week_key: string
  month_key: string
  year_key: string
  created_at: string
  updated_at: string
}