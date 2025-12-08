// hooks/usePannes.ts - Version adaptée
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PanneCreateDto } from "@/lib/types";

export function usePannes() {
  const queryClient = useQueryClient();

  const pannesQuery = useQuery({
    queryKey: ["pannes"],
    queryFn: async () => {
      const response = await fetch("/api/pannes");
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de chargement");
      }
      return dataRes;
    },
  });

  const createPanne = useMutation({
    mutationFn: async (data: PanneCreateDto) => {
      const response = await fetch("/api/pannes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de création");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pannes"] });
    },
  });

  const updatePanne = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PanneCreateDto>;
    }) => {
      const response = await fetch(`/api/pannes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de modification");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pannes"] });
    },
  });

  const deletePanne = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pannes/${id}`, {
        method: "DELETE",
      });
      const dataRes = await response.json();
      if (!response.ok) {
        throw new Error(dataRes.message || "Erreur lors de suppression");
      }
      return dataRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pannes"] });
    },
  });

  return {
    pannesQuery,
    createPanne,
    updatePanne,
    deletePanne,
  };
}
