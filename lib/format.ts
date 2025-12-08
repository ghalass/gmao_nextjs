// lib/utils/format.ts
export function formatPourcentage(value: number): string {
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getVariationColor(variation: number): string {
  if (variation > 0) return "text-red-600";
  if (variation < 0) return "text-green-600";
  return "text-gray-600";
}

export function getVariationIcon(variation: number): string {
  if (variation > 0) return "↑";
  if (variation < 0) return "↓";
  return "→";
}

export function getTendanceLabel(
  tendance: "hausse" | "baisse" | "stable"
): string {
  return {
    hausse: "À la hausse",
    baisse: "À la baisse",
    stable: "Stable",
  }[tendance];
}

export function getTendanceColor(
  tendance: "hausse" | "baisse" | "stable"
): string {
  return {
    hausse: "text-red-600",
    baisse: "text-green-600",
    stable: "text-gray-600",
  }[tendance];
}
