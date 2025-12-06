// lib/axios.ts
import axios from "axios";

// Configuration de base pour axios
export const apiRequest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour les requêtes
apiRequest.interceptors.request.use(
  (config) => {
    // Vous pouvez ajouter des headers d'authentification ici si nécessaire
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
apiRequest.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Gestion centralisée des erreurs
    if (error.response?.status === 401) {
      // Rediriger vers la page de login si non authentifié
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Gérer les erreurs de permission
      console.error("Permission denied");
    } else if (error.response?.status === 404) {
      console.error("Resource not found");
    } else if (error.response?.status >= 500) {
      console.error("Server error");
    }

    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour les requêtes courantes
export const api = {
  get: (url: string, params?: any) => apiRequest.get(url, { params }),
  post: (url: string, data?: any) => apiRequest.post(url, data),
  put: (url: string, data?: any) => apiRequest.put(url, data),
  patch: (url: string, data?: any) => apiRequest.patch(url, data),
  delete: (url: string) => apiRequest.delete(url),
};
