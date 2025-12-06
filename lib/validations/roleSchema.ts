// lib/validations/roleSchema.ts
import Yup from "@/lib/yupFr";

export const roleCreateSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  description: Yup.string().notRequired(),
  permissions: Yup.array()
    .of(Yup.string())
    .min(1, "Au moins une permission doit être sélectionnée")
    .required("Les permissions sont requises"),
});

export const roleUpdateSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  description: Yup.string().notRequired(),
  permissions: Yup.array()
    .of(Yup.string())
    .min(1, "Au moins une permission doit être sélectionnée")
    .required("Les permissions sont requises"),
});
