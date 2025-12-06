// lib/validation/performanceSchema.ts
import * as yup from "yup";
import "@/lib/yupFr";

export const saisieLubrifiantSchema = yup.object({
  lubrifiantId: yup.string().required("Le lubrifiant est requis"),
  qte: yup
    .number()
    .required("La quantité est requise")
    .min(0, "La quantité doit être positive"),
  obs: yup.string().optional(),
  typeconsommationlubId: yup.string().optional(),
});

export const saisieHimSchema = yup.object({
  panneId: yup.string().required("La panne est requise"),
  him: yup
    .number()
    .required("Le HIM est requis")
    .min(0, "Le HIM doit être positif"),
  ni: yup
    .number()
    .required("Le NI est requis")
    .min(0, "Le NI doit être positif"),
  obs: yup.string().optional(),
  saisielubrifiants: yup.array().of(saisieLubrifiantSchema).optional(),
});

export const performanceSchema = yup.object({
  du: yup.date().required("La date est requise"),
  enginId: yup.string().required("L'engin est requis"),
  siteId: yup.string().required("Le site est requis"),
  hrm: yup
    .number()
    .required("Le HRM est requis")
    .min(0, "Le HRM doit être positif"),
  saisiehims: yup.array().of(saisieHimSchema).optional(),
});
