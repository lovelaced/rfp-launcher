"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { SubsquareBountyItem, SubsquareChildBountiesResponse } from "@/types/subsquare-bounty"
import { formatTokenForNetwork } from "@/lib/formatToken"
import { PolkadotIdenticon } from "@polkadot-api/react-components"
import { sliceMiddleAddr } from "@/lib/ss58"
import { getSs58AddressInfo } from "polkadot-api"
import { ExternalLink } from "@/components/ExternalLink"
import { Briefcase, UserCircle, Tag, Calendar, Layers, ChevronDown, ChevronUp, Info } from "lucide-react"
import { formatDate } from "@/lib/date"
import ReactMarkdown from "react-markdown"
// Import customComponents from your existing MarkdownPreview
import { customComponents as markdownStyles } from "@/components/RfpForm/MarkdownPreview"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button" // Assuming Button component is available

interface BountyCardProps {
  bounty: SubsquareBountyItem & { 
    childBounties?: SubsquareChildBountiesResponse
    network?: "kusama" | "polkadot"
    submissionDeadline?: Date | null
    projectCompletionDate?: Date | null
    curatorAcceptedDate?: Date | null
    isReferendum?: boolean
    currency?: string
    assetKind?: any
  }
}

export const BountyCard: React.FC<BountyCardProps> = ({ bounty }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const bountyValue = bounty.onchainData?.value ? BigInt(bounty.onchainData.value) : BigInt(0)
  const proposerAddress = bounty.onchainData?.meta?.proposer || bounty.proposer
  
  // Format value with correct currency
  const formatValue = () => {
    if (!bountyValue) return "0"
    
    // Check if it's a stablecoin (USDC/USDT)
    if (bounty.currency && (bounty.currency === "USDC" || bounty.currency === "USDT")) {
      // Stablecoins typically have 6 decimals
      const decimals = 6
      const value = Number(bountyValue) / 10 ** decimals
      
      // Format with up to 2 decimal places, but remove trailing zeros
      const formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
      
      return `${formatted} ${bounty.currency}`
    }
    
    // Otherwise use native token formatting
    return formatTokenForNetwork(bountyValue, bounty.network || "kusama")
  }
  
  // Parse the RFP title to extract the RFP number and clean title
  const originalTitle = bounty.onchainData?.description || bounty.title || ""
  const networkPrefix = bounty.network === "polkadot" ? "DOT" : "KSM"
  
  // Try to extract RFP number from the title
  const rfpMatch = originalTitle.match(/(?:DOT|KSM)?\s*RFP\s*#?(\d+)(?:\s*[-:]?\s*(.*))?/i)
  let bountyTitle = originalTitle
  
  if (rfpMatch) {
    const rfpNumber = rfpMatch[1]
    const subtitle = rfpMatch[2] || ""
    // Standardize the format
    bountyTitle = `${networkPrefix} RFP #${rfpNumber}${subtitle ? `: ${subtitle.trim()}` : ""}`
  } else if (originalTitle.toLowerCase().includes("rfp")) {
    // Has RFP but no number - just ensure network prefix
    bountyTitle = `${networkPrefix} ${originalTitle}`
  }
    
  const bountyContent = bounty.content || "No detailed description provided for this RFP."
  
  // Determine actual status based on timeline
  const determineStatus = () => {
    const state = bounty.onchainData?.state?.state
    const now = new Date()
    
    // If bounty is "Proposed", it's not yet active
    if (state === "Proposed") {
      return { label: "Proposed", color: "text-pine-shadow" }
    }
    
    // Check if project is completed (past completion date)
    if (bounty.projectCompletionDate && now > bounty.projectCompletionDate) {
      return { label: "Completed", color: "text-pine-shadow-60" }
    }
    
    // For Active/Funded bounties, check submission deadline
    if (state === "Active" || state === "Funded") {
      // Check if we have a calculated submission deadline
      if (bounty.submissionDeadline) {
        if (now < bounty.submissionDeadline) {
          return { label: "Accepting Submissions", color: "text-lilypad" }
        }
      } else {
        // If no deadline calculated but bounty is active, assume accepting submissions
        return { label: "Accepting Submissions", color: "text-lilypad" }
      }
    }
    
    // Check if team is selected (has child bounties)
    if (bounty.childBounties && bounty.childBounties.total > 0) {
      return { label: "Team Selected, In Progress", color: "text-lilypad" }
    }
    
    return { label: "In Progress", color: "text-sun-bleach" }
  }
  
  const statusInfo = determineStatus()
  

  const MAX_COLLAPSED_HEIGHT_PX = 120 // Approx 5 lines of text

  useEffect(() => {
    if (contentRef.current) {
      // Check for overflow only when collapsed
      if (!isExpanded) {
        setIsOverflowing(contentRef.current.scrollHeight > MAX_COLLAPSED_HEIGHT_PX)
      } else {
        // If expanded, it's not "overflowing" in the sense of needing a "read more"
        setIsOverflowing(false)
      }
    }
  }, [bountyContent, isExpanded])

  const MetadataItem: React.FC<{
    icon: React.ElementType
    label: string
    value?: string | React.ReactNode
    small?: boolean
  }> = ({ icon: Icon, label, value, small = false }) => (
    <div className={`flex items-start gap-2 ${small ? "text-xs" : "text-sm"}`}>
      <Icon size={small ? 14 : 16} className="text-sun-bleach shrink-0 mt-0.5" />
      <div>
        <span className="text-pine-shadow-60">{label}: </span>
        {typeof value === "string" ? <strong className="text-midnight-koi">{value}</strong> : value}
      </div>
    </div>
  )

  return (
    <div className="poster-card flex flex-col h-full">
      {" "}
      {/* Ensure card takes full height for grid alignment */}
      {/* Card Header: Title */}
      <div className="mb-4 pb-3 border-b border-pine-shadow-10">
        <div className="flex items-start gap-3">
          <Briefcase size={28} className="text-lake-haze shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-2xl font-medium text-midnight-koi leading-tight break-words">{bountyTitle}</h3>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                bounty.network === "polkadot" 
                  ? "bg-[#E6007A] text-white" 
                  : "bg-black text-[var(--canvas-cream)]"
              }`}>
                {bounty.network || "kusama"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Card Body: Two Columns (Metadata Sidebar + Main Content) */}
      <div className="grid md:grid-cols-[minmax(200px,_1fr)_2fr] gap-x-6 gap-y-4 flex-grow">
        {/* Metadata Sidebar */}
        <div className="space-y-3 md:border-r md:border-pine-shadow-10 md:pr-6">
          <MetadataItem icon={Layers} label="Value" value={formatValue()} />
          <MetadataItem 
            icon={Tag} 
            label="Status" 
            value={<span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>} 
          />
          {bounty.submissionDeadline && statusInfo.label === "Accepting Submissions" && (
            <MetadataItem
              icon={Calendar}
              label="Deadline"
              value={formatDate(bounty.submissionDeadline)}
              small
            />
          )}
          <MetadataItem
            icon={UserCircle}
            label="Proposer"
            value={
              proposerAddress ? (
                (() => {
                  const addressInfo = getSs58AddressInfo(proposerAddress)
                  if (!addressInfo.isValid) return "Invalid address"
                  return (
                    <div className="flex items-center gap-1">
                      <PolkadotIdenticon publicKey={addressInfo.publicKey} size={16} />
                      <span className="font-mono text-xs text-midnight-koi">{sliceMiddleAddr(proposerAddress)}</span>
                    </div>
                  )
                })()
              ) : (
                "N/A"
              )
            }
            small
          />
          <MetadataItem
            icon={Calendar}
            label="Last Activity"
            value={formatDate(new Date(bounty.lastActivityAt))}
            small
          />
          <div className="pt-3 mt-3 border-t border-pine-shadow-10">
            <ExternalLink href={
              bounty.isReferendum 
                ? `https://${bounty.network || "kusama"}.subsquare.io/referenda/${bounty.bountyIndex}`
                : `https://${bounty.network || "kusama"}.subsquare.io/treasury/bounties/${bounty.bountyIndex}`
            }>
              <Button variant="outline" className="w-full poster-btn btn-secondary text-xs py-2">
                <Info size={14} className="mr-2" /> View on Subsquare
              </Button>
            </ExternalLink>
          </div>
        </div>

        {/* Main Content: Expandable Markdown */}
        <div className="md:pl-0">
          <div
            ref={contentRef}
            className={cn(
              "prose prose-sm max-w-none text-pine-shadow-90 overflow-hidden transition-all duration-300 ease-in-out",
              !isExpanded && "max-h-[120px]", // MAX_COLLAPSED_HEIGHT_PX
            )}
            style={{
              maxHeight: !isExpanded ? `${MAX_COLLAPSED_HEIGHT_PX}px` : undefined,
            }}
          >
            <ReactMarkdown components={markdownStyles}>{bountyContent}</ReactMarkdown>
          </div>
          {(isOverflowing || isExpanded) && ( // Show button if content was overflowing OR if it's currently expanded
            <Button
              variant="link"
              onClick={() => setIsExpanded(!isExpanded)}
              className="poster-btn text-tomato-stamp hover:text-midnight-koi p-0 h-auto text-xs mt-2 flex items-center gap-1"
            >
              {isExpanded ? "Read Less" : "Read More"}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

