// components/anomalies/DeleteAnomalieModal.tsx
"use client";

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
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Anomalie } from "@/lib/types/anomalie";
import { useState } from "react";

interface DeleteAnomalieModalProps {
  open: boolean;
  onClose: () => void;
  anomalie: Anomalie | null;
  deleteAnomalie: any;
}

export function DeleteAnomalieModal({
  open,
  onClose,
  anomalie,
  deleteAnomalie,
}: DeleteAnomalieModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!anomalie) return;

    setError(null);
    try {
      await deleteAnomalie.mutateAsync(anomalie.id);
      toast.success("Anomalie supprimée avec succès");
      onClose();
    } catch (error: any) {
      setError(
        error.message || "Une erreur est survenue lors de la suppression"
      );
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleClose = () => {
    onClose();
    setError(null);
  };

  const isSubmitting = deleteAnomalie.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Supprimer l'anomalie</DialogTitle>
          </div>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'anomalie{" "}
            <strong>&quot;{anomalie?.numeroBacklog}&quot;</strong> ? Cette
            action est irréversible.
            {anomalie?.historiqueStatutAnomalies &&
              anomalie.historiqueStatutAnomalies.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Attention : Cette anomalie possède un historique de{" "}
                  {anomalie.historiqueStatutAnomalies.length} changement(s) de
                  statut qui seront également supprimés.
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

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous allez supprimer définitivement l'anomalie :
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">N° Backlog:</span>
              <span>{anomalie?.numeroBacklog}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Description:</span>
              <span className="text-right max-w-xs truncate">
                {anomalie?.description.substring(0, 50)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Statut:</span>
              <span className="capitalize">
                {anomalie?.statut.replace("_", " ").toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date détection:</span>
              <span>
                {anomalie?.dateDetection
                  ? new Date(anomalie.dateDetection).toLocaleDateString("fr-FR")
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Attention :</strong> Toutes les données associées à cette
              anomalie seront définitivement perdues. Cette action ne peut pas
              être annulée.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
