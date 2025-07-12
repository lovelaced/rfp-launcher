"use client"

import type { FC } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import type { TipControlType } from "./formSchema"

export const ScopeSection: FC<{ control: TipControlType }> = ({ control }) => {
  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Tip Details</h3>

      <p className="text-lg text-pine-shadow mb-8 leading-relaxed">
        Describe what this tip is for and why it's being awarded. This helps voters understand the purpose and value of the tip.
      </p>

      <div className="space-y-8">
        <FormField
          control={control}
          name="tipTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="poster-label">Tip Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a descriptive tip title" className="poster-input" {...field} />
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="tipDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="poster-label">Tip Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this tip is for and why it's being awarded in Markdown format..."
                  className="poster-textarea min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

