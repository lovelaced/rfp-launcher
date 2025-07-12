"use client"

import { type FC, useEffect } from "react"
import { useWatch } from "react-hook-form"
import type { TipControlType } from "./formSchema"
import { selectedAccount$ } from "../SelectAccount"
import { FormInputField } from "./FormInputField"
import { useStateObservable } from "@react-rxjs/core"
import { PolkadotIdenticon } from "@polkadot-api/react-components"
import { sliceMiddleAddr } from "@/lib/ss58"
import { getSs58AddressInfo } from "polkadot-api"
import { CheckCircle } from "lucide-react"
import { identity$ } from "./data"

export const BeneficiariesSection: FC<{ control: TipControlType }> = ({ control }) => {
  const referral = useWatch({ name: "referral", control })
  const selectedAccount = useStateObservable(selectedAccount$)
  const tipBeneficiary = useWatch({ name: "tipBeneficiary", control })

  // Set default referral to connected address when component mounts
  useEffect(() => {
    if (selectedAccount && (!referral || referral === "")) {
      // This will be handled by the form field's setValue
    }
  }, [selectedAccount, referral])

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Recipients</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <FormInputField control={control} name="tipBeneficiary" label="Tip Recipient" description="who will receive the tip" placeholder="Enter recipient KSM address" />
          <BeneficiaryIdentityBadge address={tipBeneficiary} />
        </div>
        <div>
          <FormInputField control={control} name="referral" label="Referral" description="who will receive the referral fee" placeholder="Enter tipper's KSM address" />
          <BeneficiaryIdentityBadge address={referral} />
        </div>
      </div>
    </div>
  )
}

// Helper component for showing identity badge
const BeneficiaryIdentityBadge: FC<{ address: string | undefined }> = ({ address }) => {
  if (!address) return null
  
  // Validate address before using it
  const addressInfo = getSs58AddressInfo(address)
  if (!addressInfo.isValid) return null
  
  const identity = useStateObservable(identity$(address))
  
  return (
    <div className="flex items-center gap-2 mt-2 text-sm text-pine-shadow">
      <PolkadotIdenticon size={16} publicKey={addressInfo.publicKey} />
      {identity ? (
        identity.verified ? (
          <div className="flex items-center gap-1">
            <span className="font-medium">{identity.value}</span>
            <CheckCircle size={12} className="text-lilypad-dark" />
          </div>
        ) : (
          <span className="font-medium">{identity.value}</span>
        )
      ) : (
        <span className="font-mono text-xs">{sliceMiddleAddr(address)}</span>
      )}
    </div>
  )
}

