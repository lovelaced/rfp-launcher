import { FC, PropsWithChildren } from "react";
import { Button } from "../ui/button";
import { TxExplanation } from "./tx/types";
import { AddressDisplay } from "./AddressDisplay";
import { getSs58AddressInfo } from "polkadot-api";

export const StepSubmitTx: FC<
  PropsWithChildren<{
    explanation: TxExplanation;
    submit: () => void;
  }>
> = ({ explanation, submit, children }) => (
  <div className="space-y-4 overflow-hidden">
    <h3 className="text-sm font-medium text-midnight-koi">{children}</h3>
    <div className="space-y-4">
      <TxExplanationView explanation={explanation} />
      <Button className="poster-btn btn-primary w-full" onClick={submit}>
        Sign and Submit
      </Button>
    </div>
  </div>
);

const TxExplanationView: FC<{ explanation: TxExplanation }> = ({
  explanation,
}) =>
  explanation.text === "batch" ? (
    <ol className="text-sm space-y-2 overflow-hidden list-decimal list-inside text-pine-shadow">
      {Object.values(explanation.params ?? {}).map((param, i) => (
        <li key={i} className="pl-2">
          {typeof param === "string" ? (
            <span className="text-pine-shadow-90">{param}</span>
          ) : (
            <TxExplanationView explanation={param} />
          )}
        </li>
      ))}
    </ol>
  ) : (
    <div className="text-sm rounded-lg border border-pine-shadow-20 bg-lake-haze/5 px-4 py-3 space-y-3 overflow-hidden">
      <div className="font-medium text-midnight-koi">{explanation.text}</div>
      <div className="space-y-2">
        {Object.entries(explanation.params ?? {}).map(([key, value]) => (
          <div key={key} className="flex gap-2 items-start">
            <div className="text-pine-shadow-60 font-medium text-sm shrink-0 pt-0.5">{key}:</div>
            {typeof value === "string" ? (
              key.toLowerCase() === "address" && getSs58AddressInfo(value).isValid ? (
                <AddressDisplay address={value} />
              ) : (
                <div className="overflow-hidden text-ellipsis text-pine-shadow-90 font-mono text-sm break-all">
                  {value}
                </div>
              )
            ) : (
              <div className="overflow-hidden">
                <TxExplanationView explanation={value} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
