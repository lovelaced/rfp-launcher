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
      <h2 className="text-4xl font-medium mb-6 text-midnight-koi">Give someone a well-deserved tip</h2>

      <div className="space-y-4 text-lg leading-relaxed text-pine-shadow">
        <p>
          This tool guides you through suggesting a tip for someone who's done good work for the ecosystem!
        </p>
        <p>
          Be sure you have the beneficiary's address to receive the tip, and add your own to take a finder's fee.
        </p>
      </div>

      <div className="mt-8 text-sm text-pine-shadow-60">Grab some lemonade and let's get started.</div>
    </div>
  </div>
)

