// lib/validations/parcSchema.ts

import yup from "../yupFr";

export const parcSchema = yup.object({
  name: yup
    .string()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  typeparcId: yup.string().required("Le type de parc est obligatoire"),
});

export type ParcFormData = yup.InferType<typeof parcSchema>;
