// components/type_lubrifiant/DeleteTypelubrifiantModal.tsx
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
import { type Typelubrifiant } from "@/hooks/useTypelubrifiant";

interface DeleteTypelubrifiantModalProps {
  open: boolean;
  onClose: () => void;
  typeLubrifiant: Typelubrifiant | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error?: string;
}

export function DeleteTypelubrifiantModal({
  open,
  onClose,
  typeLubrifiant,
  onConfirm,
  isDeleting,
  error,
}: DeleteTypelubrifiantModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer le type de lubrifiant
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le type de lubrifiant{" "}
            <span className="font-semibold">"{typeLubrifiant?.name}"</span> ?
            {typeLubrifiant?._count &&
              typeLubrifiant._count.lubrifiants > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Ce type est utilisé par {typeLubrifiant._count.lubrifiants}{" "}
                  lubrifiant(s). La suppression n'est pas possible.
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
            disabled={
              isDeleting || (typeLubrifiant?._count?.lubrifiants || 0) > 0
            }
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
