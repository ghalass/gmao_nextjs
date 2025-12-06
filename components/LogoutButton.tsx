"use client";

import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout} className="cursor-pointer flex items-center gap-2">
      <LogOut className="w-4 h-4 text-destructive" /> Déconnexion
    </button>
  );
}
