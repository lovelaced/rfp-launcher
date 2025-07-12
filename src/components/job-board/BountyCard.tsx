"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { SubsquareBountyItem } from "@/types/subsquare-bounty"
import { formatToken } from "@/lib/formatToken"
import { PolkadotIdenticon } from "@polkadot-api/react-components"
import { sliceMiddleAddr, getPublicKey } from "@/lib/ss58"
import { ExternalLink } from "@/components/ExternalLink"
import { matchedChain } from "@/chainRoute"
import { Briefcase, UserCircle, Tag, Calendar, Layers, ChevronDown, ChevronUp, Info } from "lucide-react"
import { formatDate } from "@/lib/date"
import ReactMarkdown from "react-markdown"
// Import customComponents from your existing MarkdownPreview
import { customComponents as markdownStyles } from "@/components/RfpForm/MarkdownPreview"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button" // Assuming Button component is available

interface BountyCardProps {
  bounty: SubsquareBountyItem
}

export const BountyCard: React.FC<BountyCardProps> = ({ bounty }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const bountyValue = bounty.onchainData?.value ? BigInt(bounty.onchainData.value) : BigInt(0)
  const proposerAddress = bounty.onchainData?.meta?.proposer || bounty.proposer
  const bountyStatus = bounty.onchainData?.state?.state || bounty.state
  const bountyTitle = bounty.onchainData?.description || bounty.title
  const bountyContent = bounty.content || "No detailed description provided for this RFP."

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
          <h3 className="text-2xl font-medium text-midnight-koi leading-tight break-words">{bountyTitle}</h3>
        </div>
      </div>
      {/* Card Body: Two Columns (Metadata Sidebar + Main Content) */}
      <div className="grid md:grid-cols-[minmax(200px,_1fr)_2fr] gap-x-6 gap-y-4 flex-grow">
        {/* Metadata Sidebar */}
        <div className="space-y-3 md:border-r md:border-pine-shadow-10 md:pr-6">
          <MetadataItem icon={Layers} label="Value" value={formatToken(bountyValue)} />
          <MetadataItem icon={Tag} label="Status" value={bountyStatus} />
          <MetadataItem
            icon={UserCircle}
            label="Proposer"
            value={
              proposerAddress ? (
                <div className="flex items-center gap-1">
                  <PolkadotIdenticon publicKey={getPublicKey(proposerAddress)} size={16} />
                  <span className="font-mono text-xs text-midnight-koi">{sliceMiddleAddr(proposerAddress)}</span>
                </div>
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
            <ExternalLink href={`https://${matchedChain}.subsquare.io/treasury/bounties/${bounty.bountyIndex}`}>
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

