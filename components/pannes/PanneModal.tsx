// components/pannes/PanneModal.tsx - Version simplifiée
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useFormik } from "formik";
import * as yup from "yup";
import { Panne, Typepanne } from "@/lib/types";

// Schéma de validation
const validationSchema = yup.object({
  name: yup
    .string()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  typepanneId: yup.string().required("Le type de panne est obligatoire"),
});

interface PanneModalProps {
  open: boolean;
  onClose: () => void;
  panne: Panne | null;
  typesPanne: Typepanne[];
  createPanne: any;
  updatePanne: any;
}

export function PanneModal({
  open,
  onClose,
  panne,
  typesPanne,
  createPanne,
  updatePanne,
}: PanneModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: panne?.name || "",
      typepanneId: panne?.typepanneId || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);

        if (panne) {
          await updatePanne.mutateAsync({
            id: panne.id,
            data: values,
          });
        } else {
          await createPanne.mutateAsync(values);
        }

        onClose();
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Une erreur est survenue"
        );
      }
    },
  });

  useEffect(() => {
    if (open && panne) {
      formik.setValues({
        name: panne.name || "",
        typepanneId: panne.typepanneId || "",
      });
    } else if (open && !panne) {
      formik.resetForm();
    }
  }, [open, panne]);

  const isLoading = createPanne.isPending || updatePanne.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {panne ? "Modifier la panne" : "Nouvelle panne"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la panne *</Label>
            <Input
              id="name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ex: Rupture de courroie"
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-sm text-destructive">
                {formik.errors.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="typepanneId">Type de panne *</Label>
            <Select
              value={formik.values.typepanneId}
              onValueChange={(value) =>
                formik.setFieldValue("typepanneId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typesPanne.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.typepanneId && formik.errors.typepanneId && (
              <div className="text-sm text-destructive">
                {formik.errors.typepanneId}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {panne ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
