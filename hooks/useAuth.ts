import { useUser } from "@/context/UserContext";
import { API } from "@/lib/constantes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const { refreshUser } = useUser();
  const router = useRouter();

  // Fonction pour extraire le message d'erreur de la réponse
  const extractErrorMessage = (data: any): string => {
    if (typeof data?.error === "string") {
      return data.error;
    } else if (data?.details && Array.isArray(data.details)) {
      // Si c'est une erreur de validation avec des détails
      return data.details.join(", ");
    } else if (data?.message) {
      return data.message;
    }
    return "Une erreur est survenue";
  };

  // 🔹 LOGIN USER
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(extractErrorMessage(data));
    } else {
      await refreshUser();
      // toast.success("Connexion réussie !");
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
      // Extraire le message d'erreur correctement
      const errorMessage = extractErrorMessage(data);
      throw new Error(errorMessage);
    } else {
      // await refreshUser();
      // toast.success("Inscription réussie !");
      return true;
    }
  };

  // 🔹 LOGOUT
  const logout = async () => {
    try {
      const res = await fetch(`${API}/auth/logout`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(extractErrorMessage(data));
      }

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
