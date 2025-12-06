// // components/permissions/PermissionForm.tsx
// "use client";

// import { useState } from "react";
// import { useFormik } from "formik";
// import {
//   PermissionFormData,
//   permissionSchema,
// } from "@/lib/validations/permissionSchema";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Loader2, AlertCircle, Plus } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useResources } from "@/hooks/useResources";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// interface PermissionFormProps {
//   initialData?: PermissionFormData & { id?: string };
//   onSubmit: (data: PermissionFormData) => Promise<void>;
//   onCancel: () => void;
//   isSubmitting: boolean;
//   error?: string;
// }

// const actionOptions = [
//   { value: "read", label: "Lecture" },
//   { value: "create", label: "Création" },
//   { value: "update", label: "Modification" },
//   { value: "delete", label: "Suppression" },
//   { value: "manage", label: "Gestion complète" },
// ];

// export function PermissionForm({
//   initialData,
//   onSubmit,
//   onCancel,
//   isSubmitting,
//   error,
// }: PermissionFormProps) {
//   const { resourcesQuery, createResource, resourceOptions } = useResources();
//   const [isCreateResourceOpen, setIsCreateResourceOpen] = useState(false);
//   const [newResource, setNewResource] = useState({ name: "", label: "" });

//   const formik = useFormik<PermissionFormData>({
//     initialValues: {
//       name: initialData?.name || "",
//       resourceId: initialData?.resourceId || "",
//       action: initialData?.action || "",
//       description: initialData?.description || "",
//     },
//     validationSchema: permissionSchema,
//     onSubmit: async (values, { resetForm }) => {
//       try {
//         await onSubmit(values);
//         if (!initialData?.id) {
//           resetForm();
//         }
//       } catch (error) {
//         // Les erreurs sont gérées par le parent
//       }
//     },
//   });

//   const handleCreateResource = async (): Promise<void> => {
//     try {
//       await createResource.mutateAsync(newResource);
//       setNewResource({ name: "", label: "" });
//       setIsCreateResourceOpen(false);
//     } catch (error) {
//       // Erreur gérée par le hook
//     }
//   };

//   // ✅ CORRECTION : Vérifier que createResource existe avant d'accéder à ses propriétés
//   const isCreatingResource = createResource?.isPending || false;

//   return (
//     <>
//       <form onSubmit={formik.handleSubmit} className="space-y-6">
//         {error && (
//           <Alert variant="destructive">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         <div className="space-y-4">
//           <div>
//             <Label htmlFor="name">Nom de la permission *</Label>
//             <Input
//               id="name"
//               name="name"
//               type="text"
//               value={formik.values.name}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               disabled={isSubmitting}
//               className={
//                 formik.touched.name && formik.errors.name
//                   ? "border-destructive"
//                   : ""
//               }
//               placeholder="ex: users.read"
//             />
//             {formik.touched.name && formik.errors.name && (
//               <p className="text-sm text-destructive mt-1">
//                 {formik.errors.name}
//               </p>
//             )}
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <div className="flex items-center justify-between mb-2">
//                 <Label htmlFor="resource">Ressource *</Label>
//                 <Dialog
//                   open={isCreateResourceOpen}
//                   onOpenChange={setIsCreateResourceOpen}
//                 >
//                   <DialogTrigger asChild>
//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="sm"
//                       className="h-8 text-xs"
//                     >
//                       <Plus className="h-3 w-3 mr-1" />
//                       Nouvelle
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent>
//                     <DialogHeader>
//                       <DialogTitle>Créer une nouvelle ressource</DialogTitle>
//                     </DialogHeader>
//                     <div className="space-y-4">
//                       <div>
//                         <Label htmlFor="resourceName">Nom technique *</Label>
//                         <Input
//                           id="resourceName"
//                           value={newResource.name}
//                           onChange={(e) =>
//                             setNewResource((prev) => ({
//                               ...prev,
//                               name: e.target.value,
//                             }))
//                           }
//                           placeholder="ex: users"
//                         />
//                       </div>
//                       <div>
//                         <Label htmlFor="resourceLabel">Libellé *</Label>
//                         <Input
//                           id="resourceLabel"
//                           value={newResource.label}
//                           onChange={(e) =>
//                             setNewResource((prev) => ({
//                               ...prev,
//                               label: e.target.value,
//                             }))
//                           }
//                           placeholder="ex: Utilisateurs"
//                         />
//                       </div>
//                       <Button
//                         onClick={handleCreateResource}
//                         disabled={
//                           isCreatingResource || // ✅ Utiliser la variable sécurisée
//                           !newResource.name ||
//                           !newResource.label
//                         }
//                         className="w-full"
//                       >
//                         {isCreatingResource && (
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         )}
//                         Créer la ressource
//                       </Button>
//                     </div>
//                   </DialogContent>
//                 </Dialog>
//               </div>

