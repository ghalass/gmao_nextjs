// lib/validations/permissionSchema.ts
import Yup from "@/lib/yupFr";
export interface PermissionFormData {
  name: string;
  resourceId: string;
  action: string;
  description?: string;
}

export const permissionSchema = Yup.object({
  name: Yup.string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  resourceId: Yup.string().required("La ressource est requise"),
  action: Yup.string().required("L'action est requise"),
  description: Yup.string().max(
    255,
    "La description ne peut pas dépasser 255 caractères"
  ),
});
