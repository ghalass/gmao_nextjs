import { useUser } from "@/context/UserContext";
import { API } from "@/lib/constantes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// =======================================================
// ✅ HOOK PRINCIPAL
// =======================================================
export function useAuth() {
  const { refreshUser } = useUser();
  const router = useRouter();

  // 🔹 LOGIN USER
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur d'inscription");
      } else {
        toast.success("Connecté avec succès");
        // Refresh le contexte utilisateur
        await refreshUser();
        router.push("/"); // redirection après inscription
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de l'inscription");
    }
  };

  // 🔹 REGISTER
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur d'inscription");
      } else {
        toast.success("Compte créé avec succès !!!!!");
        // Refresh le contexte utilisateur
        await refreshUser();
        router.push("/login"); // redirection après inscription
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de l'inscription");
    }
  };

  // 🔹 LOGOUT
  const logout = async () => {
    try {
      // Logout côté serveur
      const res = await fetch(`${API}/auth/logout`, { method: "POST" });
      if (!res.ok) toast.error("Impossible de se déconnecter");

      // Refresh le contexte utilisateur
      await refreshUser();

      // Redirection vers login
      router.push("/login");

      toast.success("Déconnecté avec succès !");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la déconnexion");
    }
  };

  return { logout, login, register };
}
