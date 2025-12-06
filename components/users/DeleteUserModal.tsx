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
import { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  deleteUser: any;
}

export function DeleteUserModal({
  open,
  onClose,
  user,
  deleteUser,
}: DeleteUserModalProps) {
  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUser.mutateAsync({ id: user.id });
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
            Cette action est irréversible. Cela supprimera définitivement
            l'utilisateur{" "}
            <span className="font-semibold text-foreground">{user?.name}</span>{" "}
            ({user?.email}) et toutes ses données associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteUser.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteUser.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
