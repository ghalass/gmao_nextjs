// components/lubrifiant/LubrifiantForm.tsx
"use client";

import { useFormik } from "formik";
import {
  lubrifiantSchema,
  type LubrifiantFormData,
} from "@/lib/validations/lubrifiantSchema";
import { type Lubrifiant } from "@/hooks/useLubrifiant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTypelubrifiant } from "@/hooks/useTypelubrifiant";

interface LubrifiantFormProps {
  initialData?: Lubrifiant;
  onSubmit: (data: LubrifiantFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function LubrifiantForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: LubrifiantFormProps) {
  const { typelubrifiantQuery } = useTypelubrifiant();

  const formik = useFormik<LubrifiantFormData>({
    initialValues: {
      name: initialData?.name || "",
      typelubrifiantId: initialData?.typelubrifiantId || "",
    },
    validationSchema: lubrifiantSchema,
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
          <Label htmlFor="name">Nom du lubrifiant *</Label>
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
            placeholder="ex: Huile 15W40, Graisse lithium, etc."
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-sm text-destructive mt-1">
              {formik.errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="typelubrifiantId">Type de lubrifiant *</Label>
          <Select
            value={formik.values.typelubrifiantId}
            onValueChange={(value) =>
              formik.setFieldValue("typelubrifiantId", value)
            }
            disabled={isSubmitting || typelubrifiantQuery.isLoading}
          >
            <SelectTrigger
              className={
                formik.touched.typelubrifiantId &&
                formik.errors.typelubrifiantId
                  ? "border-destructive"
                  : ""
              }
            >
              <SelectValue placeholder="Sélectionnez un type de lubrifiant" />
            </SelectTrigger>
            <SelectContent>
              {typelubrifiantQuery.data?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.typelubrifiantId &&
            formik.errors.typelubrifiantId && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.typelubrifiantId}
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
