export const DEFAULT_INVOICE_COLOR = "#4F6B8C";

// Invoice templates append alpha bytes, so always store opaque six-digit HEX.
export function normalizeInvoiceHex(value) {
  if (typeof value !== "string") return null;
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null;
  return "#" + (hex.length === 3 ? [...hex].map(c => c + c).join("") : hex).toUpperCase();
}
