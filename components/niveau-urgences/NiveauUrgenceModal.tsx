// components/niveau-urgences/NiveauUrgenceModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Palette } from "lucide-react";
import {
  NiveauUrgence,
  NiveauUrgenceFormData,
} from "@/hooks/useNiveauUrgences";
import yup from "@/lib/yupFr";

const validationSchema = yup.object({
  name: yup
    .string()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  description: yup
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  level: yup
    .number()
    .required("Le niveau est obligatoire")
    .min(1, "Le niveau doit être au moins 1")
    .max(5, "Le niveau ne peut pas dépasser 5")
    .integer("Le niveau doit être un nombre entier"),
  color: yup
    .string()
    .matches(
      /^#[0-9A-F]{6}$/i,
      "La couleur doit être au format hexadécimal (#FF0000)"
    ),
});

const levelOptions = [
  { value: 1, label: "1 - Très basse" },
  { value: 2, label: "2 - Basse" },
  { value: 3, label: "3 - Moyenne" },
  { value: 4, label: "4 - Haute" },
  { value: 5, label: "5 - Critique" },
];

const colorOptions = [
  { value: "#10B981", label: "Vert", level: "Basse" },
  { value: "#F59E0B", label: "Jaune", level: "Moyenne" },
  { value: "#EF4444", label: "Rouge", level: "Haute" },
  { value: "#7C3AED", label: "Violet", level: "Critique" },
  { value: "#000000", label: "Noir", level: "Extrême" },
];

interface NiveauUrgenceModalProps {
  open: boolean;
  onClose: () => void;
  niveauUrgence: NiveauUrgence | null;
  createNiveauUrgence: any;
  updateNiveauUrgence: any;
}

export function NiveauUrgenceModal({
  open,
  onClose,
  niveauUrgence,
  createNiveauUrgence,
  updateNiveauUrgence,
}: NiveauUrgenceModalProps) {
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(niveauUrgence);

  const formik = useFormik<NiveauUrgenceFormData>({
    initialValues: {
      name: "",
      description: "",
      level: 3,
      color: "#F59E0B",
    },
    validationSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        if (isEditing) {
          await updateNiveauUrgence.mutateAsync({
            id: niveauUrgence!.id,
            data: values,
          });
        } else {
          await createNiveauUrgence.mutateAsync(values);
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
      if (niveauUrgence) {
        formik.setValues({
          name: niveauUrgence.name,
          description: niveauUrgence.description || "",
          level: niveauUrgence.level,
          color: niveauUrgence.color || "#F59E0B",
        });
      } else {
        formik.resetForm();
      }
    }
  }, [open, niveauUrgence]);

  const isLoading =
    createNiveauUrgence.isPending || updateNiveauUrgence.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Modifier le niveau d'urgence"
              : "Nouveau niveau d'urgence"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du niveau d'urgence."
              : "Ajoutez un nouveau niveau d'urgence pour prioriser les interventions."}
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
              placeholder="Ex: Critique, Haute, Moyenne, Basse..."
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
            <Label htmlFor="level">Niveau *</Label>
            <Select
              value={formik.values.level.toString()}
              onValueChange={(value) =>
                formik.setFieldValue("level", parseInt(value))
              }
            >
              <SelectTrigger
                className={
                  formik.touched.level && formik.errors.level
                    ? "border-destructive"
                    : ""
                }
              >
                <SelectValue placeholder="Sélectionnez un niveau" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.level && formik.errors.level && (
              <p className="text-sm text-destructive">{formik.errors.level}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <div className="flex gap-2">
              <Select
                value={formik.values.color}
                onValueChange={(value) => formik.setFieldValue("color", value)}
              >
                <SelectTrigger className="flex-1">
                  <div className="flex items-center gap-2">
                    {formik.values.color && (
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: formik.values.color }}
                      />
                    )}
                    <SelectValue placeholder="Sélectionnez une couleur" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: option.value }}
                        />
                        <span>
                          {option.label} ({option.level})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Input
                  type="color"
                  value={formik.values.color}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-12 h-10 p-1"
                  name="color"
                />
                <Palette className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {formik.touched.color && formik.errors.color && (
              <p className="text-sm text-destructive">{formik.errors.color}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Description du niveau d'urgence (optionnel)"
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
