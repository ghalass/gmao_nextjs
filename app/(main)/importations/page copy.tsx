// app/importations/page.tsx
"use client";

import React, { useState } from "react";
import { ExcelImporter } from "@/components/importations/excel-importer";
import { useImport } from "@/hooks/useImport";
import { useUser } from "@/context/UserContext";

export default function ImportPage() {
  const importMutation = useImport();
  const { user } = useUser();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isProcessingSheet, setIsProcessingSheet] = useState(false);

  const handleProcessRow = async ({
    sheetName,
    rowData,
  }: {
    sheetName: string;
    rowData: Record<string, any>;
    rowIndex: number;
  }) => {
    return await importMutation.mutateAsync({
      sheetName,
      data: rowData,
    });
  };

  // Fonction pour gérer le chargement du fichier
  const handleFileUploadStart = () => {
    setIsProcessingFile(true);
  };

  const handleFileUploadEnd = () => {
    setIsProcessingFile(false);
  };

  // Fonction pour gérer le chargement de l'onglet
  const handleSheetLoadStart = () => {
    setIsProcessingSheet(true);
  };

  const handleSheetLoadEnd = () => {
    setIsProcessingSheet(false);
  };

  const isAdminOrSuperAdmin =
    user?.roleNames?.includes("admin") ||
    user?.roleNames?.includes("super admin");

  return (
    <div className="container mx-auto">
      <ExcelImporter
        onProcessRow={handleProcessRow}
        title="Importation de données Excel"
        description="Importez des données depuis un fichier Excel vers la base de données"
        submitButtonText="Injecter"
        disabled={!isAdminOrSuperAdmin}
        disabledMessage="Vous n'êtes pas autorisé à faire les importations"
        // Ajout des props pour les indicateurs de chargement
        additionalActions={
          <div className="flex flex-col gap-2">
            {/* Indicateur de chargement du fichier */}
            {isProcessingFile && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>Chargement du fichier...</span>
              </div>
            )}

            {/* Indicateur de chargement de l'onglet */}
            {isProcessingSheet && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>Chargement des données de l'onglet...</span>
              </div>
            )}
          </div>
        }
        // Props pour les callbacks de chargement
        onFileUploadStart={handleFileUploadStart}
        onFileUploadEnd={handleFileUploadEnd}
        onSheetLoadStart={handleSheetLoadStart}
        onSheetLoadEnd={handleSheetLoadEnd}
      />
    </div>
  );
}
