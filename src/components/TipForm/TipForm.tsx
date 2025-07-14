"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { SubmitTipModal } from "../SubmitModal"
import { submit } from "../SubmitModal/tipModalActions"
import { Form } from "../ui/form"
import { type FormSchema, formSchema } from "./formSchema"
import { FundingSection } from "./FundingSection"
import { ReviewSection } from "./ReviewSection"
import { ScopeSection } from "./ScopeSection"
import { BeneficiariesSection } from "./BeneficiariesSection"
import { WelcomeSection } from "./WelcomeSection"
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react"
import { estimatedCost$, signerBalance$ } from "./data"
import { selectedAccount$ } from "@/components/SelectAccount"
import { useStateObservable } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"

const defaultValues: Partial<FormSchema> = {
  tipTitle: "",
  tipDescription: "",
  tipAmount: 0,
  referralFeePercent: 10,
  tipBeneficiary: "",
  referral: "",
}

const steps = [
  { id: "welcome", title: "Welcome", Component: WelcomeSection },
  { id: "funding", title: "Tip Amount", Component: FundingSection },
  { id: "beneficiaries", title: "Recipients", Component: BeneficiariesSection },
  { id: "scope", title: "Tip Details", Component: ScopeSection },
  { id: "review", title: "Review and Submit", Component: ReviewSection },
]

export const [formController$, setFormController] = createSignal<any>()

export const TipForm = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isTooBig, setIsTooBig] = useState(false)

  const estimatedCost = useStateObservable(estimatedCost$)
  const currentBalance = useStateObservable(signerBalance$)
  const selectedAccount = useStateObservable(selectedAccount$)

  // Clear any old form data that might contain outdated fields
  useEffect(() => {
    const storedData = localStorage.getItem("tip-form")
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        // If the stored data has outdated fields but no current fields, clear it
        if (parsed.supervisors && !parsed.tipBeneficiary) {
          localStorage.removeItem("tip-form")
        }
      } catch (e) {
        // If parsing fails, clear the data
        localStorage.removeItem("tip-form")
      }
    }
  }, [])

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  })

  // Move setFormController inside useEffect to avoid hook call issues
  useEffect(() => {
    setFormController(form)
  }, [form])

  const {
    handleSubmit,
    control,
    formState: { isValid, errors },
    watch,
  } = form

  const allFormValues = watch()

  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem("tip-form", JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const navigateToStepById = (stepId: string) => {
    const stepIndex = steps.findIndex((step) => step.id === stepId)
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex)
      window.scrollTo(0, 0)
    }
  }

  const handleNext = async () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
    window.scrollTo(0, 0)
  }

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
    window.scrollTo(0, 0)
  }

  const handleResetForm = () => {
    if (!confirm("Are you sure you want to reset the form? This will clear all your progress.")) return
    Object.entries(defaultValues).forEach(([key, value]) => form.setValue(key as keyof FormSchema, value as any))
    setCurrentStepIndex(0)
    window.scrollTo(0, 0)
  }

  const ActiveStepComponent = steps[currentStepIndex].Component
  const isReviewStep = currentStepIndex === steps.length - 1
  const hasErrors = Object.keys(errors).length > 0

  const totalRequiredCost = estimatedCost ? estimatedCost.deposits + estimatedCost.fees : null

  const hasSufficientBalanceForButton =
    selectedAccount !== null && currentBalance !== null && totalRequiredCost !== null
      ? currentBalance >= totalRequiredCost
      : selectedAccount === null

  const isSubmitDisabled =
    hasErrors ||
    !isValid ||
    (isReviewStep && selectedAccount !== null && !hasSufficientBalanceForButton) ||
    (isReviewStep && (!allFormValues?.tipBeneficiary || !allFormValues?.referral))

  const hasSufficientBalanceForWarning =
    selectedAccount !== null && currentBalance !== null && totalRequiredCost !== null
      ? currentBalance >= totalRequiredCost
      : true

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={handleSubmit(submit)} className="space-y-12">
          <div className="poster-section">
            {isReviewStep ? (
              <ReviewSection
                control={control}
                hasSufficientBalance={hasSufficientBalanceForWarning}
                currentBalance={currentBalance}
                totalRequiredCost={totalRequiredCost}
                navigateToStep={navigateToStepById}
              />
            ) : (
              // @ts-expect-error
              <ActiveStepComponent control={control} onReset={handleResetForm} onTooBigChange={setIsTooBig} />
            )}
          </div>

          <div className="poster-section">
            <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-between gap-4">
              {/* Previous Button Wrapper: Mobile order 3, Desktop order 1 */}
              <div className="w-full md:w-auto order-3 md:order-1">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="poster-btn btn-secondary flex items-center gap-2 w-full justify-center md:w-auto"
                  >
                    <ArrowLeft size={16} />
                    Previous
                  </button>
                )}
              </div>

              {/* Step Text: Mobile order 2, Desktop order 2 */}
              <div className="text-sm text-pine-shadow-60 font-medium py-2 md:py-0 text-center order-2 md:order-2">
                Step {currentStepIndex + 1} of {steps.length} — {steps[currentStepIndex].title}
              </div>

              {/* Next/Submit Button Wrapper: Mobile order 1, Desktop order 3 */}
              <div className="w-full md:w-auto order-1 md:order-3">
                {currentStepIndex < steps.length - 1 && !isTooBig && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="poster-btn btn-primary flex items-center gap-2 w-full justify-center md:w-auto"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                )}
                {isReviewStep && (
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="poster-btn btn-primary flex items-center gap-2 w-full justify-center md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Rocket size={16} />
                    Suggest Tip
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
      <SubmitTipModal />
    </FormProvider>
  )
}

