// hooks/usePermissions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/constantes";
import { useAuthRoles } from "./useAuthRoles";

// Type pour les permissions avec la ressource comme objet
export type PermissionWithResource = {
  id: string;
  name: string;
  description?: string;
  action: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
  resource: {
    id: string;
    name: string;
    label: string;
    createdAt: string;
    updatedAt: string;
  };
};

export interface Permission {
  id: string;
  name: string;
  description?: string;
  action: string;
  resourceId: string;
  resource: {
    id: string;
    name: string;
    label: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionData {
  name: string;
  resourceId: string; // Changez de 'resource' à 'resourceId'
  action: string;
  description?: string;
}

export interface UpdatePermissionData {
  name?: string;
  resourceId?: string; // Changez de 'resource' à 'resourceId'
  action?: string;
  description?: string;
}

// Hook principal pour les permissions
export const usePermissions = () => {
  const queryClient = useQueryClient();

  // 🔹 FETCH PERMISSIONS
  const permissionsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: async (): Promise<Permission[]> => {
      const response = await fetch(`${API}/permissions`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors du chargement des permissions"
        );
      }
      return data;
    },
  });

  // 🔹 CREATE PERMISSION
  const createPermission = useMutation({
    mutationFn: async (data: {
      name: string;
      resourceId: string;
      action: string;
      description?: string;
    }) => {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await response.json();
      if (!response.ok) {
        throw new Error(
          res?.message || "Erreur lors de la création de la permission"
        );
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });

  // 🔹 UPDATE PERMISSION
  const updatePermission = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PermissionWithResource>;
    }) => {
      const response = await fetch(`/api/permissions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(
          res?.message || "Erreur lors de la modification de la permission!!"
        );
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });

  // 🔹 DELETE PERMISSION
  const deletePermission = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/permissions/${id}`, {
        method: "DELETE",
      });
      const res = await response.json();
      if (!response.ok) {
        throw new Error(
          res?.message || "Erreur lors de la suppression de la permission"
        );
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });

  return {
    permissionsQuery,
    createPermission,
    updatePermission,
    deletePermission,
  };
};

// Hook pour les permissions utilisateur (RBAC)
export const useUserPermissions = () => {
  return useQuery({
    queryKey: ["user-permissions"],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch(`${API}/auth/permissions`);
      if (!response.ok) {
        throw new Error(
          "Erreur lors du chargement des permissions utilisateur"
        );
      }
      const data = await response.json();
      return data.permissions || [];
    },
  });
};

// Fonction utilitaire pour vérifier les permissions
// Fonction utilitaire pour vérifier les permissions avec vérification admin
export const usePermissionCheck = () => {
  const { data: permissions = [], isLoading: permissionsLoading } =
    useUserPermissions();
  const { data: authRoles, isLoading: rolesLoading } = useAuthRoles();

  const hasPermission = (action: string, resource: string) => {
    // ✅ Accès automatique pour les administrateurs et super-administrateurs
    if (authRoles?.isAdminOrSuperAdmin) {
      return true;
    }

    // Vérification normale des permissions pour les autres utilisateurs
    return permissions.includes(`${action}:${resource}`);
  };

  const isLoading = permissionsLoading || rolesLoading;

  return {
    hasPermission,
    permissions,
    isLoading,
    isAdmin: authRoles?.isAdmin || false,
    isSuperAdmin: authRoles?.isSuperAdmin || false,
    isAdminOrSuperAdmin: authRoles?.isAdminOrSuperAdmin || false,
  };
};

// GET permission by ID
export const usePermission = (id: string) => {
  return useQuery({
    queryKey: ["permissions", id],
    queryFn: async (): Promise<Permission> => {
      const response = await fetch(`${API}/permissions/${id}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement de la permission");
      }
      return response.json();
    },
    enabled: !!id,
  });
};
