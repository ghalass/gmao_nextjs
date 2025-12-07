// lib/validations/userSchema.ts
import yup from "@/lib/yupFr";

export const userCreateSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  name: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  password: yup
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .required("Le mot de passe est requis"),
  role: yup
    .array()
    .of(yup.string())
    .min(1, "Au moins un rôle doit être sélectionné")
    .required("Le rôle est requis"),
});

export const userUpdateSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  name: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  password: yup
    .string()
    .test(
      "password-length",
      "Le mot de passe doit contenir au moins 6 caractères",
      function (value) {
        // Si le champ est vide ou undefined, c'est valide (pas de changement)
        if (!value || value.trim() === "") return true;
        // Sinon, vérifier la longueur minimale
        return value.length >= 6;
      }
    )
    .notRequired(),
  role: yup
    .array()
    .of(yup.string())
    .min(1, "Au moins un rôle doit être sélectionné")
    .required("Le rôle est requis"),
});
