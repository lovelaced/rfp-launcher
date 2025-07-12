import { typedApi } from "@/chain";
import {
  createReferendaSdk,
  kusamaSpenderOrigin,
  PolkadotRuntimeOriginCaller,
  ReferendaTrack,
} from "@polkadot-api/sdk-governance";
import { state } from "@react-rxjs/core";
import { combineLatest, from, map } from "rxjs";

export const referendaSdk = createReferendaSdk(typedApi, {
  spenderOrigin: kusamaSpenderOrigin,
});

// Add mapping for tipper track IDs to match referendumCreation.ts
const TIPPER_TRACK_IDS: Record<string, number> = {
  small_tipper: 30,
  big_tipper: 31,
};

export const getTrack = async (
  value: bigint | null,
  tipperTrack?: "small_tipper" | "big_tipper"
): Promise<{
  origin: PolkadotRuntimeOriginCaller;
  track: ReferendaTrack;
}> => {
  if (tipperTrack && TIPPER_TRACK_IDS[tipperTrack]) {
    const trackId = TIPPER_TRACK_IDS[tipperTrack];
    const track = await referendaSdk.getTrack(trackId);
    if (!track) throw new Error(`Couldn't find track for ${tipperTrack}`);

    let origin: PolkadotRuntimeOriginCaller;
    if (tipperTrack === "small_tipper") {
      origin = { type: "Origins", value: { type: "SmallTipper", value: undefined } };
    } else if (tipperTrack === "big_tipper") {
      origin = { type: "Origins", value: { type: "BigTipper", value: undefined } };
    } else {
      throw new Error("Unknown tipper track: " + tipperTrack);
    }

    return { track, origin };
  }

  // Fallback to the original logic for non-tipper tracks
  if (!value) {
    const treasurerTrack = await referendaSdk.getTrack("treasurer");
    if (!treasurerTrack) throw new Error("Couldn't find treasurer track");
    return {
      origin: {
        type: "Origins",
        value: {
          type: "Treasurer",
          value: undefined,
        },
      } satisfies PolkadotRuntimeOriginCaller,
      track: treasurerTrack,
    };
  }

  const { track, origin } = referendaSdk.getSpenderTrack(value);
  return { track: await track, origin };
};

export const submissionDeposit =
  typedApi.constants.Referenda.SubmissionDeposit();

export const decisionDeposit = (value: bigint | null, tipperTrack?: "small_tipper" | "big_tipper") =>
  combineLatest([from(getTrack(value, tipperTrack)), from(submissionDeposit)]).pipe(
    map(([value, submissionDeposit]) => value.track.decision_deposit - submissionDeposit)
  );

export const referendaDuration = (value: bigint | null, tipperTrack?: "small_tipper" | "big_tipper") =>
  getTrack(value, tipperTrack).then(
    (value) =>
      value.track.prepare_period +
      value.track.decision_period +
      value.track.confirm_period +
      value.track.min_enactment_period
  );

export const curatorDeposit = typedApi.constants.Bounties.CuratorDepositMax();

export const curatorDeposit$ = state(from(curatorDeposit), null);
