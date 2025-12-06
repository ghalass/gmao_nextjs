// components/typeparcs/TypeparcModal.tsx (version améliorée)
import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Typeparc } from "@/lib/types";
import { useFormik } from "formik";
import { typeparcSchema } from "@/lib/validations/typeparcSchema";

interface TypeparcModalProps {
  open: boolean;
  onClose: () => void;
  typeparc: Typeparc | null;
  createTypeparc: any;
  updateTypeparc: any;
}

export function TypeparcModal({
  open,
  onClose,
  typeparc,
  createTypeparc,
  updateTypeparc,
}: TypeparcModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: typeparc?.name || "",
    },
    validationSchema: typeparcSchema,
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        if (typeparc) {
          await updateTypeparc.mutateAsync({ id: typeparc.id, data: values });
        } else {
          await createTypeparc.mutateAsync(values);
        }
        onClose();
      } catch (error: any) {
        setError(error.message || "Une erreur est survenue");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      formik.resetForm();
      setError(null);
    }
  }, [open, typeparc]);

  const isSubmitting = createTypeparc.isPending || updateTypeparc.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {typeparc ? "Modifier le type de parc" : "Nouveau type de parc"}
          </DialogTitle>
          <DialogDescription>
            {typeparc
              ? "Modifiez les informations du type de parc."
              : "Ajoutez un nouveau type de parc à votre catalogue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom du type de parc</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Parc mécanique, Parc électrique..."
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting}
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

          <DialogFooter>
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
              disabled={isSubmitting || !formik.isValid || !formik.dirty}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {typeparc ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
