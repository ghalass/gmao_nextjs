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
import { Resource } from "@/lib/types";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resource: Resource | null;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  resource,
  isDeleting,
}: DeleteConfirmationModalProps) {
  const hasPermissions =
    resource?.permissions && resource.permissions.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la ressource</AlertDialogTitle>
          <AlertDialogDescription>
            {hasPermissions ? (
              <div className="space-y-2">
                <p className="text-destructive font-medium">
                  Impossible de supprimer cette ressource
                </p>
                <p>
                  La ressource <strong>"{resource?.label}"</strong> est utilisée
                  par {resource?.permissions?.length} permission(s). Vous devez
                  d'abord supprimer les permissions associées avant de pouvoir
                  supprimer cette ressource.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Êtes-vous sûr de vouloir supprimer la ressource{" "}
                  <strong>"{resource?.label}"</strong> ?
                </p>
                <p className="text-destructive">
                  Cette action est irréversible.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          {!hasPermissions && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
