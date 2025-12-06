// components/parcs/ParcModal.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Parc, Typeparc } from "@/lib/types";
import { useFormik } from "formik";
import { parcSchema } from "@/lib/validations/parcSchema";

interface ParcModalProps {
  open: boolean;
  onClose: () => void;
  parc: Parc | null;
  typeparcs: Typeparc[];
  createParc: any;
  updateParc: any;
}

export function ParcModal({
  open,
  onClose,
  parc,
  typeparcs,
  createParc,
  updateParc,
}: ParcModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: parc?.name || "",
      typeparcId: parc?.typeparcId || "",
    },
    validationSchema: parcSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setError(null);
      try {
        if (parc) {
          await updateParc.mutateAsync({ id: parc.id, data: values });
        } else {
          await createParc.mutateAsync(values);
        }
        onClose();
      } catch (error: any) {
        setError(error.message || "Une erreur est survenue");
      }
    },
  });

  useEffect(() => {
    if (open) {
      formik.resetForm();
      setError(null);
    }
  }, [open, parc]);

  const isSubmitting = createParc.isPending || updateParc.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {parc ? "Modifier le parc" : "Nouveau parc"}
          </DialogTitle>
          <DialogDescription>
            {parc
              ? "Modifiez les informations du parc."
              : "Ajoutez un nouveau parc à votre catalogue."}
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
            <Label htmlFor="name">Nom du parc</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Parc principal, Parc secondaire..."
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
            <Label htmlFor="typeparcId">Type de parc</Label>
            <Select
              value={formik.values.typeparcId}
              onValueChange={(value) =>
                formik.setFieldValue("typeparcId", value)
              }
            >
              <SelectTrigger
                className={
                  formik.touched.typeparcId && formik.errors.typeparcId
                    ? "border-destructive"
                    : ""
                }
              >
                <SelectValue placeholder="Sélectionnez un type de parc" />
              </SelectTrigger>
              <SelectContent>
                {typeparcs.map((typeparc) => (
                  <SelectItem key={typeparc.id} value={typeparc.id}>
                    {typeparc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.typeparcId && formik.errors.typeparcId && (
              <p className="text-sm text-destructive">
                {formik.errors.typeparcId}
              </p>
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
            <Button type="submit" disabled={isSubmitting || !formik.isValid}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {parc ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
