import { typedApi } from "@/chain";
import { formatToken } from "@/lib/formatToken";
import { MultiAddress } from "@polkadot-api/descriptors";
import { state } from "@react-rxjs/core";
import { TOKEN_DECIMALS } from "@/constants";
import {
  combineLatest,
  filter,
  map,
  switchMap,
} from "rxjs";
import {
  curatorDeposit$,
} from "../../TipForm/data";
import { dismissable, submittedFormData$ } from "../tipModalActions";
import { createTxProcess } from "./txProcess";
import { TxWithExplanation } from "./types";
import { filter as rxFilter, map as rxMap } from "rxjs";
import { currencyRate$ } from "@/services/currencyRate";

// Add mapping for tipper track IDs
const TIPPER_TRACK_IDS: Record<string, number> = {
  small_tipper: 30,
  big_tipper: 31,
};

export const tipReferendumCreationTx$ = state(
  submittedFormData$.pipe(
    filter((v) => !!v),
    switchMap((formData) => {
      const tipRecipientAddr = formData.tipBeneficiary;

      const amount$ = combineLatest([
        curatorDeposit$,
        typedApi.query.System.Account.getValue(tipRecipientAddr),
      ]).pipe(map(([deposit, account]) => {
        if (!account) return 0n;
        return (deposit || 0n) - account.data.free;
      }));

      const getReferendumProposal = async (): Promise<TxWithExplanation> => {
        // Convert USD to KSM using the current rate
        const currencyRate = currencyRate$.getValue(); // USD per KSM
        const tipAmountKSM = currencyRate ? formData.tipAmount / currencyRate : 0;
        const tipAmountValue = BigInt(Math.round(tipAmountKSM * Math.pow(10, TOKEN_DECIMALS)));

        // Calculate referral fee in KSM
        let referralFeeAmount = 0n;
        if (formData.referralFeePercent && formData.referral) {
          referralFeeAmount = (tipAmountValue * BigInt(formData.referralFeePercent)) / 100n;
        }
        // const totalValue = tipAmountValue + referralFeeAmount;

        // Create spend_local call for the main beneficiary
        const tipCall = typedApi.tx.Treasury.spend_local({
          amount: tipAmountValue,
          beneficiary: MultiAddress.Id(formData.tipBeneficiary),
        });

        const calls = [tipCall];

        // If referral is present, add a spend_local call for the referral
        if (formData.referralFeePercent && formData.referral) {
          const referralFeeCall = typedApi.tx.Treasury.spend_local({
            amount: referralFeeAmount,
            beneficiary: MultiAddress.Id(formData.referral),
          });
          calls.push(referralFeeCall);
        }

        // Batch the calls
        const batchCall = typedApi.tx.Utility.batch_all({
          calls: calls.map((c) => c.decodedCall),
        });

        // Hardcode the track ID for tipper referenda
        const trackId = TIPPER_TRACK_IDS[formData.tipperTrack];
        if (trackId === undefined) throw new Error("Unknown tipper track: " + formData.tipperTrack);

        const callData = await batchCall.getEncodedData();

        // Prepare the origin for OpenGov
        let origin;
        if (formData.tipperTrack === "small_tipper") {
          origin = { type: "Origins" as const, value: { type: "SmallTipper" as const, value: undefined } };
        } else if (formData.tipperTrack === "big_tipper") {
          origin = { type: "Origins" as const, value: { type: "BigTipper" as const, value: undefined } };
        } else {
          throw new Error("Unknown tipper track: " + formData.tipperTrack);
        }

        // Create the referenda transaction using the regular API
        const referendumTx = typedApi.tx.Referenda.submit({
          proposal_origin: origin,
          proposal: { type: "Inline", value: callData },
          enactment_moment: { type: "At", value: 0 },
        });

        return {
          tx: referendumTx,
          explanation: {
            text: "Tip referendum proposal",
            params: {
              tipRecipient: formData.tipBeneficiary,
              amount: formatToken(tipAmountValue),
              ...(formData.referral && formData.referralFeePercent ? {
                referral: formData.referral,
                referralFee: `${formatToken(referralFeeAmount)} (${formData.referralFeePercent}%)`,
              } : {}),
            },
          },
        };
      };

      // Await the proposal and use the resolved value directly
      return combineLatest([
        amount$,
      ]).pipe(
        switchMap(async ([amount]) => {
          const proposal = await getReferendumProposal();
          const calls: TxWithExplanation[] = [];

          if (amount > 0) {
            calls.push({
              tx: typedApi.tx.Balances.transfer_keep_alive({
                dest: MultiAddress.Id(tipRecipientAddr),
                value: amount,
              }),
              explanation: {
                text: "Transfer balance to tip recipient",
                params: {
                  destination: tipRecipientAddr,
                  value: formatToken(amount),
                },
              },
            });
          }

          // Add the referendum submission
          calls.push({
            tx: proposal.tx,
            explanation: {
              text: "Create tip referendum",
              params: {
                call: proposal.explanation,
                track: formData.tipperTrack,
              },
            },
          });

          if (calls.length > 1) {
            return {
              tx: typedApi.tx.Utility.batch_all({
                calls: calls.map((c) => c.tx.decodedCall),
              }),
              explanation: {
                text: "batch",
                params: Object.fromEntries(
                  calls.map((v, i) => [i, v.explanation])
                ),
              },
            };
          }
          return calls[0];
        }),
        dismissable()
      );
    })
  ),
  null
);

// const formatTrackName = (track: string) => track.replace(/_/g, " ");

export const [tipReferendumCreationProcess$, submitTipReferendumCreation] =
  createTxProcess(tipReferendumCreationTx$.pipe(map((v) => v?.tx ?? null)));

// Expose the referendum index from the finalized event
export const tipReferendumIndex$ = state(
  tipReferendumCreationProcess$.pipe(
    rxFilter((evt) => {
      const isFinalized = !!evt && evt.type === "finalized" && evt.ok && Array.isArray((evt as any).events);
      if (evt) {
        console.log("[referendumIndex$] process evt:", evt, "isFinalized:", isFinalized);
      }
      return isFinalized;
    }),
    rxMap((evt) => {
      const events = (evt as any).events;
      console.log("[referendumIndex$] all events:", events);
      const event = events.find(
        (e: any) =>
          e.type === "Referenda" &&
          e.value &&
          e.value.type === "Submitted" &&
          e.value.value &&
          typeof e.value.value.index === "number"
      );
      console.log("[referendumIndex$] found event:", event);
      const index = event ? event.value.value.index : null;
      if (!index) {
        console.log("[referendumIndex$] index not valid:", index);
      }
      return index;
    }),
    rxFilter((index) => {
      const valid = typeof index === "number" && !isNaN(index);
      if (!valid) {
        console.log("[referendumIndex$] index not valid:", index);
      }
      return valid;
    })
  ),
  null
);