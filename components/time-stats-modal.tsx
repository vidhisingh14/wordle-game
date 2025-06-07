"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface TimeStatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTime: number
  timeStats: { 
    daily: number
    weekly: number
    monthly: number
    total?: number
    currentSession: number
  }
  isLoading?: boolean
}

export function TimeStatsModal({ open, onOpenChange, currentTime, timeStats, isLoading = false }: TimeStatsModalProps) {
  const { user, isGuest } = useAuth()

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

  const clearTimeData = async () => {
    try {
      if (user) {
        // For logged-in users, you might want to implement a clear function
        // that removes their data from Supabase (optional)
        alert("Clear user data functionality can be implemented here")
      } else {
        // For guest users, clear localStorage
        localStorage.removeItem("wordle-time-tracking")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error clearing time data:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wordle-bg wordle-text wordle-border max-w-md border-2">
        <DialogTitle className="text-2xl font-wordle-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Time Spent
          {user && <span className="text-sm text-blue-400">(Account)</span>}
          {isGuest && <span className="text-sm text-yellow-400">(Guest)</span>}
        </DialogTitle>
        
        <div className="p-4">
          <div className="space-y-6">
            {/* Current Session */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-wordle-bold mb-3 text-green-400">Current Session</h3>
              <div className="text-3xl font-wordle-bold text-center py-2">
                {formatTime(currentTime)}
              </div>
            </div>

            {/* Time Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-wordle-bold mb-3">Statistics</h3>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Loading stats...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="font-wordle-medium">Today:</span>
                    <span className="font-wordle-bold text-blue-400">
                      {formatTime(timeStats.daily + currentTime)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="font-wordle-medium">This Week:</span>
                    <span className="font-wordle-bold text-yellow-400">
                      {formatTime(timeStats.weekly + currentTime)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="font-wordle-medium">This Month:</span>
                    <span className="font-wordle-bold text-purple-400">
                      {formatTime(timeStats.monthly + currentTime)}
                    </span>
                  </div>

                  {user && timeStats.total !== undefined && (
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="font-wordle-medium">Total Time:</span>
                      <span className="font-wordle-bold text-green-400">
                        {formatTime(timeStats.total + currentTime)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="bg-gray-900 rounded-lg p-3 text-xs">
              <div className="text-gray-400">Mode:</div>
              {user ? (
                <div className="text-blue-400">
                  👤 Logged in as {user.user_metadata?.full_name || user.email}
                </div>
              ) : (
                <div className="text-yellow-400">
                  🎮 Guest Mode (Browser-specific tracking)
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {!user && (
                <Button
                  onClick={clearTimeData}
                  variant="outline"
                  className="flex-1 bg-transparent border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-wordle-medium"
                >
                  Clear Data
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-wordle-medium"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}