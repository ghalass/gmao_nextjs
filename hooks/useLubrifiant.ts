// hooks/useLubrifiant.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface Lubrifiant {
  id: string;
  name: string;
  typelubrifiantId: string;
  createdAt: string;
  updatedAt: string;
  typelubrifiant?: {
    id: string;
    name: string;
  };
  parcs?: {
    id: string;
    name: string;
  }[];
  _count?: {
    saisielubrifiant: number;
    lubrifiantParc: number;
  };
}

export interface LubrifiantFormData {
  name: string;
  typelubrifiantId: string;
  parcIds: string[];
}

export const useLubrifiant = () => {
  const queryClient = useQueryClient();

  const lubrifiantQuery = useQuery<Lubrifiant[]>({
    queryKey: ["lubrifiant"],
    queryFn: async (): Promise<Lubrifiant[]> => {
      const response = await fetch(`${API}/lubrifiant`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createLubrifiant = useMutation<Lubrifiant, Error, LubrifiantFormData>({
    mutationFn: async (data: LubrifiantFormData): Promise<Lubrifiant> => {
      const response = await fetch(`${API}/lubrifiant`, {
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
      queryClient.invalidateQueries({ queryKey: ["lubrifiant"] });
    },
  });

  const updateLubrifiant = useMutation<
    Lubrifiant,
    Error,
    { id: string; data: LubrifiantFormData }
  >({
    mutationFn: async ({ id, data }): Promise<Lubrifiant> => {
      const response = await fetch(`${API}/lubrifiant/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["lubrifiant"] });
    },
  });

  const deleteLubrifiant = useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/lubrifiant/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la suppression");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lubrifiant"] });
    },
  });

  return {
    lubrifiantQuery,
    createLubrifiant,
    updateLubrifiant,
    deleteLubrifiant,
  };
};
