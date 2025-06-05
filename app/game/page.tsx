"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { GameGrid } from "@/components/game-grid"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { useGameLogic } from "@/hooks/use-game-logic"
import { useTimeTracking } from "@/hooks/use-time-tracking"
import { TimeStatsModal } from "@/components/time-stats-modal"

export default function GamePage() {
  const [showRules, setShowRules] = useState(true)
  const [showTimeStats, setShowTimeStats] = useState(false)
  const { currentTime, timeStats, isActive } = useTimeTracking()
  const { currentGuess, guesses, currentRow, gameStatus, keyboardStatus, handleKeyPress, submitGuess, resetGame } =
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

  return (
    <div className="min-h-screen wordle-bg wordle-text">
      {/* Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="wordle-bg wordle-text wordle-border max-w-md border-2">
          <div className="p-2">
            <h2 className="text-2xl font-wordle-bold mb-4">How To Play</h2>
            <p className="mb-4 text-base font-wordle-normal">Guess the Wordle in 6 tries.</p>

            <ul className="space-y-2 mb-6 text-sm font-wordle-normal">
              <li>• Each guess must be a valid 5-letter word.</li>
              <li>• The color of the tiles will change to show how close your guess was to the word.</li>
            </ul>

            <div className="space-y-4">
              <div>
                <h3 className="font-wordle-bold mb-3 text-base">Examples</h3>

                <div className="flex gap-1 mb-2">
                  <div className="w-10 h-10 wordle-tile-correct flex items-center justify-center font-wordle-bold text-sm">
                    W
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    O
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    R
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    D
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    Y
                  </div>
                </div>
                <p className="text-sm mb-4 font-wordle-normal">W is in the word and in the correct spot.</p>

                <div className="flex gap-1 mb-2">
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    L
                  </div>
                  <div className="w-10 h-10 wordle-tile-present flex items-center justify-center font-wordle-bold text-sm">
                    I
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    G
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    H
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    T
                  </div>
                </div>
                <p className="text-sm mb-4 font-wordle-normal">I is in the word but in the wrong spot.</p>

                <div className="flex gap-1 mb-2">
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    R
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    O
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    G
                  </div>
                  <div className="w-10 h-10 wordle-tile-absent flex items-center justify-center font-wordle-bold text-sm">
                    U
                  </div>
                  <div className="w-10 h-10 wordle-tile-empty flex items-center justify-center font-wordle-bold text-sm">
                    E
                  </div>
                </div>
                <p className="text-sm font-wordle-normal">U is not in the word in any spot.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Stats Modal - Now receives props */}
      <TimeStatsModal
        open={showTimeStats}
        onOpenChange={setShowTimeStats}
        currentTime={currentTime}
        timeStats={timeStats}
      />

      {/* Game Header */}
      <header className="border-b wordle-border p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-3xl font-wordle-bold">Wordle</h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRules(true)}
                className="wordle-text hover:bg-gray-800 font-wordle-medium"
              >
                Rules
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeStats(true)}
                className="wordle-text hover:bg-gray-800 font-wordle-medium"
              >
                Time Spent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetGame}
                className="wordle-text hover:bg-gray-800 font-wordle-medium"
              >
                New Game
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            <span className="font-wordle-normal">Version 10</span>
            {/* Debug info */}
            <span className="ml-4 text-green-400">
              Timer: {currentTime}s {isActive ? "🟢" : "🔴"}
            </span>
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className="max-w-md mx-auto p-4">
        <GameGrid guesses={guesses} currentGuess={currentGuess} currentRow={currentRow} />

        {gameStatus !== "playing" && (
          <div className="text-center my-6">
            <p className="text-xl font-wordle-bold mb-3">{gameStatus === "won" ? "Congratulations!" : "Game Over!"}</p>
            <Button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 text-white font-wordle-medium px-6 py-2 rounded-full"
            >
              Play Again
            </Button>
          </div>
        )}

        <VirtualKeyboard onKeyPress={handleKeyPress} onEnter={submitGuess} keyboardStatus={keyboardStatus} />
      </main>
    </div>
  )
}
