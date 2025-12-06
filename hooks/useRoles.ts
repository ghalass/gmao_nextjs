// hooks/useRoles.ts
"use client";

import { API } from "@/lib/constantes";
import { Role, roleCreateDto } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Types pour les opérations de mise à jour
interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

interface UpdateRoleVariables {
  id: string;
  data: UpdateRoleData;
}

interface DeleteRoleVariables {
  id: string;
}

export function useRoles() {
  const queryClient = useQueryClient();

  // 🔹 FETCH ROLES
  const rolesQuery = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async (): Promise<Role[]> => {
      const response = await fetch(`${API}/roles`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors du chargement des roles");
      }
      return data;
    },
  });

  // 🔹 CREATE ROLE
  const createRole = useMutation<Role, Error, roleCreateDto>({
    mutationFn: async (roleData): Promise<Role> => {
      try {
        // Validation des données avant envoi
        if (!roleData.name || typeof roleData.name !== "string") {
          throw new Error(
            "Le nom du rôle est requis et doit être une chaîne de caractères"
          );
        }

        if (!roleData.permissions || !Array.isArray(roleData.permissions)) {
          throw new Error("Les permissions doivent être un tableau");
        }

        const validPermissions = roleData.permissions.filter(
          (permission): permission is string =>
            typeof permission === "string" && permission.length > 0
        );

        if (validPermissions.length === 0) {
          throw new Error("Au moins une permission valide est requise");
        }

        const payload = {
          name: roleData.name.trim(),
          description: roleData.description?.trim() || undefined,
          permissions: validPermissions,
        };

        const response = await fetch(`${API}/roles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const res = await response.json();
        if (!response.ok) {
          throw new Error(res.message || "Erreur lors de la création du rôle");
        }
        return res;
      } catch (error) {
        console.error("Erreur dans createRole:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalider et refetch les rôles après création réussie
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: Error) => {
      console.error("Erreur de création de rôle:", error);
      toast.error(error.message || "Erreur lors de la création du rôle");
    },
  });

  // 🔹 UPDATE ROLE
  const updateRole = useMutation<Role, Error, UpdateRoleVariables>({
    mutationFn: async ({ id, data }): Promise<Role> => {
      try {
        // Validation de l'ID
        if (!id || typeof id !== "string") {
          throw new Error("ID de rôle invalide");
        }

        // Préparer les données de mise à jour
        const updateData: UpdateRoleData = {};

        if (data.name !== undefined) {
          if (typeof data.name !== "string" || data.name.trim().length === 0) {
            throw new Error("Le nom du rôle doit être une chaîne non vide");
          }
          updateData.name = data.name.trim();
        }

        if (data.description !== undefined) {
          updateData.description =
            typeof data.description === "string"
              ? data.description.trim() || undefined
              : undefined;
        }

        if (data.permissions !== undefined) {
          if (!Array.isArray(data.permissions)) {
            throw new Error("Les permissions doivent être un tableau");
          }

          const validPermissions = data.permissions.filter(
            (permission): permission is string =>
              typeof permission === "string" && permission.length > 0
          );

          if (validPermissions.length === 0) {
            throw new Error("Au moins une permission valide est requise");
          }

          updateData.permissions = validPermissions;
        }

        console.log("🔹 Mise à jour du rôle:", { id, data: updateData });

        const response = await fetch(`${API}/roles/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        const res = await response.json();
        if (!response.ok) {
          throw new Error(
            res.message || "Erreur lors de la modification du rôle"
          );
        }
        return res;
      } catch (error) {
        console.error("Erreur dans updateRole:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: Error) => {
      console.error("Erreur de mise à jour de rôle:", error);
      toast.error(error.message || "Erreur lors de la modification du rôle");
    },
  });

  // 🔹 DELETE ROLE
  const deleteRole = useMutation<Role, Error, DeleteRoleVariables>({
    mutationFn: async ({ id }): Promise<Role> => {
      try {
        // Validation de l'ID
        if (!id || typeof id !== "string") {
          throw new Error("ID de rôle invalide");
        }

        const response = await fetch(`${API}/roles/${id}`, {
          method: "DELETE",
        });

        const res = await response.json();
        if (!response.ok) {
          throw new Error(
            res.message || "Erreur lors de la suppression du rôle"
          );
        }
        return res;
      } catch (error) {
        console.error("Erreur dans deleteRole:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: Error) => {
      console.error("Erreur de suppression de rôle:", error);
      // 🔥 ICI : Le toast affichera automatiquement le message d'erreur du backend
      toast.error(error.message || "Erreur lors de la suppression du rôle");
    },
  });

  return {
    rolesQuery,
    createRole,
    updateRole,
    deleteRole,
  };
}

// 🔹 GET ROLE BY ID
export const useRole = (id: string | undefined) => {
  return useQuery<Role, Error>({
    queryKey: ["roles", id],
    queryFn: async (): Promise<Role> => {
      if (!id) {
        throw new Error("ID de rôle non fourni");
      }

      const response = await fetch(`${API}/roles/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Erreur ${response.status} lors du chargement du rôle`
        );
      }

      return response.json();
    },
    enabled: !!id && typeof id === "string",
    retry: (failureCount, error) => {
      // Ne pas retry sur les erreurs 404
      if (error.message.includes("404")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
