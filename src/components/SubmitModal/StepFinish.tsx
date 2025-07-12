import { FC } from "react";
import { ExternalLink } from "../ExternalLink";
import { Textarea } from "../ui/textarea";

export const StepFinish: FC<{
  refIdx?: number;
}> = ({ refIdx }) => {
  return (
    <div className="space-y-2 overflow-hidden">
      <h3 className="text-sm font-bold">Referendum submitted!</h3>
      <div>
        Please, edit the referendum in{" "}
        <ExternalLink href={"https://kusama.subsquare.io/referenda/" + refIdx}>
          Subsquare
        </ExternalLink>{" "}
        or{" "}
        <ExternalLink
          href={"https://kusama.polkassembly.io/referenda/" + refIdx}
        >
          Polkassembly
        </ExternalLink>{" "}
        with the following body
      </div>
      <Textarea readOnly value="Referendum submitted successfully!" className="max-h-72" />
    </div>
  );
};
