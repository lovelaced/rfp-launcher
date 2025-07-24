"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import type { SubsquareBountyItem, SubsquareBountiesResponse, SubsquareChildBountiesResponse } from "@/types/subsquare-bounty"
import { BountyCard } from "@/components/job-board/BountyCard"
import { Spinner } from "@/components/Spinner"
import { AlertTriangle, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_URLS = {
  kusama: "https://kusama-api.subsquare.io/treasury/bounties?page=1&pageSize=100",
  polkadot: "https://polkadot-api.subsquare.io/treasury/bounties?page=1&pageSize=100"
}

type SortKey = "date" | "amount" | "title"
type SortOrder = "asc" | "desc"
type StatusFilter = "all" | "proposed" | "accepting-submissions" | "in-progress"

interface BountyWithChildren extends SubsquareBountyItem {
  childBounties?: SubsquareChildBountiesResponse
  network: "kusama" | "polkadot"
  submissionDeadline?: Date | null
  curatorAcceptedDate?: Date | null
}

// Helper function to parse submission deadline from content
const parseSubmissionDeadline = (content: string): Date | null => {
  // First try to find explicit date patterns like "Monday, January 15 - Submission deadline"
  const datePatterns = [
    /(\w+,\s*\w+\s+\d+)\s*[-–]\s*[Ss]ubmission\s*[Dd]eadline/,
    /[Ss]ubmission\s*[Dd]eadline\s*[-–]\s*(\w+,\s*\w+\s+\d+)/,
    /(\w+,\s*\w+\s+\d+,\s*\d{4})\s*[-–]\s*[Ss]ubmission\s*[Dd]eadline/,
  ]
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const dateStr = match[1]
      // Try to parse the date string
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    }
  }
  
  // Fall back to old week-based format for legacy RFPs
  const weekPatterns = [
    /(\d+)\s*[Ww]eeks?\s*after\s*[Bb]ounty\s*[Ff]unding\s*[-–]\s*[Ss]ubmission\s*[Dd]eadline/,
    /[Ss]ubmission\s*[Dd]eadline.*?(\d+)\s*[Ww]eeks?\s*after/,
    /(\d+)\s*[Ww]eeks?\s*[-–]\s*[Ss]ubmission\s*[Dd]eadline/
  ]
  
  for (const pattern of weekPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const weeks = parseInt(match[1], 10)
      // Return weeks count as negative number to indicate it needs timeline calculation
      return new Date(-weeks * 7 * 24 * 60 * 60 * 1000)
    }
  }
  
  return null
}

