export function formatFcfa(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("fr-FR")} FCFA`;
}
