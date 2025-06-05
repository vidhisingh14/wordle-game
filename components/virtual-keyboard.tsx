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
    const baseClass = "h-14 font-wordle-bold text-sm rounded-md border-0"

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
    <div className="space-y-2 px-2">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1">
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => handleKeyClick(key)}
              className={`
                ${key === "ENTER" || key === "BACKSPACE" ? "px-3 min-w-[65px]" : "w-11"}
                ${getKeyClass(key)}
              `}
              variant="secondary"
            >
              {key === "BACKSPACE" ? "⌫" : key}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}
