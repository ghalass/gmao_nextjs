// app/(main)/saisies/page.tsx
"use client";

import { ExcelImporter } from "@/components/importations/excel-importer";
import { useUser } from "@/context/UserContext";
import { useImport } from "@/hooks/useImport";

export default function SaisiePage() {
  const importMutation = useImport();
  const { user } = useUser();
  return (
    <div className="container mx-auto py-6">
      <ExcelImporter
        importMutation={importMutation}
        user={user}
        allowedRoles={["admin", "super admin"]}
        title="Saisie des performances depuis un fichier Excel"
        description="Importez des données depuis un fichier Excel vers la base de données"
        submitButtonText="Injecter les données"
        permissionMessage="Vous n'êtes pas autorisé à effectuer des importations"
      />
    </div>
  );
}
