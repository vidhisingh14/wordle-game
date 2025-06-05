"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Clock } from "lucide-react"

interface TimeStatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTime: number
  timeStats: { daily: number; weekly: number; monthly: number }
}

export function TimeStatsModal({ open, onOpenChange, currentTime, timeStats }: TimeStatsModalProps) {
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

  const clearTimeData = () => {
    try {
      localStorage.removeItem("wordle-time-tracking")
      // Force page reload to reset the timer
      window.location.reload()
    } catch (error) {
      console.error("Error clearing time data:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wordle-bg wordle-text wordle-border max-w-md border-2">
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-wordle-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Time Spent
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="wordle-text hover:bg-gray-800 p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Current Session */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-wordle-bold mb-3 text-green-400">Current Session</h3>
              <div className="text-3xl font-wordle-bold text-center py-2">{formatTime(currentTime)}</div>
            </div>

            {/* Time Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-wordle-bold mb-3">Statistics</h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="font-wordle-medium">Today:</span>
                  <span className="font-wordle-bold text-blue-400">{formatTime(timeStats.daily)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="font-wordle-medium">This Week:</span>
                  <span className="font-wordle-bold text-yellow-400">{formatTime(timeStats.weekly)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="font-wordle-medium">This Month:</span>
                  <span className="font-wordle-bold text-purple-400">{formatTime(timeStats.monthly)}</span>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-900 rounded-lg p-3 text-xs">
              <div className="text-gray-400">Debug Info:</div>
              <div>Current Time: {currentTime}s</div>
              <div>Timer Active: {currentTime > 0 ? "Yes" : "No"}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={clearTimeData}
                variant="outline"
                className="flex-1 bg-transparent border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-wordle-medium"
              >
                Clear Data
              </Button>
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
