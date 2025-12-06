// hooks/useParcs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typeparc } from "@/lib/types";
import { ParcFormData } from "@/lib/validations/parcSchema";

export interface Parc {
  id: string;
  name: string;
  typeparcId: string;
  typeparc: Typeparc;
  createdAt: string;
  updatedAt: string;
  _count: {
    engins: number;
  };
}

export function useParcs() {
  const queryClient = useQueryClient();

  const parcsQuery = useQuery({
    queryKey: ["parcs"],
    queryFn: async (): Promise<Parc[]> => {
      const response = await fetch("/api/parcs");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des parcs");
      }
      return response.json();
    },
  });

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

  const createParc = useMutation({
    mutationFn: async (data: ParcFormData): Promise<Parc> => {
      const response = await fetch("/api/parcs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création du parc");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcs"] });
    },
  });

  const updateParc = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ParcFormData;
    }): Promise<Parc> => {
      const response = await fetch(`/api/parcs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Erreur lors de la modification du parc"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcs"] });
    },
  });

  const deleteParc = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/parcs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression du parc");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcs"] });
    },
  });

  return {
    parcsQuery,
    typeparcsQuery,
    createParc,
    updateParc,
    deleteParc,
  };
}
