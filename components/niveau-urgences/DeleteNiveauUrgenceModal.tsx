// components/niveau-urgences/DeleteNiveauUrgenceModal.tsx
"use client";

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
import { AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { NiveauUrgence } from "@/hooks/useNiveauUrgences";

interface DeleteNiveauUrgenceModalProps {
  open: boolean;
  onClose: () => void;
  niveauUrgence: NiveauUrgence | null;
  deleteNiveauUrgence: any;
}

export function DeleteNiveauUrgenceModal({
  open,
  onClose,
  niveauUrgence,
  deleteNiveauUrgence,
}: DeleteNiveauUrgenceModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!niveauUrgence) return;

    setError(null);
    try {
      await deleteNiveauUrgence.mutateAsync(niveauUrgence.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const isLoading = deleteNiveauUrgence.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer le niveau d'urgence
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le niveau d'urgence{" "}
            <strong>&quot;{niveauUrgence?.name}&quot;</strong> ?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              {niveauUrgence?.color && (
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: niveauUrgence.color }}
                />
              )}
              <p>
                <strong>Nom :</strong> {niveauUrgence?.name}
              </p>
            </div>
            <p>
              <strong>Niveau :</strong> {niveauUrgence?.level}
            </p>
            {niveauUrgence?.description && (
              <p>
                <strong>Description :</strong> {niveauUrgence.description}
              </p>
            )}
            <p className="text-destructive font-medium">
              <strong>Pannes associées :</strong>{" "}
              {niveauUrgence?._count?.pannes || 0}
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Attention</p>
              <p>
                Cette action est irréversible. Les pannes liées à ce niveau
                d'urgence seront affectées.
              </p>
            </div>
          </div>
        </div>

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
