import { DeepPartialSkipArrayKey } from "react-hook-form";
import { FormSchema, parseNumber } from "../formSchema";
import { createSignal } from "@react-rxjs/utils";
import { state } from "@react-rxjs/core";
import { currencyRate$ } from "@/services/currencyRate";

export const calculatePriceTotals = (
  formFields: DeepPartialSkipArrayKey<FormSchema>,
  conversionRate?: number | null
) => {
  if (typeof conversionRate !== "number" || !conversionRate) {
    conversionRate = currencyRate$.getValue();
  }

  const tipAmount = parseNumber(formFields.tipAmount) || 0;
  const referralFeePercent = parseNumber(formFields.referralFeePercent) || 0;

  // Calculate referral fee amount from percentage
  const referralFeeAmount = (tipAmount * referralFeePercent) / 100;

  const totalAmount = tipAmount + referralFeeAmount;
  const totalAmountToken = conversionRate ? totalAmount / conversionRate : null;

  return { totalAmount, totalAmountToken };
};

export const [setTipValue$, setTipValue] = createSignal<number | null>();
export const tipValue$ = state(setTipValue$, null);
