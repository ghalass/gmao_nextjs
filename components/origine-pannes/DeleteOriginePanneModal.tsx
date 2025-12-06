// components/origine-pannes/DeleteOriginePanneModal.tsx
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
import { OriginePanne } from "@/hooks/useOriginePannes";

interface DeleteOriginePanneModalProps {
  open: boolean;
  onClose: () => void;
  originePanne: OriginePanne | null;
  deleteOriginePanne: any;
}

export function DeleteOriginePanneModal({
  open,
  onClose,
  originePanne,
  deleteOriginePanne,
}: DeleteOriginePanneModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!originePanne) return;

    setError(null);
    try {
      await deleteOriginePanne.mutateAsync(originePanne.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const isLoading = deleteOriginePanne.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'origine de panne
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'origine de panne{" "}
            <strong>&quot;{originePanne?.name}&quot;</strong> ?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm space-y-1">
            <p>
              <strong>Nom :</strong> {originePanne?.name}
            </p>
            {originePanne?.description && (
              <p>
                <strong>Description :</strong> {originePanne.description}
              </p>
            )}
            <p className="text-destructive font-medium">
              <strong>Pannes associées :</strong>{" "}
              {originePanne?._count?.pannes || 0}
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Attention</p>
              <p>
                Cette action est irréversible. Les pannes liées à cette origine
                seront affectées.
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
