// components/performances/HrmModal.tsx
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
import { AlertCircle, CalendarIcon } from "lucide-react";
import { performanceSchema } from "@/lib/validations/performanceSchema";
import {
  SaisiePerformance,
  SaisiePerformanceFormData,
} from "@/lib/types/performance";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Engin, Site } from "@/lib/types";

interface HrmModalProps {
  open: boolean;
  onClose: () => void;
  performance?: SaisiePerformance | null;
  engins: Engin[];
  sites: Site[];
  createPerformance: (data: SaisiePerformanceFormData) => Promise<void>;
  updatePerformance: (data: {
    id: string;
    data: SaisiePerformanceFormData;
  }) => Promise<void>;
}

export function HrmModal({
  open,
  onClose,
  performance,
  engins,
  sites,
  createPerformance,
  updatePerformance,
}: HrmModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      du: performance?.du ? new Date(performance.du) : new Date(),
      enginId: performance?.enginId || "",
      siteId: performance?.siteId || "",
      hrm: performance?.hrm || 0,
    },
    validationSchema: performanceSchema,
    onSubmit: async (values) => {
      try {
        setError(null);

        if (performance) {
          await updatePerformance({ id: performance.id, data: values });
        } else {
          await createPerformance(values);
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
            {performance ? "Modifier la saisie HRM" : "Nouvelle saisie HRM"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Informations de base */}
          <div className="space-y-2">
            <Label htmlFor="du">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formik.values.du && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formik.values.du
                    ? format(formik.values.du, "dd/MM/yyyy")
                    : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formik.values.du}
                  onSelect={(date) => formik.setFieldValue("du", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {formik.touched.du && typeof formik.errors.du === "string" && (
              <div className="text-sm text-destructive">{formik.errors.du}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="enginId">Engin *</Label>
            <Select
              value={formik.values.enginId}
              onValueChange={(value) => formik.setFieldValue("enginId", value)}
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
            {formik.touched.enginId && formik.errors.enginId && (
              <div className="text-sm text-destructive">
                {formik.errors.enginId}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteId">Site *</Label>
            <Select
              value={formik.values.siteId}
              onValueChange={(value) => formik.setFieldValue("siteId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un site" />
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
              <div className="text-sm text-destructive">
                {formik.errors.siteId}
              </div>
            )}
          </div>

          {/* Saisie HRM */}
          <div className="space-y-2">
            <Label htmlFor="hrm">HRM (Heures de fonctionnement) *</Label>
            <Input
              id="hrm"
              type="number"
              step="0.01"
              min="0"
              {...formik.getFieldProps("hrm")}
            />
            {formik.touched.hrm && formik.errors.hrm && (
              <div className="text-sm text-destructive">
                {formik.errors.hrm}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting
                ? "Enregistrement..."
                : performance
                ? "Modifier"
                : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
