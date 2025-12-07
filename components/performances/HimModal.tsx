// components/performances/HimModal.tsx
"use client";

import { useState } from "react";
import { useFormik } from "formik";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { saisieHimSchema } from "@/lib/validations/performanceSchema";
import {
  SaisieHim,
  SaisieHimFormData,
  Panne,
  Engin,
} from "@/lib/types/performance";

interface HimModalProps {
  open: boolean;
  onClose: () => void;
  him?: SaisieHim | null;
  pannes: Panne[];
  engins: Engin[];
  saisiehrmId: string;
  createHim: (data: SaisieHimFormData) => Promise<SaisieHim>;
  updateHim: (data: {
    id: string;
    data: SaisieHimFormData;
  }) => Promise<SaisieHim>;
  onAddLubrifiant?: (himId: string) => void;
}

export function HimModal({
  open,
  onClose,
  him,
  pannes,
  engins,
  saisiehrmId,
  createHim,
  updateHim,
  onAddLubrifiant,
}: HimModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      panneId: him?.panneId || "",
      him: him?.him || 0,
      ni: him?.ni || 0,
      obs: him?.obs || "",
      saisiehrmId: him?.saisiehrmId || saisiehrmId,
      enginId: him?.enginId || "",
    },
    validationSchema: saisieHimSchema,
    onSubmit: async (values) => {
      try {
        setError(null);

        if (him) {
          await updateHim({ id: him.id, data: values });
        } else {
          await createHim(values);
        }

        onClose();
      } catch (err: any) {
        setError(err.response?.data?.message || "Une erreur est survenue");
      }
    },
  });

  const handleSaveAndAddLubrifiant = async () => {
    try {
      setError(null);
      let himId = him?.id;

      if (!him) {
        // Créer d'abord la saisie HIM
        const newHim = await createHim(formik.values);
        himId = newHim.id;
      } else {
        await updateHim({ id: him.id, data: formik.values });
      }

      if (himId && onAddLubrifiant) {
        onAddLubrifiant(himId);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Une erreur est survenue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {him ? "Modifier la saisie HIM" : "Nouvelle saisie HIM"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Engin</Label>
              <Select
                value={formik.values.enginId}
                onValueChange={(value) =>
                  formik.setFieldValue("enginId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un engin" />
                </SelectTrigger>
                <SelectContent>
                  {engins.map((engin) => (
                    <SelectItem key={engin.id} value={engin.id}>
                      {engin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Panne *</Label>
              <Select
                value={formik.values.panneId}
                onValueChange={(value) =>
                  formik.setFieldValue("panneId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une panne" />
                </SelectTrigger>
                <SelectContent>
                  {pannes.map((panne) => (
                    <SelectItem key={panne.id} value={panne.id}>
                      {panne.name}{" "}
                      {/* Utilisez panne.name au lieu de panne.code/description */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formik.touched.panneId && formik.errors.panneId && (
                <div className="text-sm text-destructive">
                  {formik.errors.panneId}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>HIM *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formik.values.him}
                onChange={(e) =>
                  formik.setFieldValue("him", parseFloat(e.target.value))
                }
              />
              {formik.touched.him && formik.errors.him && (
                <div className="text-sm text-destructive">
                  {formik.errors.him}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>NI *</Label>
              <Input
                type="number"
                min="0"
                value={formik.values.ni}
                onChange={(e) =>
                  formik.setFieldValue("ni", parseInt(e.target.value))
                }
              />
              {formik.touched.ni && formik.errors.ni && (
                <div className="text-sm text-destructive">
                  {formik.errors.ni}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observations</Label>
            <Input
              value={formik.values.obs}
              onChange={(e) => formik.setFieldValue("obs", e.target.value)}
              placeholder="Observations sur la panne..."
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              {!him && onAddLubrifiant && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAndAddLubrifiant}
                  disabled={formik.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer et ajouter des lubrifiants
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={formik.isSubmitting}>
                {formik.isSubmitting
                  ? "Enregistrement..."
                  : him
                  ? "Modifier"
                  : "Enregistrer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
