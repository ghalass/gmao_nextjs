// hooks/useTypelubrifiant.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";

export interface Typelubrifiant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: { lubrifiants: number };
}

export interface TypelubrifiantFormData {
  name: string;
}

export const useTypelubrifiant = () => {
  const queryClient = useQueryClient();

  const typelubrifiantQuery = useQuery<Typelubrifiant[]>({
    queryKey: ["type_lubrifiant"],
    queryFn: async (): Promise<Typelubrifiant[]> => {
      const response = await fetch(`${API}/type_lubrifiant`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createTypelubrifiant = useMutation<
    Typelubrifiant,
    Error,
    TypelubrifiantFormData
  >({
    mutationFn: async (
      data: TypelubrifiantFormData
    ): Promise<Typelubrifiant> => {
      const response = await fetch(`${API}/type_lubrifiant`, {
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
      queryClient.invalidateQueries({ queryKey: ["type_lubrifiant"] });
    },
  });

  const updateTypelubrifiant = useMutation<
    Typelubrifiant,
    Error,
    { id: string; data: TypelubrifiantFormData }
  >({
    mutationFn: async ({ id, data }): Promise<Typelubrifiant> => {
      const response = await fetch(`${API}/type_lubrifiant/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["type_lubrifiant"] });
    },
  });

  const deleteTypelubrifiant = useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/type_lubrifiant/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la suppression");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["type_lubrifiant"] });
    },
  });

  return {
    typelubrifiantQuery,
    createTypelubrifiant,
    updateTypelubrifiant,
    deleteTypelubrifiant,
  };
};
