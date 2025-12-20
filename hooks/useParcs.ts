// hooks/useParcs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typeparc } from "@/lib/types";
import { ParcFormData } from "@/lib/validations/parcSchema";
import { API } from "@/lib/constantes";

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

  const parcsQuery = useQuery<Parc[]>({
    queryKey: ["parcs"],
    queryFn: async (): Promise<Parc[]> => {
      const response = await fetch(`${API}/parcs`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  // Nouvelle fonction pour récupérer les parcs par typeparc
  const useParcsByTypeparc = (typeparcId?: string) => {
    return useQuery<Parc[]>({
      queryKey: ["parcs", "by-typeparc", typeparcId],
      queryFn: async (): Promise<Parc[]> => {
        if (!typeparcId) return [];

        const response = await fetch(`${API}/parcs?typeparcId=${typeparcId}`);
        const dataRes = await response.json();
        if (!response.ok) {
          throw new Error(dataRes.message || "Erreur lors du chargement");
        }
        return dataRes;
      },
      enabled: !!typeparcId,
    });
  };

  const createParc = useMutation({
    mutationFn: async (data: ParcFormData): Promise<Parc> => {
      const response = await fetch(`${API}/parcs`, {
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
      const response = await fetch(`${API}/parcs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors modification");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcs"] });
    },
  });

  const deleteParc = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/parcs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcs"] });
    },
  });

  return {
    parcsQuery,
    useParcsByTypeparc, // Renommé pour plus de clarté
    createParc,
    updateParc,
    deleteParc,
  };
}
