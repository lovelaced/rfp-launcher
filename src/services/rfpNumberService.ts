import { matchedChain } from "@/chainRoute";

const API_URLS = {
  kusama: "https://kusama-api.subsquare.io/treasury/bounties?page=1&pageSize=500",
  polkadot: "https://polkadot-api.subsquare.io/search?text=rfp&page=1&pageSize=500"
};

export async function getNextRfpNumber(): Promise<number> {
  const network = matchedChain as "kusama" | "polkadot";
  const networkPrefix = network === "polkadot" ? "DOT" : "KSM";
  
  try {
    if (network === "kusama") {
      // For Kusama, fetch bounties
      const response = await fetch(API_URLS.kusama);
      const data = await response.json();
      
      // Extract RFP numbers from bounty titles/descriptions
      const rfpNumbers = data.items
        .map((bounty: any) => {
          const title = bounty.onchainData?.description || bounty.title || "";
          const match = title.match(/(?:KSM\s*)?RFP\s*#?(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num: number) => num > 0);
      
      return rfpNumbers.length > 0 ? Math.max(...rfpNumbers) + 1 : 1;
    } else {
      // For Polkadot, fetch from search API
      const response = await fetch(API_URLS.polkadot);
      const data = await response.json();
      
      // Combine all RFP items from different sections
      const allRfpItems = [
        ...(data.openGovReferenda || []),
        ...(data.bounties || [])
      ];
      
      // Extract RFP numbers
      const rfpNumbers = allRfpItems
        .map((item: any) => {
          const title = item.title || "";
          const match = title.match(/(?:DOT\s*)?RFP\s*#?(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num: number) => num > 0);
      
      return rfpNumbers.length > 0 ? Math.max(...rfpNumbers) + 1 : 1;
    }
  } catch (error) {
    console.error("Error fetching RFP numbers:", error);
    // Return 1 as fallback if fetch fails
    return 1;
  }
}

export function formatRfpTitle(title: string, rfpNumber: number): string {
  const network = matchedChain as "kusama" | "polkadot";
  const networkPrefix = network === "polkadot" ? "DOT" : "KSM";
  
  // Remove any existing RFP format first
  const cleanTitle = title.replace(/^(?:DOT|KSM)?\s*RFP\s*#?\d+:?\s*/i, '').trim();
  
  // If nothing left after removing RFP format, return just the format
  if (!cleanTitle) {
    return `${networkPrefix} RFP #${rfpNumber}`;
  }
  
  // Add the correct RFP format
  return `${networkPrefix} RFP #${rfpNumber}: ${cleanTitle}`;
}