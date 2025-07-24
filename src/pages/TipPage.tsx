import { TipForm } from "../components/TipForm"
import { matchedChain } from "@/chainRoute"
import { Construction } from "lucide-react"

export function TipPage() {
  if (matchedChain === "polkadot") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="poster-card text-center">
          <Construction className="w-16 h-16 text-pine-shadow-60 mx-auto mb-6" />
          <h2 className="text-3xl font-medium text-midnight-koi mb-4">
            Coming Soon
          </h2>
          <p className="text-lg text-pine-shadow mb-6">
            Polkadot tipping is currently in development.
          </p>
          <p className="text-pine-shadow-60">
            In the meantime, you can use Kusama for tips or create RFPs on Polkadot.
          </p>
          <div className="mt-8">
            <a 
              href="/launch-rfp" 
              className="poster-btn btn-primary inline-flex items-center gap-2"
            >
              Launch an RFP Instead
            </a>
          </div>
        </div>
      </div>
    )
  }
  
  return <TipForm />
}