// components/typeparcs/DeleteTypeparcModal.tsx
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
import { Typeparc } from "@/lib/types";

interface DeleteTypeparcModalProps {
  open: boolean;
  onClose: () => void;
  typeparc: Typeparc | null;
  deleteTypeparc: any;
}

export function DeleteTypeparcModal({
  open,
  onClose,
  typeparc,
  deleteTypeparc,
}: DeleteTypeparcModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!typeparc) return;

    setError(null);
    try {
      await deleteTypeparc.mutateAsync(typeparc.id);
      onClose();
    } catch (error: any) {
      setError(
        error.message || "Une erreur est survenue lors de la suppression"
      );
    }
  };

  const isSubmitting = deleteTypeparc.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Supprimer le type de parc
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le type de parc{" "}
            <strong>&quot;{typeparc?.name}&quot;</strong> ? Cette action est
            irréversible.
            {typeparc?.parcs && typeparc.parcs.length > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                Attention : Ce type de parc est utilisé par{" "}
                {typeparc.parcs.length} parc(s). La suppression pourrait
                affecter ces parcs.
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
