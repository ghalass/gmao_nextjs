// components/typepannes/TypepanneModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Typepanne, TypepanneFormData } from "@/hooks/useTypepannes";
import yup from "@/lib/yupFr";

const validationSchema = yup.object({
  name: Yup.string()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  description: Yup.string().max(
    500,
    "La description ne peut pas dépasser 500 caractères"
  ),
});

interface TypepanneModalProps {
  open: boolean;
  onClose: () => void;
  typepanne: Typepanne | null;
  createTypepanne: any;
  updateTypepanne: any;
}

export function TypepanneModal({
  open,
  onClose,
  typepanne,
  createTypepanne,
  updateTypepanne,
}: TypepanneModalProps) {
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(typepanne);

  const formik = useFormik<TypepanneFormData>({
    initialValues: {
      name: "",
      description: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        if (isEditing) {
          await updateTypepanne.mutateAsync({
            id: typepanne!.id,
            data: values,
          });
        } else {
          await createTypepanne.mutateAsync(values);
        }
        onClose();
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
      }
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (typepanne) {
        formik.setValues({
          name: typepanne.name,
          description: typepanne.description || "",
        });
      } else {
        formik.resetForm();
      }
    }
  }, [open, typepanne]);

  const isLoading = createTypepanne.isPending || updateTypepanne.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le type de panne" : "Nouveau type de panne"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du type de panne."
              : "Ajoutez un nouveau type de panne pour catégoriser les anomalies."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Mécanique, Hydraulique, Pneumatique..."
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.name && formik.errors.name
                  ? "border-destructive"
                  : ""
              }
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-sm text-destructive">{formik.errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Description du type de panne (optionnel)"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows={3}
              className={
                formik.touched.description && formik.errors.description
                  ? "border-destructive"
                  : ""
              }
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-sm text-destructive">
                {formik.errors.description}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
