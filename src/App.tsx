"use client"

import { Header } from "./components/Header"
import { RfpForm } from "./components/RfpForm"
import { JobBoardPage } from "./pages/JobBoardPage"
import { TipPage } from "./pages/TipPage"
import { FaqPage } from "./pages/FaqPage"
import { useState, useEffect } from "react"
import { matchedChain } from "./chainRoute"

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
  const AppHeader = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
      <header className="poster-header">
        <div className="poster-header-content">
          {/* Brand */}
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate("/")
              }}
              className="flex flex-row items-center gap-2 sm:gap-3 hover:no-underline after:hidden"
            >
              <img src="/logo.svg" alt="OpenGov Fund Logo" className="h-7 sm:h-8 md:h-10 w-auto flex-shrink-0" />
              <div className="poster-brand">
                <h1 className="poster-brand-title">opengov.fund</h1>
                <div className="poster-brand-subtitle hidden md:block">Proposal & Tip Toolkit</div>
              </div>
            </a>
          </div>

          {/* Desktop Navigation & Controls */}
          <div className="hidden lg:flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/")
                }}
                className={`text-sm font-medium hover:text-tomato-stamp transition-colors whitespace-nowrap ${currentPage === "/" ? "text-tomato-stamp" : "text-pine-shadow"}`}
              >
                Job Board
              </a>
              <a
                href="/launch-rfp"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/launch-rfp")
                }}
                className={`text-sm font-medium hover:text-tomato-stamp transition-colors whitespace-nowrap ${currentPage === "/launch-rfp" ? "text-tomato-stamp" : "text-pine-shadow"}`}
              >
                Launch RFP
              </a>
              <a
                href="/suggest-tip"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/suggest-tip")
                }}
                className={`text-sm font-medium hover:text-tomato-stamp transition-colors whitespace-nowrap ${currentPage === "/suggest-tip" ? "text-tomato-stamp" : "text-pine-shadow"}`}
              >
                Suggest Tip
              </a>
              <a
                href="/faq"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/faq")
                }}
                className={`text-sm font-medium hover:text-tomato-stamp transition-colors whitespace-nowrap ${currentPage === "/faq" ? "text-tomato-stamp" : "text-pine-shadow"}`}
              >
                FAQ
              </a>
            </nav>
            <div className="h-6 w-px bg-pine-shadow-20 mx-2"></div>
            <Header />
          </div>

          {/* Mobile/Tablet Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-pine-shadow-10 focus:bg-pine-shadow-10 focus:outline-none focus:ring-2 focus:ring-pine-shadow-20 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-5 h-5 text-pine-shadow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-pine-shadow-20 bg-canvas-cream shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="poster-header-content pt-6 pb-8">
              <div className="flex flex-col space-y-2">
                {/* Navigation Links */}
                <div className="space-y-2">
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate("/")
                      setMobileMenuOpen(false)
                    }}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tomato-stamp/20 ${
                      currentPage === "/" 
                        ? "text-tomato-stamp bg-tomato-stamp/10 border-l-4 border-tomato-stamp rounded-l-none" 
                        : "text-pine-shadow hover:text-tomato-stamp hover:bg-pine-shadow/10 focus:bg-pine-shadow/10"
                    }`}
                  >
                    Job Board
                  </a>
                  <a
                    href="/launch-rfp"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate("/launch-rfp")
                      setMobileMenuOpen(false)
                    }}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tomato-stamp/20 ${
                      currentPage === "/launch-rfp" 
                        ? "text-tomato-stamp bg-tomato-stamp/10 border-l-4 border-tomato-stamp rounded-l-none" 
                        : "text-pine-shadow hover:text-tomato-stamp hover:bg-pine-shadow/10 focus:bg-pine-shadow/10"
                    }`}
                  >
                    Launch RFP
                  </a>
                  <a
                    href="/suggest-tip"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate("/suggest-tip")
                      setMobileMenuOpen(false)
                    }}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tomato-stamp/20 ${
                      currentPage === "/suggest-tip" 
                        ? "text-tomato-stamp bg-tomato-stamp/10 border-l-4 border-tomato-stamp rounded-l-none" 
                        : "text-pine-shadow hover:text-tomato-stamp hover:bg-pine-shadow/10 focus:bg-pine-shadow/10"
                    }`}
                  >
                    Suggest Tip
                  </a>
                  <a
                    href="/faq"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate("/faq")
                      setMobileMenuOpen(false)
                    }}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tomato-stamp/20 ${
                      currentPage === "/faq" 
                        ? "text-tomato-stamp bg-tomato-stamp/10 border-l-4 border-tomato-stamp rounded-l-none" 
                        : "text-pine-shadow hover:text-tomato-stamp hover:bg-pine-shadow/10 focus:bg-pine-shadow/10"
                    }`}
                  >
                    FAQ
                  </a>
                </div>

                {/* Account & Network Section */}
                <div className="pt-8 mt-8 border-t border-pine-shadow-20">
                  <div className="text-xs font-medium uppercase tracking-wider text-pine-shadow-60 mb-4 px-4">
                    Account & Network
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex flex-col gap-3">
                      <Header />
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    )
  }

  let pageContent
  if (currentPage === "/launch-rfp") {
    pageContent = <RfpForm />
  } else if (currentPage === "/suggest-tip") {
    pageContent = <TipPage />
  } else if (currentPage === "/faq") {
    pageContent = <FaqPage />
  } else {
    pageContent = <JobBoardPage />
  }

  return (
    <div className="min-h-screen bg-canvas-cream">
      <AppHeader />
      <main className="poster-container">{pageContent}</main>
    </div>
  );
}

export default App;
