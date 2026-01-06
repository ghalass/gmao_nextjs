// lib/validation/lubrifiantSchema.ts
import yup from "@/lib/yupFr";

export const lubrifiantSchema = yup.object({
  name: yup
    .string()
    .required("Le nom du lubrifiant est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  typelubrifiantId: yup.string().required("Le type de lubrifiant est requis"),
  parcIds: yup
    .array()
    .of(yup.string())
    .min(1, "Sélectionnez au moins un parc")
    .required("Association à au moins un parc est requise"),
});

export type LubrifiantFormData = yup.InferType<typeof lubrifiantSchema>;
