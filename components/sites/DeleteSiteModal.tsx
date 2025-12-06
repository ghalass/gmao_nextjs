// components/sites/DeleteSiteModal.tsx
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
import { type Site } from "@/hooks/useSites";

interface DeleteSiteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  site: Site | null; // ✅ Peut être null
  isDeleting: boolean;
}
export function DeleteSiteModal({
  open,
  onClose,
  onConfirm,
  site,
  isDeleting,
}: DeleteSiteModalProps) {
  const handleConfirm = async (): Promise<void> => {
    try {
      await onConfirm();
    } catch (error) {
      // L'erreur est gérée par le parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Supprimer le site</DialogTitle>
          </div>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce site ? Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous allez supprimer le site : <strong>{site?.name}</strong>
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Attention :</strong> Toutes les données associées à ce
              site pourront être affectées.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-2">
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
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
