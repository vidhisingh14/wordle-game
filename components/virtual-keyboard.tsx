"use client"

import { Button } from "@/components/ui/button"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onEnter: () => void
  keyboardStatus: Record<string, "correct" | "present" | "absent" | "unused">
}

export function VirtualKeyboard({ onKeyPress, onEnter, keyboardStatus }: VirtualKeyboardProps) {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ]

  const getKeyClass = (key: string) => {
    const status = keyboardStatus[key]
    // Mobile-responsive base class with smaller height on mobile
    const baseClass = "h-12 sm:h-14 font-wordle-bold text-xs sm:text-sm rounded-md border-0 transition-colors"

    switch (status) {
      case "correct":
        return `${baseClass} wordle-key-correct`
      case "present":
        return `${baseClass} wordle-key-present`
      case "absent":
        return `${baseClass} wordle-key-absent`
      default:
        return `${baseClass} wordle-key-unused`
    }
  }

  const handleKeyClick = (key: string) => {
    if (key === "ENTER") {
      onEnter()
    } else {
      onKeyPress(key)
    }
  }

  return (
    <div className="space-y-1 sm:space-y-2 px-1 sm:px-2 max-w-full">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-0.5 sm:gap-1 w-full">
          {row.map((key) => {
            // Calculate responsive widths for different key types
            const isSpecialKey = key === "ENTER" || key === "BACKSPACE"
            const specialKeyClass = isSpecialKey 
              ? "flex-1 max-w-[80px] sm:max-w-[65px] px-1 sm:px-3 min-w-[50px]" 
              : "w-8 sm:w-11 flex-shrink-0"
            
            return (
              <Button
                key={key}
                onClick={() => handleKeyClick(key)}
                className={`${specialKeyClass} ${getKeyClass(key)}`}
                variant="secondary"
                size="sm"
              >
                <span className="text-xs sm:text-sm font-wordle-bold">
                  {key === "BACKSPACE" ? "⌫" : key}
                </span>
              </Button>
            )
          })}
        </div>
      ))}
    </div>
  )
}