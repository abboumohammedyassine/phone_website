export function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    maximumFractionDigits: 0,
  }).format(amount) + " DA";
}
