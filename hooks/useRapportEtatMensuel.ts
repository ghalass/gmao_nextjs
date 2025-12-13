// hooks/useEtatMensuel.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface EtatMensuelItem {
  typeParcId: string;
  typeParcName: string;
  parcs: Array<{
    parcId: string;
    parcName: string;
    nbreEngins: number;
    nhoMois: number;
    nhoAnnee: number;
    aggregatesMois: {
      him: number;
      hrm: number;
      ni: number;
      tp: number;
      vs: number;
      hrd: number;
      mttr: number;
      sw: string;
      disp: string;
      tdm: string;
      mtbf: number;
      util: string;
    };
    aggregatesAnnee: {
      him: number;
      hrm: number;
      ni: number;
      tp: number;
      vs: number;
      hrd: number;
      mttr: number;
      sw: string;
      disp: string;
      tdm: string;
      mtbf: number;
      util: string;
    };
    objectifDispo: number | null;
    objectifUtil: number | null;
  }>;
  totalTypeParc: {
    nbreEngins: number;
    nhoMois: number;
    nhoAnnee: number;
    aggregatesMois: {
      him: number;
      hrm: number;
      ni: number;
      tp: number;
      vs: number;
      hrd: number;
      mttr: number;
      sw: string;
      disp: string;
      tdm: string;
      mtbf: number;
      util: string;
    };
    aggregatesAnnee: {
      him: number;
      hrm: number;
      ni: number;
      tp: number;
      vs: number;
      hrd: number;
      mttr: number;
      sw: string;
      disp: string;
      tdm: string;
      mtbf: number;
      util: string;
    };
  };
}

export const useEtatMensuel = (mois: string | null, annee: string | null) => {
  return useQuery<EtatMensuelItem[]>({
    queryKey: ["etat-mensuel", mois, annee],
    queryFn: async () => {
      // Ne pas faire la requête si mois ou année manquent
      if (!mois || !annee) {
        return [];
      }

      const res = await fetch(`${API}/rapports/etat-mensuel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois, annee }), // MODIFICATION : envoyer mois et annee
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || "Erreur chargement état mensuel");
      }

      return res.json();
    },
    enabled: !!(mois && annee), // S'exécuter seulement si mois et année sont définis
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};
