// components/engins/EnginModal.tsx
import { useState, useEffect, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Engin, Parc, Site, Typeparc } from "@/lib/types";
import { useFormik } from "formik";
import { enginSchema } from "@/lib/validations/enginSchema";

interface EnginModalProps {
  open: boolean;
  onClose: () => void;
  engin: Engin | null;
  parcs: Parc[];
  sites: Site[];
  typeparcs: Typeparc[];
  createEngin: any;
  updateEngin: any;
}

export function EnginModal({
  open,
  onClose,
  engin,
  parcs,
  sites,
  typeparcs,
  createEngin,
  updateEngin,
}: EnginModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedtypeparcId, setSelectedtypeparcId] = useState<string>(
    engin?.parc?.typeparc?.id || ""
  );

  // Filtrer les parcs par type de parc sélectionné
  const filteredparcs = useMemo(() => {
    if (!selectedtypeparcId) return parcs;
    return parcs.filter((parc) => parc?.typeparc?.id === selectedtypeparcId);
  }, [parcs, selectedtypeparcId]);

  const formik = useFormik({
    initialValues: {
      name: engin?.name || "",
      typeparcId: engin?.parc?.typeparc?.id || "",
      parcId: engin?.parcId || "",
      siteId: engin?.siteId || "",
      active: engin?.active ?? true,
      initialHeureChassis: engin?.initialHeureChassis || 0,
    },
    validationSchema: enginSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setError(null);
      try {
        // N'envoyer que les champs nécessaires à l'API
        const { typeparcId, ...submitData } = values;

        if (engin) {
          await updateEngin.mutateAsync({ id: engin.id, data: submitData });
        } else {
          await createEngin.mutateAsync(submitData);
        }
        onClose();
      } catch (error: any) {
        setError(error.message || "Une erreur est survenue");
      }
    },
  });

  // Mettre à jour les parcs filtrés quand le type de parc change
  useEffect(() => {
    if (selectedtypeparcId !== formik.values.typeparcId) {
      formik.setFieldValue("typeparcId", selectedtypeparcId);
      // Réinitialiser la sélection du parc quand le type change
      formik.setFieldValue("parcId", "");
    }
  }, [selectedtypeparcId, formik]);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      formik.resetForm();
      setError(null);
      setSelectedtypeparcId(engin?.parc?.typeparc?.id || "");
    }
  }, [open, engin]);

  const isSubmitting = createEngin.isPending || updateEngin.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {engin ? "Modifier l'engin" : "Nouvel engin"}
          </DialogTitle>
          <DialogDescription>
            {engin
              ? "Modifiez les informations de l'engin."
              : "Ajoutez un nouvel engin à votre parc."}
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
            <Label htmlFor="name">{"Nom de l'engin"}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Pelle hydraulique 001, Bulldozer 002..."
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

          {/* Sélection en deux étapes : Type de parc -> parc */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typeparcId">Type de parc</Label>
              <Select
                value={selectedtypeparcId}
                onValueChange={setSelectedtypeparcId}
              >
                <SelectTrigger
                  className={
                    formik.touched.typeparcId && formik.errors.typeparcId
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue placeholder="Type de parc" />
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

            <div className="space-y-2">
              <Label htmlFor="parcId">parc</Label>
              <Select
                value={formik.values.parcId}
                onValueChange={(value) => formik.setFieldValue("parcId", value)}
                disabled={!selectedtypeparcId}
              >
                <SelectTrigger
                  className={
                    formik.touched.parcId && formik.errors.parcId
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue
                    placeholder={
                      !selectedtypeparcId
                        ? "Choisissez d'abord le type"
                        : "Sélectionnez un parc"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredparcs.length === 0 ? (
                    <SelectItem value="no-parc" disabled>
                      Aucun parc disponible
                    </SelectItem>
                  ) : (
                    filteredparcs.map((parc) => (
                      <SelectItem key={parc.id} value={parc.id}>
                        {parc.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formik.touched.parcId && formik.errors.parcId && (
                <p className="text-sm text-destructive">
                  {formik.errors.parcId}
                </p>
              )}
              {selectedtypeparcId && filteredparcs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun parc disponible pour ce type
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteId">Site</Label>
            <Select
              value={formik.values.siteId}
              onValueChange={(value) => formik.setFieldValue("siteId", value)}
            >
              <SelectTrigger
                className={
                  formik.touched.siteId && formik.errors.siteId
                    ? "border-destructive"
                    : ""
                }
              >
                <SelectValue placeholder="Sélectionnez un site" />
              </SelectTrigger>
              <SelectContent>
                {sites
                  .filter((site) => site.active)
                  .map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {formik.touched.siteId && formik.errors.siteId && (
              <p className="text-sm text-destructive">{formik.errors.siteId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialHeureChassis">
              Heures chassis initiales
            </Label>
            <Input
              id="initialHeureChassis"
              name="initialHeureChassis"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={formik.values.initialHeureChassis}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.initialHeureChassis &&
                formik.errors.initialHeureChassis
                  ? "border-destructive"
                  : ""
              }
            />
            {formik.touched.initialHeureChassis &&
              formik.errors.initialHeureChassis && (
                <p className="text-sm text-destructive">
                  {formik.errors.initialHeureChassis}
                </p>
              )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formik.values.active}
              onCheckedChange={(checked) =>
                formik.setFieldValue("active", checked)
              }
            />
            <Label htmlFor="active">Engin actif</Label>
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
              disabled={
                isSubmitting || !formik.isValid || !formik.values.parcId
              }
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {engin ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
