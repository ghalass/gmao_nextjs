// lib/validations/typeparcSchema.ts
import Yup from "@/lib/yupFr";

export const typeparcSchema = Yup.object({
  name: Yup.string()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
});
