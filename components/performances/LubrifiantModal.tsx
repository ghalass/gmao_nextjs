// components/performances/LubrifiantModal.tsx
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
import { saisieLubrifiantSchema } from "@/lib/validations/performanceSchema";
import {
  SaisieLubrifiant,
  SaisieLubrifiantFormData,
  Lubrifiant,
  TypeConsommationLub,
} from "@/lib/types/performance";

interface LubrifiantModalProps {
  open: boolean;
  onClose: () => void;
  lubrifiant?: SaisieLubrifiant | null;
  lubrifiants: Lubrifiant[];
  typesConsommation: TypeConsommationLub[];
  saisiehimId: string;
  createLubrifiant: (data: SaisieLubrifiantFormData) => Promise<void>;
  updateLubrifiant: (data: {
    id: string;
    data: SaisieLubrifiantFormData;
  }) => Promise<void>;
}

export function LubrifiantModal({
  open,
  onClose,
  lubrifiant,
  lubrifiants,
  typesConsommation,
  saisiehimId,
  createLubrifiant,
  updateLubrifiant,
}: LubrifiantModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      lubrifiantId: lubrifiant?.lubrifiantId || "",
      qte: lubrifiant?.qte || 0,
      obs: lubrifiant?.obs || "",
      saisiehimId: lubrifiant?.saisiehimId || saisiehimId,
      typeconsommationlubId: lubrifiant?.typeconsommationlubId || "",
    },
    validationSchema: saisieLubrifiantSchema,
    onSubmit: async (values) => {
      try {
        setError(null);

        if (lubrifiant) {
          await updateLubrifiant({ id: lubrifiant.id, data: values });
        } else {
          await createLubrifiant(values);
        }

        onClose();
      } catch (err: any) {
        setError(err.response?.data?.message || "Une erreur est survenue");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lubrifiant
              ? "Modifier la consommation de lubrifiant"
              : "Nouvelle consommation de lubrifiant"}
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
            <Label>Lubrifiant *</Label>
            <Select
              value={formik.values.lubrifiantId}
              onValueChange={(value) =>
                formik.setFieldValue("lubrifiantId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un lubrifiant" />
              </SelectTrigger>
              <SelectContent>
                {lubrifiants.map((lubrifiant) => (
                  <SelectItem key={lubrifiant.id} value={lubrifiant.id}>
                    {lubrifiant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.lubrifiantId && formik.errors.lubrifiantId && (
              <div className="text-sm text-destructive">
                {formik.errors.lubrifiantId}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quantité *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formik.values.qte}
              onChange={(e) =>
                formik.setFieldValue("qte", parseFloat(e.target.value))
              }
            />
            {formik.touched.qte && formik.errors.qte && (
              <div className="text-sm text-destructive">
                {formik.errors.qte}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type de consommation</Label>
            <Select
              value={formik.values.typeconsommationlubId || ""}
              onValueChange={(value) =>
                formik.setFieldValue("typeconsommationlubId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de consommation" />
              </SelectTrigger>
              <SelectContent>
                {typesConsommation.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observations</Label>
            <Input
              value={formik.values.obs}
              onChange={(e) => formik.setFieldValue("obs", e.target.value)}
              placeholder="Observations sur la consommation..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting
                ? "Enregistrement..."
                : lubrifiant
                ? "Modifier"
                : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
