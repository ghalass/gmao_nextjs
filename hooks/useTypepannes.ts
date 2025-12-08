// hooks/useTypepannes.ts - VERSION CORRIGÉE
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

  // Renommez pour retourner directement la query
  const typepannesQuery = useQuery({
    queryKey: ["typepannes"],
    queryFn: async (): Promise<Typepanne[]> => {
      const response = await fetch("/api/typepannes");
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
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
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la création");
      }
      return dataRes;
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
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de modification");
      }
      return dataRes;
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
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de suppression");
      }
      return dataRes;
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
