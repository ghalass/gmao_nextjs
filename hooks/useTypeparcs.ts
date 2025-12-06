// hooks/useTypeparcs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Typeparc {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    parcs: number;
  };
}

export interface TypeparcFormData {
  name: string;
}

export function useTypeparcs() {
  const queryClient = useQueryClient();

  const typeparcsQuery = useQuery({
    queryKey: ["typeparcs"],
    queryFn: async (): Promise<Typeparc[]> => {
      const response = await fetch("/api/typeparcs");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des types de parcs");
      }
      return response.json();
    },
  });

  const createTypeparc = useMutation({
    mutationFn: async (data: TypeparcFormData): Promise<Typeparc> => {
      const response = await fetch("/api/typeparcs", {
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
      queryClient.invalidateQueries({ queryKey: ["typeparcs"] });
    },
  });

  const updateTypeparc = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TypeparcFormData;
    }): Promise<Typeparc> => {
      const response = await fetch(`/api/typeparcs/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["typeparcs"] });
    },
  });

  const deleteTypeparc = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/typeparcs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typeparcs"] });
    },
  });

  return {
    typeparcsQuery,
    createTypeparc,
    updateTypeparc,
    deleteTypeparc,
  };
}
