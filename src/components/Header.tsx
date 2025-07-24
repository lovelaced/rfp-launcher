import { USE_CHOPSTICKS } from "@/chain";
import { ChopsticksController } from "./ChopsticksController";
import { SelectAccount } from "./SelectAccount";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { KnownChains, matchedChain } from "@/chainRoute";

export const Header = () => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SelectAccount />
      <ChainSelector />
      {USE_CHOPSTICKS && <ChopsticksController />}
    </div>
  );
};

const chainNames: Record<KnownChains, string> = {
  kusama: "Kusama",
  polkadot: "Polkadot",
};

const ChainSelector = () => (
  <Select
    value={matchedChain}
    onValueChange={(v) => {
      window.location.href = "?chain=" + v;
    }}
  >
    <SelectTrigger className={`w-auto ${matchedChain === 'kusama' ? 'kusama-stamp' : 'polkadot-stamp'}`}>
      <SelectValue aria-label={matchedChain}>
        {chainNames[matchedChain]}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {Object.entries(chainNames).map(([key, value]) => (
        <SelectItem key={key} value={key}>
          {value}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
