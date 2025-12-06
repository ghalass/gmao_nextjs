// hooks/useNiveauUrgences.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface NiveauUrgence {
  id: string;
  name: string;
  description?: string;
  level: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pannes: number;
  };
}

export interface NiveauUrgenceFormData {
  name: string;
  description?: string;
  level: number;
  color?: string;
}

export function useNiveauUrgences() {
  const queryClient = useQueryClient();

  const niveauUrgencesQuery = useQuery({
    queryKey: ["niveauUrgences"],
    queryFn: async (): Promise<NiveauUrgence[]> => {
      const response = await fetch("/api/niveau-urgences");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des niveaux d'urgence");
      }
      return response.json();
    },
  });

  const createNiveauUrgence = useMutation({
    mutationFn: async (data: NiveauUrgenceFormData): Promise<NiveauUrgence> => {
      const response = await fetch("/api/niveau-urgences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveauUrgences"] });
    },
  });

  const updateNiveauUrgence = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: NiveauUrgenceFormData;
    }): Promise<NiveauUrgence> => {
      const response = await fetch(`/api/niveau-urgences/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveauUrgences"] });
    },
  });

  const deleteNiveauUrgence = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/niveau-urgences/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveauUrgences"] });
    },
  });

  return {
    niveauUrgencesQuery,
    createNiveauUrgence,
    updateNiveauUrgence,
    deleteNiveauUrgence,
  };
}
