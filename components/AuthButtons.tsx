// components/AuthButtons.tsx - Version corrigée

"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import LogoutButton from "./LogoutButton";

export default function AuthButtons() {
  const { user } = useUser();

  // Si user est null, afficher les boutons de connexion
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md"
        >
          Connexion
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md shadow-sm"
        >
          {"S'inscrire"}
        </Link>
      </div>
    );
  }

  // Vérification sécurisée pour les roles
  // Selon votre nouveau schéma, user.roles est un tableau direct de Role
  // OU selon l'API register/login, user.roleNames est un tableau de noms de rôles
  const userRoles = user.roles || [];
  const roleNames = user.roleNames || []; // Nouvelles propriétés de l'API

  // Extraire les noms de rôles selon la structure
  let displayRoleNames: string;

  if (roleNames.length > 0) {
    // Utiliser user.roleNames si disponible (nouvelle API)
    displayRoleNames = roleNames.join(", ");
  } else if (userRoles.length > 0 && userRoles[0].name) {
    // Si user.roles existe et a des objets avec .name (structure directe)
    displayRoleNames = userRoles.map((r: any) => r.name).join(", ");
  } else if (userRoles.length > 0 && userRoles[0].role?.name) {
    // Ancienne structure imbriquée (compatibilité)
    displayRoleNames = userRoles.map((r: any) => r.role?.name).join(", ");
  } else {
    displayRoleNames = "";
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors duration-200 group">
            <div className="w-8 h-8 bg-linear-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user.name?.charAt(0).toUpperCase() || (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-foreground">
                {user.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {displayRoleNames ? (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {displayRoleNames}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Aucun rôle</span>
                )}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {displayRoleNames || "Aucun rôle"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="cursor-pointer flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Mon profil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            asChild
            className="text-destructive focus:text-destructive"
          >
            <div className="cursor-pointer flex items-center gap-2">
              <LogoutButton />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
