// lib/validations/enginSchema.ts

import yup from "../yupFr";

export const enginSchema = yup.object({
  name: yup
    .string()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  parcId: yup.string().required("Le parc est obligatoire"),
  siteId: yup.string().required("Le site est obligatoire"),
  active: yup.boolean().default(true),
  initialHeureChassis: yup
    .number()
    .min(0, "Les heures doivent être positives")
    .nullable()
    .optional(),
});

export type EnginFormData = yup.InferType<typeof enginSchema>;
