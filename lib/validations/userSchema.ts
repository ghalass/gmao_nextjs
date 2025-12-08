// lib/validations/userSchema.ts
import yup from "@/lib/yupFr";

// lib/validations/userSchema.ts
export const userCreateSchema = yup.object({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  name: yup.string().required("Le nom est requis"),
  password: yup
    .string()
    .min(6, "Le mot de passe doit faire au moins 6 caractères")
    .required("Le mot de passe est requis"),
  roles: yup
    .array()
    .of(yup.string().required())
    .min(1, "Au moins un rôle est requis"),
  active: yup.boolean().default(true),
});

export const userUpdateSchema = yup.object({
  email: yup.string().email("Email invalide").optional(),
  name: yup.string().optional(),
  password: yup
    .string()
    .min(6, "Le mot de passe doit faire au moins 6 caractères")
    .optional(),
  roles: yup.array().of(yup.string().required()).optional(),
  active: yup.boolean().optional(),
});
