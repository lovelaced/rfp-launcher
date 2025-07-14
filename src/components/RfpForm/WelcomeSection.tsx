import type { FC } from "react";
import { RfpControlType } from "./formSchema";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";

export const WelcomeSection: FC<{ control: RfpControlType }> = ({
  control,
}) => (
  <div className="poster-card">
    {/* Hero section with fixed background */}
    <div className="relative rounded-lg overflow-hidden mb-8" style={{ height: "200px" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}rocket.jpg?height=400&width=1200')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(0.95)",
          opacity: 0.7,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight-koi/50 to-transparent" />
      <h2 className="absolute bottom-6 left-6 text-4xl font-medium text-white drop-shadow-lg">
        Let's launch your RFP together
      </h2>
    </div>

    {/* Content section */}
    <div className="max-w-2xl space-y-6">
      <div className="space-y-4 text-lg leading-relaxed text-pine-shadow">
        <p>
          We'll help you create an awesome RFP step by step.
        </p>
        <p>
          After completing the form, you'll submit three transactions to set up
          the RFP. Then we'll provide a pre-formatted body for your referendum.
        </p>
        <p className="text-sm">
          New to RFPs?{" "}
          <a href="/faq" className="text-lake-haze hover:underline font-medium">
            Check out our FAQ
          </a>
          {" "}to learn how RFPs work and see bounty management resources.
        </p>
      </div>

      {/* Prominent RFP Type Selection */}
      <div className="bg-canvas-cream rounded-lg p-6 border border-pine-shadow-20">
        <h3 className="text-lg font-medium text-midnight-koi mb-4">
          Choose your RFP type:
        </h3>
        
        <FormField
          control={control}
          name="isChildRfp"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`p-6 rounded-lg border transition-all text-left ${
                      !field.value 
                        ? "border-lilypad bg-lilypad/10 shadow-sm" 
                        : "border-pine-shadow-20 hover:border-pine-shadow-40 hover:bg-canvas-cream/50"
                    }`}
                  >
                    <div className="font-medium text-lg mb-2 text-midnight-koi">
                      New RFP
                    </div>
                    <div className="text-sm text-pine-shadow">
                      Create a new treasury proposal for your RFP
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={`p-6 rounded-lg border transition-all text-left ${
                      field.value 
                        ? "border-lilypad bg-lilypad/10 shadow-sm" 
                        : "border-pine-shadow-20 hover:border-pine-shadow-40 hover:bg-canvas-cream/50"
                    }`}
                  >
                    <div className="font-medium text-lg mb-2 text-midnight-koi">
                      Child Bounty
                    </div>
                    <div className="text-sm text-pine-shadow">
                      Use funds from an existing bounty (curator only)
                    </div>
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />
      </div>

      <div className="text-sm text-pine-shadow-60 italic">
        Grab some lemonade and let's get started. ☀️
      </div>
    </div>
  </div>
);
