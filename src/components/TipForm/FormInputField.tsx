import type { HTMLInputTypeAttribute } from "react"
import type { Control, FieldValues, Path } from "react-hook-form"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"

export const FormInputField = <T extends FieldValues>({
  control,
  name,
  label,
  description,
  type,
  min,
  max,
  step,
  disabled,
  placeholder,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  description?: string
  type?: HTMLInputTypeAttribute
  min?: number | string | undefined
  max?: number | string | undefined
  step?: number | string | undefined
  disabled?: boolean
  placeholder?: string
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="space-y-2">
        <FormLabel className="poster-label">{label}</FormLabel>
        <FormControl>
          <Input
            type={type}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            className="poster-input"
            onWheel={type === "number" ? (evt) => evt.currentTarget.blur() : undefined}
            {...field}
            value={field.value ?? ""}
          />
        </FormControl>
        {description ? (
          <FormDescription className="text-xs text-pine-shadow-60 leading-tight">{description}</FormDescription>
        ) : null}
        <FormMessage className="text-tomato-stamp text-xs" />
      </FormItem>
    )}
  />
)

