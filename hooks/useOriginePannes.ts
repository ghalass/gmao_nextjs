// hooks/useOriginePannes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OriginePanne {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pannes: number;
  };
}

export interface OriginePanneFormData {
  name: string;
  description?: string;
}

export function useOriginePannes() {
  const queryClient = useQueryClient();

  const originePannesQuery = useQuery({
    queryKey: ["originePannes"],
    queryFn: async (): Promise<OriginePanne[]> => {
      const response = await fetch("/api/origine-pannes");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des origines de panne");
      }
      return response.json();
    },
  });

  const createOriginePanne = useMutation({
    mutationFn: async (data: OriginePanneFormData): Promise<OriginePanne> => {
      const response = await fetch("/api/origine-pannes", {
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
      queryClient.invalidateQueries({ queryKey: ["originePannes"] });
    },
  });

  const updateOriginePanne = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: OriginePanneFormData;
    }): Promise<OriginePanne> => {
      const response = await fetch(`/api/origine-pannes/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["originePannes"] });
    },
  });

  const deleteOriginePanne = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/origine-pannes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["originePannes"] });
    },
  });

  return {
    originePannesQuery,
    createOriginePanne,
    updateOriginePanne,
    deleteOriginePanne,
  };
}
