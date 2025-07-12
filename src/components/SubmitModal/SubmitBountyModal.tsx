import { useStateObservable } from "@react-rxjs/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { dismiss, submittedFormData$ } from "./modalActions";
import { StepBroadcastingTx } from "./StepBroadcastingTx";
import { StepFinish } from "./StepFinish";
import { StepSubmitTx } from "./StepSubmitTx";
import { activeBountyRfpTxStep$, referendumIndex$ } from "./submit.state";
import { submitBountyCreation } from "./tx/bountyCreation";
import { submitdecisionDeposit } from "./tx/decisionDeposit";
import { submitReferendumCreation } from "./tx/referendumCreation";

export const SubmitBountyModal = () => {
  const formData = useStateObservable(submittedFormData$);
  
  if (!formData) return null;
  
  return (
    <Dialog onOpenChange={(isOpen) => (isOpen ? null : dismiss())} open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-midnight-koi">Submit RFP</DialogTitle>
          <DialogDescription className="text-pine-shadow-60">
            This is a three-step process: Create the bounty, submit the
            referendum, and place the decision deposit.
          </DialogDescription>
        </DialogHeader>
        <SubmitModalContent /> {/* This contains the multi-step tx UI */}
      </DialogContent>
    </Dialog>
  );
};

const SubmitModalContent = () => {
  const activeTxStep = useStateObservable(activeBountyRfpTxStep$);
  const refIdx = useStateObservable(referendumIndex$);

  if (!activeTxStep) return null;

  if (activeTxStep.type === "tx") {
    switch (activeTxStep.tag) {
      case "bounty":
        return (
          <div className="space-y-2 overflow-hidden">
            <h3 className="text-sm font-medium text-midnight-koi">
              1. Submit the transaction to create the bounty
            </h3>
            <StepSubmitTx
              explanation={activeTxStep.value.explanation}
              submit={submitBountyCreation}
            />
          </div>
        );
      case "ref":
        return (
          <div className="space-y-2 overflow-hidden">
            <h3 className="text-sm font-medium text-midnight-koi">
              2. Submit the transaction to create the referendum
            </h3>
            <StepSubmitTx
              explanation={activeTxStep.value.explanation}
              submit={submitReferendumCreation}
            />
          </div>
        );
      case "decision":
        return (
          <div className="space-y-2 overflow-hidden">
            <h3 className="text-sm font-medium text-midnight-koi">
              3. Place the decision deposit on the referendum to start it
            </h3>
            <StepSubmitTx
              explanation={activeTxStep.value.explanation}
              submit={submitdecisionDeposit}
            />
          </div>
        );
    }
    return null;
  }

  if (activeTxStep.type === "submitting" || !activeTxStep.value.txEvent.ok) {
    return <StepBroadcastingTx txEvt={activeTxStep.value.txEvent} />;
  }

  return <StepFinish refIdx={refIdx} />;
};