//               {/* SELECT_RESOURCE */}
//               <Select
//                 value={formik.values.resourceId}
//                 onValueChange={(value) =>
//                   formik.setFieldValue("resourceId", value)
//                 }
//                 disabled={isSubmitting || resourcesQuery.isLoading}
//               >
//                 <SelectTrigger
//                   className={
//                     formik.touched.resourceId && formik.errors.resourceId
//                       ? "border-destructive"
//                       : ""
//                   }
//                 >
//                   <SelectValue
//                     placeholder={
//                       resourcesQuery.isLoading
//                         ? "Chargement..."
//                         : "Sélectionnez une ressource"
//                     }
//                   />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {resourceOptions.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               {formik.touched.resourceId && formik.errors.resourceId && (
//                 <p className="text-sm text-destructive mt-1">
//                   {formik.errors.resourceId}
//                 </p>
//               )}
//             </div>

//             <div>
//               <Label htmlFor="action">Action *</Label>
//               <Select
//                 value={formik.values.action}
//                 onValueChange={(value) => formik.setFieldValue("action", value)}
//                 disabled={isSubmitting}
//               >
//                 <SelectTrigger
//                   className={
//                     formik.touched.action && formik.errors.action
//                       ? "border-destructive"
//                       : ""
//                   }
//                 >
//                   <SelectValue placeholder="Sélectionnez une action" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {actionOptions.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               {formik.touched.action && formik.errors.action && (
//                 <p className="text-sm text-destructive mt-1">
//                   {formik.errors.action}
//                 </p>
//               )}
//             </div>
//           </div>

//           <div>
//             <Label htmlFor="description">Description</Label>
//             <Textarea
//               id="description"
//               name="description"
//               value={formik.values.description}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               disabled={isSubmitting}
//               rows={3}
//               placeholder="Description optionnelle de la permission..."
//               className={
//                 formik.touched.description && formik.errors.description
//                   ? "border-destructive"
//                   : ""
//               }
//             />
//             {formik.touched.description && formik.errors.description && (
//               <p className="text-sm text-destructive mt-1">
//                 {formik.errors.description}
//               </p>
//             )}
//           </div>
//         </div>

//         <div className="flex justify-end space-x-2 pt-4">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onCancel}
//             disabled={isSubmitting}
//           >
//             Annuler
//           </Button>
//           <Button
//             type="submit"
//             disabled={
//               isSubmitting || !formik.isValid || !formik.values.resourceId
//             }
//           >
//             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             {initialData?.id ? "Modifier" : "Créer"}
//           </Button>
//         </div>
//       </form>
//     </>
//   );
// }

// components/permissions/PermissionForm.tsx - Version simplifiée
// components/permissions/SimplePermissionForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimplePermissionFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

const actionOptions = [
  { value: "read", label: "Lecture" },
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
  { value: "manage", label: "Gestion complète" },
];

export function PermissionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: SimplePermissionFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    resourceId: initialData?.resourceId || "",
    action: initialData?.action || "",
    description: initialData?.description || "",
  });

  const [resources, setResources] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Charger les ressources une seule fois
  useEffect(() => {
    const loadResources = async () => {
      setIsLoadingResources(true);
      try {
        const response = await fetch("/api/resources");
        if (response.ok) {
          const data = await response.json();
          setResources(data);
        }
      } catch (error) {
        console.error("Erreur chargement ressources:", error);
      } finally {
        setIsLoadingResources(false);
      }
    };

    loadResources();
  }, []); // Tableau de dépendances vide = exécuté une seule fois

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Nom de la permission *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          disabled={isSubmitting}
          placeholder="ex: users.read"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="resourceId">Ressource *</Label>
          <Select
            value={formData.resourceId}
            onValueChange={(value) => handleChange("resourceId", value)}
            disabled={isSubmitting || isLoadingResources}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingResources
                    ? "Chargement..."
                    : "Sélectionnez une ressource"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {resources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="action">Action *</Label>
          <Select
            value={formData.action}
            onValueChange={(value) => handleChange("action", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une action" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          disabled={isSubmitting}
          rows={3}
          placeholder="Description optionnelle de la permission..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.name ||
            !formData.resourceId ||
            !formData.action
          }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
