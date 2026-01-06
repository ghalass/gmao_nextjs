// components/type_lubrifiant/TypelubrifiantForm.tsx
"use client";

import { useFormik } from "formik";
import {
  typeLubrifiantSchema,
  type TypelubrifiantFormData,
} from "@/lib/validations/type_lubrifiantSchema";
import { type Typelubrifiant } from "@/hooks/useTypelubrifiant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface TypelubrifiantFormProps {
  initialData?: Typelubrifiant;
  onSubmit: (data: TypelubrifiantFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function TypelubrifiantForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: TypelubrifiantFormProps) {
  const formik = useFormik<TypelubrifiantFormData>({
    initialValues: {
      name: initialData?.name || "",
    },
    validationSchema: typeLubrifiantSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await onSubmit(values);
        if (!initialData?.id) {
          resetForm();
        }
      } catch (error) {
        // Les erreurs sont gérées par le parent
      }
    },
    enableReinitialize: true,
  });

  const handleCancel = () => {
    onCancel();
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom du type de lubrifiant *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={isSubmitting}
            className={
              formik.touched.name && formik.errors.name
                ? "border-destructive"
                : ""
            }
            placeholder="ex: Huile moteur, Graisse, etc."
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-sm text-destructive mt-1">
              {formik.errors.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting || !formik.isValid}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
