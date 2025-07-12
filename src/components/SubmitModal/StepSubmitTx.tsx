import { FC, PropsWithChildren } from "react";
import { Button } from "../ui/button";
import { TxExplanation } from "./tx/types";
import { AddressDisplay } from "./AddressDisplay";
import { getSs58AddressInfo } from "polkadot-api";

export const StepSubmitTx: FC<
  PropsWithChildren<{
    explanation: TxExplanation;
    submit: () => void;
  }>
> = ({ explanation, submit, children }) => (
  <div className="space-y-4 overflow-hidden">
    <h3 className="text-sm font-medium text-midnight-koi">{children}</h3>
    <div className="space-y-4">
      <TxExplanationView explanation={explanation} />
      <Button className="poster-btn btn-primary w-full" onClick={submit}>
        Sign and Submit
      </Button>
    </div>
  </div>
);

// Helper to make labels more user-friendly
const formatLabel = (key: string): string => {
  const labelMap: Record<string, string> = {
    tipRecipient: "Tip Recipient",
    amount: "Total Amount",
    referral: "Referral Address",
    referralFee: "Referral Fee",
    track: "Approval Track",
    trackId: "Track ID",
    destination: "Send To",
    value: "Amount",
    address: "Address",
  };
  return labelMap[key] || key;
};

// Helper to simplify tip-specific explanations
const simplifyTipExplanation = (explanation: TxExplanation): TxExplanation => {
  if (explanation.text === "Create tip referendum") {
    // For tip referendum, show a simplified version
    const { call, track } = explanation.params || {};
    if (call && typeof call === "object" && "params" in call) {
      // Extract the inner params from the nested call
      return {
        text: "Tip Proposal Details",
        params: {
          ...call.params,
          "Approval Track": track === "small_tipper" ? "Small Tipper" : "Big Tipper",
        },
      };
    }
  }
  return explanation;
};

const TxExplanationView: FC<{ explanation: TxExplanation }> = ({
  explanation,
}) => {
  // Simplify tip-specific explanations
  const displayExplanation = simplifyTipExplanation(explanation);
  
  if (displayExplanation.text === "batch") {
    // For batch operations, show them as a simple list
    const batchItems = Object.values(displayExplanation.params ?? {});
    const tipRelatedItems = batchItems.filter((item) => 
      typeof item === "object" && item !== null && "text" in item && 
      (item.text === "Tip referendum proposal" || item.text === "Transfer balance to tip recipient")
    );
    
    if (tipRelatedItems.length > 0) {
      // Show only tip-related items in a cleaner way
      return (
        <div className="text-sm space-y-3">
          {tipRelatedItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-pine-shadow-20 bg-lake-haze/5 px-4 py-3">
              <TxExplanationView explanation={item as TxExplanation} />
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback for other batch operations
    return (
      <ol className="text-sm space-y-2 overflow-hidden list-decimal list-inside text-pine-shadow">
        {batchItems.map((param, i) => (
          <li key={i} className="pl-2">
            {typeof param === "string" ? (
              <span className="text-pine-shadow-90">{param}</span>
            ) : (
              <TxExplanationView explanation={param as TxExplanation} />
            )}
          </li>
        ))}
      </ol>
    );
  }
  
  // Hide technical transaction types for tips
  const hiddenTechParams = ["trackId", "call"];
  const filteredParams = Object.entries(displayExplanation.params ?? {}).filter(
    ([key]) => !hiddenTechParams.includes(key)
  );
  
  return (
    <div className="text-sm rounded-lg border border-pine-shadow-20 bg-lake-haze/5 px-4 py-3 space-y-3 overflow-hidden">
      <div className="font-medium text-midnight-koi">
        {displayExplanation.text === "Transfer balance to tip recipient" 
          ? "Initial Balance Transfer" 
          : displayExplanation.text}
      </div>
      <div className="space-y-2">
        {filteredParams.map(([key, value]) => (
          <div key={key} className="flex gap-2 items-baseline">
            <div className="text-pine-shadow-60 font-medium text-sm shrink-0">
              {formatLabel(key)}:
            </div>
            {typeof value === "string" ? (
              (key.toLowerCase() === "address" || key.toLowerCase().includes("recipient") || key.toLowerCase() === "referral" || key.toLowerCase() === "destination") && 
              value !== "None" && getSs58AddressInfo(value).isValid ? (
                <AddressDisplay address={value} />
              ) : (
                <div className="overflow-hidden text-ellipsis text-pine-shadow-90 font-mono text-sm break-all">
                  {value}
                </div>
              )
            ) : (
              <div className="overflow-hidden">
                <TxExplanationView explanation={value} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
