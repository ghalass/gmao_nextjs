// components/lubrifiant/DeleteLubrifiantModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { type Lubrifiant } from "@/hooks/useLubrifiant";

interface DeleteLubrifiantModalProps {
  open: boolean;
  onClose: () => void;
  lubrifiant: Lubrifiant | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error?: string;
}

export function DeleteLubrifiantModal({
  open,
  onClose,
  lubrifiant,
  onConfirm,
  isDeleting,
  error,
}: DeleteLubrifiantModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const totalUsages =
    (lubrifiant?._count?.saisielubrifiant || 0) +
    (lubrifiant?._count?.lubrifiantParc || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer le lubrifiant
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le lubrifiant{" "}
            <span className="font-semibold">"{lubrifiant?.name}"</span> ?
            {totalUsages > 0 && (
              <span className="block mt-2 text-destructive">
                ⚠️ Ce lubrifiant est utilisé {totalUsages} fois. La suppression
                n'est pas possible.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || totalUsages > 0}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
