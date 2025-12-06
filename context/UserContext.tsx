"use client";

import { API } from "@/lib/constantes";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type UserRole = {
  role: {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
  };
} & {
  id: string;
  createdAt: Date;
  userId: string;
  roleId: string;
};

type User = {
  roles: UserRole[];
  name: string;
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
} | null; // Utilisez null au lieu d'un objet vide

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null); // Initialisez avec null

  async function refreshUser() {
    try {
      const res = await fetch(`${API}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
