// hooks/useTypeparcs.ts
import { API } from "@/lib/constantes";
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
      const response = await fetch(`${API}/typeparcs`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createTypeparc = useMutation({
    mutationFn: async (data: TypeparcFormData): Promise<Typeparc> => {
      const response = await fetch(`${API}/typeparcs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du création");
      }
      return dataRes;
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
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du modification");
      }
      return dataRes;
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
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du suppression");
      }
      return dataRes;
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
