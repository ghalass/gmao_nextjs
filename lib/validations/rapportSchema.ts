// lib/validations/rapportSchema.ts
import yup from "@/lib/yupFr";

export const rapportFiltersSchema = yup.object({
  date: yup.date().required("La date est requise"),
  siteId: yup.string().optional(),
  parcId: yup.string().optional(),
});

export type RapportFiltersData = yup.InferType<typeof rapportFiltersSchema>;

// Types de calculs
export interface RapportEngin {
  id: string;
  code: string;
  siteId: string;
  parcId: string;

  // Données brutes pour la journée sélectionnée
  NHO: number; // Nombre d'heures ouvrables (24)
  HIM: number; // Heures d'immobilisation
  HRM: number; // Heures réelles de marche
  NI: number; // Nombre d'interventions
  TP: number; // Travaux Préventifs
  VS: number; // Visites systématiques

  // Calculs
  HRD: number; // Heures réelles disponibles sans utilisation
  MTTR: number; // Temps moyen de réparation
  SW: number; // Taux d'arrêts préventifs
  DISP: number; // Disponibilité (%)
  TDM: number; // Taux de marche (%)
  MTBF: number; // Temps moyen entre 2 pannes (H)
  UTIL: number; // Utilisation (%)
}

export interface RapportJournalier {
  date: Date;
  engins: RapportEngin[];
  total: {
    DISP: { jour: number; mois: number; cumul: number };
    TDM: { jour: number; mois: number; cumul: number };
    MTBF: { mois: number; cumul: number };
  };
  objectif: {
    DISP: number;
    TDM: number;
    MTBF: number;
  };
}

export interface CalculPeriodes {
  jour: RapportEngin;
  mois: RapportEngin;
  cumul: RapportEngin;
}
