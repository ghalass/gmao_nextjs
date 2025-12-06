// components/pannes/DeletePanneModal.tsx - Version simplifiée
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { Panne } from "@/lib/types";

interface DeletePanneModalProps {
  open: boolean;
  onClose: () => void;
  panne: Panne | null;
  deletePanne: any;
}

export function DeletePanneModal({
  open,
  onClose,
  panne,
  deletePanne,
}: DeletePanneModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!panne) return;

    try {
      setError(null);
      await deletePanne.mutateAsync(panne.id);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Une erreur est survenue lors de la suppression"
      );
    }
  };

  const isLoading = deletePanne.isPending;

  // Compter le nombre d'engins uniques associés
  const nombreEngins = panne?.saisiehim
    ? new Set(panne.saisiehim.map((s) => s.enginId).filter(Boolean)).size
    : 0;

  // Compter le nombre de saisies HIM
  const nombreSaisies = panne?.saisiehim?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer la panne
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette panne ? Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>

        {panne && (
          <div className="space-y-2">
            <div className="font-medium">{panne.name || "Panne sans nom"}</div>
            <div className="text-sm text-muted-foreground">
              Type: {panne.typepanne?.name || "Type inconnu"}
            </div>
            <div className="text-sm text-muted-foreground">
              Engins associés: {nombreEngins} engin(s)
            </div>
            <div className="text-sm text-muted-foreground">
              Nombre de saisies HIM: {nombreSaisies}
            </div>
            <div className="text-sm text-muted-foreground">
              Créée le: {new Date(panne.createdAt).toLocaleDateString("fr-FR")}
            </div>

            {nombreSaisies > 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Attention : Cette panne est liée à {nombreSaisies} saisie(s)
                HIM. La suppression de la panne affectera ces saisies.
              </div>
            )}
          </div>
        )}

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
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
