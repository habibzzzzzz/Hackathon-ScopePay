export const CURRENCIES = ["USD", "EUR", "GBP", "IDR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function toMinor(value: string | number): number {
  const text = String(value);
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text))
    throw new Error("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result))
    throw new Error("Amount exceeds the supported range.");
  return result;
}

export function decimal(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0)
    throw new Error("Invalid monetary amount.");
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

export function formatMoney(minor: number, currency: Currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}
