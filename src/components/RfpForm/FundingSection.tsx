"use client";

import { STABLE_INFO } from "@/constants";
import { formatToken } from "@/lib/formatToken";
import { useStateObservable } from "@react-rxjs/core";
import { CheckCircle2, TriangleAlert, Info } from "lucide-react";
import { type FC, useState, useEffect } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { openSelectAccount, selectedAccount$ } from "../SelectAccount";
import { Spinner } from "../Spinner";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { estimatedCost$, priceTotals$, signerBalance$ } from "./data";
import { FormInputField } from "./FormInputField";
import { type RfpControlType, emptyNumeric } from "./formSchema";
import { BountyCheck } from "./FundingBountyCheck";

export const FundingSection: FC<{ control: RfpControlType }> = ({
  control,
}) => {
  const { setValue } = useFormContext();
  const isChildRfp = useWatch({ control, name: "isChildRfp" });
  const findersFee = useWatch({ control, name: "findersFee" });
  const [showFindersFee, setShowFindersFee] = useState(false);
  
  // Show finder's fee input if there's already a value
  useEffect(() => {
    if (findersFee && parseFloat(findersFee.toString()) > 0) {
      setShowFindersFee(true);
    }
  }, [findersFee]);

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Funding</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <FormInputField
          control={control}
          name="prizePool"
          label="Prize Pool (USD)"
          description="total amount for implementors"
          type="number"
        />
        {!isChildRfp && (
          <FormInputField
            control={control}
            name="supervisorsFee"
            label="Supervisors' Fee (USD)"
            description="payment for project supervisors"
            type="number"
          />
        )}
        {showFindersFee ? (
          <div className="relative">
            <FormInputField
              control={control}
              name="findersFee"
              label="Finder's Fee (USD)"
              description="reward for finding and referring talent"
              type="number"
            />
            <button
              type="button"
              onClick={() => {
                setShowFindersFee(false);
                // Clear the finder's fee value
                setValue("findersFee", emptyNumeric);
              }}
              className="absolute top-0 right-0 text-sm text-pine-shadow-60 hover:text-midnight-koi hover:underline inline-flex items-center gap-1"
            >
              <span>×</span> Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowFindersFee(true)}
              className="poster-btn btn-secondary text-sm"
            >
              Add Finder's Fee
            </button>
          </div>
        )}
      </div>
      {showFindersFee && (
        <div className="poster-alert alert-info flex items-start gap-3 mb-6">
          <Info size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>About Finder's Fees:</strong> Adding a finder's fee will create an additional 
            child bounty specifically for rewarding those who refer talented developers to your RFP. 
            This incentivizes the community to help find the best implementers for your project.
          </div>
        </div>
      )}
      {STABLE_INFO && !isChildRfp ? (
        <div className="mb-8">
          <FormField
            control={control}
            name="fundingCurrency"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="poster-label">RFP Currency</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full data-[size=default]:h-auto">
                      <SelectValue placeholder="Choose a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STABLE_INFO!).map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription className="text-xs text-pine-shadow-60 leading-tight">
                  Select a stablecoin for the RFP. Stablecoin RFPs ({Object.keys(STABLE_INFO!).join("/")}) 
                  will create a multisig instead of a bounty.
                </FormDescription>
                <FormMessage className="text-tomato-stamp text-xs" />
              </FormItem>
            )}
          />
        </div>
      ) : null}
      <BalanceCheck control={control} />
    </div>
  );
};

const BalanceCheck: FC<{ control: RfpControlType }> = ({ control }) => {
  const isChild = useWatch({ control, name: "isChildRfp" });

  return (
    <div className="bg-canvas-cream border border-pine-shadow-20 rounded-lg p-6">
      <EstimatedSignerCost />
      <BalanceMessage />
      {isChild ? <BountyCheck control={control} /> : null}
    </div>
  );
};

const BalanceMessage = () => {
  const priceTotals = useStateObservable(priceTotals$);
  const estimatedCost = useStateObservable(estimatedCost$);
  const selectedAccount = useStateObservable(selectedAccount$);
  const currentBalance = useStateObservable(signerBalance$);

  if (!estimatedCost || !priceTotals?.totalAmount) return null;

  if (!selectedAccount) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          className="poster-btn btn-secondary py-1 px-3 text-sm"
          onClick={openSelectAccount}
        >
          Connect Wallet
        </button>
        <span className="text-pine-shadow text-sm">
          to check if you have sufficient balance.
        </span>
      </div>
    );
  }
  if (currentBalance == null) {
    // It's possible selectedAccount is set, but balance is still fetching
    return (
      <div className="text-pine-shadow-60 mt-2 text-sm">
        Fetching your balance...
      </div>
    );
  }

  // estimatedCost is confirmed non-null by the calling condition
  const totalCost = estimatedCost!.deposits + estimatedCost!.fees;

  if (currentBalance < totalCost) {
    return (
      <div className="poster-alert alert-error flex items-center gap-3 mt-2">
        <TriangleAlert size={20} className="shrink-0" />
        <div className="text-sm">
          <strong>Uh-oh:</strong> not enough balance (
          {formatToken(currentBalance)}). Please add funds or select another
          wallet.
        </div>
      </div>
    );
  }
  return (
    <div className="poster-alert alert-success flex items-center gap-3 mt-2">
      <CheckCircle2 size={20} className="shrink-0 text-lilypad" />
      <div className="text-sm">
        <strong>Nice:</strong> you have enough funds to launch the RFP 🚀
      </div>
    </div>
  );
};

const EstimatedSignerCost = () => {
  const estimatedCost = useStateObservable(estimatedCost$);
  const ready = useStateObservable(priceTotals$)?.totalAmount ?? 0 > 0;

  return (
    <div className="space-y-3 mb-4">
      <p className="text-pine-shadow leading-relaxed">
        Please note that you'll need a minimum of{" "}
        {ready ? (
          estimatedCost ? (
            <strong className="text-midnight-koi font-semibold">
              {formatToken(estimatedCost.deposits + estimatedCost.fees)}
            </strong>
          ) : (
            <span className="text-pine-shadow-60">
              (enter amount above)
            </span>
          )
        ) : (
          <span className="text-pine-shadow-60">
            (enter prize pool to see cost)
          </span>
        )}
        {ready && estimatedCost && (
          <>
            {" "}
            to submit the RFP
            {estimatedCost.deposits ? (
              <>
                {" "}
                ({formatToken(estimatedCost.fees)} in fees. You'll get{" "}
                {formatToken(estimatedCost.deposits)} in deposits back once the
                RFP ends)
              </>
            ) : null}
          </>
        )}
      </p>
      {ready && !estimatedCost && (
        <div className="poster-alert alert-info flex items-center gap-3">
          <Spinner size={16} className="shrink-0" />
          <div className="text-sm">
            <strong>Hang tight!</strong> We're calculating the exact costs... this might take a moment.
          </div>
        </div>
      )}
    </div>
  );
};
