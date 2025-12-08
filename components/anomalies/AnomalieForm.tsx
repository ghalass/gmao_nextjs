// components/anomalies/AnomalieForm.tsx
"use client";

import React, { useMemo } from "react";
import { useFormik } from "formik";
import {
  anomalieSchema,
  AnomalieFormData as ValidationAnomalieFormData,
} from "@/lib/validations/anomalieSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Anomalie } from "@/lib/types/anomalie";
import { Site } from "@/hooks/useSites";
import { Engin } from "@/hooks/useEngins";
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";

function formatFormDataForSubmission(
  data: ValidationAnomalieFormData
): ValidationAnomalieFormData {
  return {
    ...data,
    quantite: data.quantite || null,
    reference: data.reference || null,
    code: data.code || null,
    stock: data.stock || null,
    numeroBS: data.numeroBS || null,
    programmation: data.programmation || null,
    sortiePDR: data.sortiePDR || null,
    equipe: data.equipe || null,
    dateExecution: data.dateExecution || null,
    confirmation: data.confirmation || null,
    observations: data.observations || null,
  };
}

interface AnomalieFormProps {
  initialData?: Anomalie;
  onSubmit: (data: ValidationAnomalieFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit" | "view";
  sites: Site[];
  engins: Engin[];
  error?: string;
}

export function AnomalieForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
  sites,
  engins,
  error,
}: AnomalieFormProps) {
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const initialValues = React.useMemo(
    () => ({
      numeroBacklog: initialData?.numeroBacklog || generateNumeroBacklog(),
      dateDetection: initialData?.dateDetection
        ? formatDate(new Date(initialData.dateDetection))
        : formatDate(new Date()),
      description: initialData?.description || "",
      source: initialData?.source || "VS",
      priorite: initialData?.priorite || "MOYENNE",
      besoinPDR: initialData?.besoinPDR || false,
      quantite: initialData?.quantite || undefined,
      reference: initialData?.reference || "",
      code: initialData?.code || "",
      stock: initialData?.stock || "",
      numeroBS: initialData?.numeroBS || "",
      programmation: initialData?.programmation || "",
      sortiePDR: initialData?.sortiePDR || "",
      equipe: initialData?.equipe || "",
      statut: initialData?.statut || "ATTENTE_PDR",
      dateExecution: initialData?.dateExecution
        ? formatDate(new Date(initialData.dateExecution))
        : "",
      confirmation: initialData?.confirmation || "",
      observations: initialData?.observations || "",
      enginId: initialData?.enginId || "",
      siteId: initialData?.siteId || "",
    }),
    [initialData]
  );

  const formik = useFormik<ValidationAnomalieFormData>({
    initialValues: {
      numeroBacklog: initialData?.numeroBacklog || generateNumeroBacklog(),
      dateDetection: initialData?.dateDetection
        ? formatDate(new Date(initialData.dateDetection))
        : formatDate(new Date()),
      description: initialData?.description || "",
      source: initialData?.source || "VS",
      priorite: initialData?.priorite || "MOYENNE",
      besoinPDR: initialData?.besoinPDR || false,
      quantite: initialData?.quantite || null,
      reference: initialData?.reference || null,
      code: initialData?.code || null,
      stock: initialData?.stock || null,
      numeroBS: initialData?.numeroBS || null,
      programmation: initialData?.programmation || null,
      sortiePDR: initialData?.sortiePDR || null,
      equipe: initialData?.equipe || null,
      statut: initialData?.statut || "ATTENTE_PDR",
      dateExecution: initialData?.dateExecution
        ? formatDate(new Date(initialData.dateExecution))
        : null,
      confirmation: initialData?.confirmation || null,
      observations: initialData?.observations || null,
      enginId: initialData?.enginId || "",
      siteId: initialData?.siteId || "",
    },
    validationSchema: anomalieSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // Formater les données avant soumission
        const formattedData = formatFormDataForSubmission(values);
        await onSubmit(formattedData);
        if (!initialData?.id) {
          resetForm({
            values: {
              ...values,
              numeroBacklog: generateNumeroBacklog(),
            },
          });
        }
      } catch (error) {
        // Les erreurs sont gérées par le parent
      }
    },
    // REMOVED: enableReinitialize: true, - causes infinite loops
  });

  // Filtrer les engins en fonction du site sélectionné
  const filteredEngins = useMemo(() => {
    if (!formik.values.siteId) {
      return [];
    }
    return engins.filter((engin) => engin.siteId === formik.values.siteId);
  }, [formik.values.siteId, engins]);

  // Gérer le changement de site - réinitialiser l'engin si nécessaire
  const handleSiteChange = (siteId: string) => {
    const currentEngin = engins.find(
      (engin) => engin.id === formik.values.enginId
    );

    if (currentEngin && currentEngin.siteId !== siteId) {
      // Réinitialiser l'engin avant de changer le site
      formik.setValues((prev) => ({
        ...prev,
        siteId: siteId,
        enginId: "",
      }));
    } else {
      formik.setFieldValue("siteId", siteId);
    }
  };

  function generateNumeroBacklog(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const sequence = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `TO${year}-${month}-${sequence}`;
  }

  function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  const handleCancel = () => {
    onCancel();
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-4">
          {/* Numéro de backlog */}
          <div>
            <Label htmlFor="numeroBacklog">Numéro de backlog *</Label>
            <Input
              id="numeroBacklog"
              name="numeroBacklog"
              value={formik.values.numeroBacklog}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting || isViewMode}
              className={
                formik.touched.numeroBacklog && formik.errors.numeroBacklog
                  ? "border-destructive"
                  : ""
              }
              placeholder="TO14-25-001"
            />
            {formik.touched.numeroBacklog && formik.errors.numeroBacklog && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.numeroBacklog}
              </p>
            )}
          </div>

          {/* Date de détection */}
          <div>
            <Label htmlFor="dateDetection">Date de détection *</Label>
            <Input
              id="dateDetection"
              name="dateDetection"
              type="date"
              value={formik.values.dateDetection}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting || isViewMode}
              className={
                formik.touched.dateDetection && formik.errors.dateDetection
                  ? "border-destructive"
                  : ""
              }
            />
            {formik.touched.dateDetection && formik.errors.dateDetection && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.dateDetection}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting || isViewMode}
              className={
                formik.touched.description && formik.errors.description
                  ? "border-destructive"
                  : ""
              }
              placeholder="Décrivez l'anomalie en détail..."
              rows={3}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.description}
              </p>
            )}
          </div>

          {/* Source */}
          <div>
            <Label htmlFor="source">Source *</Label>
            <Select
              value={formik.values.source}
              onValueChange={(value: SourceAnomalie) =>
                formik.setFieldValue("source", value)
              }
              disabled={isSubmitting || isViewMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez la source" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SourceAnomalie).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.source && formik.errors.source && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.source as string}
              </p>
            )}
          </div>

          {/* Priorité */}
          <div>
            <Label htmlFor="priorite">Priorité *</Label>
            <Select
              value={formik.values.priorite}
              onValueChange={(value: Priorite) =>
                formik.setFieldValue("priorite", value)
              }
              disabled={isSubmitting || isViewMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez la priorité" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Priorite).map((priorite) => (
                  <SelectItem key={priorite} value={priorite}>
                    {priorite.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.priorite && formik.errors.priorite && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.priorite as string}
              </p>
            )}
          </div>

          {/* Besoin PDR */}
          <div className="flex items-center space-x-2">
            <Switch
              id="besoinPDR"
              checked={formik.values.besoinPDR}
              onCheckedChange={(checked) =>
                formik.setFieldValue("besoinPDR", checked)
              }
              disabled={isSubmitting || isViewMode}
            />
            <Label htmlFor="besoinPDR">Besoin PDR</Label>
          </div>

          {/* Quantité */}
          {formik.values.besoinPDR && (
            <div>
              <Label htmlFor="quantite">Quantité</Label>
              <Input
                id="quantite"
                name="quantite"
                type="number"
                min="0"
                value={formik.values.quantite || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isSubmitting || isViewMode}
                className={
                  formik.touched.quantite && formik.errors.quantite
                    ? "border-destructive"
                    : ""
                }
              />
              {formik.touched.quantite && formik.errors.quantite && (
                <p className="text-sm text-destructive mt-1">
                  {formik.errors.quantite}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Site */}
          <div>
            <Label htmlFor="siteId">Site *</Label>
            <Select
              value={formik.values.siteId}
              onValueChange={handleSiteChange}
              disabled={isSubmitting || isViewMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.siteId && formik.errors.siteId && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.siteId}
              </p>
            )}
          </div>

          {/* Engin */}
          <div>
            <Label htmlFor="enginId">Engin *</Label>
            <Select
              value={formik.values.enginId}
              onValueChange={(value) => formik.setFieldValue("enginId", value)}
              disabled={isSubmitting || isViewMode || !formik.values.siteId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !formik.values.siteId
                      ? "Sélectionnez d'abord un site"
                      : filteredEngins.length === 0
                      ? "Aucun engin disponible"
                      : "Sélectionnez un engin"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredEngins.map((engin) => (
                  <SelectItem key={engin.id} value={engin.id}>
                    {engin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.enginId && formik.errors.enginId && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.enginId}
              </p>
            )}
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="statut">Statut *</Label>
            <Select
              value={formik.values.statut}
              onValueChange={(value: StatutAnomalie) =>
                formik.setFieldValue("statut", value)
              }
              disabled={isSubmitting || (isViewMode && !isEditMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le statut" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(StatutAnomalie).map((statut) => (
                  <SelectItem key={statut} value={statut}>
                    {statut.replace("_", " ").toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.statut && formik.errors.statut && (
              <p className="text-sm text-destructive mt-1">
                {formik.errors.statut as string}
              </p>
            )}
          </div>

          {/* Date d'exécution */}
          {formik.values.statut === "EXECUTE" && (
            <div>
              <Label htmlFor="dateExecution">Date d'exécution</Label>
              <Input
                id="dateExecution"
                name="dateExecution"
                type="date"
                value={formik.values.dateExecution || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isSubmitting || isViewMode}
                className={
                  formik.touched.dateExecution && formik.errors.dateExecution
                    ? "border-destructive"
                    : ""
                }
              />
              {formik.touched.dateExecution && formik.errors.dateExecution && (
                <p className="text-sm text-destructive mt-1">
                  {formik.errors.dateExecution}
                </p>
              )}
            </div>
          )}

          {/* Référence */}
          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              name="reference"
              value={formik.values.reference || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting || isViewMode}
              placeholder="Référence de la pièce..."
            />
          </div>

          {/* Code */}
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              value={formik.values.code || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting || isViewMode}
              placeholder="Code de l'anomalie..."
            />
          </div>

          {/* N° BS */}
          <div>
            <Label htmlFor="numeroBS">N° BS</Label>
            <Input
              id="numeroBS"
              name="numeroBS"
              value={formik.values.numeroBS || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting || isViewMode}
              placeholder="Numéro du bon de service..."
            />
          </div>
        </div>
      </div>

      {/* Observations */}
      <div>
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          name="observations"
          value={formik.values.observations || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isSubmitting || isViewMode}
          placeholder="Observations supplémentaires..."
          rows={3}
          className={
            formik.touched.observations && formik.errors.observations
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.observations && formik.errors.observations && (
          <p className="text-sm text-destructive mt-1">
            {formik.errors.observations}
          </p>
        )}
      </div>

      {/* Boutons d'action */}
      {!isViewMode && (
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
      )}
    </form>
  );
}
