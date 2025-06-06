interface GameGridProps {
  guesses: string[]
  currentGuess: string
  currentRow: number
  targetWord: string // ADDED: Pass the target word as a prop
}

export function GameGrid({ guesses, currentGuess, currentRow, targetWord }: GameGridProps) {
  const rows = Array.from({ length: 6 }, (_, index) => {
    if (index < guesses.length) {
      return guesses[index]
    } else if (index === currentRow) {
      return currentGuess.padEnd(5, " ")
    } else {
      return "     "
    }
  })

  const getCellClass = (letter: string, position: number, rowIndex: number) => {
    const baseClass = "flex items-center justify-center font-wordle-bold text-2xl uppercase"

    // For rows that haven't been guessed yet
    if (rowIndex >= guesses.length) {
      if (letter.trim()) {
        return `${baseClass} wordle-tile-filled`
      } else {
        return `${baseClass} wordle-tile-empty`
      }
    }

    // Safety check for targetWord
    if (!targetWord) {
      return `${baseClass} wordle-tile-empty`
    }

    // For completed guesses, check against target word
    if (letter === targetWord[position]) {
      return `${baseClass} wordle-tile-correct`
    } else if (targetWord.includes(letter)) {
      return `${baseClass} wordle-tile-present`
    } else {
      return `${baseClass} wordle-tile-absent`
    }
  }

  return (
    <div className="mx-auto mb-8" style={{ overflow: "unset" }}>
      <div
        className="grid gap-[5px] p-[10px] box-border mx-auto"
        style={{
          width: "300px",
          height: "360px",
          display: "grid",
          gridTemplateRows: "repeat(6, 1fr)",
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-[5px]"
            style={{
              gridTemplateColumns: "repeat(5, 1fr)",
            }}
            role="group"
            aria-label={`Row ${rowIndex + 1}`}
          >
            {Array.from(row).map((letter, colIndex) => (
              <div
                key={colIndex}
                className={getCellClass(letter, colIndex, rowIndex)}
                role="img"
                aria-roledescription="tile"
                aria-label={
                  letter.trim()
                    ? `${colIndex + 1}${rowIndex === 0 ? "st" : rowIndex === 1 ? "nd" : rowIndex === 2 ? "rd" : "th"} letter, ${letter}, ${
                        rowIndex < guesses.length && targetWord // FIXED: Add safety check
                          ? letter === targetWord[colIndex]
                            ? "correct"
                            : targetWord.includes(letter)
                              ? "present in another position"
                              : "not in word"
                          : "empty"
                      }`
                    : "empty"
                }
                data-state={
                  rowIndex >= guesses.length || !targetWord // FIXED: Add safety check
                    ? "empty"
                    : letter === targetWord[colIndex]
                      ? "correct"
                      : targetWord.includes(letter)
                        ? "present"
                        : "absent"
                }
                data-animation="idle"
                data-testid="tile"
                aria-live="polite"
                style={{
                  animationDelay: `${colIndex * 100}ms`,
                }}
              >
                {letter.trim()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}