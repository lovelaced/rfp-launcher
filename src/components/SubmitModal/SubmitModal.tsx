"use client"

import { state, useStateObservable } from "@react-rxjs/core"
import { mergeWithKey } from "@react-rxjs/utils"
import { useEffect } from "react"
import { filter, map, of, switchMap, take, withLatestFrom } from "rxjs"
import { selectedAccount$ } from "../SelectAccount"
import { PickExtension } from "../SelectAccount/PickExtension"
import { PickExtensionAccount } from "../SelectAccount/PickExtensionAccount"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { dismiss, dismiss$, formDataChange$, submittedFormData$ } from "./modalActions"
import { StepBroadcastingTx } from "./StepBroadcastingTx"
import { StepFinish } from "./StepFinish"
import { StepSubmitTx } from "./StepSubmitTx"
import { activeTxStep$, referendumIndex$ } from "./submit.state"
import { submitdecisionDeposit } from "./tx/decisionDeposit"
import { submitReferendumCreation } from "./tx/referendumCreation"
import { signerBalance$ } from "@/components/RfpForm/data"
import { estimatedCost$ } from "@/components/RfpForm/data"
import { formatToken } from "@/lib/formatToken"
import { AlertCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Loading } from "../Spinner" // Assuming Spinner.tsx exports Loading
import { concat, combineLatest, takeUntil } from "rxjs" // Add missing RxJS operators
import type { FC } from "react"

// Define modal view types for better clarity
type ModalView =
  | null
  | { type: "prompt_account" }
  | { type: "checking_balance" }
  | {
    type: "insufficient_balance_error"
    required: bigint
    available: bigint
  }
  | { type: "transaction_steps" }

// This observable manages the modal's view state before transaction steps
const submitModalInternal$ = mergeWithKey({ formDataChange$, dismiss$ }).pipe(
  withLatestFrom(selectedAccount$), // Get current account status when submit is initiated or modal dismissed
  switchMap(([event, account]) => {
    if (event.type === "dismiss$") {
      return of(null) // Close modal
    }

    // At this point, event.type is 'formDataChange$' (meaning submit was initiated)

    if (!account) {
      // No account connected when "Submit Tip Referendum" was clicked.
      // First, show the account picker.
      // Then, once an account is selected, transition to checking_balance.
      return concat(
        of({ type: "prompt_account" } as ModalView),
        selectedAccount$.pipe(
          filter((newlySelectedAccount) => !!newlySelectedAccount), // Wait for a non-null account
          take(1), // Only react to the first selection
          map(() => ({ type: "checking_balance" }) as ModalView), // Transition to balance check
          // If dismiss is called while waiting for account selection, stop this inner flow.
          takeUntil(dismiss$.pipe(filter(() => !selectedAccount$.getValue()))), // getValue() to check current state
        ),
      )
    }

    // An account was already connected when "Submit Tip Referendum" was clicked.
    // Proceed directly to balance check.
    return of({ type: "checking_balance" } as ModalView)
  }),
)

// This observable handles the balance check and then decides the next step
const submitModal$ = state(
  submitModalInternal$.pipe(
    switchMap((currentView) => {
      if (currentView?.type === "checking_balance") {
        // An account is now available (either pre-existing or just selected).
        // We need to ensure we're using the most current selectedAccount for the balance check.
        return selectedAccount$.pipe(
          filter((acc) => !!acc), // Ensure account is definitely available
          take(1), // Take the current account
          switchMap((_) => {
            // We don't need the account from here, signerBalance$ is reactive
            return combineLatest([
              estimatedCost$.pipe(filter((v): v is NonNullable<typeof v> => v !== null)),
              signerBalance$.pipe(filter((v): v is NonNullable<typeof v> => v !== null)),
            ]).pipe(
              take(1), // Get the latest cost and balance once
              map(([costData, balanceData]) => {
                const totalRequired = costData.deposits + costData.fees
                if (balanceData < totalRequired) {
                  return {
                    type: "insufficient_balance_error",
                    required: totalRequired,
                    available: balanceData,
                  } as ModalView
                }
                // Balance is sufficient, proceed to the original transaction steps
                return { type: "transaction_steps" } as ModalView
              }),
            )
          }),
        )
      }
      // For any other view (null, prompt_account, etc.), just pass it through.
      return of(currentView)
    }),
  ),
  null, // Initial state of the modal is closed
)

