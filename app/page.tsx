"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function HomePage() {
  const router = useRouter()
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      // The redirect will be handled by Supabase
    } catch (error) {
      console.error("Error during Google login:", error)
      setIsLoading(false)
    }
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
            className="w-full py-4 px-8 text-lg rounded-full transition-all duration-200 flex items-center justify-center gap-3"
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
            {isLoading ? (
              "Signing in..."
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
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
            Play as Guest
          </button>
        </div>

        <div style={{ color: "#9ca3af" }}>
          <p style={{ fontWeight: 600, fontSize: "16px" }}>June 5, 2025</p>
          <p style={{ fontSize: "12px", fontWeight: 500, marginTop: "16px" }}>Version 10</p>
        </div>
      </div>
    </div>
  )
}