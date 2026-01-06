// hooks/useTypelubrifiants.ts - VERSION CORRIGÉE
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Typelubrifiant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    lubrifiants: number;
    typelubrifiantParc: number;
  };
}

export interface TypelubrifiantFormData {
  name: string;
  description?: string;
}

export function useTypelubrifiants() {
  const queryClient = useQueryClient();

  // Renommez pour retourner directement la query
  const typelubrifiantsQuery = useQuery({
    queryKey: ["typelubrifiants"],
    queryFn: async (): Promise<Typelubrifiant[]> => {
      const response = await fetch("/api/typelubrifiants");
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createTypelubrifiant = useMutation({
    mutationFn: async (
      data: TypelubrifiantFormData
    ): Promise<Typelubrifiant> => {
      const response = await fetch("/api/typelubrifiants", {
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
      queryClient.invalidateQueries({ queryKey: ["typelubrifiants"] });
    },
  });

  const updateTypelubrifiant = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TypelubrifiantFormData;
    }): Promise<Typelubrifiant> => {
      const response = await fetch(`/api/typelubrifiants/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["typelubrifiants"] });
    },
  });

  const deleteTypelubrifiant = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/typelubrifiants/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de suppression");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typelubrifiants"] });
    },
  });

  return {
    typelubrifiantsQuery,
    createTypelubrifiant,
    updateTypelubrifiant,
    deleteTypelubrifiant,
  };
}
