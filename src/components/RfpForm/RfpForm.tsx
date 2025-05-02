import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { emptyNumeric, formSchema } from "./formSchema";
import { FundingSection } from "./FundingSection";
import { SupervisorsSection } from "./SupervisorsSection";

export const RfpForm = () => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prizePool: emptyNumeric,
      findersFee: emptyNumeric,
      supervisorsFee: emptyNumeric,
      supervisors: [],
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FundingSection control={form.control} />
        <SupervisorsSection control={form.control} />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