// New component for the insufficient balance step
const StepInsufficientBalance: FC<{ required: bigint; available: bigint; onDismiss: () => void }> = ({
  required,
  available,
  onDismiss,
}) => {
  return (
    // This content will be rendered inside a Dialog open={true}
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-tomato-stamp">
          <AlertCircle className="h-5 w-5" /> Insufficient Balance
        </DialogTitle>
        <DialogDescription className="text-pine-shadow-60">
          Your connected wallet does not have enough funds to cover the estimated costs for submitting this referendum.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="poster-alert alert-error">
          <div className="space-y-2">
            <p>
              <span className="text-pine-shadow-60">Required:</span>{" "}
              <strong className="text-midnight-koi font-medium">{formatToken(required)}</strong>
            </p>
            <p>
              <span className="text-pine-shadow-60">Available:</span>{" "}
              <strong className="text-midnight-koi font-medium">{formatToken(available)}</strong>
            </p>
          </div>
        </div>
        <p className="text-sm text-pine-shadow-60">
          Please add funds to your wallet or select a different wallet with sufficient balance.
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button className="poster-btn btn-secondary" onClick={onDismiss}>
          Close
        </Button>
        {/* Optional: Button to re-trigger wallet selection.
            This would require `openSelectAccount` to be available or another mechanism.
            For simplicity, "Close" is the primary action.
        <Button onClick={() => { onDismiss(); openSelectAccount(); }}>Change Wallet</Button>
        */}
      </div>
    </>
  )
}

export const SubmitModal = () => {
  const modalStatus = useStateObservable(submitModal$)

  useEffect(() => {
    const sub = submittedFormData$.subscribe()
    return () => sub.unsubscribe()
  }, [])

  if (!modalStatus) return null // Modal is closed

  // Common dialog props
  const dialogProps = {
    open: true,
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) {
        dismiss() // Call dismiss if the dialog is closed by user action (e.g., Esc, click outside)
      }
    },
  }

  if (modalStatus.type === "prompt_account") {
    return (
      <Dialog {...dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-midnight-koi">Connect Wallet</DialogTitle>
            <DialogDescription className="text-pine-shadow-60">Please connect a wallet to submit the referendum.</DialogDescription>
          </DialogHeader>
          <PickExtension />
          <PickExtensionAccount
            onSelected={() => {
              // The selection updates selectedAccount$, and the submitModal$ observable flow
              // will automatically transition to "checking_balance". No need to call dismiss() here.
            }}
          />
        </DialogContent>
      </Dialog>
    )
  }

  if (modalStatus.type === "checking_balance") {
    return (
      <Dialog {...dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-midnight-koi">Verifying Funds</DialogTitle>
          </DialogHeader>
          <div className="py-8 flex flex-col justify-center items-center space-y-4">
            <Loading />
            <p className="text-sm text-pine-shadow-60">Checking your available balance...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (modalStatus.type === "insufficient_balance_error") {
    return (
      <Dialog {...dialogProps}>
        <DialogContent>
          <StepInsufficientBalance
            required={modalStatus.required}
            available={modalStatus.available}
            onDismiss={dismiss}
          />
        </DialogContent>
      </Dialog>
    )
  }

  if (modalStatus.type === "transaction_steps") {
    return (
      <Dialog {...dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-midnight-koi">Submit Referendum</DialogTitle>
            <DialogDescription className="text-pine-shadow-60">
              This is a two-step process: Submit the referendum and place the decision deposit.
            </DialogDescription>
          </DialogHeader>
          <SubmitModalContent /> {/* This contains the multi-step tx UI */}
        </DialogContent>
      </Dialog>
    )
  }

  // Fallback or should not be reached if modalStatus is always one of the above or null
  return null
}

const SubmitModalContent = () => {
  const activeTxStep = useStateObservable(activeTxStep$)
  const refIdx = useStateObservable(referendumIndex$)

  // Debugging output
  console.log("[SubmitModalContent] activeTxStep:", activeTxStep)
  if (activeTxStep && activeTxStep.type === "tx") {
    console.log("[SubmitModalContent] tag:", activeTxStep.tag)
    console.log("[SubmitModalContent] value:", activeTxStep.value)
  }

  if (!activeTxStep) return null

  if (activeTxStep.type === "tx") {
    switch (activeTxStep.tag) {
      case "ref":
        return (
          <div className="space-y-2 overflow-hidden">
            <h3 className="text-sm font-medium text-midnight-koi">1. Submit the transaction to create the referendum</h3>
            <StepSubmitTx explanation={activeTxStep.value.explanation} submit={submitReferendumCreation} />
          </div>
        )
      case "decision":
        return (
          <div className="space-y-2 overflow-hidden">
            <h3 className="text-sm font-medium text-midnight-koi">2. Place the decision deposit on the referendum to start it</h3>
            <StepSubmitTx explanation={activeTxStep.value.explanation} submit={submitdecisionDeposit} />
          </div>
        )
      default:
        console.error("[SubmitModalContent] Unknown tx step tag:", activeTxStep.tag, activeTxStep)
        return <div style={{ color: 'red' }}>Error: Unknown transaction step tag: {String(activeTxStep.tag)}</div>
    }
  }

  if (activeTxStep.type === "submitting" || !activeTxStep.value.txEvent.ok) {
    return <StepBroadcastingTx txEvt={activeTxStep.value.txEvent} />
  }

  return <StepFinish refIdx={refIdx} />
}

