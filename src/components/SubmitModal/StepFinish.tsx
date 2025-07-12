import { FC } from "react";
import { ExternalLink } from "../ExternalLink";
import { Textarea } from "../ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { matchedChain } from "@/chainRoute";

export const StepFinish: FC<{
  refIdx?: number;
}> = ({ refIdx }) => {
  return (
    <div className="space-y-4 overflow-hidden">
      <div className="poster-alert alert-success">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="text-sm font-medium">Referendum submitted successfully!</h3>
        </div>
      </div>
      <div className="text-sm text-pine-shadow-90">
        Your referendum has been submitted. You can now edit and add details on:
      </div>
      <div className="flex gap-4 justify-center">
        <ExternalLink 
          href={`https://${matchedChain}.subsquare.io/referenda/${refIdx}`}
          className="poster-btn btn-primary text-center"
        >
          View on Subsquare
        </ExternalLink>
        <ExternalLink
          href={`https://${matchedChain}.polkassembly.io/referenda/${refIdx}`}
          className="poster-btn btn-secondary text-center"
        >
          View on Polkassembly
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
