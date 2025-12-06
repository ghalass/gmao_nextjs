// components/performances/DeletePerformanceModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SaisiePerformance } from "@/lib/types/performance";
import { format } from "date-fns";

interface DeletePerformanceModalProps {
  open: boolean;
  onClose: () => void;
  performance: SaisiePerformance | null;
  deletePerformance: (id: string) => Promise<void>;
}

export function DeletePerformanceModal({
  open,
  onClose,
  performance,
  deletePerformance,
}: DeletePerformanceModalProps) {
  const handleDelete = async () => {
    if (!performance) return;

    try {
      await deletePerformance(performance.id);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  if (!performance) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la saisie de performance</DialogTitle>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Êtes-vous sûr de vouloir supprimer la saisie de performance du{" "}
            {format(new Date(performance.du), "dd/MM/yyyy")} pour l'engin{" "}
            {performance.engin.name} ? Cette action est irréversible.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
