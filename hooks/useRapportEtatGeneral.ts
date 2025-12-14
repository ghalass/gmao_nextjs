// hooks/useRapportEtatGeneral.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface EnginEtatGeneral {
  enginId: string;
  enginName: string;
  siteName: string;
  parcName: string;
  typeParcName: string;
  initialHeureChassis: number;
  hrmMois: number;
  heureChassisMois: number;
  totalHeureChassis: number;
}

export interface ParcEtatGeneral {
  parcId: string;
  parcName: string;
  typeParcId: string;
  typeParcName: string;
  engins: EnginEtatGeneral[];
  totalParc: {
    nombreEngins: number;
    totalHRMMois: number;
    totalHeureChassisMois: number;
  };
}

export interface TypeParcEtatGeneral {
  typeParcId: string;
  typeParcName: string;
  parcs: ParcEtatGeneral[];
  totalTypeParc: {
    nombreEngins: number;
    totalHRMMois: number;
    totalHeureChassisMois: number;
  };
}

export interface RapportEtatGeneralResponse {
  data: TypeParcEtatGeneral[];
  sites: string[];
  parcs: string[];
}

interface RapportEtatGeneralOptions {
  enabled?: boolean;
}

export const useRapportEtatGeneral = (
  mois: string | null,
  annee: string | null,
  options: RapportEtatGeneralOptions = {}
) => {
  return useQuery<RapportEtatGeneralResponse>({
    queryKey: ["rapport-etat-general", mois, annee],
    queryFn: async () => {
      if (!mois || !annee) {
        throw new Error("Le mois et l'année sont requis");
      }

      const res = await fetch(`${API}/rapports/etat-general`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois: mois, annee: annee }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Erreur chargement rapport État Général"
        );
      }

      return res.json();
    },
    enabled: options.enabled ?? !!(mois && annee),
    retry: 1,
  });
};
