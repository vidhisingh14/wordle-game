"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { GameGrid } from "@/components/game-grid"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { useGameLogic } from "@/hooks/use-game-logic"
import { useUnifiedTimeTracking } from "@/hooks/use-unified-time-tracking"
import { TimeStatsModal } from "@/components/time-stats-modal"
import { useAuth } from "@/contexts/AuthContext"

export default function GamePage() {
  const [showRules, setShowRules] = useState(true)
  const [showTimeStats, setShowTimeStats] = useState(false)
  const { user, signOut, isGuest } = useAuth()
  const { currentTime, timeStats, isActive } = useUnifiedTimeTracking()
  const { currentGuess, guesses, currentRow, gameStatus, keyboardStatus, targetWord, handleKeyPress, submitGuess, resetGame } =
    useGameLogic()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (showRules || showTimeStats) return

      const key = event.key.toLowerCase()

      if (key === "enter") {
        event.preventDefault()
        submitGuess()
      } else if (key === "backspace") {
        event.preventDefault()
        handleKeyPress("BACKSPACE")
      } else if (/^[a-z]$/.test(key)) {
        event.preventDefault()
        handleKeyPress(key.toUpperCase())
      }
    },
    [showRules, showTimeStats, handleKeyPress, submitGuess],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/' // Redirect to home page
  }

  return (
    <div className="min-h-screen wordle-bg wordle-text">
      {/* Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="wordle-bg wordle-text wordle-border max-w-[90vw] sm:max-w-md border-2">
          <DialogTitle className="text-xl sm:text-2xl font-wordle-bold mb-4">How To Play</DialogTitle>
          
          <div className="p-2">
            <p className="mb-4 text-sm sm:text-base font-wordle-normal">Guess the Wordle in 6 tries.</p>

            <ul className="space-y-2 mb-6 text-xs sm:text-sm font-wordle-normal">
              <li>• Each guess must be a valid 5-letter word.</li>
              <li>• The color of the tiles will change to show how close your guess was to the word.</li>
            </ul>

            <div className="space-y-4">
              <div>
                <h3 className="font-wordle-bold mb-3 text-sm sm:text-base">Examples</h3>

                <div className="flex gap-1 mb-2 justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-correct flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    W
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    O
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    R
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    D
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    Y
                  </div>
                </div>
                <p className="text-xs sm:text-sm mb-4 font-wordle-normal">W is in the word and in the correct spot.</p>

                <div className="flex gap-1 mb-2 justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    L
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-present flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    I
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    G
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    H
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    T
                  </div>
                </div>
                <p className="text-xs sm:text-sm mb-4 font-wordle-normal">I is in the word but in the wrong spot.</p>

                <div className="flex gap-1 mb-2 justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    R
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    O
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    G
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-absent flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    U
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-xs sm:text-sm">
                    E
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-wordle-normal">U is not in the word in any spot.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Stats Modal */}
      <TimeStatsModal
        open={showTimeStats}
        onOpenChange={setShowTimeStats}
        currentTime={currentTime}
        timeStats={timeStats}
      />

      {/* Game Header - Mobile Optimized */}
      <header className="border-b wordle-border p-3 sm:p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h1 className="text-2xl sm:text-3xl font-wordle-bold">Wordle</h1>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRules(true)}
                className="wordle-text hover:bg-gray-800 font-wordle-medium text-xs sm:text-sm px-2 sm:px-3"
              >
                Rules
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeStats(true)}
                className="wordle-text hover:bg-gray-800 font-wordle-medium text-xs sm:text-sm px-2 sm:px-3"
              >
                {user ? "Stats" : "Time"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetGame}
                className="wordle-text hover:bg-gray-800 font-wordle-medium text-xs sm:text-sm px-2 sm:px-3"
              >
                New
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="wordle-text hover:bg-gray-800 font-wordle-medium text-xs sm:text-sm px-2 sm:px-3"
                >
                  Sign Out
                </Button>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            <span className="font-wordle-normal"></span>
            <span className="ml-2 sm:ml-4 text-green-400">
              Timer: {currentTime}s {isActive ? "🟢" : "🔴"}
            </span>
            {user && (
              <span className="ml-2 text-blue-400">
                👤 {user.user_metadata?.full_name || user.email}
              </span>
            )}
            {isGuest && (
              <span className="ml-2 text-yellow-400">
                🎮 Guest Mode
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Game Content - Mobile Optimized */}
      <main className="max-w-md mx-auto p-3 sm:p-4 flex flex-col min-h-[calc(100vh-120px)]">
        {/* Game Grid - Responsive */}
        <div className="flex-1 flex items-start justify-center pt-4">
          <GameGrid guesses={guesses} currentGuess={currentGuess} currentRow={currentRow} targetWord={targetWord} />
        </div>

        {/* Game Status Messages */}
        {gameStatus !== "playing" && (
          <div className="text-center my-4 sm:my-6">
            {gameStatus === "won" ? (
              <>
                <p className="text-lg sm:text-xl font-wordle-bold mb-2 sm:mb-3 text-green-400">🎉 Congratulations!</p>
                <p className="text-xs sm:text-sm font-wordle-medium mb-3 sm:mb-4 text-gray-300">
                  You guessed <span className="text-green-400 font-wordle-bold">{targetWord}</span> correctly!
                </p>
              </>
            ) : (
              <>
                <p className="text-lg sm:text-xl font-wordle-bold mb-2 sm:mb-3">Game Over!</p>
                <p className="text-2xl sm:text-3xl font-wordle-bold mb-3 sm:mb-4 text-yellow-400 tracking-wider">
                  {targetWord}
                </p>
              </>
            )}
            
            <Button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 text-white font-wordle-medium px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base"
            >
              Play Again
            </Button>
          </div>
        )}

        {/* Virtual Keyboard - Mobile Optimized */}
        <div className="mt-auto pb-2">
          <VirtualKeyboard onKeyPress={handleKeyPress} onEnter={submitGuess} keyboardStatus={keyboardStatus} />
        </div>
      </main>
    </div>
  )
}