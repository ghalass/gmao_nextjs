// lib/validation/type_lubrifiantSchema.ts
import yup from "@/lib/yupFr";

export const typeLubrifiantSchema = yup.object({
  name: yup
    .string()
    .required("Le nom du type de lubrifiant est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
});

export type TypelubrifiantFormData = yup.InferType<typeof typeLubrifiantSchema>;
