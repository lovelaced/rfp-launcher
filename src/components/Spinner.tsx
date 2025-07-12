import { LoaderCircle, LucideProps } from "lucide-react";
import { FC, PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

export const Spinner = (props: LucideProps) => (
  <LoaderCircle
    {...props}
    className={twMerge("animate-spin", props.className)}
  />
);

export const Loading: FC<PropsWithChildren> = ({ children }) => (
  <div
    className={"flex items-center justify-center gap-2 text-pine-shadow-60"}
  >
    <Spinner className="text-lake-haze" />
    {children && <span className="text-sm">{children}</span>}
  </div>
);
