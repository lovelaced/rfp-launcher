import { TOKEN_DECIMALS } from "@/constants";
import { state } from "@react-rxjs/core";
import { combineLatest, of, switchMap } from "rxjs";
import { tipValue$ } from "./price";
import {
  decisionDeposit,
} from "./referendaConstants";
import { createSignal } from "@react-rxjs/utils";

// Create a signal to set the current tipper track
export const [setTipperTrack$, setTipperTrack] = createSignal<"small_tipper" | "big_tipper">();
export const tipperTrack$ = state(setTipperTrack$, "small_tipper" as const);

// Combine tip value with tipper track for accurate deposit calculation
const depositCosts$ = combineLatest([tipValue$, tipperTrack$]).pipe(
  switchMap(([tipValue, tipperTrack]) => {
    const planckValue = tipValue ? BigInt(Math.round(tipValue * 10 ** TOKEN_DECIMALS)) : null;
    return decisionDeposit(planckValue, tipperTrack);
  })
);

// Create estimatedCost$ that only includes deposits for now
export const estimatedCost$ = state(
  combineLatest({
    deposits: depositCosts$,
    fees: of(0n),
  }),
  null,
);
