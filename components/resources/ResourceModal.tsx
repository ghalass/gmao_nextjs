"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import {
  ResourceFormData,
  resourceSchema,
} from "@/lib/validations/resourceSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Resource } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResourceModalProps {
  open: boolean;
  onClose: () => void;
  resource?: Resource | null;
  onSubmit: (data: ResourceFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

interface TableInfo {
  table_name: string;
}

export function ResourceModal({
  open,
  onClose,
  resource,
  onSubmit,
  isSubmitting,
  error,
}: ResourceModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Charger la liste des tables quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      fetchTables();
    }
  }, [open]);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const response = await fetch("/api/tables");
      const data = await response.json();

      if (response.ok) {
        setTables(data.tables || []);
      } else {
        setLocalError("Erreur lors du chargement des tables");
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      setLocalError("Impossible de charger la liste des tables");
    } finally {
      setLoadingTables(false);
    }
  };

  const formik = useFormik<ResourceFormData>({
    initialValues: {
      name: resource?.name || "",
      label: resource?.label || "",
    },
    validationSchema: resourceSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLocalError(null);
        await onSubmit(values);
        if (!resource) {
          resetForm();
        }
        onClose();
      } catch (error) {
        // L'erreur est gérée par le parent
      }
    },
    enableReinitialize: true,
  });

  // Réinitialiser le formulaire quand le modal s'ouvre/ferme
  useEffect(() => {
    if (open) {
      formik.resetForm();
      setLocalError(null);
    }
  }, [open, resource]);

  const displayError = error || localError;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {resource
              ? "Modifier la ressource"
              : "Créer une nouvelle ressource"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom technique *</Label>
            {loadingTables ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Chargement des tables...
                </span>
              </div>
            ) : (
              <Select
                value={formik.values.name}
                onValueChange={(value) => formik.setFieldValue("name", value)}
                disabled={isSubmitting || !!resource} // Désactivé en mode édition
              >
                <SelectTrigger
                  className={
                    formik.touched.name && formik.errors.name
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue
                    className="w-full"
                    placeholder="Sélectionnez une table"
                  />
                </SelectTrigger>
                <SelectContent>
                  {tables.length === 0 ? (
                    <SelectItem value="no-tables" disabled>
                      Aucune table disponible
                    </SelectItem>
                  ) : (
                    tables.map((tableName) => (
                      <SelectItem key={tableName} value={tableName}>
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          {tableName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {formik.touched.name && formik.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.name}
              </p>
            )}
            {!resource && tables.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez une table de la base de données
              </p>
            )}
            {resource && (
              <p className="text-xs text-muted-foreground mt-1">
                Le nom technique ne peut pas être modifié après la création
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Libellé *</Label>
            <Input
              id="label"
              name="label"
              type="text"
              value={formik.values.label}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting}
              className={
                formik.touched.label && formik.errors.label
                  ? "border-destructive"
                  : ""
              }
              placeholder="ex: Utilisateurs"
            />
            {formik.touched.label && formik.errors.label && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.label}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formik.isValid || loadingTables}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {resource ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
