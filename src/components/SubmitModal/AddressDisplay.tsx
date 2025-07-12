import { FC } from "react";
import { useStateObservable } from "@react-rxjs/core";
import { PolkadotIdenticon } from "@polkadot-api/react-components";
import { getPublicKey, sliceMiddleAddr } from "@/lib/ss58";
// Import from RfpForm identity which uses the chain-aware peopleApi
import { identity$ } from "@/components/RfpForm/data/identity";
import { CheckCircle2 } from "lucide-react";

export const AddressDisplay: FC<{ address: string }> = ({ address }) => {
  const identity = useStateObservable(identity$(address));

  return (
    <div className="flex items-center gap-2">
      <PolkadotIdenticon
        size={16}
        publicKey={getPublicKey(address)}
        className="shrink-0"
      />
      <div className="text-sm overflow-hidden">
        {identity ? (
          <span className="flex items-center gap-1">
            <span className="font-medium text-pine-shadow-90">{identity.value}</span>
            {identity.verified && (
              <CheckCircle2 className="h-3 w-3 text-lilypad shrink-0" />
            )}
            <span className="text-xs text-pine-shadow-60 font-mono">
              ({sliceMiddleAddr(address)})
            </span>
          </span>
        ) : (
          <span className="font-mono text-xs text-pine-shadow-90 break-all">
            {address}
          </span>
        )}
      </div>
    </div>
  );
};