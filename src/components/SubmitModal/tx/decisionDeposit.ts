import { typedApi } from "@/chain";
import { state } from "@react-rxjs/core";
import { map, of, switchMap, filter } from "rxjs";
import { dismissable } from "../modalActions";
import { referendumIndex$ } from "./referendumCreation";
import { createTxProcess } from "./txProcess";
import { TxWithExplanation } from "./types";

export const decisionDepositTx$ = state(
  referendumIndex$.pipe(
    filter((index) => index != null),
    switchMap((index) => {
      console.log("[decisionDeposit] Building tx for index:", index);
      const res: TxWithExplanation = {
        tx: typedApi.tx.Referenda.place_decision_deposit({ index: Number(index) }),
        explanation: {
          text: "Place decision deposit",
        },
      };
      return of(res).pipe(dismissable());
    })
  ),
  null
);

export const [decisionDepositProcess$, submitdecisionDeposit] = createTxProcess(
  decisionDepositTx$.pipe(map((v) => v?.tx ?? null))
);

// Auto-trigger decision deposit after referendum creation is finalized
referendumIndex$.subscribe((index) => {
  if (index != null) {
    console.log("[decisionDeposit] Auto-triggering decision deposit for index:", index);
    submitdecisionDeposit();
  }
});
