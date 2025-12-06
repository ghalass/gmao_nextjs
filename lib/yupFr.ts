// lib/yupFr.ts
import * as yup from "yup";
import { fr } from "yup-locales";

// Configuration séparée
export const configureYup = () => {
  yup.setLocale(fr);
};

// Exporter yup directement
export default yup;
