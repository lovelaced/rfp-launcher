import { FC } from "react";
import { ExternalLink } from "../ExternalLink";
import { CheckCircle2 } from "lucide-react";
import { matchedChain } from "@/chainRoute";

export const StepFinish: FC<{
  refIdx?: number | null;
}> = ({ refIdx }) => {
  return (
    <div className="space-y-4 overflow-hidden">
      <div className="poster-alert alert-success">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="text-sm font-medium">Awesome! Your referendum is live!</h3>
        </div>
      </div>
      <div className="text-sm text-pine-shadow-90">
        Your referendum is ready! You can add more details here:
      </div>
      <div className="flex gap-4 justify-center">
        <ExternalLink 
          href={`https://${matchedChain}.subsquare.io/referenda/${refIdx}`}
        >
          <span className="poster-btn btn-primary text-center">
            Check it out on Subsquare
          </span>
        </ExternalLink>
        <ExternalLink
          href={`https://${matchedChain}.polkassembly.io/referenda/${refIdx}`}
        >
          <span className="poster-btn btn-secondary text-center">
            See it on Polkassembly
          </span>
        </ExternalLink>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-pine-shadow-60">Referendum details:</p>
        <div className="bg-lake-haze/10 rounded-lg p-4 border border-pine-shadow-20">
          <p className="text-sm font-mono text-pine-shadow-90">Referendum #{refIdx}</p>
        </div>
      </div>
    </div>
  );
};
