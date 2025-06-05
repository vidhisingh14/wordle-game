"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    // Simulate Google OAuth - in real app, implement actual OAuth
    setTimeout(() => {
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: "User",
            email: "user@example.com",
            loginTime: new Date().toISOString(),
          }),
        )
      } catch (error) {
        console.error("Error saving user data:", error)
      }
      router.push("/game")
    }, 1000)
  }

  const handlePlayAsGuest = () => {
    try {
      localStorage.setItem("guestMode", "true")
    } catch (error) {
      console.error("Error setting guest mode:", error)
    }
    router.push("/game")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#121213" }}>
      <div className="w-full max-w-md text-center">
        {/* Wordle Logo */}
        <div className="mb-12">
          <div className="w-20 h-20 mx-auto mb-6 grid grid-cols-3 gap-1">
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#6aaa64", border: "2px solid #6aaa64", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#c9b458", border: "2px solid #c9b458", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#787c7e", border: "2px solid #787c7e", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#6aaa64", border: "2px solid #6aaa64", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#6aaa64", border: "2px solid #6aaa64", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#787c7e", border: "2px solid #787c7e", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#c9b458", border: "2px solid #c9b458", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#787c7e", border: "2px solid #787c7e", height: "20px" }}
            ></div>
            <div
              className="rounded-sm"
              style={{ backgroundColor: "#6aaa64", border: "2px solid #6aaa64", height: "20px" }}
            ></div>
          </div>
          <h1
            className="text-5xl font-bold mb-6"
            style={{ color: "#ffffff", fontWeight: 700, letterSpacing: "0.02em" }}
          >
            Wordle
          </h1>
          <p
            className="text-xl mb-12"
            style={{ color: "#ffffff", fontWeight: 600, letterSpacing: "0.01em", lineHeight: "1.6" }}
          >
            Get 6 chances to guess
            <br />a 5-letter word.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-4 px-8 text-lg rounded-full transition-all duration-200"
            style={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "2px solid #6b7280",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#374151"
              e.currentTarget.style.borderColor = "#9ca3af"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.borderColor = "#6b7280"
            }}
          >
            {isLoading ? "Signing in..." : "Log in"}
          </button>

          <button
            onClick={handlePlayAsGuest}
            className="w-full py-4 px-8 text-lg rounded-full transition-all duration-200"
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "2px solid #000000",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1f2937"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#000000"
            }}
          >
            Play
          </button>
        </div>

        <div style={{ color: "#9ca3af" }}>
          <p style={{ fontWeight: 600, fontSize: "16px" }}>June 5, 2025</p>
          <p style={{ fontSize: "12px", fontWeight: 500, marginTop: "16px" }}>Version 9</p>
        </div>
      </div>
    </div>
  )
}
