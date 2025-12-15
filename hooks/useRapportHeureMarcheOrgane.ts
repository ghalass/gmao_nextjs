// hooks/useRapportHeureMarcheOrgane.ts
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface HeureMarcheOrganeData {
  organeId: string;
  organeName: string;
  typeOrganeName: string;
  hrmMensuel: number;
  hrmCumul: number;
  dateDernierePose: string;
  dateDepose: string;
  estSurEngin: boolean;
}

export interface EnginHeureMarcheOrgane {
  enginId: string;
  enginName: string;
  siteName: string;
  parcName: string;
  typeParcName: string;
  organes: HeureMarcheOrganeData[];
}

export interface TypeParcHeureMarcheOrgane {
  typeParcId: string;
  typeParcName: string;
  engins: EnginHeureMarcheOrgane[];
}

export interface RapportHeureMarcheOrganeResponse {
  data: TypeParcHeureMarcheOrgane[];
  sites: string[];
  parcs: string[];
  typeOrganes: string[];
  mois: string;
  annee: string;
}

interface RapportHeureMarcheOrganeOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export function useRapportHeureMarcheOrgane(
  mois: string | null,
  annee: string | null,
  options: RapportHeureMarcheOrganeOptions = {}
) {
  return useQuery<RapportHeureMarcheOrganeResponse>({
    queryKey: ["rapport-heure-marche-organe", mois, annee],
    queryFn: async () => {
      if (!mois || !annee) {
        throw new Error("Le mois et l'année sont requis");
      }

      const res = await fetch(`${API}/rapports/heure-marche-organe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois, annee }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Erreur chargement rapport Heure Marche Organes"
        );
      }

      return res.json();
    },
    enabled: options.enabled ?? !!(mois && annee),
    refetchOnMount: options.refetchOnMount ?? false,
    retry: 1,
  });
}
