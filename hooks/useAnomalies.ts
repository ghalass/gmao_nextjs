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

// Fonction séparée pour récupérer une anomalie par ID avec toutes les mutations
export const useAnomalie = (id?: string) => {
  const queryClient = useQueryClient();

  const anomalieQuery = useQuery<AnomalieWithRelations>({
    queryKey: ["anomalie", id],
    queryFn: async (): Promise<AnomalieWithRelations> => {
      if (!id) {
        throw new Error("ID de l'anomalie requis");
      }
      const response = await fetch(`${API}/anomalies/${id}`);
      const dataRes = await response.json();

      if (!response.ok) {
        throw new Error(
          dataRes.message || "Erreur lors du chargement de l'anomalie"
        );
      }
      return dataRes;
    },
    enabled: !!id,
  });

  // Mutation pour mettre à jour l'anomalie
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
    onSuccess: (data, variables) => {
      // Invalider et rafraîchir toutes les requêtes pertinentes
      queryClient.invalidateQueries({ queryKey: ["anomalie", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["anomalieStats"] });

      // Mettre à jour le cache directement pour une réactivité immédiate
      queryClient.setQueryData(["anomalie", variables.id], data);
    },
  });

  const deleteAnomalie = useMutation<void, Error, string>({
    mutationFn: async (anomalieId: string): Promise<void> => {
      const response = await fetch(`${API}/anomalies/${anomalieId}`, {
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
    onSuccess: (_, id) => {
      // Invalider toutes les requêtes après suppression
      queryClient.invalidateQueries({ queryKey: ["anomalie", id] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["anomalieStats"] });

      // Supprimer du cache
      queryClient.removeQueries({ queryKey: ["anomalie", id] });
    },
  });

  return {
    anomalieQuery,
    updateAnomalie,
    deleteAnomalie,
  };
};

// Fonction pour les anomalies avec filtres (version simplifiée)
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

  // Types pour l'évolution
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

  return {
    anomaliesQuery,
    statsQuery,
    createAnomalie,
    evolutionQuery,
  };
};
