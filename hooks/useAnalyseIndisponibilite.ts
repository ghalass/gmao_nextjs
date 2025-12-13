import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface AnalyseIndisponibiliteItem {
  typeParcId: string;
  typeParcName: string;
  parcs: Array<{
    parcId: string;
    parcName: string;
    nbreEngins: number;
    pannes: Array<{
      typepanneId: string;
      typepanneName: string;
      pannes: Array<{
        panneId: string;
        panneName: string;
        niMois: number;
        niAnnee: number;
        himMois: number;
        himAnnee: number;
        coeffNiMois: number;
        coeffNiAnnee: number;
        coeffHimMois: number;
        coeffHimAnnee: number;
      }>;
      totalTypePanne: {
        niMois: number;
        niAnnee: number;
        himMois: number;
        himAnnee: number;
        coeffNiMois: number;
        coeffNiAnnee: number;
        coeffHimMois: number;
        coeffHimAnnee: number;
      };
    }>;
    totalParc: {
      niMois: number;
      niAnnee: number;
      himMois: number;
      himAnnee: number;
      coeffNiMois: number;
      coeffNiAnnee: number;
      coeffHimMois: number;
      coeffHimAnnee: number;
    };
  }>;
  totalTypeParc: {
    niMois: number;
    niAnnee: number;
    himMois: number;
    himAnnee: number;
    coeffNiMois: number;
    coeffNiAnnee: number;
    coeffHimMois: number;
    coeffHimAnnee: number;
  };
}

export const useAnalyseIndisponibilite = (
  mois: string | null,
  annee: string | null
) => {
  return useQuery<AnalyseIndisponibiliteItem[]>({
    queryKey: ["analyse-indisponibilite", mois, annee],
    queryFn: async () => {
      if (!mois || !annee) {
        return [];
      }

      const res = await fetch(`${API}/rapports/analyse-indisponibilite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois, annee }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          error?.message || "Erreur chargement analyse indisponibilité"
        );
      }

      return res.json();
    },
    enabled: !!(mois && annee),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};
