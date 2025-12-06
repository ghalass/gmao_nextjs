// hooks/useEngins.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Engin, Parc, Site, Typeparc } from "@/lib/types";
import { EnginFormData } from "@/lib/validations/enginSchema";

const apiFetch = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Erreur lors de la requête");
  }

  return response.json();
};

export function useEngins() {
  const queryClient = useQueryClient();

  const enginsQuery = useQuery({
    queryKey: ["engins"],
    queryFn: async (): Promise<Engin[]> => {
      return apiFetch<Engin[]>("/api/engins");
    },
  });

  const parcsQuery = useQuery({
    queryKey: ["parcs"],
    queryFn: async (): Promise<Parc[]> => {
      return apiFetch<Parc[]>("/api/parcs");
    },
  });

  const typeparcsQuery = useQuery({
    queryKey: ["typeparcs"],
    queryFn: async (): Promise<Typeparc[]> => {
      return apiFetch<Typeparc[]>("/api/typeparcs");
    },
  });

  const sitesQuery = useQuery({
    queryKey: ["sites"],
    queryFn: async (): Promise<Site[]> => {
      return apiFetch<Site[]>("/api/sites");
    },
  });

  const createEngin = useMutation({
    mutationFn: async (data: EnginFormData): Promise<Engin> => {
      return apiFetch<Engin>("/api/engins", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });

  const updateEngin = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: EnginFormData;
    }): Promise<Engin> => {
      return apiFetch<Engin>(`/api/engins/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });

  const deleteEngin = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiFetch(`/api/engins/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });

  return {
    enginsQuery,
    parcsQuery,
    sitesQuery,
    createEngin,
    updateEngin,
    deleteEngin,
    typeparcsQuery,
  };
}
