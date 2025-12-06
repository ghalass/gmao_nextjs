// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, User, Shield, Save, Edit3, Key } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUsers } from "@/hooks/useUsers";

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utilisation correcte du hook useUsers
  const { updateProfile, changePassword } = useUsers();

  // Récupérer les données de l'utilisateur
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery<UserData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Mettre à jour formData quand les données utilisateur sont chargées
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setError(null);

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        email: formData.email,
      });

      setIsEditing(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du profil"
      );
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setError(null);

    try {
      await changePassword.mutateAsync({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Réinitialiser les champs de mot de passe
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement de mot de passe"
      );
    }
  };

  // Gérer les cas où name est undefined, null ou vide
  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== "string") {
      return "U"; // Initiales par défaut
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return "U";
    }

    return trimmedName
      .split(" ")
      .map((part) => part[0] || "")
      .filter((initial) => initial) // Filtrer les chaînes vides
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (userLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-64">
          <Alert variant="destructive">
            <AlertDescription>
              Erreur lors du chargement du profil
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-64">
          <p>Veuillez vous connecter pour voir votre profil.</p>
        </div>
      </div>
    );
  }

  const isSaving = updateProfile.isPending;
  const isChangingPassword = changePassword.isPending;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Modifier le profil
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {updateProfile.isSuccess && (
        <Alert>
          <AlertDescription>Profil mis à jour avec succès</AlertDescription>
        </Alert>
      )}

      {changePassword.isSuccess && (
        <Alert>
          <AlertDescription>Mot de passe changé avec succès</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de compte
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {user?.name || "Nom non défini"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Membre depuis{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                      : "Date inconnue"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!isEditing || isSaving}
                    placeholder="Votre nom complet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={true}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changement de mot de passe */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe de connexion
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  placeholder="••••••••"
                  disabled={isChangingPassword}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    placeholder="••••••••"
                    disabled={isChangingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="••••••••"
                    disabled={isChangingPassword}
                  />
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !formData.currentPassword ||
                  !formData.newPassword ||
                  !formData.confirmPassword
                }
                className="flex items-center gap-2"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Rôles et permissions */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Rôles et permissions</CardTitle>
                <CardDescription>
                  {"Vos accès dans l'application"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Rôles attribués</Label>
                <div className="flex flex-wrap gap-1">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((roleObj: UserRole, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="capitalize"
                      >
                        {roleObj.role?.name || roleObj.roleId || "Unknown role"}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">Aucun rôle</Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  {user?.roles?.map((roleObj: UserRole, key) => (
                    <div key={key}>
                      • {roleObj.role?.description || "Unknown permission"}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
