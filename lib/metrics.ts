// -----------------------------------------------------------------
// File: /utils/metrics.ts
// Helper functions implementing the formulas provided by the user

export type RawCounters = {
  NHO: number; // Nombre d'heures ouvrables (24)
  HIM: number; // Heures d'immobilisation
  HRM: number; // Heures réelles de marche
  NI: number; // Nombre d'interventions
  TP?: number; // Travaux Préventifs
  VS?: number; // Visites systématiques
};

export function safeDiv(a: number, b: number): number {
  if (!b || isNaN(b)) return 0;
  return a / b;
}

export function calcHRD(NHO: number, HIM: number, HRM: number) {
  return NHO - (HIM + HRM);
}

export function calcMTTR(HIM: number, NI: number) {
  if (!NI) return 0;
  return safeDiv(HIM, NI);
}

export function calcSW(TP: number = 0, VS: number = 0, HIM: number) {
  if (!HIM) return 0;
  return safeDiv(TP + VS, HIM) * 100;
}

export function calcDISP(HIM: number, NHO: number) {
  if (!NHO) return 0;
  return (1 - safeDiv(HIM, NHO)) * 100;
}

export function calcTDM(HRM: number, NHO: number) {
  if (!NHO) return 0;
  return safeDiv(HRM, NHO) * 100;
}

export function calcMTBF(HRM: number, NI: number) {
  if (!NI) return 0;
  return safeDiv(HRM, NI);
}

export function calcUTIL(HRM: number, HRD: number) {
  if (!HRM && !HRD) return 0;
  return safeDiv(HRM, HRM + HRD) * 100;
}
