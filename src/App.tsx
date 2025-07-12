"use client"

import { Header } from "./components/Header"
import { RfpForm } from "./components/RfpForm"
import { JobBoardPage } from "./pages/JobBoardPage" // Import the new Job Board page
import { useState, useEffect } from "react"

function App() {
  const [currentPage, setCurrentPage] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, "", path)
    setCurrentPage(path)
  }

  // Update Header to include navigation
  const AppHeader = () => (
    <header className="poster-header">
      <div className="poster-header-content">
        <div className="flex flex-row items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              navigate("/")
            }}
            className="flex flex-row items-center gap-3 hover:no-underline after:hidden"
          >
            <img src="/logo.svg" alt="RFP Launcher Logo" className="h-10 w-auto" />
            <div className="poster-brand">
              <h1 className="poster-brand-title">RFP Launcher</h1>
              <div className="poster-brand-subtitle">Kusama Proposal Toolkit</div>
            </div>
          </a>
        </div>

        <div className="poster-actions">
          <nav className="flex items-center gap-4">
            <a
              href="/create-rfp"
              onClick={(e) => {
                e.preventDefault()
                navigate("/create-rfp")
              }}
              className={`text-sm font-medium hover:text-tomato-stamp transition-colors ${currentPage === "/create-rfp" ? "text-tomato-stamp" : "text-pine-shadow"}`}
            >
              Create RFP
            </a>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate("/")
              }}
              className={`text-sm font-medium hover:text-tomato-stamp transition-colors ${currentPage === "/" ? "text-tomato-stamp" : "text-pine-shadow"}`}
            >
              Job Board
            </a>
          </nav>
          <div className="h-6 w-px bg-pine-shadow-20 mx-2"></div> {/* Visual separator */}
          <Header /> {/* This will render the original Header content (SelectAccount, Kusama Stamp, etc.) */}
        </div>
      </div>
    </header>
  )

  let pageContent
  if (currentPage === "/create-rfp") {
    pageContent = <RfpForm />
  } else {
    pageContent = <JobBoardPage />
  }

  return (
    <div className="min-h-screen bg-canvas-cream">
      <AppHeader />
      <main className="poster-container">{pageContent}</main>
    </div>
  )
}

export default App

