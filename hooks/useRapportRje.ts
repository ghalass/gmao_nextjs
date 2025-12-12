// hooks/useRapportRje.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface RapportRjeItem {
  engin: string;
  siteName?: string;
  parcName?: string;
  dispo_j: string | number;
  dispo_m: string | number;
  dispo_a: string | number;
  tdm_j: string | number;
  tdm_m: string | number;
  tdm_a: string | number;
  mtbf_j: string | number;
  mtbf_m: string | number;
  mtbf_a: string | number;
  nho_j: string | number;
  nho_m: string | number;
  nho_a: string | number;
  him_j: string | number;
  him_m: string | number;
  him_a: string | number;
  hrm_j: string | number;
  hrm_m: string | number;
  hrm_a: string | number;
  ni_j: string | number;
  ni_m: string | number;
  ni_a: string | number;
  objectif_dispo: string | number;
  objectif_mtbf: string | number;
  objectif_tdm: string | number;
  [key: string]: any;
}

// Définir le type pour les options
interface RapportRjeOptions {
  enabled?: boolean;
}

export const useRapportRje = (
  date: string | null,
  options: RapportRjeOptions = {}
) => {
  return useQuery<RapportRjeItem[]>({
    queryKey: ["rapport-rje", date],
    queryFn: async () => {
      const res = await fetch(`${API}/rapports/rje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ du: date }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Erreur chargement rapport RJE");

      return data;
    },
    enabled: options.enabled ?? !!date,
    staleTime: 1000 * 60 * 2,
  });
};
