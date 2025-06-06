"use client"

import { useState, useCallback } from "react"

type GameStatus = "playing" | "won" | "lost"
type KeyStatus = "correct" | "present" | "absent" | "unused"

export function useGameLogic() {
  // Word list for random selection
  const WORD_LIST = [
    "REACT", "ADAPT", "CEASE", "LIGHT", "WORLD", "HOUSE", "PLANT", "MUSIC",
  "ABOUT", "AFTER", "AGAIN", "AMONG", "ALONG", "AWARE", "BADGE", "BEACH",
  "BREAD", "BREAK", "BRIEF", "BRING", "BROAD", "BUILD", "CATCH", "CHAIR",
  "CHART", "CHEAP", "CHECK", "CHILD", "CHINA", "CLAIM", "CLASS", "CLEAN",
  "CLEAR", "CLIMB", "CLOSE", "COACH", "COAST", "COUNT", "COVER", "CROWD",
  "DANCE", "DOING", "DREAM", "DRESS", "DRINK", "DRIVE", "EARLY", "EARTH",
  "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "EVENT",
  "EVERY", "EXACT", "EXIST", "EXTRA", "FAITH", "FALSE", "FAULT", "FIELD",
  "FIGHT", "FINAL", "FIRST", "FLASH", "FLOOR", "FOCUS", "FORCE", "FORTH",
  "FRAME", "FRESH", "FRONT", "FRUIT", "FUNNY", "GLASS", "GRACE", "GRAND",
  "GRANT", "GRASS", "GREAT", "GREEN", "GROSS", "GROUP", "GUARD", "GUEST",
  "GUIDE", "HAPPY", "HEART", "HEAVY", "HORSE", "HOTEL", "HUMAN", "IDEAL",
  "IMAGE", "INNER", "INPUT", "ISSUE", "JUDGE", "KNIFE", "LARGE", "LASER",
  "LATER", "LAUGH", "LAYER", "LEARN", "LEAST", "LEAVE", "LEGAL", "LEVEL",
  "LOCAL", "LOOSE", "LOWER", "LUCKY", "LUNCH", "MAGIC", "MAJOR", "MAKER",
  "MARCH", "MATCH", "MAYBE", "MAYOR", "MEANT", "MEDIA", "METAL", "MIGHT",
  "MINOR", "MINUS", "MIXED", "MODEL", "MONEY", "MONTH", "MORAL", "MOTOR",
  "MOUNT", "MOUSE", "MOUTH", "MOVED", "MOVIE", "NEEDS", "NEVER", "NOISE",
  "NORTH", "NOTED", "NOVEL", "NURSE", "OCCUR", "OCEAN", "OFFER", "OFTEN",
  "ORDER", "OTHER", "OUGHT", "OWNED", "OWNER", "PAINT", "PANEL", "PAPER",
  "PARTY", "PEACE", "PHASE", "PHONE", "PHOTO", "PIECE", "PILOT", "PITCH",
  "PLACE", "PLAIN", "PLANE", "POINT", "POUND", "POWER", "PRESS", "PRICE",
  "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF", "PROUD", "PROVE",
  "QUEEN", "QUICK", "QUIET", "QUITE", "RADIO", "RAISE", "RANGE", "RAPID",
  "RATIO", "REACH", "READY", "REFER", "RIGHT", "RIVER", "ROUGH", "ROUND",
  "ROUTE", "ROYAL", "RURAL", "SCALE", "SCENE", "SCOPE", "SCORE", "SENSE",
  "SERVE", "SEVEN", "SHALL", "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF",
  "SHELL", "SHIFT", "SHINE", "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOWN",
  "SIGHT", "SINCE", "SIXTH", "SIXTY", "SIZED", "SKILL", "SLEEP", "SLIDE",
  "SMALL", "SMART", "SMILE", "SMOKE", "SNAKE", "SNOW", "SOLID", "SOLVE",
  "SORRY", "SOUND", "SOUTH", "SPACE", "SPARE", "SPEAK", "SPEED", "SPEND",
  "SPENT", "SPLIT", "SPOKE", "SPORT", "STAFF", "STAGE", "STAKE", "STAND",
  "START", "STATE", "STEAM", "STEEL", "STICK", "STILL", "STOCK", "STONE",
  "STOOD", "STORE", "STORM", "STORY", "STRIP", "STUCK", "STUDY", "STUFF",
  "STYLE", "SUGAR", "SUITE", "SUPER", "SWEET", "TABLE", "TAKEN", "TASTE",
  "TAXES", "TEACH", "TERMS", "THANK", "THEFT", "THEIR", "THEME", "THERE",
  "THESE", "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW",
  "THROW", "THUMB", "TIGHT", "TIMER", "TIRED", "TITLE", "TODAY", "TOPIC",
  "TOTAL", "TOUCH", "TOUGH", "TOWER", "TRACK", "TRADE", "TRAIN", "TREAT",
  "TREND", "TRIAL", "TRIBE", "TRICK", "TRIED", "TRIES", "TRUCK", "TRULY",
  "TRUNK", "TRUST", "TRUTH", "TWICE", "UNCLE", "UNDER", "UNDUE", "UNION",
  "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE", "USUAL", "VALUE",
  "VIDEO", "VIRUS", "VISIT", "VITAL", "VOICE", "WASTE", "WATCH", "WATER",
  "WEIGH", "WEIRD", "WHEEL", "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE",
  "WHOSE", "WIDOW", "WIDTH", "WOMAN", "WOMEN", "WORLD", "WORRY", "WORSE",
  "WORST", "WORTH", "WOULD", "WRITE", "WRONG", "WROTE", "YOUNG", "YOUTH", 
  "YATCH", "ABOVE", "ABUSE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "ADULT", "AGENT",
  "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIEN", "ALIGN", "ALIKE",
  "ALIVE", "ALLOW", "ALONE", "ALTER", "AMBER", "AMEND", "ANGEL", "ANGER",
  "ANGLE", "ANGRY", "APART", "APPLE", "APPLY", "ARENA", "ARGUE", "ARISE",
  "ARMED", "ARMOR", "ARRAY", "ARROW", "ASIDE", "ASSET", "ATLAS", "AVOID",
  "AWAKE", "AWARD", "AWFUL", "BASIC", "BATCH", "BEARD", "BEAST", "BEGIN",
  "BEING", "BELLY", "BELOW", "BENCH", "BIKES", "BILLS", "BIRTH", "BLACK",
  "BLADE", "BLAME", "BLANK", "BLAST", "BLAZE", "BLEED", "BLEND", "BLESS",
  "BLIND", "BLOCK", "BLOOD", "BLOOM", "BLOWN", "BOARD", "BOAST", "BOATS",
  "BONUS", "BOOST", "BOOTH", "BOUND", "BOXES", "BRAIN", "BRAND", "BRASS",
  "BRAVE", "BREED", "BROWN", "BRUSH", "BURST", "BUYER", "CABLE", "CACHE",
  "CANDY", "CANOE", "CARDS", "CARRY", "CARVE", "CAUSE", "CHAIN", "CHALK",
  "CHAMP", "CHAOS", "CHARM", "CHASE", "CHEAT", "CHESS", "CHEST", "CHIEF",
  "CHORD", "CHOSE", "CHUNK", "CLASH", "CLICK", "CLIFF", "CLOCK", "CLOTH",
  "CLOUD", "CLOWN", "CLUBS", "CODES", "COINS", "COLOR", "COMET", "CORAL",
  "COSTA", "COURT", "CRACK", "CRAFT", "CRANE", "CRASH", "CRAZY", "CREAM",
  "CRIME", "CROPS", "CROSS", "CRUDE", "CRUSH", "CURVE", "CYCLE", "DAILY",
  "DATED", "DEALS", "DEATH", "DEBUT", "DELAY", "DELTA", "DENSE", "DEPTH",
  "DERBY", "DESKS", "DEVIL", "DIARY", "DICED", "DIGIT", "DIRTY", "DISCO",
  "DITCH", "DIVER", "DIZZY", "DOORS", "DOUBT", "DOZEN", "DRAFT", "DRAKE",
  "DRAMA", "DRANK", "DRAWN", "DRIED", "DRIFT", "DRILL", "DRONE", "DROVE",
  "DRUMS", "DRUNK", "DUCKS", "DUMMY", "DUMPS", "DUSTY", "DUTCH", "DWARF",
  "DYING", "EAGER", "EAGLE", "EASEL", "EATEN", "EBONY", "EDGES", "EIGHT",
  "ELBOW", "ELECT", "ELITE", "ENDED", "ESSAY", "ETHER", "ETHIC", "FACED",
  "FACTS", "FADED", "FAILS", "FAIRY", "FANCY", "FARMS", "FATAL", "FAVOR",
  "FEARS", "FEAST", "FEEDS", "FEELS", "FENCE", "FERRY", "FETCH", "FEVER",
  "FIBER", "FIFTY", "FILMS", "FINDS", "FINER", "FIRED", "FIRMS", "FIXED",
  "FLAGS", "FLAME", "FLASK", "FLEET", "FLESH", "FLIES", "FLINT", "FLOAT",
  "FLOCK", "FLOOD", "FLOUR", "FLOWS", "FLUID", "FLUTE", "FOCAL", "FOLKS",
  "FONTS", "FOODS", "FORGE", "FORMS", "FORTY", "FORUM", "FOUND", "FRAUD",
  "FRIED", "FROST", "FULLY", "FUNDS", "GAINS", "GAMES", "GATES", "GAZER",
  "GEARS", "GENES", "GHOST", "GIANT", "GIFTS", "GIRLS", "GIVEN", "GIVES",
  "GLADE", "GLOBE", "GLORY", "GLOVE", "GOALS", "GOATS", "GOING", "GOODS",
  "GRADE", "GRAIN", "GRAPH", "GRAVE", "GREED", "GREET", "GRIEF", "GRILL",
  "GRIND", "GRIPS", "GROVE", "GROWN", "GUESS", "GUILD", "GUILT", "GULLS",
  "HABIT", "HALLS", "HANDS", "HANDY", "HARSH", "HASTE", "HASTY", "HATCH",
  "HAVEN", "HAWKS", "HEADS", "HEARD", "HEATH", "HEDGE", "HEELS", "HELLO",
  "HELPS", "HERBS", "HIDES", "HILLS", "HINTS", "HIRED", "HOBBY", "HOLDS",
  "HOLES", "HOLLY", "HOMES", "HONEY", "HONOR", "HOOKS", "HOPED", "HOPES",
  "HORNS", "HOSTS", "HOURS", "HOVER", "HUMID", "HUMOR", "HURRY", "HUSKY",
  "HYENA", "ICONS", "IDEAS", "IDIOM", "IDOLS", "IGLOO", "IMPLY", "INBOX",
  "INDEX", "IRONY", "ITEMS", "IVORY", "JADED", "JAILS", "JEANS", "JEWEL",
  "JOINS", "JOKES", "JOLLY", "JUICE", "JUMBO", "JUMPS", "JUNKY", "KEEPS",
  "KICKS", "KILLS", "KINDS", "KINGS", "KITES", "KNEES", "KNOCK", "KNOTS",
  "KNOWN", "KNOWS", "LABEL", "LABOR", "LACKS", "LAKES", "LAMPS", "LANCE",
  "LANDS", "LANES", "LEADS", "LEASE", "LEDGE", "LEMON", "LEVER", "LIKES",
  "LIMIT", "LINED", "LINES", "LINKS", "LIONS", "LISTS", "LIVED", "LIVER",
  "LIVES", "LOADS", "LOANS", "LOBBY", "LOCKS", "LODGE", "LOGIC", "LOOKS",
  "LOOPS", "LORDS", "LOSES", "LOVED", "LOVER", "LOVES", "LUNGS", "LYING",
  "MALES", "MANGO", "MANOR", "MAPLE", "MARKS", "MARRY", "MARSH", "MASKS",
  "MATES", "MATHS", "MEALS", "MEANS", "MEATS", "MEDAL", "MEETS", "MELON",
  "MELTS", "MEMOS", "MENUS", "MERCY", "MERGE", "MERIT", "MERRY", "METER",
  "METRO", "MICRO", "MILES", "MINDS", "MINES", "MIXER", "MIXES", "MODES",
  "MONKS", "MOODS", "MOULD", "MOUND", "MOVER", "MOVES", "MOWED", "MYTHS",
  "NAILS", "NAKED", "NAMED", "NAMES", "NASTY", "NAVAL", "NEWLY", "NICER",
  "NIGHT", "NOBLE", "NODES", "OATHS", "OBEYS", "OLIVE", "OPENS", "OPERA",
  "ORGAN", "OUTER", "OUNCE", "OXIDE", "PACED", "PACKS", "PAGES", "PAINS",
  "PAIRS", "PANIC", "PARKS", "PARTS", "PASTA", "PASTE", "PATCH", "PATHS",
  "PAUSE", "PEACH", "PEAKS", "PEARL", "PEDAL", "PENNY", "PIXEL", "PIZZA",
  "PLANS", "PLATE", "PLAYS", "PLAZA", "PLOTS", "PLUMB", "POEMS", "POLES",
  "POLLS", "POOLS", "PORCH", "POSED", "POSTS", "PROPS", "PSALM", "PULLS",
  "PULSE", "PUMPS", "PUNCH", "PUPIL", "PURSE", "PUSHY", "QUACK", "QUAKE",
  "QUART", "QUERY", "QUEST", "QUEUE", "QUOTA", "QUOTE", "RACES", "RADAR",
  "RALLY", "RANKS", "RATES", "REALM", "REBEL", "REIGN", "RELAX", "RELAY",
  "REMIX", "REPLY", "RESET", "RINGS", "RINSE", "RISES", "RISKS", "RIVAL",
  "ROADS", "ROAST", "ROBES", "ROBOT", "ROCKS", "ROLES", "ROLLS", "ROMAN",
  "ROOMS", "ROOTS", "ROPES", "ROSES", "RUINS", "RULES", "RUSTY", "SADLY",
  "SAFER", "SAINT", "SALAD", "SALES", "SALON", "SALTY", "SANDY", "SAUCE",
  "SAVED", "SAVER", "SAVES", "SCARE", "SCENT", "SCOUT", "SCRAP", "SEALS",
  "SEATS", "SEEDS", "SEEKS", "SEEMS", "SELLS", "SENDS", "SHADE", "SHAFT",
  "SHAKE", "SHAME", "SHARK", "SHEEP", "SHIPS", "SHOES", "SHOPS", "SHORE",
  "SHOWS", "SHRUG", "SIDES", "SIGNS", "SILLY", "SINKS", "SITES", "SIZES",
  "SKINS", "SKULL", "SLACK", "SLAMS", "SLATE", "SLAVE", "SLEPT", "SLIME",
  "SLOPE", "SLOTS", "SOBER", "SOCKS", "SOFAS", "SOLAR", "SONGS", "SORTS",
  "SOULS", "SPINE", "SPOTS", "SPRAY", "SQUAD", "STAIN", "STALE", "STAMP",
  "STARE", "STAYS", "STEAL", "STEEP", "STEPS", "STERN", "STING", "STINK",
  "STOIC", "SUITS", "SUNNY", "SWEEP", "SWEPT", "SWIFT", "SWING", "SWIPE",
  "SWISS", "TALES", "TALKS", "TANKS", "TAPES", "TASKS", "TEAMS", "TEARS",
  "TEENS", "TEETH", "TELLS", "TENTS", "TESTS", "TEXTS", "TIGER", "TILES",
  "TIMES", "TOKEN", "TOOLS", "TOOTH", "TOURS", "TOWEL", "TOWNS", "TRAIL",
  "TREES", "TRIBE", "TRIPS", "TRUNK", "TUBES", "TUMOR", "TURNS", "TWIST",
  "TYPED", "TYPES", "ULTRA", "UNFED", "UNITS", "VAPOR", "VAULT", "VEGAN",
  "VENUE", "VERBS", "VIEWS", "VINYL", "VIRAL", "VITAL", "VOCAL", "VOIDS",
  "VOTES", "WAGES", "WAIST", "WAITS", "WAKES", "WALKS", "WALLS", "WANTS",
  "WARDS", "WARMS", "WARNS", "WAVES", "WAXED", "WEARY", "WEEKS", "WELLS",
  "WHALE", "WHEAT", "WIDER", "WINDS", "WINES", "WINGS", "WINKS", "WIPED",
  "WIPES", "WIRED", "WIRES", "WITCH", "WIVES", "WOODS", "WORDS", "WORKS",
  "YARDS", "YEARS", "YEAST", "YIELD", "YOURS", "ZEBRA", "ZEROS", "ZONES"
  ]

  // Function to get random word
  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length)
    return WORD_LIST[randomIndex]
  }

  const [currentGuess, setCurrentGuess] = useState("")
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentRow, setCurrentRow] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  const [keyboardStatus, setKeyboardStatus] = useState<Record<string, KeyStatus>>({})
  
  // Initialize with random word - using regular state so it can be updated
  const [targetWord, setTargetWord] = useState(() => getRandomWord())

  const validateWord = async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
      return response.ok
    } catch {
      // Expanded fallback word list for demo
      const validWords = [
        "ABOUT", "HOUSE", "PLANT", "MUSIC", "WORLD", "LIGHT", "HAPPY", "DREAM",
        "PEACE", "SMILE", "BRAVE", "HEART", "MAGIC", "POWER", "SOUND", "GRACE",
        "REACT", "ADAPT", "CEASE", "WATER", "STONE", "FLAME", "STORM", "OCEAN",
        "SPACE", "FRESH", "QUIET", "STORY", "TRUST", "NIGHT", "SPARK", "BLOOM"
      ]
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
    setTargetWord(getRandomWord()) // Pick new random word
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
    targetWord, // Return targetWord so it can be passed to GameGrid
    handleKeyPress,
    submitGuess,
    resetGame,
  }
}