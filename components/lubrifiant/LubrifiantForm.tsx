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
import { Loader2, AlertCircle, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTypelubrifiant } from "@/hooks/useTypelubrifiant";
import { useParcs } from "@/hooks/useParcs";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";

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
  const { parcsQuery } = useParcs();

  // État pour le filtre de recherche des parcs
  const [parcSearch, setParcSearch] = useState("");

  // Filtrer les parcs selon la recherche
  const filteredParcs = useMemo(() => {
    if (!parcsQuery.data || !parcSearch) return parcsQuery.data;

    return parcsQuery.data.filter((parc) =>
      parc.name.toLowerCase().includes(parcSearch.toLowerCase())
    );
  }, [parcsQuery.data, parcSearch]);

  const formik = useFormik<LubrifiantFormData>({
    initialValues: {
      name: initialData?.name || "",
      typelubrifiantId: initialData?.typelubrifiantId || "",
      parcIds: initialData?.parcs?.map((p) => p.id) || [],
    },
    validationSchema: lubrifiantSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // S'assurer que parcIds ne contient que des strings valides
        const cleanData: LubrifiantFormData = {
          ...values,
          parcIds: values.parcIds.filter(
            (id): id is string => id !== undefined && id !== null && id !== ""
          ),
        };

        await onSubmit(cleanData);
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

  const handleParcToggle = (parcId: string, checked: boolean) => {
    const currentParcIds = formik.values.parcIds || [];
    if (checked) {
      formik.setFieldValue("parcIds", [...currentParcIds, parcId]);
    } else {
      formik.setFieldValue(
        "parcIds",
        currentParcIds.filter((id) => id !== parcId)
      );
    }
    console.log("Parcs disponibles:", parcsQuery.data);
    console.log("Parcs sélectionnés:", formik.values.parcIds);
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

        <div>
          <Label>Parcs associés *</Label>
          {/* Filtre de recherche des parcs */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un parc..."
                value={parcSearch}
                onChange={(e) => setParcSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Liste des parcs avec checkboxes */}
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {parcsQuery.isLoading ? (
              <div className="text-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                Chargement des parcs...
              </div>
            ) : parcsQuery.isError ? (
              <div className="text-center text-destructive">
                Erreur lors du chargement des parcs
              </div>
            ) : filteredParcs?.length === 0 ? (
              <div className="text-center text-muted-foreground">
                Aucun parc trouvé pour "{parcSearch}"
              </div>
            ) : (
              filteredParcs?.map((parc) => (
                <div key={parc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`parc-${parc.id}`}
                    checked={formik.values.parcIds?.includes(parc.id) || false}
                    onCheckedChange={(checked: boolean) =>
                      handleParcToggle(parc.id, checked)
                    }
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={`parc-${parc.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {parc.name}
                  </Label>
                </div>
              ))
            )}
          </div>

          {/* Actions rapides */}
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <span>
              {filteredParcs?.length || 0} parc(s) trouvé(s)
              {parcSearch && ` pour "${parcSearch}"`}
            </span>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Sélectionner tous les parcs filtrés
                  const allParcIds = filteredParcs?.map((p) => p.id) || [];
                  formik.setFieldValue("parcIds", allParcIds);
                }}
                disabled={isSubmitting || !filteredParcs?.length}
              >
                Tout sélectionner
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Désélectionner tous les parcs
                  formik.setFieldValue("parcIds", []);
                }}
                disabled={isSubmitting}
              >
                Tout désélectionner
              </Button>
            </div>
          </div>

          {formik.touched.parcIds && formik.errors.parcIds && (
            <p className="text-sm text-destructive mt-1">
              {formik.errors.parcIds}
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
