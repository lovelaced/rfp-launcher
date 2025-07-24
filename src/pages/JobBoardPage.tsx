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
  polkadot: "https://polkadot-api.subsquare.io/treasury/bounties?page=1&pageSize=100",
  polkadotReferenda: "https://polkadot-api.subsquare.io/search?text=rfp&page=1&pageSize=100",
  kusamaReferenda: "https://kusama-api.subsquare.io/search?text=rfp&page=1&pageSize=100"
}

type SortKey = "date" | "amount" | "title"
type SortOrder = "asc" | "desc"
type StatusFilter = "all" | "active" | "proposed" | "accepting-submissions" | "in-progress" | "completed"

interface BountyWithChildren extends SubsquareBountyItem {
  childBounties?: SubsquareChildBountiesResponse
  network: "kusama" | "polkadot"
  submissionDeadline?: Date | null
  projectCompletionDate?: Date | null
  curatorAcceptedDate?: Date | null
  isReferendum?: boolean
  currency?: string
  assetKind?: any
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

// Helper function to parse project completion date from content
const parseProjectCompletionDate = (content: string): Date | null => {
  // Simply get all dates and return the last one as the likely project completion date
  const allDates = parseAllTimelineDates(content)
  
  if (allDates.length > 0) {
    // Sort dates chronologically and return the last one
    allDates.sort((a, b) => a.getTime() - b.getTime())
    return allDates[allDates.length - 1]
  }
  
  return null
}

// Helper function to parse any timeline date (for checking if all dates have passed)
const parseAllTimelineDates = (content: string): Date[] => {
  const dates: Date[] = []
  
  // Try different timeline section patterns
  let timelineContent = ""
  
  // Try ## Timeline pattern first
  const timelineMatch = content.match(/##\s*Timeline[\s\S]*?(?=\n##|$)/i)
  if (timelineMatch) {
    timelineContent = timelineMatch[0]
  } else {
    // Try bold **Timeline** pattern
    const boldMatch = content.match(/\*\*Timeline\*\*:?[\s\S]*?(?=\n\*\*|\n##|$)/i)
    if (boldMatch) {
      timelineContent = boldMatch[0]
    } else {
      // Try simple Timeline: pattern
      const simpleMatch = content.match(/Timeline:[\s\S]*?(?=\n\n|$)/i)
      if (simpleMatch) {
        timelineContent = simpleMatch[0]
      } else {
        // Look for timeline information in sentences
        const sentenceMatch = content.match(/(?:timeline|schedule)(?:\s+(?:includes?|is|are))?[\s\S]*?(?:\.|$)/i)
        if (sentenceMatch) {
          timelineContent = sentenceMatch[0]
        }
      }
    }
  }
  
  // If no timeline section found, search the entire content for dates
  if (!timelineContent) {
    timelineContent = content
  }
  
  // Look for date patterns in various formats
  const datePatterns = [
    // "Monday, January 15" or "Monday, January 15, 2024"
    /(\w+,\s*\w+\s+\d+(?:,\s*\d{4})?)/g,
    // "January 15, 2024"
    /(\w+\s+\d+,\s*\d{4})/g,
    // "June 8" or "July 16" - simple month + day
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})\b/gi,
    // "15th January" or "8th June"
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\b/gi,
    // "Jan 15" or "Jul 16" - abbreviated months
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\b/gi
  ]
  
  for (const pattern of datePatterns) {
    const matches = timelineContent.matchAll(pattern)
    for (const match of matches) {
      const dateStr = match[1]
      let parsed: Date
      
      // If no year is specified, we need to be smart about which year to use
      if (!dateStr.match(/\d{4}/)) {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        
        // Try parsing with current year first
        parsed = new Date(`${dateStr}, ${currentYear}`)
        
        // If invalid date, try different formats
        if (isNaN(parsed.getTime())) {
          // Try formats like "15th January" -> "January 15"
          const ordinalMatch = dateStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)/)
          if (ordinalMatch) {
            parsed = new Date(`${ordinalMatch[2]} ${ordinalMatch[1]}, ${currentYear}`)
          } else {
            parsed = new Date(dateStr)
          }
        }
        
        // If still invalid, skip this date
        if (isNaN(parsed.getTime())) {
          continue
        }
        
        // If the date is more than 6 months in the future, assume it's from last year
        const sixMonthsFuture = new Date()
        sixMonthsFuture.setMonth(sixMonthsFuture.getMonth() + 6)
        if (parsed > sixMonthsFuture) {
          parsed = new Date(`${dateStr}, ${currentYear - 1}`)
        }
      } else {
        parsed = new Date(dateStr)
        if (isNaN(parsed.getTime())) {
          continue
        }
      }
      
      if (!isNaN(parsed.getTime())) {
        dates.push(parsed)
      }
    }
  }
  
