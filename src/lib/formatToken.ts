import { TOKEN_DECIMALS, TOKEN_SYMBOL } from "@/constants";

export const formatToken = (value: bigint | null | undefined) => {
  if (value == null) return "";
  
  const numValue = Number(value) / 10 ** TOKEN_DECIMALS;

  return `${numValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })} ${TOKEN_SYMBOL}`;
};

export const formatCurrency = (
  value: number | null | undefined,
  symbol: string,
  maximumFractionDigits = 2,
) => {
  if (value == null) return "";

  const valueStr = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });

  if (symbol === "$") return `$${valueStr}`;
  return `${valueStr} ${symbol}`;
};

export const formatUsd = (value: number | null | undefined) =>
  formatCurrency(value, "$");

export const formatTokenForNetwork = (value: bigint | null | undefined, network: "kusama" | "polkadot") => {
  if (value == null) return "";
  
  const decimals = network === "kusama" ? 12 : 10;
  const symbol = network === "kusama" ? "KSM" : "DOT";
  
  const numValue = Number(value) / 10 ** decimals;
  
  // Format with up to 4 decimal places, but remove trailing zeros
  return `${numValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })} ${symbol}`;
};
