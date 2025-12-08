// lib/validations/anomalieSchema.ts
import * as yup from "yup";
import { SourceAnomalie, Priorite, StatutAnomalie } from "@prisma/client";

export const anomalieSchema = yup.object({
  numeroBacklog: yup
    .string()
    .required("Le numéro de backlog est requis")
    .matches(
      /^[A-Z]{2}\d{2}-\d{2}-\d{3}$/,
      "Format invalide. Exemple: TO14-25-001"
    ),
  dateDetection: yup.string().required("La date de détection est requise"),
  description: yup
    .string()
    .required("La description est requise")
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  source: yup
    .mixed<SourceAnomalie>()
    .oneOf(Object.values(SourceAnomalie))
    .required("La source est requise"),
  priorite: yup
    .mixed<Priorite>()
    .oneOf(Object.values(Priorite))
    .required("La priorité est requise"),
  besoinPDR: yup.boolean().default(false),
  quantite: yup
    .number()
    .nullable()
    .transform((v) => (v === "" || v === null ? null : v))
    .min(0, "La quantité ne peut pas être négative")
    .max(1000, "La quantité est trop élevée"),
  reference: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  code: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  stock: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  numeroBS: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  programmation: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  sortiePDR: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  equipe: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  statut: yup
    .mixed<StatutAnomalie>()
    .oneOf(Object.values(StatutAnomalie))
    .required("Le statut est requis"),
  dateExecution: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  confirmation: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  observations: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .max(1000, "Les observations ne peuvent pas dépasser 1000 caractères"),
  enginId: yup.string().required("L'engin est requis"),
  siteId: yup.string().required("Le site est requis"),
});

export type AnomalieFormData = yup.InferType<typeof anomalieSchema>;
