import { typedApi } from "@/chain";
import {
  calculatePriceTotals,
  generateMarkdown,
  identity$,
  signerBalance$,
} from "@/components/RfpForm/data";
import { FormSchema } from "@/components/RfpForm/formSchema";
import { selectedAccount$ } from "@/components/SelectAccount";
import { TOKEN_DECIMALS } from "@/constants";
import { formatToken } from "@/lib/formatToken";
import { currencyRate$ } from "@/services/currencyRate";
import { novasamaProvider } from "@polkadot-api/sdk-accounts";
import { createBountiesSdk } from "@polkadot-api/sdk-governance";
import {
  AccountId,
  getMultisigAccountId,
  sortMultisigSignatories,
} from "@polkadot-api/substrate-bindings";
import { state } from "@react-rxjs/core";
import { Binary } from "polkadot-api";
import { combineLatest, filter, from, map, merge, of, switchMap } from "rxjs";
import { submittedFormData$ } from "../modalActions";
import { createTxProcess } from "./txProcess";
import { TxWithExplanation } from "./types";

const totalAmount$ = (formData: FormSchema) =>
  currencyRate$.pipe(
    map(
      (currencyRate) =>
        calculatePriceTotals(formData, currencyRate).totalAmountWithBuffer
    ),
    filter((v) => v != null),
    map((v) => {
      // The amount is an approximation (with the +25% buffer), no need to have accurate math
      return BigInt(Math.round(v * Math.pow(10, TOKEN_DECIMALS)));
    })
  );

const multisigCreationHash = Binary.fromHex("".padEnd(32 * 2, "00"));
export const getCreationMultisigCallMetadata = (
  formData: FormSchema,
  selectedAccount: string
) => {
  const codec = AccountId();
  const multisigAddr = getMultisigAddress(formData);
  const sortedSignatories = sortMultisigSignatories(
    formData.supervisors.map(codec.enc)
  );
  const toHex = (v: Uint8Array) => Binary.fromBytes(v).asHex();
  const selectedPk = toHex(codec.enc(selectedAccount));
  const otherSignatories = sortedSignatories.filter(
    (v) => toHex(v) !== selectedPk
  );
  if (otherSignatories.length === sortedSignatories.length) return null;

  return {
    multisigAddr,
    call_hash: multisigCreationHash,
    threshold: formData.signatoriesThreshold,
    other_signatories: otherSignatories.map(codec.dec),
  };
};

export const REMARK_TEXT =
  "Unused funds from the bounty will be returned to the treasury";
export const bountyCreationTx$ = state(
  submittedFormData$.pipe(
    switchMap((formData) => {
      if (!formData) return [null];

      const needsMultisigCreation$ =
        formData.supervisors.length > 1
          ? from(novasamaProvider("kusama")(getMultisigAddress(formData))).pipe(
              map((v) => !v)
            )
          : of(false);

      const shouldCreateMultisig$ = combineLatest([
        needsMultisigCreation$,
        signerBalance$.pipe(filter((v) => v != null)),
        typedApi.constants.Multisig.DepositBase(),
        typedApi.constants.Multisig.DepositFactor(),
      ]).pipe(
        map(([needsMultisig, signerFunds, depositBase, depositFactor]) => {
          if (!needsMultisig) return false;
          const multisigDepositCost =
            depositBase + BigInt(formData.supervisors.length) * depositFactor;
          return multisigDepositCost < signerFunds;
        })
      );

      const multisigMetadata$ = combineLatest([
        shouldCreateMultisig$,
        selectedAccount$.pipe(filter((v) => !!v)),
      ]).pipe(
        map(([shouldCreateMultisig, selectedAccount]) => {
          if (!shouldCreateMultisig) return null;
          return getCreationMultisigCallMetadata(
            formData,
            selectedAccount.address
          );
        })
      );

      return combineLatest([totalAmount$(formData), multisigMetadata$]).pipe(
        map(([value, multisigMeta]): TxWithExplanation => {
          const proposeBounty: TxWithExplanation = {
            tx: typedApi.tx.Bounties.propose_bounty({
              value,
              description: Binary.fromText(formData.projectTitle),
            }),
            explanation: {
              text: "Propose bounty",
              params: {
                title: formData.projectTitle,
                value: formatToken(value),
              },
            },
          };

          const remark: TxWithExplanation = {
            tx: typedApi.tx.System.remark_with_event({
              remark: Binary.fromText(REMARK_TEXT),
            }),
            explanation: {
              text: "Remark",
              params: {
                text: REMARK_TEXT,
              },
            },
          };

          const calls = [proposeBounty.tx, remark.tx];
          const explanations = [proposeBounty.explanation, remark.explanation];

          if (multisigMeta) {
            calls.push(
              typedApi.tx.Multisig.approve_as_multi({
                ...multisigMeta,
                max_weight: { proof_size: 0n, ref_time: 0n },
                maybe_timepoint: undefined,
              })
            );
            explanations.push({
              text: "Multisig call to have the curator indexed",
              params: {
                address: multisigMeta.multisigAddr,
              },
            });
          }

          return {
            tx: typedApi.tx.Utility.batch({
              calls: calls.map((v) => v.decodedCall),
            }),
            explanation: {
              text: "batch",
              params: Object.fromEntries(Object.entries(explanations)),
            },
          };
        })
      );
    })
  )
);

