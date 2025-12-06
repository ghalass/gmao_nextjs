// hooks/useTypepannes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Typepanne {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pannes: number;
    typepanneParc: number;
  };
}

export interface TypepanneFormData {
  name: string;
  description?: string;
}

export function useTypepannes() {
  const queryClient = useQueryClient();

  const typepannesQuery = useQuery({
    queryKey: ["typepannes"],
    queryFn: async (): Promise<Typepanne[]> => {
      const response = await fetch("/api/typepannes");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des types de panne");
      }
      return response.json();
    },
  });

  const createTypepanne = useMutation({
    mutationFn: async (data: TypepanneFormData): Promise<Typepanne> => {
      const response = await fetch("/api/typepannes", {
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
      queryClient.invalidateQueries({ queryKey: ["typepannes"] });
    },
  });

  const updateTypepanne = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TypepanneFormData;
    }): Promise<Typepanne> => {
      const response = await fetch(`/api/typepannes/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["typepannes"] });
    },
  });

  const deleteTypepanne = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/typepannes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typepannes"] });
    },
  });

  return {
    typepannesQuery,
    createTypepanne,
    updateTypepanne,
    deleteTypepanne,
  };
}
