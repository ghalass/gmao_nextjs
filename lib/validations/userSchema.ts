// lib/validations/userSchema.ts
import Yup from "@/lib/yupFr";

export const userCreateSchema = Yup.object().shape({
  email: Yup.string().email("Email invalide").required("L'email est requis"),
  name: Yup.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  password: Yup.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .required("Le mot de passe est requis"),
  role: Yup.array()
    .of(Yup.string())
    .min(1, "Au moins un rôle doit être sélectionné")
    .required("Le rôle est requis"),
});

export const userUpdateSchema = Yup.object().shape({
  email: Yup.string().email("Email invalide").required("L'email est requis"),
  name: Yup.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  password: Yup.string()
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
  role: Yup.array()
    .of(Yup.string())
    .min(1, "Au moins un rôle doit être sélectionné")
    .required("Le rôle est requis"),
});
