export const CURRENCY_PRESETS = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

export function formatAmount(amount: number, currency: string): string {
  const preset = CURRENCY_PRESETS.find((c) => c.code === currency);
  const formatted = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return preset ? `${preset.symbol}${formatted}` : `${currency} ${formatted}`;
}
