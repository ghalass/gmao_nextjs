// hooks/useRapportUnitePhysique.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface SiteStats {
  hrm: number;
  him: number;
  nbre?: number; // Nombre d'engins
}

export interface ParcData {
  parcId: string;
  parcName: string;
  nbreEngins: number;
  siteStatsMois: Record<string, SiteStats>;
  siteStatsAnnee: Record<string, SiteStats>;
  aggregatesMois: {
    totalHRM: number;
    totalHIM: number;
  };
  aggregatesAnnee: {
    totalHRM: number;
    totalHIM: number;
  };
}

export interface UnitePhysiqueItem {
  typeParcId: string;
  typeParcName: string;
  parcs: ParcData[];
  totalTypeParc: {
    nbreEngins: number;
    aggregatesMois: {
      totalHRM: number;
      totalHIM: number;
    };
    aggregatesAnnee: {
      totalHRM: number;
      totalHIM: number;
    };
  };
}

export interface RapportUnitePhysiqueResponse {
  data: UnitePhysiqueItem[];
  sites: string[];
}

interface RapportUnitePhysiqueOptions {
  enabled?: boolean;
}

export const useRapportUnitePhysique = (
  mois: string | null,
  annee: string | null,
  options: RapportUnitePhysiqueOptions = {}
) => {
  console.log("Hook useRapportUnitePhysique - mois:", mois, "annee:", annee);
  return useQuery<RapportUnitePhysiqueResponse>({
    queryKey: ["rapport-unite-physique", mois, annee],
    queryFn: async () => {
      if (!mois || !annee) {
        throw new Error("Le mois et l'année sont requis");
      }

      const res = await fetch(`${API}/rapports/unite-physique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois: mois, annee: annee }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Erreur chargement rapport Unité Physique"
        );
      }

      return res.json();
    },
    enabled: options.enabled ?? !!(mois && annee), // Activer seulement si mois ET année
  });
};