// Helper function to determine actual bounty status based on timeline
const determineBountyStatus = (bounty: SubsquareBountyItem): { 
  status: "proposed" | "accepting-submissions" | "in-progress", 
  submissionDeadline: Date | null,
  curatorAcceptedDate: Date | null 
} => {
  const timeline = bounty.onchainData?.timeline || []
  const state = bounty.onchainData?.state?.state
  const content = bounty.content || ""
  
  // Find key events in timeline
  const becameActiveEvent = timeline.find(event => event.method === "BountyBecameActive")
  
  // If bounty is "Proposed", it's not yet active
  if (state === "Proposed") {
    return { status: "proposed", submissionDeadline: null, curatorAcceptedDate: null }
  }
  
  // Parse submission deadline from content
  let submissionDeadline = parseSubmissionDeadline(content)
  
  // Handle legacy week-based format (negative timestamp indicates weeks)
  if (submissionDeadline && submissionDeadline.getTime() < 0) {
    const weeks = Math.abs(submissionDeadline.getTime()) / (7 * 24 * 60 * 60 * 1000)
    
    if (becameActiveEvent) {
      const activeDate = new Date(becameActiveEvent.indexer.blockTime)
      submissionDeadline = new Date(activeDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
    } else if (state === "Active" || state === "Funded") {
      // If no BountyBecameActive event but state is Active/Funded, estimate based on creation date
      const proposeEvent = timeline.find(event => event.method === "proposeBounty")
      if (proposeEvent) {
        const proposeDate = new Date(proposeEvent.indexer.blockTime)
        // Assume it took about 1 week to get approved/funded
        const estimatedActiveDate = new Date(proposeDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        submissionDeadline = new Date(estimatedActiveDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
      } else {
        submissionDeadline = null
      }
    } else {
      submissionDeadline = null
    }
  }
  
  // Check if we're still in submission period
  const now = new Date()
  if (submissionDeadline && now < submissionDeadline) {
    return { status: "accepting-submissions", submissionDeadline, curatorAcceptedDate: null }
  }
  
  return { status: "in-progress", submissionDeadline, curatorAcceptedDate: null }
}

export const JobBoardPage: React.FC = () => {
  const [bounties, setBounties] = useState<BountyWithChildren[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  useEffect(() => {
    const fetchBountiesFromNetwork = async (network: "kusama" | "polkadot"): Promise<BountyWithChildren[]> => {
      try {
        const response = await fetch(API_URLS[network])
        if (!response.ok) {
          throw new Error(`Failed to fetch ${network} bounties: ${response.statusText}`)
        }
        const data: SubsquareBountiesResponse = await response.json()
        const rfpBounties = data.items.filter(
          (bounty) =>
            bounty.onchainData &&
            ((bounty.onchainData.description && bounty.onchainData.description.toUpperCase().includes("RFP")) ||
              (bounty.title && bounty.title.toUpperCase().includes("RFP"))) &&
            ["Proposed", "Approved", "Funded", "Active", "PendingPayout"].includes(bounty.onchainData.state.state),
        )
        
        // Fetch child bounties for each RFP bounty
        const bountiesWithChildren = await Promise.all(
          rfpBounties.map(async (bounty) => {
            try {
              const childResponse = await fetch(
                `https://${network}-api.subsquare.io/treasury/bounties/${bounty.bountyIndex}/child-bounties?page=1&pageSize=100`
              )
              if (childResponse.ok) {
                const childData: SubsquareChildBountiesResponse = await childResponse.json()
                const statusInfo = determineBountyStatus(bounty)
                return { 
                  ...bounty, 
                  childBounties: childData, 
                  network,
                  submissionDeadline: statusInfo.submissionDeadline,
                  curatorAcceptedDate: statusInfo.curatorAcceptedDate
                }
              }
            } catch (error) {
              console.error(`Failed to fetch child bounties for ${network} bounty ${bounty.bountyIndex}:`, error)
            }
            // Return bounty with empty child bounties if fetch failed
            const statusInfo = determineBountyStatus(bounty)
            return { 
              ...bounty, 
              childBounties: { items: [], page: 1, pageSize: 100, total: 0 }, 
              network,
              submissionDeadline: statusInfo.submissionDeadline,
              curatorAcceptedDate: statusInfo.curatorAcceptedDate
            }
          })
        )
        
        return bountiesWithChildren
      } catch (err) {
        console.error(`Error fetching ${network} bounties:`, err)
        return []
      }
    }

    const fetchAllBounties = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch from both networks in parallel
        const [kusamaBounties, polkadotBounties] = await Promise.all([
          fetchBountiesFromNetwork("kusama"),
          fetchBountiesFromNetwork("polkadot")
        ])
        
        // Combine bounties from both networks
        const allBounties = [...kusamaBounties, ...polkadotBounties]
        setBounties(allBounties)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAllBounties()
  }, [])

  const filteredAndSortedBounties = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    let filtered = bounties.filter(
      (bounty) =>
        (bounty.onchainData?.description?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
        (bounty.title?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
        (bounty.onchainData?.meta?.proposer?.toLowerCase() || "").includes(lowerCaseSearchTerm),
    )
    
    // Apply status filter based on timeline analysis
    if (statusFilter !== "all") {
      filtered = filtered.filter(bounty => {
        const statusInfo = determineBountyStatus(bounty)
        if (statusFilter === "proposed") {
          return statusInfo.status === "proposed"
        } else if (statusFilter === "accepting-submissions") {
          return statusInfo.status === "accepting-submissions"
        } else if (statusFilter === "in-progress") {
          return statusInfo.status === "in-progress" || (bounty.childBounties && bounty.childBounties.total > 0)
        }
        return true
      })
    }
    
    // Debug logging

    // Sorting logic
    filtered.sort((a, b) => {
      let valA: any
      let valB: any

      switch (sortKey) {
        case "date":
          // Use createdAt for "most recently posted"
          valA = new Date(a.createdAt).getTime()
          valB = new Date(b.createdAt).getTime()
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
  }, [searchTerm, bounties, sortKey, sortOrder, statusFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-medium text-midnight-koi mb-3">RFP Job Board</h1>
        <p className="text-lg text-pine-shadow max-w-2xl mx-auto">
          Discover active Request for Proposals (RFPs) on both Kusama and Polkadot treasuries. Find opportunities to contribute and get
          funded.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pine-shadow-60 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by title, proposer, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="poster-input text-sm w-full"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-sm font-medium text-pine-shadow shrink-0">Filter & Sort:</span>
          <Select onValueChange={(value) => setStatusFilter(value as StatusFilter)} value={statusFilter}>
            <SelectTrigger className="w-[140px] poster-input text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RFPs</SelectItem>
              <SelectItem value="proposed">Proposed</SelectItem>
              <SelectItem value="accepting-submissions">Accepting Submissions</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setSortKey(value as SortKey)} value={sortKey}>
            <SelectTrigger className="w-[140px] poster-input text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Posted</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setSortOrder(value as SortOrder)} value={sortOrder}>
            <SelectTrigger className="w-[140px] poster-input text-sm">
              <SelectValue placeholder="Order" />
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
          <p className="text-lg">Fetching opportunities from Kusama and Polkadot...</p>
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
          <p className="text-xl mb-2">Hmm, no RFPs match your search</p>
          <p>Try different filters or check back soon - new opportunities pop up all the time!</p>
        </div>
      )}

      {!isLoading && !error && filteredAndSortedBounties.length > 0 && (
        <div className="space-y-8">
          {filteredAndSortedBounties.map((bounty) => (
            <BountyCard key={bounty._id} bounty={bounty} />
          ))}
        </div>
      )}
      <div className="text-center mt-12 text-sm text-pine-shadow-60 space-y-2">
        <p>
          This board lists bounties from Subsquare that appear to be RFPs. To create your own RFP, use the{" "}
          <a href="/launch-rfp" className="font-medium underline hover:text-tomato-stamp">
            RFP Launcher tool
          </a>
          .
        </p>
        <p>
          Have questions?{" "}
          <a href="/faq" className="font-medium underline hover:text-tomato-stamp">
            Check out our FAQ
          </a>
          {" "}for information about RFPs, tips, and bounty management.
        </p>
      </div>
    </div>
  )
}


