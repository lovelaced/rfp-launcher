// Based on the provided JSON from https://kusama-api.subsquare.io/treasury/bounties/

export interface SubsquareBountyTimelineItem {
  type: string
  method: string
  args: Record<string, any>
  indexer: {
    blockHeight: number
    blockHash: string
    blockTime: number
    extrinsicIndex: number
    eventIndex?: number
  }
}

export interface SubsquareBountyOnchainData {
  _id: string
  indexer: {
    blockHeight: number
    blockHash: string
    blockTime: number
    extrinsicIndex: number
    eventIndex: number
  }
  bountyIndex: number
  authors: string[]
  description: string // This seems to be the actual RFP title
  value: string // Value in picoKSM (string)
  meta: {
    proposer: string
    value: string // picoKSM
    fee: string // picoKSM
    curatorDeposit: string // picoKSM
    bond: string // picoKSM
    status: Record<string, any> // e.g., { proposed: null }, { approved: null }
  }
  state: {
    indexer: {
      blockHeight: number
      blockHash: string
      blockTime: number
    }
    state: string // e.g., "Proposed", "Approved", "Funded"
    data: any[]
  }
  timeline: SubsquareBountyTimelineItem[]
}

export interface SubsquareBountyAuthor {
  username: string
  publicKey: string
  address: string
}

export interface SubsquareBountyItem {
  _id: string
  bountyIndex: number
  title: string // This might be a discussion title, prefer onchainData.description
  proposer: string
  content: string
  contentType: string
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  state: string // Top-level state, might differ slightly from onchainData.state.state
  onchainData: SubsquareBountyOnchainData
  author: SubsquareBountyAuthor
  commentsCount: number
  // ... other fields like polkassemblyCommentsCount, etc.
}

export interface SubsquareBountiesResponse {
  items: SubsquareBountyItem[]
  page: number
  pageSize: number
  total: number
}

// Child bounty interfaces
export interface SubsquareChildBounty {
  _id: string
  parentBountyId: number
  index: number
  title: string
  state: string
  onchainData: {
    value: string
    curator: string
    beneficiary: string
    description: string
    meta: {
      status: Record<string, any>
    }
  }
}

export interface SubsquareChildBountiesResponse {
  items: SubsquareChildBounty[]
  page: number
  pageSize: number
  total: number
}

