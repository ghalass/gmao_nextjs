// hooks/usePannes.ts - Version adaptée
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PanneCreateDto } from "@/lib/types";

export function usePannes() {
  const queryClient = useQueryClient();

  const pannesQuery = useQuery({
    queryKey: ["pannes"],
    queryFn: async () => {
      const response = await fetch("/api/pannes");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors du chargement des pannes"
        );
      }
      return response.json();
    },
  });

  const createPanne = useMutation({
    mutationFn: async (data: PanneCreateDto) => {
      const response = await fetch("/api/pannes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la création de la panne"
        );
      }

      return response.json();
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la modification de la panne"
        );
      }

      return response.json();
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la suppression de la panne"
        );
      }

      return response.json();
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
