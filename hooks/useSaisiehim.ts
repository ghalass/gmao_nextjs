// hooks/useSaisiehim.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";
import { Saisiehim, SaisiehimFormData } from "@/lib/types/saisie";

export const useSaisiehim = () => {
  const queryClient = useQueryClient();

  const saisiehimQuery = useQuery<Saisiehim[]>({
    queryKey: ["saisiehim"],
    queryFn: async (): Promise<Saisiehim[]> => {
      const response = await fetch(`${API}/saisiehim`);
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors du chargement");
      }
      return dataRes;
    },
  });

  const createSaisiehim = useMutation<Saisiehim, Error, SaisiehimFormData>({
    mutationFn: async (data: SaisiehimFormData): Promise<Saisiehim> => {
      const response = await fetch(`${API}/saisiehim`, {
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
      queryClient.invalidateQueries({ queryKey: ["saisiehim"] });
    },
  });

  const deleteSaisiehim = useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API}/saisiehim/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de la suppression");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saisiehim"] });
    },
  });

  return {
    saisiehimQuery,
    createSaisiehim,
    deleteSaisiehim,
  };
};