  return dates
}

// Helper function to determine actual bounty status based on timeline
const determineBountyStatus = (bounty: SubsquareBountyItem & { isReferendum?: boolean; bountyIndex?: number }): { 
  status: "proposed" | "accepting-submissions" | "in-progress" | "completed", 
  submissionDeadline: Date | null,
  projectCompletionDate: Date | null,
  curatorAcceptedDate: Date | null 
} => {
  const timeline = bounty.onchainData?.timeline || []
  const state = bounty.onchainData?.state?.state
  const content = bounty.content || ""
  
  // For Polkadot referenda, check if it's still in voting or rejected
  if (bounty.isReferendum) {
    // States like "Deciding", "Confirming" mean it's still being voted on
    if (["Deciding", "Confirming", "Queueing", "Preparing", "Submitted"].includes(state)) {
      return { status: "proposed", submissionDeadline: null, projectCompletionDate: null, curatorAcceptedDate: null }
    }
    
    // For executed referenda, we need to check the actual timeline dates
    if (state === "Executed") {
      // Parse the dates from content
      const submissionDeadline = parseSubmissionDeadline(content)
      const projectCompletionDate = parseProjectCompletionDate(content)
      
      // Also get all timeline dates to check if everything is complete
      const allTimelineDates = parseAllTimelineDates(content)
      const now = new Date()
      
      
      // Check if ALL timeline dates have passed (indicating completion)
      if (allTimelineDates.length > 0) {
        const allDatesPassed = allTimelineDates.every(date => now > date)
        if (allDatesPassed) {
          return { status: "completed", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
        }
      }
      
      // If no timeline dates found but project completion date exists and passed
      if (projectCompletionDate && now > projectCompletionDate) {
        return { status: "completed", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
      }
      
      // Check if we're still accepting submissions
      if (submissionDeadline && now < submissionDeadline) {
        return { status: "accepting-submissions", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
      }
      
      // Otherwise it's in progress
      return { status: "in-progress", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
    }
  }
  
  // Find key events in timeline (for bounties)
  const becameActiveEvent = timeline.find(event => event.method === "BountyBecameActive")
  
  // If bounty is "Proposed", it's not yet active
  if (state === "Proposed") {
    return { status: "proposed", submissionDeadline: null, projectCompletionDate: null, curatorAcceptedDate: null }
  }
  
  // Parse submission deadline and project completion date from content
  let submissionDeadline = parseSubmissionDeadline(content)
  const projectCompletionDate = parseProjectCompletionDate(content)
  
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
  
  // Check bounty status based on dates
  const now = new Date()
  
  // Check if project is completed (past completion date)
  if (projectCompletionDate && now > projectCompletionDate) {
    return { status: "completed", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
  }
  
  // Check if we're still in submission period
  if (submissionDeadline && now < submissionDeadline) {
    return { status: "accepting-submissions", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
  }
  
  return { status: "in-progress", submissionDeadline, projectCompletionDate, curatorAcceptedDate: null }
}

export const JobBoardPage: React.FC = () => {
  const [bounties, setBounties] = useState<BountyWithChildren[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")

  useEffect(() => {
    const fetchRfpFromSearch = async (network: "kusama" | "polkadot"): Promise<BountyWithChildren[]> => {
      try {
        const url = network === "polkadot" ? API_URLS.polkadotReferenda : API_URLS.kusamaReferenda
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${network} RFP search results: ${response.statusText}`)
        }
        const data = await response.json()
        
        
        // The search API returns results in different sections
        let allRfpItems = []
        
        // For Polkadot: only get referenda (not treasury spends which are duplicates)
        // For Kusama: only get bounties
        if (network === "polkadot") {
          const referenda = data.openGovReferenda || []
          
          allRfpItems = referenda.filter((item: any) => {
            // Filter out rejected referenda
            const state = item.state?.name || item.state || ""
            const isRejected = state === "Rejected" || state === "Cancelled" || state === "TimedOut"
            
            return !isRejected
          })
        } else {
          // Only get bounties and child bounties for Kusama
          const bounties = data.bounties || []
          const childBounties = data.childBounties || []
          allRfpItems = [...bounties, ...childBounties]
        }
        
        
        // Convert to bounty-like format for compatibility
        return allRfpItems.map((item: any) => {
          const isReferendum = !!item.referendumIndex
          const index = item.referendumIndex || item.proposalIndex || item.bountyIndex || 0
          
          // Get the actual value and currency from different sources
          let value = "0"
          let currency = network === "polkadot" ? "DOT" : "KSM"
          let assetKind = null
          
          if (item.allSpends && item.allSpends.length > 0) {
            // For treasury spends/referenda, get the first spend's details
            const firstSpend = item.allSpends[0]
            value = firstSpend.amount || "0"
            
            // Check if it's USDC/USDT or native token
            if (firstSpend.assetKind) {
              assetKind = firstSpend.assetKind
              currency = firstSpend.assetKind.symbol || currency
            }
          } else if (item.value) {
            value = item.value
          } else if (item.onchainData?.treasurySpend?.amount) {
            // For referenda with treasury spend info
            value = item.onchainData.treasurySpend.amount
          } else if (item.requestedAmount) {
            // Some items might have requestedAmount field
            value = item.requestedAmount
          }
          
          // Extract content from contentSummary if available
          const content = item.content || item.contentSummary?.summary || ""
          
          const bountyForStatus = {
            ...item,
            onchainData: {
              ...item.onchainData,
              state: { state: item.state?.name || item.state || "Active" },
              timeline: item.onchainData?.timeline || []
            },
            content: content,
            isReferendum: isReferendum,
            bountyIndex: index
          }
          
          
          const statusInfo = determineBountyStatus(bountyForStatus)
          
          const result: BountyWithChildren = {
            ...item, // Keep all original properties including isPaid
            bountyIndex: index,
            title: item.title || `RFP #${index}`,
            content: content,
            createdAt: item.createdAt || new Date().toISOString(),
            lastActivityAt: item.updatedAt || item.createdAt || new Date().toISOString(),
            onchainData: {
              state: { state: item.state?.name || item.state || "Active" },
              value: value,
              description: item.title || `RFP #${index}`,
              meta: {
                proposer: item.proposer || item.onchainData?.proposer || ""
              },
              timeline: item.onchainData?.timeline || []
            },
            childBounties: { items: [], page: 1, pageSize: 100, total: 0 },
            network: network,
            submissionDeadline: statusInfo.submissionDeadline,
            projectCompletionDate: statusInfo.projectCompletionDate,
            curatorAcceptedDate: null,
            // Flag to indicate this is a referendum/proposal, not a bounty
            isReferendum: isReferendum,
            // Store currency info for proper display
            currency: currency,
            assetKind: assetKind
          }
          
          
          return result
        })
      } catch (err) {
        console.error(`Error fetching ${network} RFP search results:`, err)
        return []
      }
    }

    const fetchBountiesFromNetwork = async (network: "kusama" | "polkadot"): Promise<BountyWithChildren[]> => {
      try {
        const response = await fetch(API_URLS[network])
        if (!response.ok) {
          throw new Error(`Failed to fetch ${network} bounties: ${response.statusText}`)
        }
        const data: SubsquareBountiesResponse = await response.json()
        const rfpBounties = data.items.filter(
          (bounty) => {
            const hasOnchainData = !!bounty.onchainData
            // Check title, description, and content fields for RFP
            const hasRFPInDescription = bounty.onchainData?.description?.toUpperCase().includes("RFP") || false
            const hasRFPInTitle = bounty.title?.toUpperCase().includes("RFP") || false
            const hasRFPInContent = bounty.content?.toUpperCase().includes("RFP") || false
            const hasValidState = bounty.onchainData?.state?.state ? 
              ["Proposed", "Approved", "Funded", "Active", "PendingPayout"].includes(bounty.onchainData.state.state) : false
            
            const isRFP = hasOnchainData && (hasRFPInDescription || hasRFPInTitle || hasRFPInContent) && hasValidState
            return isRFP
          }
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
                  projectCompletionDate: statusInfo.projectCompletionDate,
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
              projectCompletionDate: statusInfo.projectCompletionDate,
              curatorAcceptedDate: statusInfo.curatorAcceptedDate
            }
          })
        )
        
        return bountiesWithChildren
      } catch (err) {
        console.error(`[ERROR] Error fetching ${network} bounties:`, {
          network,
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          url: API_URLS[network]
        })
        throw err
      }
    }

    const fetchAllBounties = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch from both networks independently to handle failures gracefully
        // For Kusama: fetch bounties (RFPs are bounties)
        // For Polkadot: fetch bounties AND search for referenda RFPs
        const results = await Promise.allSettled([
          fetchBountiesFromNetwork("kusama"),
          fetchBountiesFromNetwork("polkadot"),
          fetchRfpFromSearch("polkadot")
          // Don't fetch search results for Kusama - we get those from bounties
        ])
        
        const kusamaBounties = results[0].status === 'fulfilled' ? results[0].value : []
        const polkadotBounties = results[1].status === 'fulfilled' ? results[1].value : []
        const polkadotRfpSearch = results[2].status === 'fulfilled' ? results[2].value : []
        
        // Log any errors
        if (results[0].status === 'rejected') {
          console.error('[ERROR] Kusama bounties fetch failed:', results[0].reason)
        }
        if (results[1].status === 'rejected') {
          console.error('[ERROR] Polkadot bounties fetch failed:', results[1].reason)
        }
        if (results[2].status === 'rejected') {
          console.error('[ERROR] Polkadot RFP search failed:', results[2].reason)
        }
        
        // Combine all results, avoiding duplicates by creating a unique key
        const bountyMap = new Map<string, any>()
        
        // Add all bounties to map, using network + index as key
        const allItems = [...kusamaBounties, ...polkadotBounties, ...polkadotRfpSearch]
        allItems.forEach(bounty => {
          const key = `${bounty.network}-${bounty.bountyIndex}`
          // Only add if not already present (prefer bounties over search results)
          if (!bountyMap.has(key)) {
            bountyMap.set(key, bounty)
          }
        })
        
        const allBounties = Array.from(bountyMap.values())
        setBounties(allBounties)
        
        // Show error only if both networks failed
        if (results[0].status === 'rejected' && results[1].status === 'rejected') {
          setError("Failed to fetch bounties from both Kusama and Polkadot networks.")
        }
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
        // Use the already-parsed dates if available
        const now = new Date()
        let status: string
        
        // Check if bounty is proposed
        if (bounty.onchainData?.state?.state === "Proposed") {
          status = "proposed"
        }
        // Check if project is completed (past completion date)
        else if (bounty.projectCompletionDate && now > bounty.projectCompletionDate) {
          status = "completed"
        }
        // Check if accepting submissions
        else if (bounty.submissionDeadline && now < bounty.submissionDeadline) {
          status = "accepting-submissions"
        }
        // Otherwise it's in progress
        else {
          status = "in-progress"
        }
        
        if (statusFilter === "active") {
          // Active means not proposed and not completed
          return status !== "proposed" && status !== "completed"
        } else if (statusFilter === "proposed") {
          return status === "proposed"
        } else if (statusFilter === "accepting-submissions") {
          return status === "accepting-submissions"
        } else if (statusFilter === "in-progress") {
          // Only show RFPs that are in-progress (not completed, not proposed, not accepting submissions)
          return status === "in-progress"
        } else if (statusFilter === "completed") {
          return status === "completed"
        }
        return true
      })
    }
    

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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="all">All RFPs</SelectItem>
              <SelectItem value="proposed">Proposed</SelectItem>
              <SelectItem value="accepting-submissions">Accepting Submissions</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
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
        
        {statusFilter === "active" && (
          <div className="text-xs text-pine-shadow-60 text-center">
            Active RFPs are those currently accepting submissions or in progress (excludes proposed and completed RFPs)
          </div>
        )}
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


