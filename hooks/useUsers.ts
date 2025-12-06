// hooks/useUsers.ts
"use client";

import { API } from "@/lib/constantes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Interface User cohérente avec votre schéma
export interface User {
  createdAt: string | number | Date;
  roles: any;
  id: string;
  email: string;
  name: string;
  // Ajoutez d'autres champs si nécessaire
}

export interface userCreateDto {
  email: string;
  name: string;
  password: string;
  role: string;
}

// =======================================================
// ✅ HOOK PRINCIPAL
// =======================================================
export function useUsers() {
  const queryClient = useQueryClient();

  // 🔹 FETCH USERS
  const usersQuery = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch(`${API}/users`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs");
      }
      return response.json();
    },
  });

  // 🔹 CREATE USER
  const createUser = useMutation<User, Error, userCreateDto>({
    mutationFn: async ({ email, name, password, role }) => {
      const response = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la création d'un utilisateur"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // 🔹 UPDATE USER
  const updateUser = useMutation<
    User,
    Error,
    {
      id: string;
      email: string;
      name: string;
      password: string;
      role: string[];
    }
  >({
    mutationFn: async ({ id, email, name, password, role }) => {
      const response = await fetch(`${API}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la modification d'un utilisateur"
        );
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur modifié !");
      return response.json();
    },
    onError: (error: any) => {
      // Ne pas afficher de toast si c'est une erreur de validation
      if (error.status !== 400 && error.status !== 409) {
        toast.error(error.message);
      }
    },
  });

  // 🔹 DELETE USER
  const deleteUser = useMutation<User, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const response = await fetch(`${API}/users/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la suppression d'un utilisateur"
        );
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur supprimé !");
      return response.json();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateProfile = useMutation<
    User,
    Error,
    {
      name: string;
      email: string;
      password?: string;
    }
  >({
    mutationFn: async ({ name, email, password }) => {
      const response = await fetch(`${API}/auth/profile`, {
        // Endpoint profil
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors de la mise à jour du profil"
        );
      }

      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profil mis à jour !");
      return response.json();
    },
    onError: (error: any) => {
      if (error.status !== 400 && error.status !== 409) {
        toast.error(error.message);
      }
    },
  });

  const changePassword = useMutation<
    User,
    Error,
    {
      currentPassword: string;
      newPassword: string;
    }
  >({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const response = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Erreur lors du changement de mot de passe"
        );
      }

      toast.success("Mot de passe modifié avec succès !");
      return response.json();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    usersQuery,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword,
  };
}
