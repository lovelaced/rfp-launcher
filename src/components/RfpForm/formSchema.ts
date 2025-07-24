import type { Control } from "react-hook-form";
import { z } from "zod";
import { addDays } from "date-fns";

export const formSchema = z.object({
  isChildRfp: z.boolean(),
  parentBountyId: z.number().optional(),
  prizePool: z.coerce.number().positive(),
  findersFee: z.coerce.number(),
  supervisorsFee: z.coerce.number(),
  supervisors: z.array(z.string()).min(1),
  signatoriesThreshold: z.coerce.number(),
  submissionDeadline: z.date().refine(
    (date) => date.getTime() >= addDays(new Date(), 7).getTime(),
    {
      message: "Submission deadline must be at least 7 days from today",
    }
  ),
  projectCompletion: z.date().optional(), // Changed to optional
  projectTitle: z.string().nonempty(),
  projectScope: z.string(),
  milestones: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      amount: z.coerce.number(),
    }),
  ),
  fundingCurrency: z.string().nonempty(),
}).refine(
  (data) => {
    if (data.projectCompletion && data.submissionDeadline) {
      return data.projectCompletion.getTime() >= addDays(data.submissionDeadline, 7).getTime();
    }
    return true;
  },
  {
    message: "Project completion must be at least 7 days after submission deadline",
    path: ["projectCompletion"],
  }
);

export const parseNumber = (value: string | number | undefined) => {
  try {
    return z.coerce.number().parse(value);
  } catch (_) {
    return null;
  }
};

// zod with .coerce can work with strings, but TS complains.
export const emptyNumeric = "" as unknown as number;

export type FormSchema = z.infer<typeof formSchema>;
export type Milestone = FormSchema["milestones"][number];

export type RfpFormContext = unknown;
export type RfpControlType = Control<FormSchema, RfpFormContext, FormSchema>;
