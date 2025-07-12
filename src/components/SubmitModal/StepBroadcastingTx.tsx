import { client } from "@/chain";
import { stringify } from "@/lib/json";
import { state, useStateObservable } from "@react-rxjs/core";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { TxEvent } from "polkadot-api";
import { FC } from "react";
import { Loading } from "../Spinner";
import { Textarea } from "../ui/textarea";

const currentFinalized$ = state(client.finalizedBlock$, null);

export const StepBroadcastingTx: FC<{
  txEvt: TxEvent | { type: "error"; err: unknown };
}> = ({ txEvt }) => {
  const finalized = useStateObservable(currentFinalized$);

  if (txEvt.type === "error" || (txEvt.type === "finalized" && !txEvt.ok)) {
    return (
      <div className="space-y-4">
        <div className="poster-alert alert-error">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Transaction failed. Please try again.</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-pine-shadow-60">Error details:</p>
          <Textarea
            className="max-h-72 font-mono text-xs bg-pine-shadow-10 border-pine-shadow-20 text-pine-shadow-90"
            readOnly
            value={stringify("err" in txEvt ? txEvt.err : txEvt.dispatchError)}
          />
        </div>
      </div>
    );
  }

  if (txEvt.type === "finalized") {
    return (
      <div className="poster-alert alert-success">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>Transaction succeeded!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <Loading />
      <p className="text-sm text-pine-shadow-60 text-center">
        {txEvt.type === "signed"
          ? "Transaction signed, broadcasting…"
          : txEvt.type === "broadcasted"
            ? "Transaction broadcasted, waiting to be included in a block…"
            : "Transaction was found in a block, waiting for confirmation…" +
            (finalized && txEvt.found
              ? ` (${txEvt.block.number - finalized.number})`
              : "")}
      </p>
    </div>
  );
};
