// hooks/useEngins.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface Engin {
  id: string;
  name: string;
  active: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  parc?: {
    id: string;
    name: string;
    typeparc?: {
      id: string;
      name: string;
    };
  };
  site?: {
    id: string;
    name: string;
  };
}

export interface EnginFormData {
  name: string;
  active?: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis?: number;
}

export interface EnginFilters {
  typeparcId?: string;
  parcId?: string;
  siteId?: string;
  active?: boolean;
}

export const useEngins = () => {
  const queryClient = useQueryClient();

  // Hook pour récupérer les engins avec filtres
  const useFilteredEngins = (filters?: EnginFilters) => {
    return useQuery<Engin[]>({
      queryKey: ["engins", filters],
      queryFn: async (): Promise<Engin[]> => {
        const params = new URLSearchParams();

        if (filters?.typeparcId)
          params.append("typeparcId", filters.typeparcId);
        if (filters?.parcId) params.append("parcId", filters.parcId);
        if (filters?.siteId) params.append("siteId", filters.siteId);
        if (filters?.active !== undefined)
          params.append("active", filters.active.toString());

        const url = `${API}/engins${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const response = await fetch(url);
        const dataRes = await response.json();
        if (!response.ok) {
          throw new Error(dataRes.message || "Erreur lors du chargement");
        }
        return dataRes;
      },
    });
  };

  // Hook pour récupérer tous les engins (sans filtres)
  const enginsQuery = useQuery<Engin[]>({
    queryKey: ["engins"],
    queryFn: async (): Promise<Engin[]> => {
      const response = await fetch(`${API}/engins`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createEngin = useMutation<Engin, Error, EnginFormData>({
    mutationFn: async (data: EnginFormData): Promise<Engin> => {
      const response = await fetch(`${API}/engins`, {
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
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });

  const updateEngin = useMutation<
    Engin,
    Error,
    { id: string; data: EnginFormData }
  >({
    mutationFn: async ({ id, data }): Promise<Engin> => {
      const response = await fetch(`${API}/engins/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la modification");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });

  const deleteEngin = useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/engins/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la suppression");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });

  return {
    enginsQuery,
    useFilteredEngins, // Nouvelle fonction exportée
    createEngin,
    updateEngin,
    deleteEngin,
  };
};
