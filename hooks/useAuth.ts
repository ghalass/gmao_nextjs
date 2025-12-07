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
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw Error(data?.error);
    } else {
      await refreshUser();
      return true;
    }
  };

  // 🔹 REGISTER
  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw Error(data?.error);
    } else {
      await refreshUser();
      return true;
    }
  };

  // 🔹 LOGOUT
  const logout = async () => {
    try {
      // Logout côté serveur
      const res = await fetch(`${API}/auth/logout`, { method: "POST" });
      if (!res.ok) toast.error("Impossible de se déconnecter");
      await refreshUser();
      router.push("/login");
      toast.success("Déconnecté avec succès !");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la déconnexion");
    }
  };

  return { logout, login, register };
}
