"use client";

import { ExcelImporter } from "@/components/importations/excel-importer";
import UnderConstruction from "@/components/UnderConstruction";
import { useUser } from "@/context/UserContext";
import { useImport } from "@/hooks/useImport";
import React from "react";

export default function OrganesPage() {
  const importMutation = useImport();
  const { user } = useUser();
  return (
    <div className="container mx-auto py-6">
      <ExcelImporter
        importMutation={importMutation}
        user={user}
        allowedRoles={["admin", "super admin"]}
        title="Gestion et saisie des mouvements depuis un fichier Excel"
        description="Importez des données depuis un fichier Excel vers la base de données"
        submitButtonText="Injecter les données"
        permissionMessage="Vous n'êtes pas autorisé à effectuer des importations"
      />
    </div>
  );
}
