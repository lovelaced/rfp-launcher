// This component now only contains elements specific to the original header actions,
// as the brand/logo and main navigation are handled in App.tsx's AppHeader.
import { USE_CHOPSTICKS } from "@/chain"
import { ChopsticksController } from "./ChopsticksController"
import { SelectAccount } from "./SelectAccount"

export const Header = () => {
  return (
    <>
      {" "}
      {/* Use a fragment as we don't need a wrapping div here anymore */}
      <SelectAccount />
      <div className="kusama-stamp">KUSAMA</div>
      {USE_CHOPSTICKS && <ChopsticksController />}
    </>
  )
}