export const bountyMarkdown$ = state(
  combineLatest([
    submittedFormData$.pipe(filter((v) => !!v)),
    currencyRate$,
  ]).pipe(
    switchMap(([formFields, currencyRate]) => {
      const { totalAmountWithBuffer } = calculatePriceTotals(
        formFields,
        currencyRate
      );

      const identities$ = combineLatest(
        Object.fromEntries(
          formFields.supervisors.map((addr) => [
            addr,
            identity$(addr).pipe(map((id) => id?.value)),
          ])
        )
      );

      return identities$.pipe(
        map((identities) =>
          generateMarkdown(formFields, totalAmountWithBuffer, identities)
        )
      );
    })
  ),
  null
);

export const [bountyCreationProcess$, submitBountyCreation] = createTxProcess(
  bountyCreationTx$.pipe(map((v) => v?.tx ?? null))
);

const accountCodec = AccountId();

const getMultisigAddress = (formData: FormSchema) =>
  accountCodec.dec(
    getMultisigAccountId({
      threshold: Math.min(
        formData.signatoriesThreshold,
        formData.supervisors.length
      ),
      signatories: formData.supervisors.map(accountCodec.enc),
    })
  );

const bountiesSdk = createBountiesSdk(typedApi);
export const rfpBounty$ = state(
  merge(
    bountyCreationProcess$.pipe(
      filter((v) => v?.type === "finalized" && v.ok),
      switchMap(async (v) => {
        const bounty = await bountiesSdk.getProposedBounty(v);
        if (!bounty) {
          // TODO check error boundaries
          throw new Error("Bounty could not be found");
        }

        const [multisig] = typedApi.event.Multisig.NewMultisig.filter(v.events);

        return {
          bounty,
          multisigTimepoint: multisig
            ? {
                height: v.block.number,
                index: v.block.index,
              }
            : null,
        };
      })
    ),
    // try and load existing one if it's there
    submittedFormData$.pipe(
      filter((v) => !!v),
      switchMap(async (formData) => {
        const multisigAddr =
          formData.supervisors.length > 1 ? getMultisigAddress(formData) : null;

        const [bounties, multisig] = await Promise.all([
          bountiesSdk.getBounties(),
          multisigAddr
            ? typedApi.query.Multisig.Multisigs.getValue(
                multisigAddr,
                multisigCreationHash
              )
            : Promise.resolve(null),
        ]);
        const bounty = bounties.find(
          (bounty) =>
            bounty.status.type === "Proposed" &&
            bounty.description === formData.projectTitle
        );

        return { bounty: bounty!, multisigTimepoint: multisig?.when ?? null };
      }),
      filter((v) => !!v.bounty)
    )
  )
);
