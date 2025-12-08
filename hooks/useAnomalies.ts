// hooks/useAnomalies.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";
import {
  Anomalie,
  AnomalieFormData,
  AnomalieFilters,
  AnomalieStats,
  AnomalieWithRelations,
} from "@/lib/types/anomalie";

import { SourceAnomalie, Priorite, StatutAnomalie } from "@prisma/client";

export const useAnomalies = (filters?: AnomalieFilters) => {
  const queryClient = useQueryClient();

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    return params.toString();
  };

  const anomaliesQuery = useQuery<AnomalieWithRelations[]>({
    queryKey: ["anomalies", filters],
    queryFn: async (): Promise<AnomalieWithRelations[]> => {
      const queryString = buildQueryString();
      const url = `${API}/anomalies${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors du chargement des anomalies"
        );
      }
      return dataRes;
    },
  });

  const statsQuery = useQuery<AnomalieStats>({
    queryKey: ["anomalieStats", filters],
    queryFn: async (): Promise<AnomalieStats> => {
      const queryString = buildQueryString();
      const url = `${API}/anomalies/stats${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await fetch(url);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors du chargement des statistiques"
        );
      }
      return dataRes;
    },
  });

  const createAnomalie = useMutation<Anomalie, Error, AnomalieFormData>({
    mutationFn: async (data: AnomalieFormData): Promise<Anomalie> => {
      const response = await fetch(`${API}/anomalies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors de la création de l'anomalie"
        );
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["anomalieStats"] });
    },
  });

  const updateAnomalie = useMutation<
    Anomalie,
    Error,
    {
      id: string;
      data: Partial<AnomalieFormData> & {
        commentaireChangementStatut?: string;
      };
    }
  >({
    mutationFn: async ({ id, data }): Promise<Anomalie> => {
      const response = await fetch(`${API}/anomalies/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors de la modification de l'anomalie"
        );
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["anomalieStats"] });
    },
  });

  const deleteAnomalie = useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/anomalies/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors de la suppression de l'anomalie"
        );
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["anomalieStats"] });
    },
  });

  const getAnomalie = useQuery<AnomalieWithRelations>({
    queryKey: ["anomalie", filters?.id],
    queryFn: async (): Promise<AnomalieWithRelations> => {
      if (!filters?.id) {
        throw new Error("ID de l'anomalie requis");
      }

      const response = await fetch(`${API}/anomalies/${filters.id}`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors du chargement de l'anomalie"
        );
      }
      return dataRes;
    },
    enabled: !!filters?.id,
  });

  // Evolution
  interface EvolutionMensuelle {
    mois: string;
    moisComplet: string;
    anomalies: number;
    resolues: number;
    attentePDR: number;
    programmées: number;
    nonProgrammées: number;
    pdrPret: number;
    tauxResolution: number;
  }

  interface EvolutionData {
    evolutionMensuelle: EvolutionMensuelle[];
    totalAnomalies: number;
    anomaliesResolues: number;
    anomaliesCritiques: number;
    anomaliesRecent: number;
    tauxResolution: number;
    tempsMoyenResolution: number;
    repartitionPriorite: Record<string, number>;
    repartitionSource: Record<string, number>;
    repartitionStatut: {
      anomalies: number;
      resolues: number;
      attentePDR: number;
      programmées: number;
      nonProgrammées: number;
      pdrPret: number;
    };
    evolution: number;
    topEngins: Array<{
      enginId: string;
      name: string;
      count: number;
    }>;
    periode: {
      debut: string;
      fin: string;
      jours: number;
    };
    metriques: {
      moyenneMensuelle: number;
      meilleurMois: EvolutionMensuelle | null;
      pireMois: EvolutionMensuelle | null;
    };
    evolutionPeriodes: EvolutionPeriodes;
    comparaisonMensuelle: ComparaisonMensuelle;
  }

  // Ajouter à useAnomalies
  const evolutionQuery = useQuery<EvolutionData>({
    queryKey: ["anomalieEvolution", filters],
    queryFn: async (): Promise<EvolutionData> => {
      const queryString = buildQueryString();
      const url = `${API}/anomalies/evolution${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await fetch(url);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors du chargement de l'évolution"
        );
      }
      return dataRes;
    },
  });

  interface EvolutionPeriodes {
    mensuelle: number;
    pourcentageMensuel: number;
    pourcentageTrimestriel: number;
    tendance: "hausse" | "baisse" | "stable";
  }

  interface ComparaisonMensuelle {
    moisCourant: EvolutionMensuelle | null;
    moisPrecedent: EvolutionMensuelle | null;
    difference: number;
    pourcentage: number;
  }

  return {
    anomaliesQuery,
    statsQuery,
    createAnomalie,
    updateAnomalie,
    deleteAnomalie,
    getAnomalie,
    evolutionQuery,
  };
};
