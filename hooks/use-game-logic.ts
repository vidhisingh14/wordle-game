"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

type GameStatus = "playing" | "won" | "lost" | "loading"
type KeyStatus = "correct" | "present" | "absent" | "unused"

interface GameState {
  currentGuess: string
  guesses: string[]
  currentRow: number
  gameStatus: GameStatus
  keyboardStatus: Record<string, KeyStatus>
  targetWord: string
  wordSource: "api" | "fallback"
  userId?: string
}

// Separate storage keys for guest and authenticated users
const GUEST_GAME_STATE_KEY = "wordle-guest-game-state"
const AUTH_GAME_STATE_KEY = "wordle-auth-game-state"

export function useGameLogic() {
  // Add notification state directly in the hook
  const [notification, setNotification] = useState<{
    message: string
    type: "error" | "success" | "warning" | "info"
    isVisible: boolean
  }>({
    message: "",
    type: "error",
    isVisible: false
  })

  const showNotification = useCallback((
    message: string, 
    type: "error" | "success" | "warning" | "info" = "error"
  ) => {
    setNotification({
      message,
      type,
      isVisible: true
    })
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }))
  }, [])

  // 50 high-quality fallback words for production
  const FALLBACK_WORDS = [
    "REACT", "LIGHT", "WORLD", "HOUSE", "MUSIC", "ADAPT", "CEASE", "PLANT",
    "ABOUT", "AFTER", "AGAIN", "AMONG", "ALONG", "AWARE", "BADGE", "BEACH",
    "BREAD", "BREAK", "BRIEF", "BRING", "BROAD", "BUILD", "CATCH", "CHAIR",
    "CHART", "CHEAP", "CHECK", "CHILD", "CHINA", "CLAIM", "CLASS", "CLEAN",
    "CLEAR", "CLIMB", "CLOSE", "COACH", "COAST", "COUNT", "COVER", "CROWD",
    "DANCE", "DOING", "DREAM", "DRESS", "DRINK", "DRIVE", "EARLY", "EARTH",
    "EMPTY", "ENEMY", "ENJOY", "ENTER"
  ]

  const [currentGuess, setCurrentGuess] = useState("")
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentRow, setCurrentRow] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  const [keyboardStatus, setKeyboardStatus] = useState<Record<string, KeyStatus>>({})
  const [targetWord, setTargetWord] = useState<string>("")
  const [wordSource, setWordSource] = useState<"api" | "fallback">("fallback")

  const { user, isGuest } = useAuth();

  // Ensure a unique session id for guest users per session
  const getGuestSessionId = () => {
    if (typeof window === 'undefined') return '';
    let guestSessionId = sessionStorage.getItem('wordle-guest-session-id');
    if (!guestSessionId) {
      guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('wordle-guest-session-id', guestSessionId);
    }
    return guestSessionId;
  };

  // Get the appropriate storage key based on user type and identity
  const getStorageKey = useCallback(() => {
    if (isGuest) {
      return `wordle-guest-game-state-${getGuestSessionId()}`;
    } else if (user) {
      // Use user id or email for uniqueness
      return `wordle-auth-game-state-${user.id || user.email}`;
    } else {
      // Fallback to a generic guest session
      return `wordle-guest-game-state-${getGuestSessionId()}`;
    }
  }, [isGuest, user]);

  // Load game state from sessionStorage
  const loadGameState = useCallback((): GameState | null => {
    try {
      const storageKey = getStorageKey()
      const savedState = sessionStorage.getItem(storageKey)
      if (savedState) {
        const gameState = JSON.parse(savedState) as GameState
        // Validate the loaded state
        if (gameState.targetWord && 
            Array.isArray(gameState.guesses) && 
            typeof gameState.currentRow === 'number' && 
            typeof gameState.gameStatus === 'string' &&
            typeof gameState.keyboardStatus === 'object') {
          if (process.env.NODE_ENV === 'development') {
            console.log('📄 Loaded game state from sessionStorage:', gameState)
          }
          return gameState
        }
      }
    } catch (error) {
      console.error("Error loading game state:", error)
    }
    return null
  }, [getStorageKey])

  // Save game state to sessionStorage
  const saveGameState = useCallback((state: Partial<GameState>) => {
    try {
      const storageKey = getStorageKey()
      const currentState: GameState = {
        currentGuess,
        guesses,
        currentRow,
        gameStatus,
        keyboardStatus,
        targetWord,
        wordSource,
        ...state
      }
      // Only save if we have a valid game state
      if (currentState.targetWord) {
        sessionStorage.setItem(storageKey, JSON.stringify(currentState))
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 Saved game state to sessionStorage:', currentState)
        }
      }
    } catch (error) {
      console.error("Error saving game state:", error)
    }
  }, [currentGuess, guesses, currentRow, gameStatus, keyboardStatus, targetWord, wordSource, getStorageKey])

  // Save state whenever it changes
  useEffect(() => {
    if (targetWord) { // Only save if game is initialized
      saveGameState({})
    }
  }, [currentGuess, guesses, currentRow, gameStatus, keyboardStatus, targetWord, wordSource, saveGameState])

  // Initialize with saved state or new game
  useEffect(() => {
    const initializeGame = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Initializing game...')
      }
      // Try to load saved game state first
      const savedState = loadGameState()
      if (savedState && savedState.targetWord) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Restoring saved game state')
        }
        // Restore all game state
        setCurrentGuess(savedState.currentGuess || "")
        setGuesses(savedState.guesses || [])
        setCurrentRow(savedState.currentRow || 0)
        setGameStatus(savedState.gameStatus || "playing")
        setKeyboardStatus(savedState.keyboardStatus || {})
        setTargetWord(savedState.targetWord)
        setWordSource(savedState.wordSource || "fallback")
        return
      }
      // No saved state, start new game
      if (process.env.NODE_ENV === 'development') {
        console.log('🆕 Starting new game')
      }
      // Set a fallback word immediately so game can start
      const fallbackWord = getFallbackWord()
      setTargetWord(fallbackWord)
      setGameStatus("playing")
      setWordSource("fallback")
      // Then try to get a better word from API in background
      try {
        const apiWord = await fetchWordFromAPI()
        if (apiWord) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Updating to API word:', apiWord)
          }
          setTargetWord(apiWord)
          setWordSource("api")
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Staying with fallback word')
        }
      }
    }
    initializeGame()
  }, [loadGameState])

  // Simple fallback word picker
  const getFallbackWord = (): string => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_WORDS.length)
    return FALLBACK_WORDS[randomIndex]
  }

  // Get API key safely in browser environment (production ready)
  const getApiKey = (): string | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_NINJAS_KEY
      if (apiKey) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ API key found from environment')
        }
        return apiKey
      }
    } catch (error) {
      // Silent in production, log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('❌ Environment variable not accessible:', error)
      }
    }
    
    // Remove hardcoded key section for production
    if (process.env.NODE_ENV === 'development') {
      console.warn('❌ No API key found')
    }
    return null
  }

  // Fetch word from API Ninjas with timeout (your exact working logic)
  const fetchWordFromAPI = async (retryCount = 0): Promise<string | null> => {
    const apiKey = getApiKey()
    if (!apiKey) {
      return null
    }
    if (retryCount > 10) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Maximum retries reached for API word fetch. Using fallback.')
      }
      return null
    }
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Fetching word from API Ninjas...')
      }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const response = await fetch('https://api.api-ninjas.com/v1/randomword', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (response.ok) {
        const data = await response.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Raw API response:', data)
        }
        let word = null
        if (data.word && Array.isArray(data.word) && data.word.length > 0) {
          word = String(data.word[0]).toUpperCase()
          if (process.env.NODE_ENV === 'development') {
            console.log('📝 Extracted word from array:', word)
          }
        } else if (data.word && typeof data.word === 'string') {
          word = data.word.toUpperCase()
          if (process.env.NODE_ENV === 'development') {
            console.log('📝 Extracted word from string:', word)
          }
        } else if (typeof data === 'string') {
          word = data.toUpperCase()
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Unexpected API response format:', data)
          }
          return null
        }
        if (word && word.length === 5 && /^[A-Z]+$/.test(word)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Got 5-letter word from API:', word)
          }
          return word
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`⚠️ API returned ${word?.length || 0}-letter word: ${word}, trying again...`)
          }
          // If not 5 letters, try again (limit retries)
          return await fetchWordFromAPI(retryCount + 1)
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('❌ API response not ok:', response.status)
        }
        return null
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (error.name === 'AbortError') {
          console.warn('❌ API request timed out')
        } else {
          console.warn('❌ API request failed:', error)
        }
      }
      return null
    }
  }

  // Get random word (try API, fallback to local)
  const getRandomWord = async (): Promise<string> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Getting random word...')
    }
    
    try {
      const apiWord = await fetchWordFromAPI()
      if (apiWord) {
        setWordSource("api")
        return apiWord
      }
    } catch (error) {
      // Silent fallback in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('API failed, using fallback:', error)
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Using fallback word')
    }
    setWordSource("fallback")
    return getFallbackWord()
  }

  // Enhanced word validation (production optimized)
  const validateWord = async (word: string): Promise<boolean> => {
    try {
      // Always allow the target word
      if (word.toUpperCase() === targetWord.toUpperCase()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Target word is always valid:', word)
        }
        return true
      }
      
      // Check against known words first (instant)
      if (FALLBACK_WORDS.includes(word.toUpperCase())) {
        return true
      }
      
      // Extended common words that might come from API
      const commonAPIWords = [
        "STORM", "FLARE", "GLOBE", "BLEND", "CRISP", "FROST", "GLIDE", "SWEPT",
        "THUMB", "TWIST", "QUIRK", "BLITZ", "FJORD", "ZESTY", "WALTZ", "CHARM",
        "DRIFT", "GROVE", "MARSH", "PERCH", "RIDGE", "SPARK", "SPIKE", "SPIRE",
        "STERN", "SWAMP", "SWING", "THYME", "TORCH", "TRACE", "TREND", "TRUCE",
        "APPLE", "BRAVE", "CRANE", "DRAPE", "EAGLE", "FABLE", "GRACE", "HORSE",
        "IMAGE", "JUICE", "KNIFE", "LARGE", "MAPLE", "NOBLE", "OLIVE", "PEACE",
        "QUOTE", "RAISE", "SMILE", "TOWER", "UNDER", "VOICE", "WHALE", "YOUNG"
      ]
      
      if (commonAPIWords.includes(word.toUpperCase())) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Common API word accepted:', word)
        }
        return true
      }
      
      // Then try dictionary API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Word validated by dictionary:', word)
        }
        return true
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Word not in dictionary:', word)
        }
        return false
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Word validation failed, checking fallback list:', error)
      }
      return FALLBACK_WORDS.includes(word.toUpperCase())
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
      // Replace alert with smooth notification
      showNotification("Not a valid word!", "error")
      return
    }

    const newGuesses = [...guesses, currentGuess]
    setGuesses(newGuesses)
    updateKeyboardStatus(currentGuess)

    if (currentGuess === targetWord) {
      setGameStatus("won")
      showNotification("Congratulations! 🎉", "success")
    } else if (newGuesses.length >= 6) {
      setGameStatus("lost")
      showNotification(`The word was: ${targetWord}`, "info")
    } else {
      setCurrentRow((prev) => prev + 1)
    }

    setCurrentGuess("")
  }, [currentGuess, guesses, gameStatus, targetWord, updateKeyboardStatus, showNotification])

  // Clear game state for current user type only
  const clearGameState = useCallback(() => {
    try {
      const storageKey = getStorageKey()
      sessionStorage.removeItem(storageKey)
    } catch (error: unknown) {
      console.error("Error clearing game state:", error)
    }
  }, [getStorageKey])

  const resetGame = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Resetting game...')
    }
    // Immediately reset to playable state
    setCurrentGuess("")
    setGuesses([])
    setCurrentRow(0)
    setGameStatus("playing")
    setKeyboardStatus({})
    // Set fallback word immediately
    const fallbackWord = getFallbackWord()
    setTargetWord(fallbackWord)
    setWordSource("fallback")
    // Try to get API word in background
    try {
      const apiWord = await fetchWordFromAPI()
      if (apiWord) {
        setTargetWord(apiWord)
        setWordSource("api")
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback word for new game')
      }
    }
    // Clear saved game state for current user type only
    clearGameState()
  }, [clearGameState])

  return {
    currentGuess,
    guesses,
    currentRow,
    gameStatus,
    keyboardStatus,
    targetWord,
    wordSource,
    handleKeyPress,
    submitGuess,
    resetGame,
    notification,
    hideNotification
  }
}
