"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import type { SubsquareBountyItem, SubsquareBountiesResponse } from "@/types/subsquare-bounty"
import { BountyCard } from "@/components/job-board/BountyCard"
import { Spinner } from "@/components/Spinner"
import { AlertTriangle, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_URL = "https://kusama-api.subsquare.io/treasury/bounties?page=1&pageSize=100"

type SortKey = "date" | "amount" | "title"
type SortOrder = "asc" | "desc"

export const JobBoardPage: React.FC = () => {
  const [bounties, setBounties] = useState<SubsquareBountyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  useEffect(() => {
    const fetchBounties = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(API_URL)
        if (!response.ok) {
          throw new Error(`Failed to fetch bounties: ${response.statusText}`)
        }
        const data: SubsquareBountiesResponse = await response.json()
        const rfpBounties = data.items.filter(
          (bounty) =>
            bounty.onchainData &&
            ((bounty.onchainData.description && bounty.onchainData.description.toUpperCase().includes("RFP")) ||
              (bounty.title && bounty.title.toUpperCase().includes("RFP"))) &&
            ["Proposed", "Approved", "Funded", "Active", "PendingPayout"].includes(bounty.onchainData.state.state),
        )
        setBounties(rfpBounties)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBounties()
  }, [])

  const filteredAndSortedBounties = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    const filtered = bounties.filter(
      (bounty) =>
        (bounty.onchainData?.description?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
        (bounty.title?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
        (bounty.onchainData?.meta?.proposer?.toLowerCase() || "").includes(lowerCaseSearchTerm),
    )

    // Sorting logic
    filtered.sort((a, b) => {
      let valA: any
      let valB: any

      switch (sortKey) {
        case "date":
          valA = new Date(a.lastActivityAt).getTime()
          valB = new Date(b.lastActivityAt).getTime()
          break
        case "amount":
          valA = a.onchainData?.value ? BigInt(a.onchainData.value) : BigInt(0)
          valB = b.onchainData?.value ? BigInt(b.onchainData.value) : BigInt(0)
          break
        case "title":
          valA = (a.onchainData?.description || a.title || "").toLowerCase()
          valB = (b.onchainData?.description || b.title || "").toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        if (valA < valB) return -1
        if (valA > valB) return 1
        return 0
      } else {
        // desc
        if (valA > valB) return -1
        if (valA < valB) return 1
        return 0
      }
    })

    return filtered
  }, [searchTerm, bounties, sortKey, sortOrder])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-medium text-midnight-koi mb-3">Kusama RFP Job Board</h1>
        <p className="text-lg text-pine-shadow max-w-2xl mx-auto">
          Discover active Request for Proposals (RFPs) on the Kusama Treasury. Find opportunities to contribute and get
          funded.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by title, proposer, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="poster-input pl-10 text-sm w-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pine-shadow-60" />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <span className="text-sm font-medium text-pine-shadow shrink-0">Sort by:</span>
          <Select onValueChange={(value) => setSortKey(value as SortKey)} value={sortKey}>
            <SelectTrigger className="w-full sm:w-[180px] poster-input text-sm">
              <SelectValue placeholder="Select criteria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Last Activity</SelectItem>
              <SelectItem value="amount">KSM Amount</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setSortOrder(value as SortOrder)} value={sortOrder}>
            <SelectTrigger className="w-full sm:w-[180px] poster-input text-sm">
              <SelectValue placeholder="Select order" />
            </SelectTrigger>
            <SelectContent>
              {sortKey === "date" && (
                <>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </>
              )}
              {sortKey === "amount" && (
                <>
                  <SelectItem value="desc">Highest First</SelectItem>
                  <SelectItem value="asc">Lowest First</SelectItem>
                </>
              )}
              {sortKey === "title" && (
                <>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-pine-shadow py-10">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-lg">Loading Kusama RFPs...</p>
        </div>
      )}

      {error && (
        <div className="poster-alert alert-error max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <h4 className="font-medium text-lg">Error Fetching Bounties</h4>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && filteredAndSortedBounties.length === 0 && (
        <div className="text-center text-pine-shadow-60 py-10">
          <p className="text-xl mb-2">No RFPs found matching your criteria.</p>
          <p>Try adjusting your search or sort options, or check back later for new proposals.</p>
        </div>
      )}

      {!isLoading && !error && filteredAndSortedBounties.length > 0 && (
        <div className="space-y-8">
          {filteredAndSortedBounties.map((bounty) => (
            <BountyCard key={bounty._id} bounty={bounty} />
          ))}
        </div>
      )}
      <div className="text-center mt-12 text-sm text-pine-shadow-60">
        <p>
          This board lists bounties from Subsquare that appear to be RFPs. To create your own RFP, use the{" "}
          <a href="/create-rfp" className="font-medium underline hover:text-tomato-stamp">
            RFP Launcher tool
          </a>
          .
        </p>
      </div>
    </div>
  )
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  return <input className={`poster-input ${className}`} {...props} />
}

