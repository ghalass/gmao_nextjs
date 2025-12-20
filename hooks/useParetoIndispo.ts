// hooks/useParetoIndispo.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface PanneStats {
  panneName: string;
  description: string;
  him: number;
  indispo: number;
  ni: number;
  enginCount: number;
}

export interface MTBFStats {
  panneName: string;
  description: string;
  him: number;
  hrm: number;
  ni: number;
  mtbf: number;
  enginCount: number;
}

export interface EnginStats {
  enginName: string;
  enginId: string;
  him: number;
  ni: number;
  indispo?: number;
  hrm?: number;
  mtbf?: number;
}

export interface ParcDetails {
  typeparc: string;
  parc: string;
  panne: string;
  panneDescription: string;
  nombre_d_engin: number;
  nho_m: number;
  ni_m: number;
  him_m: number;
  indisp_m: number;
  coef_indispo_m: number;
  enginsAffectedCount: number;
}

export interface MonthlyEvolution {
  month: string;
  monthNumber: number;
  year: number;
  totalHRM: number;
  totalHIM: number;
  totalNI: number;
  avgIndispo: number;
  avgMTBF: number;
  activeEnginsCount: number;
}

export interface SummaryStats {
  totalHRM: number;
  totalHIM: number;
  totalNI: number;
  avgIndispo: number;
  avgMTBF: number;
  totalActiveEnginsPeriod: number;
  nhoPeriod: number;
}

export interface ParetoIndispoData {
  topIndispo: PanneStats[];
  topMTBF: MTBFStats[];
  enginsIndispo: EnginStats[];
  enginsMTBF: EnginStats[];
  detailsParParc: ParcDetails[];
  monthlyEvolution: MonthlyEvolution[];
  summary: SummaryStats;
}

interface ParetoIndispoFilters {
  typeparcId?: string;
  parcId?: string;
  enginId?: string;
  siteId?: string;
  dateFrom: string;
  dateTo: string;
}

export const useParetoIndispo = (
  filters: ParetoIndispoFilters,
  enabled = true
) => {
  return useQuery<ParetoIndispoData>({
    queryKey: ["pareto-indispo", filters],
    queryFn: async () => {
      if (!filters.dateFrom || !filters.dateTo) {
        throw new Error("Les dates sont obligatoires");
      }

      const res = await fetch(`${API}/rapports/pareto-indispo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Erreur lors du calcul du Pareto"
        );
      }

      return res.json();
    },
    enabled: enabled && !!filters.dateFrom && !!filters.dateTo,
  });
};
