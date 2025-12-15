// hooks/useRapportMvtOrgane.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface MvtOrganeData {
  enginId: string;
  enginName: string;
  siteName: string;
  parcName: string;
  typeParcName: string;
  typeOrganeName: string;
  dateDepose: string;
  organeDepose: string;
  hrmDepose: number;
  datePose: string;
  organePose: string;
  causeDepose: string;
  typeCause: string;
  observations: string;
}

export interface ParcMvtOrgane {
  parcId: string;
  parcName: string;
  typeParcId: string;
  typeParcName: string;
  mouvements: MvtOrganeData[];
}

export interface TypeParcMvtOrgane {
  typeParcId: string;
  typeParcName: string;
  parcs: ParcMvtOrgane[];
}

export interface RapportMvtOrganeResponse {
  data: TypeParcMvtOrgane[];
  sites: string[];
  parcs: string[];
  typeOrganes: string[];
}

interface RapportMvtOrganeOptions {
  enabled?: boolean;
}

export const useRapportMvtOrgane = (
  mois: string | null,
  annee: string | null,
  options: RapportMvtOrganeOptions = {}
) => {
  return useQuery<RapportMvtOrganeResponse>({
    queryKey: ["rapport-mvt-organe", mois, annee],
    queryFn: async () => {
      if (!mois || !annee) {
        throw new Error("Le mois et l'année sont requis");
      }

      const res = await fetch(`${API}/rapports/mvt-organe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois: mois, annee: annee }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Erreur chargement rapport Mouvements Organes"
        );
      }

      return res.json();
    },
    enabled: options.enabled ?? !!(mois && annee),
    retry: 1,
  });
};
