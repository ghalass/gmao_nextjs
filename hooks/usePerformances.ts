// hooks/usePerformances.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SaisiePerformance,
  SaisiePerformanceFormData,
  Engin,
  Site,
  Panne,
  Lubrifiant,
  TypeConsommationLub,
  SaisieLubrifiantFormData,
  SaisieHimFormData,
  SaisieHim,
  SaisieLubrifiant,
} from "@/lib/types/performance";
import { apiRequest } from "@/lib/axios";

export const usePerformances = () => {
  const queryClient = useQueryClient();

  // Query pour les saisies HRM
  const performancesQuery = useQuery({
    queryKey: ["performances"],
    queryFn: async (): Promise<SaisiePerformance[]> => {
      const { data } = await apiRequest.get("/performances");
      return data;
    },
  });

  // Query pour les engins (actifs seulement)
  const enginsQuery = useQuery({
    queryKey: ["engins"],
    queryFn: async (): Promise<Engin[]> => {
      const { data } = await apiRequest.get("/engins?activeOnly=true");
      return data;
    },
  });

  // Query pour les sites
  const sitesQuery = useQuery({
    queryKey: ["sites"],
    queryFn: async (): Promise<Site[]> => {
      const { data } = await apiRequest.get("/sites");
      return data;
    },
  });

  // Query pour les pannes (non clôturées seulement)
  const pannesQuery = useQuery({
    queryKey: ["pannes"],
    queryFn: async (): Promise<Panne[]> => {
      const { data } = await apiRequest.get("/pannes?nonClotureesOnly=true");
      return data;
    },
  });

  // Query pour les lubrifiants
  const lubrifiantsQuery = useQuery({
    queryKey: ["lubrifiants"],
    queryFn: async (): Promise<Lubrifiant[]> => {
      const { data } = await apiRequest.get("/lubrifiants");
      return data;
    },
  });

  // Query pour les types de consommation
  const typesConsommationQuery = useQuery({
    queryKey: ["types-consommation"],
    queryFn: async (): Promise<TypeConsommationLub[]> => {
      const { data } = await apiRequest.get("/types-consommation");
      return data;
    },
  });

  // Mutation pour créer une saisie de performance
  const createPerformance = useMutation({
    mutationFn: async (
      data: SaisiePerformanceFormData
    ): Promise<SaisiePerformance> => {
      const response = await apiRequest.post("/performances", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  // Mutation pour mettre à jour une saisie de performance
  const updatePerformance = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SaisiePerformanceFormData;
    }): Promise<SaisiePerformance> => {
      const response = await apiRequest.put(`/performances/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  // Mutation pour supprimer une saisie de performance
  const deletePerformance = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiRequest.delete(`/performances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  // Query pour les statistiques
  const statistiquesQuery = useQuery({
    queryKey: ["statistiques"],
    queryFn: async () => {
      const { data } = await apiRequest.get("/performances/statistiques");
      return data;
    },
  });

  const createHim = useMutation({
    mutationFn: async (data: SaisieHimFormData): Promise<SaisieHim> => {
      const response = await apiRequest.post("/hims", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  const updateHim = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SaisieHimFormData;
    }): Promise<SaisieHim> => {
      const response = await apiRequest.put(`/hims/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  const createLubrifiant = useMutation({
    mutationFn: async (
      data: SaisieLubrifiantFormData
    ): Promise<SaisieLubrifiant> => {
      const response = await apiRequest.post("/lubrifiants-saisie", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  const updateLubrifiant = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SaisieLubrifiantFormData;
    }): Promise<SaisieLubrifiant> => {
      const response = await apiRequest.put(`/lubrifiants-saisie/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performances"] });
    },
  });

  return {
    performancesQuery,
    enginsQuery,
    sitesQuery,
    pannesQuery,
    lubrifiantsQuery,
    typesConsommationQuery,
    statistiquesQuery,
    createPerformance,
    updatePerformance,
    deletePerformance,
    createHim,
    updateHim,
    createLubrifiant,
    updateLubrifiant,
  };
};
