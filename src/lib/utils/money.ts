export function formatMoney(value?: number | string | null, currency = "USD") {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(num);
}
