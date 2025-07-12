import type { Control } from "react-hook-form"
import { z } from "zod"

const requiredString = z.string().min(1, "This field is required")
const optionalAddress = z.string().optional()

export const formSchema = z.object({
  // Tip Details
  tipTitle: requiredString,
  tipDescription: requiredString,

  // Funding
  tipAmount: z.coerce.number().min(0, "Tip amount must be a positive number"),
  referralFeePercent: z.coerce.number().min(0).max(100).optional(),

  // Track selection
  tipperTrack: z.enum(["small_tipper", "big_tipper"], { required_error: "Select a tipper track" }),

  // Beneficiaries
  tipBeneficiary: requiredString,
  referral: optionalAddress,
})

export const parseNumber = (value: string | number | undefined) => {
  try {
    return z.coerce.number().parse(value)
  } catch (_) {
    return null
  }
}

// zod with .coerce can work with strings, but TS complains.
export const emptyNumeric = "" as unknown as number

export type FormSchema = z.infer<typeof formSchema>

export type TipFormContext = unknown
export type TipControlType = Control<FormSchema, TipFormContext, FormSchema>

