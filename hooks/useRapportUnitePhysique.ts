// hooks/useRapportUnitePhysique.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface UnitePhysiqueItem {
  typeParcName: string;
  parcs: {
    parcName: string;
    siteStats: Record<
      string,
      {
        hrm: number;
        him: number;
        nbre?: number; // Nombre d'engins
      }
    >;
  }[];
  totalTypeParc: {
    mensuel: {
      totalHRM: number;
      totalHIM: number;
    };
    annuel: {
      totalHRM: number;
      totalHIM: number;
    };
  };
}

interface RapportUnitePhysiqueOptions {
  enabled?: boolean;
}

export const useRapportUnitePhysique = (
  date: string | null,
  options: RapportUnitePhysiqueOptions = {}
) => {
  return useQuery<UnitePhysiqueItem[]>({
    queryKey: ["rapport-unite-physique", date],
    queryFn: async () => {
      const res = await fetch(`${API}/rapports/unite-physique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || "Erreur chargement rapport Unité Physique"
        );

      return data;
    },
    enabled: options.enabled ?? !!date,
    staleTime: 1000 * 60 * 2,
  });
};
