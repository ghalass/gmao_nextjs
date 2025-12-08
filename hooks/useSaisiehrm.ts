// hooks/useSaisiehrm.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";
import { Saisiehrm, SaisiehrmFormData } from "@/lib/types/saisie";

export const useSaisiehrm = () => {
  const queryClient = useQueryClient();

  const saisiehrmQuery = useQuery<Saisiehrm[]>({
    queryKey: ["saisiehrm"],
    queryFn: async (): Promise<Saisiehrm[]> => {
      const response = await fetch(`${API}/saisiehrm`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createSaisiehrm = useMutation<Saisiehrm, Error, SaisiehrmFormData>({
    mutationFn: async (data: SaisiehrmFormData): Promise<Saisiehrm> => {
      const response = await fetch(`${API}/saisiehrm`, {
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
      queryClient.invalidateQueries({ queryKey: ["saisiehrm"] });
    },
  });

  const deleteSaisiehrm = useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/saisiehrm/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la suppression");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saisiehrm"] });
    },
  });

  return {
    saisiehrmQuery,
    createSaisiehrm,
    deleteSaisiehrm,
  };
};
