// lib/validation/siteSchema.ts
import Yup from "@/lib/yupFr";

export const siteSchema = Yup.object({
  name: Yup.string()
    .required("Le nom du site est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  active: Yup.boolean().default(true),
});

export type SiteFormData = Yup.InferType<typeof siteSchema>;
