// // components/ui/DeleteConfirmationModal.tsx
// "use client";

// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";

// interface DeleteConfirmationModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onConfirm: () => void;
//   isDeleting: boolean;
//   itemName: string;
//   title?: string;
//   description?: string;
// }

// export function DeleteConfirmationModal({
//   open,
//   onOpenChange,
//   onConfirm,
//   isDeleting,
//   itemName,
//   title = "Supprimer",
//   description = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
// }: DeleteConfirmationModalProps) {
//   return (
//     <AlertDialog open={open} onOpenChange={onOpenChange}>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>{title}</AlertDialogTitle>
//           <AlertDialogDescription>{description}</AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
//           <Button
//             variant="destructive"
//             onClick={onConfirm}
//             disabled={isDeleting}
//           >
//             {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//             Supprimer
//           </Button>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }

// components/ui/delete-confirmation-modal.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Permission } from "@/hooks/usePermissions";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  permission: Permission | null;
  isDeleting: boolean;
  title?: string;
  description?: string;
}

export function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  permission,
  isDeleting,
  title = "Supprimer la permission",
  description = "Êtes-vous sûr de vouloir supprimer cette permission ? Cette action est irréversible et pourrait affecter les rôles qui utilisent cette permission.",
}: DeleteConfirmationModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Supprimer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
