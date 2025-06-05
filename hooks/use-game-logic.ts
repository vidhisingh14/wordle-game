"use client"

import { useState, useCallback } from "react"

type GameStatus = "playing" | "won" | "lost"
type KeyStatus = "correct" | "present" | "absent" | "unused"

export function useGameLogic() {
  const [currentGuess, setCurrentGuess] = useState("")
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentRow, setCurrentRow] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  const [keyboardStatus, setKeyboardStatus] = useState<Record<string, KeyStatus>>({})
  const [targetWord] = useState("REACT") // In real app, this would be random

  const validateWord = async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
      return response.ok
    } catch {
      // Fallback word list for demo
      const validWords = ["REACT", "ADAPT", "CEASE", "LIGHT", "WORLD", "HOUSE", "PLANT", "MUSIC"]
      return validWords.includes(word.toUpperCase())
    }
  }

  const updateKeyboardStatus = useCallback(
    (guess: string) => {
      const newStatus = { ...keyboardStatus }

      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i]
        if (letter === targetWord[i]) {
          newStatus[letter] = "correct"
        } else if (targetWord.includes(letter) && newStatus[letter] !== "correct") {
          newStatus[letter] = "present"
        } else if (!targetWord.includes(letter)) {
          newStatus[letter] = "absent"
        }
      }

      setKeyboardStatus(newStatus)
    },
    [keyboardStatus, targetWord],
  )

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameStatus !== "playing") return

      if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1))
      } else if (key.length === 1 && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key)
      }
    },
    [currentGuess, gameStatus],
  )

  const submitGuess = useCallback(async () => {
    if (currentGuess.length !== 5 || gameStatus !== "playing") return

    const isValid = await validateWord(currentGuess)
    if (!isValid) {
      alert("Not a valid word!")
      return
    }

    const newGuesses = [...guesses, currentGuess]
    setGuesses(newGuesses)
    updateKeyboardStatus(currentGuess)

    try {
      // Save to localStorage with error handling
      localStorage.setItem("wordle-guesses", JSON.stringify(newGuesses))
    } catch (error) {
      console.error("Error saving guesses:", error)
    }

    if (currentGuess === targetWord) {
      setGameStatus("won")
    } else if (newGuesses.length >= 6) {
      setGameStatus("lost")
    } else {
      setCurrentRow((prev) => prev + 1)
    }

    setCurrentGuess("")
  }, [currentGuess, guesses, gameStatus, targetWord, updateKeyboardStatus])

  const resetGame = useCallback(() => {
    setCurrentGuess("")
    setGuesses([])
    setCurrentRow(0)
    setGameStatus("playing")
    setKeyboardStatus({})
    try {
      localStorage.removeItem("wordle-guesses")
    } catch (error) {
      console.error("Error clearing game data:", error)
    }
  }, [])

  return {
    currentGuess,
    guesses,
    currentRow,
    gameStatus,
    keyboardStatus,
    handleKeyPress,
    submitGuess,
    resetGame,
  }
}
