import { polkadotPeopleApi, kusamaPeopleApi } from "@/chain";
import { matchedChain } from "@/chainRoute";
import { createIdentitySdk } from "@polkadot-api/sdk-accounts";
import { state } from "@react-rxjs/core";
import { SS58String } from "polkadot-api";
import { from, map, startWith, tap, catchError, of, switchMap } from "rxjs";

const CACHE_KEY = "identity-cache";
const cache: Record<
  SS58String,
  { value: string; verified: boolean } | undefined
> = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");

const polkadotIdentitySdk = createIdentitySdk(polkadotPeopleApi);
const kusamaIdentitySdk = createIdentitySdk(kusamaPeopleApi);

export const identity$ = state((address: SS58String) => {
  const defaultValue = cache[address] ?? null;
  
  // Determine primary and fallback SDKs based on current chain
  const primarySdk = matchedChain === "kusama" ? kusamaIdentitySdk : polkadotIdentitySdk;
  const fallbackSdk = matchedChain === "kusama" ? polkadotIdentitySdk : kusamaIdentitySdk;
  
  // Try primary chain first
  const primaryLookup$ = from(primarySdk.getIdentity(address)).pipe(
    map((v) =>
      v?.info.display
        ? {
            value: v.info.display,
            verified: v.verified,
          }
        : null
    ),
    catchError(() => of(null))
  );
  
  // If no identity found on primary chain, try fallback
  return primaryLookup$.pipe(
    switchMap(primaryResult => {
      if (primaryResult) {
        return of(primaryResult);
      }
      // Try fallback chain
      return from(fallbackSdk.getIdentity(address)).pipe(
        map((v) =>
          v?.info.display
            ? {
                value: v.info.display,
                verified: v.verified,
              }
            : null
        ),
        catchError(() => of(null))
      );
    }),
    tap((v) => {
      if (v != null) {
        cache[address] = v;
      } else {
        delete cache[address];
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }),
    startWith(defaultValue)
  );
}, null);
