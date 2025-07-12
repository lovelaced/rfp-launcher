import type { FC } from "react"

export const WelcomeSection: FC = () => (
  <div className="poster-card relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage: `url('${import.meta.env.BASE_URL}rocket.jpg?height=400&width=1200')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(2px) saturate(0.95)",
        mixBlendMode: "multiply",
      }}
    />

    {/* Content overlay */}
    <div className="relative z-10 max-w-2xl">
      <h2 className="text-4xl font-medium mb-6 text-midnight-koi">Submit a tip referendum</h2>

      <div className="space-y-4 text-lg leading-relaxed text-pine-shadow">
        <p>
          This tool guides you through creating a tip referendum for big tipper or small tipper tracks.
        </p>
        <p>
          After completing the form, you'll submit a referendum that includes a batch of beneficiaries to give funds to the receiver and the referral.
        </p>
      </div>

      <div className="mt-8 text-sm text-pine-shadow-60">Grab some lemonade and let's get started.</div>
    </div>
  </div>
)

