"use client";

import {
  Trash2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Plus,
} from "lucide-react";
import type { ChangeEvent, FC } from "react";
import { useEffect, useState } from "react";
import { type ControllerRenderProps, useWatch } from "react-hook-form";
import { getNextRfpNumber, formatRfpTitle } from "@/services/rfpNumberService";
import { matchedChain } from "@/chainRoute";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  emptyNumeric,
  type FormSchema,
  type Milestone,
  type RfpControlType,
  parseNumber,
} from "./formSchema";

export const ScopeSection: FC<{ control: RfpControlType }> = ({ control }) => {
  const prizePool = useWatch({ control, name: "prizePool" });
  const milestones = useWatch({ control, name: "milestones" });
  const [nextRfpNumber, setNextRfpNumber] = useState<number | null>(null);
  const [isLoadingNumber, setIsLoadingNumber] = useState(true);

  const prizePoolAmount = parseNumber(prizePool) || 0;
  const milestonesTotal = (milestones || [])
    .map((milestone) => parseNumber(milestone.amount))
    .filter((v) => v != null)
    .reduce((a, b) => a + b, 0);

  const remainingBudget = prizePoolAmount - milestonesTotal;
  const isOverBudget = remainingBudget < 0;
  const isBudgetMatched = remainingBudget === 0 && prizePoolAmount > 0;

  // Fetch the next RFP number on component mount
  useEffect(() => {
    getNextRfpNumber().then((number) => {
      setNextRfpNumber(number);
      setIsLoadingNumber(false);
    });
  }, []);

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">
        Project Scope
      </h3>

      <p className="text-lg text-pine-shadow mb-8 leading-relaxed">
        Let's map out your project's goals, deliverables, and milestones. 
        This is your roadmap to success.
      </p>

      <div className="space-y-8">
        <FormField
          control={control}
          name="projectTitle"
          render={({ field }) => {
            const networkPrefix = matchedChain === "polkadot" ? "DOT" : "KSM";
            const placeholder = isLoadingNumber 
              ? "Loading RFP number..." 
              : `${networkPrefix} RFP #${nextRfpNumber}: Enter project description`;
            
            return (
              <FormItem>
                <FormLabel className="poster-label">
                  Project Title
                  {nextRfpNumber && (
                    <span className="text-sm font-normal text-pine-shadow-60 ml-2">
                      (Will be formatted as: {networkPrefix} RFP #{nextRfpNumber}: ...)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={placeholder}
                    className="poster-input"
                    {...field}
                    onChange={(e) => {
                      // Just pass through the value without formatting while typing
                      field.onChange(e.target.value);
                    }}
                    onBlur={(e) => {
                      // Format on blur as well
                      if (e.target.value && nextRfpNumber) {
                        const formatted = formatRfpTitle(e.target.value, nextRfpNumber);
                        field.onChange(formatted);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage className="text-tomato-stamp text-xs" />
              </FormItem>
            );
          }}
        />

        <FormField
          control={control}
          name="projectScope"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="poster-label">
                Project Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the project scope, objectives, and deliverables in Markdown format..."
                  className="poster-textarea min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />

        {/* Budget Overview */}
        {prizePoolAmount > 0 && (
          <div className="bg-canvas-cream border border-pine-shadow-20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-lake-haze" />
              <h4 className="text-lg font-medium text-midnight-koi">
                Budget Allocation
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-pine-shadow-60 uppercase tracking-wide mb-1">
                  Prize Pool
                </div>
                <div className="text-xl font-semibold text-midnight-koi">
                  ${prizePoolAmount.toLocaleString()}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-pine-shadow-60 uppercase tracking-wide mb-1">
                  Allocated
                </div>
                <div
                  className={`text-xl font-semibold ${isOverBudget ? "text-tomato-stamp" : "text-midnight-koi"}`}
                >
                  ${milestonesTotal.toLocaleString()}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-pine-shadow-60 uppercase tracking-wide mb-1">
                  Remaining
                </div>
                <div
                  className={`text-xl font-semibold flex items-center justify-center gap-1 ${
                    isOverBudget
                      ? "text-tomato-stamp"
                      : isBudgetMatched
                        ? "text-lilypad"
                        : "text-midnight-koi"
                  }`}
                >
                  {isOverBudget && <AlertTriangle size={16} />}
                  {isBudgetMatched && <CheckCircle size={16} />}$
                  {Math.abs(remainingBudget).toLocaleString()}
                </div>
              </div>
            </div>

            {isOverBudget && (
              <div className="mt-4 poster-alert alert-error">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle size={16} />
                  <span>
                    Milestones exceed prize pool by $
                    {Math.abs(remainingBudget).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {isBudgetMatched && (
              <div className="mt-4 poster-alert alert-success">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} />
                  <span>Nice work! Your budget is perfectly balanced.</span>
                </div>
              </div>
            )}
          </div>
        )}

        <FormField
          control={control}
          name="milestones"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="poster-label">Project Milestones</FormLabel>
              <FormControl>
                <MilestonesControl
                  {...field}
                  remainingBudget={remainingBudget}
                />
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

const MilestonesControl: FC<
  ControllerRenderProps<FormSchema, "milestones"> & { remainingBudget: number }
> = ({ value, onChange, remainingBudget }) => {
  const editProps = (
    milestone: Milestone,
    idx: number,
    prop: keyof Milestone,
  ) => ({
    value: milestone[prop],
    onChange: (
      evt: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const newValue: any = [...value];
      newValue[idx] = { ...newValue[idx] };
      newValue[idx][prop] = evt.currentTarget.value;
      onChange(newValue);
    },
  });

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <div className="text-center py-8 text-pine-shadow-60">
          <p className="mb-4">
            Ready to add your first milestone? Let's break down your project!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {value.map((milestone, i) => {
            const milestoneAmount = parseNumber(milestone.amount) || 0;
            return (
              <li
                key={i}
                className="bg-canvas-cream border border-pine-shadow-20 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-lake-haze text-midnight-koi text-sm font-semibold rounded">
                      {i + 1}
                    </span>
                    <h4 className="text-lg font-medium text-midnight-koi">
                      Milestone {i + 1}
                      {milestoneAmount > 0 && (
                        <span className="text-pine-shadow-60 text-sm font-normal ml-2">
                          ${milestoneAmount.toLocaleString()}
                        </span>
                      )}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i2) => i !== i2))}
                    className="poster-btn btn-destructive p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <FormItem>
                    <FormLabel className="poster-label">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Milestone title"
                        className="poster-input"
                        {...editProps(milestone, i, "title")}
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel className="poster-label">Amount (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter USD amount"
                        className="poster-input"
                        {...editProps(milestone, i, "amount")}
                      />
                    </FormControl>
                  </FormItem>
                </div>

                <FormItem>
                  <FormLabel className="poster-label">Deliverables</FormLabel>
                  <FormControl>
                    <Textarea
                      {...editProps(milestone, i, "description")}
                      placeholder="Describe what will be delivered in this milestone..."
                      className="poster-textarea min-h-20"
                    />
                  </FormControl>
                </FormItem>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-center pt-4">
        <button
          type="button"
          className="poster-btn btn-primary flex items-center gap-2"
          onClick={() =>
            onChange([
              ...value,
              {
                title: "",
                amount: emptyNumeric,
                description: "",
              } satisfies Milestone,
            ])
          }
        >
          <Plus size={16} />
          Add Milestone
        </button>
      </div>

      {remainingBudget > 0 && value.length > 0 && (
        <div className="text-center text-sm text-pine-shadow-60">
          ${remainingBudget.toLocaleString()} remaining to allocate
        </div>
      )}
    </div>
  );
};
