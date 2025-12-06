// components/parcs/DeleteParcModal.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Parc } from "@/lib/types";

interface DeleteParcModalProps {
  open: boolean;
  onClose: () => void;
  parc: Parc | null;
  deleteParc: any;
}

export function DeleteParcModal({
  open,
  onClose,
  parc,
  deleteParc,
}: DeleteParcModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!parc) return;

    setError(null);
    try {
      await deleteParc.mutateAsync(parc.id);
      onClose();
    } catch (error: any) {
      setError(
        error.message || "Une erreur est survenue lors de la suppression"
      );
    }
  };

  const isSubmitting = deleteParc.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Supprimer le parc
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le parc{" "}
            <strong>&quot;{parc?.name}&quot;</strong> ? Cette action est
            irréversible.
            {parc?._count && parc._count.engins > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                Attention : Ce parc contient {parc._count.engins} engin(s). La
                suppression pourrait affecter ces engins.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
