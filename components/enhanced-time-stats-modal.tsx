// "use client"

// import { useState, useEffect } from "react"
// import { Dialog, DialogContent } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { X, Clock, Calendar, BarChart3 } from "lucide-react"

// interface EnhancedTimeStatsModalProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// export function EnhancedTimeStatsModal({ open, onOpenChange }: EnhancedTimeStatsModalProps) {
//   const [timeStats, setTimeStats] = useState({
//     currentSession: 0,
//     daily: 0,
//     weekly: 0,
//     monthly: 0,
//     totalSessions: 0,
//     totalTime: 0,
//     lastActive: 0,
//     browserFingerprint: "",
//   })

//   useEffect(() => {
//     if (!open) return

//     const updateStats = () => {
//       try {
//         const stored = localStorage.getItem("wordle-persistent-time")
//         if (stored) {
//           const data = JSON.parse(stored)
//           const now = new Date()
//           const today = now.toDateString()
//           const weekStart = getWeekStart(now)

//           // Calculate current session time if active
//           const currentSessionTime = 0
//           const sessions = data.sessions || []

//           // Filter and calculate times
//           const todaySessions = sessions.filter((s: any) => s.date === today)
//           const weekSessions = sessions.filter((s: any) => {
//             const sessionDate = new Date(s.startTime)
//             return sessionDate >= new Date(weekStart)
//           })
//           const monthSessions = sessions.filter((s: any) => {
//             const sessionDate = new Date(s.startTime)
//             return sessionDate.getFullYear() === now.getFullYear() && sessionDate.getMonth() === now.getMonth()
//           })

//           const dailyTime = todaySessions.reduce((sum: number, s: any) => sum + s.duration, 0)
//           const weeklyTime = weekSessions.reduce((sum: number, s: any) => sum + s.duration, 0)
//           const monthlyTime = monthSessions.reduce((sum: number, s: any) => sum + s.duration, 0)

//           setTimeStats({
//             currentSession: currentSessionTime,
//             daily: Math.floor(dailyTime / 1000),
//             weekly: Math.floor(weeklyTime / 1000),
//             monthly: Math.floor(monthlyTime / 1000),
//             totalSessions: sessions.length,
//             totalTime: Math.floor((data.totalTime || 0) / 1000),
//             lastActive: data.lastActiveTime || 0,
//             browserFingerprint: data.browserFingerprint || "",
//           })
//         }
//       } catch (error) {
//         console.error("Error reading time stats:", error)
//       }
//     }

//     updateStats()
//     const interval = setInterval(updateStats, 1000)

//     return () => clearInterval(interval)
//   }, [open])

//   const formatTime = (seconds: number) => {
//     const hours = Math.floor(seconds / 3600)
//     const minutes = Math.floor((seconds % 3600) / 60)
//     const secs = seconds % 60

//     if (hours > 0) {
//       return `${hours}h ${minutes}m ${secs}s`
//     } else if (minutes > 0) {
//       return `${minutes}m ${secs}s`
//     } else {
//       return `${secs}s`
//     }
//   }

//   const formatLastActive = (timestamp: number) => {
//     if (!timestamp) return "Never"
//     const diff = Date.now() - timestamp
//     const minutes = Math.floor(diff / 60000)
//     const hours = Math.floor(minutes / 60)
//     const days = Math.floor(hours / 24)

//     if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
//     if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
//     if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
//     return "Just now"
//   }

//   const clearTimeData = () => {
//     try {
//       localStorage.removeItem("wordle-persistent-time")
//       setTimeStats({
//         currentSession: 0,
//         daily: 0,
//         weekly: 0,
//         monthly: 0,
//         totalSessions: 0,
//         totalTime: 0,
//         lastActive: 0,
//         browserFingerprint: "",
//       })
//     } catch (error) {
//       console.error("Error clearing time data:", error)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="wordle-bg wordle-text wordle-border max-w-lg border-2">
//         <div className="p-4">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-wordle-bold flex items-center gap-2">
//               <Clock size={24} />
//               Time Tracking
//             </h2>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => onOpenChange(false)}
//               className="wordle-text hover:bg-gray-800 p-1"
//             >
//               <X size={20} />
//             </Button>
//           </div>

//           <div className="space-y-6">
//             {/* Current Session */}
//             <div className="bg-gray-800 rounded-lg p-4">
//               <h3 className="text-lg font-wordle-bold mb-3 text-green-400 flex items-center gap-2">
//                 <BarChart3 size={20} />
//                 Current Session
//               </h3>
//               <div className="text-3xl font-wordle-bold text-center py-2">{formatTime(timeStats.currentSession)}</div>
//             </div>

//             {/* Time Statistics */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-wordle-bold mb-3 flex items-center gap-2">
//                 <Calendar size={20} />
//                 Statistics
//               </h3>

//               <div className="grid grid-cols-1 gap-3">
//                 <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
//                   <span className="font-wordle-medium">Today:</span>
//                   <span className="font-wordle-bold text-blue-400">{formatTime(timeStats.daily)}</span>
//                 </div>

//                 <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
//                   <span className="font-wordle-medium">This Week:</span>
//                   <span className="font-wordle-bold text-yellow-400">{formatTime(timeStats.weekly)}</span>
//                 </div>

//                 <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
//                   <span className="font-wordle-medium">This Month:</span>
//                   <span className="font-wordle-bold text-purple-400">{formatTime(timeStats.monthly)}</span>
//                 </div>

//                 <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
//                   <span className="font-wordle-medium">Total Time:</span>
//                   <span className="font-wordle-bold text-green-400">{formatTime(timeStats.totalTime)}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Session Info */}
//             <div className="bg-gray-800 rounded-lg p-4">
//               <h3 className="text-lg font-wordle-bold mb-3">Session Info</h3>
//               <div className="space-y-2 text-sm">
//                 <div className="flex justify-between">
//                   <span>Total Sessions:</span>
//                   <span className="font-wordle-bold">{timeStats.totalSessions}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Last Active:</span>
//                   <span className="font-wordle-bold">{formatLastActive(timeStats.lastActive)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Browser ID:</span>
//                   <span className="font-wordle-bold text-xs">{timeStats.browserFingerprint.slice(0, 8)}...</span>
//                 </div>
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="flex gap-3 pt-4">
//               <Button
//                 onClick={clearTimeData}
//                 variant="outline"
//                 className="flex-1 bg-transparent border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-wordle-medium"
//               >
//                 Clear Data
//               </Button>
//               <Button
//                 onClick={() => onOpenChange(false)}
//                 className="flex-1 bg-green-600 hover:bg-green-700 text-white font-wordle-medium"
//               >
//                 Close
//               </Button>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

// function getWeekStart(date: Date): string {
//   const d = new Date(date)
//   const day = d.getDay()
//   const diff = d.getDate() - day
//   return new Date(d.setDate(diff)).toDateString()
// }
