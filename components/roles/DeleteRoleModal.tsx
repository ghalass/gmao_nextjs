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
import { Loader2 } from "lucide-react";
import { Role } from "@/lib/types";

interface DeleteRoleModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  deleteRole: any;
}

export function DeleteRoleModal({
  open,
  onClose,
  role,
  deleteRole,
}: DeleteRoleModalProps) {
  const handleDelete = async () => {
    if (!role) return;
    try {
      await deleteRole.mutateAsync({ id: role.id });
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cela supprimera définitivement le
            rôle{" "}
            <span className="font-semibold text-foreground">{role?.name}</span>{" "}
            et toutes ses données associées.
            {role?.description && (
              <span className="block mt-2 text-sm">
                Description : {role.description}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRole.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRole.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteRole.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
