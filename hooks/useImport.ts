// app/hooks/useImport.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ImportData {
  sheetName: string;
  data: any;
}

interface ImportResult {
  success: boolean;
  message: string;
  data: any;
  summary?: {
    total: number;
    success: number;
    errors: number;
  };
}

const importData = async ({
  sheetName,
  data,
}: ImportData): Promise<ImportResult> => {
  const response = await fetch("/api/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sheetName, data }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'importation");
  }

  return response.json();
};

export const useImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importData,
    onSuccess: () => {
      // Rafraîchir les données si nécessaire
      queryClient.invalidateQueries({ queryKey: ["importList"] });
    },
  });
};
