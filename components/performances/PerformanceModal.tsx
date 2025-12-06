// components/performances/PerformanceModal.tsx
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
import { AlertCircle, Plus, Trash2, CalendarIcon } from "lucide-react";
import { performanceSchema } from "@/lib/validations/performanceSchema";
import {
  SaisiePerformance,
  SaisiePerformanceFormData,
  Engin,
  Site,
  Panne,
  Lubrifiant,
  TypeConsommationLub,
} from "@/lib/types/performance";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PerformanceModalProps {
  open: boolean;
  onClose: () => void;
  performance?: SaisiePerformance | null;
  engins: Engin[];
  sites: Site[];
  pannes: Panne[];
  lubrifiants: Lubrifiant[];
  typesConsommation: TypeConsommationLub[];
  createPerformance: (data: SaisiePerformanceFormData) => Promise<void>;
  updatePerformance: (data: {
    id: string;
    data: SaisiePerformanceFormData;
  }) => Promise<void>;
}

export function PerformanceModal({
  open,
  onClose,
  performance,
  engins,
  sites,
  pannes,
  lubrifiants,
  typesConsommation,
  createPerformance,
  updatePerformance,
}: PerformanceModalProps) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      du: performance?.du ? new Date(performance.du) : new Date(),
      enginId: performance?.enginId || "",
      siteId: performance?.siteId || "",
      hrm: performance?.hrm || 0,
      saisiehims:
        performance?.saisiehim?.map((him) => ({
          id: him.id,
          panneId: him.panneId,
          him: him.him,
          ni: him.ni,
          obs: him.obs || "",
          saisielubrifiants:
            him.saisielubrifiants?.map((lub) => ({
              id: lub.id,
              lubrifiantId: lub.lubrifiantId,
              qte: lub.qte,
              obs: lub.obs || "",
              typeconsommationlubId: lub.typeconsommationlubId || "",
            })) || [],
        })) || [],
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

  const addSaisieHim = () => {
    formik.setFieldValue("saisiehims", [
      ...formik.values.saisiehims,
      {
        panneId: "",
        him: 0,
        ni: 0,
        obs: "",
        saisielubrifiants: [],
      },
    ]);
  };

  const removeSaisieHim = (index: number) => {
    const newSaisieHims = formik.values.saisiehims.filter(
      (_, i) => i !== index
    );
    formik.setFieldValue("saisiehims", newSaisieHims);
  };

  const addSaisieLubrifiant = (himIndex: number) => {
    const newSaisieHims = [...formik.values.saisiehims];
    newSaisieHims[himIndex].saisielubrifiants.push({
      lubrifiantId: "",
      qte: 0,
      obs: "",
      typeconsommationlubId: "",
      id: "",
    });
    formik.setFieldValue("saisiehims", newSaisieHims);
  };

  const removeSaisieLubrifiant = (himIndex: number, lubIndex: number) => {
    const newSaisieHims = [...formik.values.saisiehims];
    newSaisieHims[himIndex].saisielubrifiants = newSaisieHims[
      himIndex
    ].saisielubrifiants.filter((_, i) => i !== lubIndex);
    formik.setFieldValue("saisiehims", newSaisieHims);
  };

  const selectedEngin = engins.find(
    (engin) => engin.id === formik.values.enginId
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {performance
              ? "Modifier la saisie de performance"
              : "Nouvelle saisie de performance"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="text-sm text-destructive">
                  {formik.errors.du}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="enginId">Engin *</Label>
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

          {/* Saisies HIM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Saisies HIM par panne</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSaisieHim}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une panne
              </Button>
            </div>

            {formik.values.saisiehims.map((him, himIndex) => (
              <div key={himIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Panne {himIndex + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSaisieHim(himIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Panne *</Label>
                    <Select
                      value={him.panneId}
                      onValueChange={(value) =>
                        formik.setFieldValue(
                          `saisiehims[${himIndex}].panneId`,
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une panne" />
                      </SelectTrigger>
                      <SelectContent>
                        {pannes
                          .filter(
                            (panne) => panne.engin.id === formik.values.enginId
                          )
                          .map((panne) => (
                            <SelectItem key={panne.id} value={panne.id}>
                              {panne.code ? `${panne.code} - ` : ""}
                              {panne.description}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>HIM *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={him.him}
                      onChange={(e) =>
                        formik.setFieldValue(
                          `saisiehims[${himIndex}].him`,
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>NI *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={him.ni}
                      onChange={(e) =>
                        formik.setFieldValue(
                          `saisiehims[${himIndex}].ni`,
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observations</Label>
                  <Input
                    value={him.obs}
                    onChange={(e) =>
                      formik.setFieldValue(
                        `saisiehims[${himIndex}].obs`,
                        e.target.value
                      )
                    }
                    placeholder="Observations sur la panne..."
                  />
                </div>

                {/* Saisies Lubrifiants pour cette HIM */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Consommations de lubrifiants</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSaisieLubrifiant(himIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un lubrifiant
                    </Button>
                  </div>

                  {him.saisielubrifiants.map((lub, lubIndex) => (
                    <div
                      key={lubIndex}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                    >
                      <div className="space-y-2">
                        <Label>Lubrifiant *</Label>
                        <Select
                          value={lub.lubrifiantId}
                          onValueChange={(value) =>
                            formik.setFieldValue(
                              `saisiehims[${himIndex}].saisielubrifiants[${lubIndex}].lubrifiantId`,
                              value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un lubrifiant" />
                          </SelectTrigger>
                          <SelectContent>
                            {lubrifiants.map((lubrifiant) => (
                              <SelectItem
                                key={lubrifiant.id}
                                value={lubrifiant.id}
                              >
                                {lubrifiant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantité *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={lub.qte}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `saisiehims[${himIndex}].saisielubrifiants[${lubIndex}].qte`,
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type de consommation</Label>
                        <Select
                          value={lub.typeconsommationlubId || ""}
                          onValueChange={(value) =>
                            formik.setFieldValue(
                              `saisiehims[${himIndex}].saisielubrifiants[${lubIndex}].typeconsommationlubId`,
                              value
                            )
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

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeSaisieLubrifiant(himIndex, lubIndex)
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
