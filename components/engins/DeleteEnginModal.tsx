// components/engins/DeleteEnginModal.tsx
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
import { Engin } from "@/lib/types";

interface DeleteEnginModalProps {
  open: boolean;
  onClose: () => void;
  engin: Engin | null;
  deleteEngin: any;
}

export function DeleteEnginModal({
  open,
  onClose,
  engin,
  deleteEngin,
}: DeleteEnginModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!engin) return;

    setError(null);
    try {
      await deleteEngin.mutateAsync(engin.id);
      onClose();
    } catch (error: any) {
      setError(
        error.message || "Une erreur est survenue lors de la suppression"
      );
    }
  };

  const isSubmitting = deleteEngin.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Supprimer l'engin
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'engin{" "}
            <strong>&quot;{engin?.name}&quot;</strong> ? Cette action est
            irréversible.
            {engin?._count &&
              (engin._count.pannes > 0 ||
                engin._count.saisiehrms > 0 ||
                engin._count.saisiehim > 0) && (
                <span className="block mt-2 text-destructive font-medium">
                  Attention : Cet engin a des données associées (
                  {engin._count.pannes} panne(s), {engin._count.saisiehrms}{" "}
                  saisie(s) HRM, {engin._count.saisiehim} saisie(s) HIM). La
                  suppression pourrait affecter ces données.
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
