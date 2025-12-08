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
import { toast } from "sonner";
import { Site } from "@/lib/types";
import { useState } from "react";

interface DeleteSiteModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
  deleteSite: any;
}
export function DeleteSiteModal({
  open,
  onClose,
  site,
  deleteSite,
}: DeleteSiteModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!site) return;

    setError(null);
    try {
      await deleteSite.mutateAsync(site.id);
      onClose();
    } catch (error: any) {
      setError(
        error.message || "Une erreur est survenue lors de la suppression"
      );
    }
  };

  const handleClode = () => {
    onClose();
    setError(null);
  };

  const isSubmitting = deleteSite.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClode}>
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
            Êtes-vous sûr de vouloir supprimer le site{" "}
            <strong>&quot;{site?.name}&quot;</strong> ? Cette action est
            irréversible.
            {site?._count?.engins && site?._count?.engins > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                Attention : Ce site contient {site?._count?.engins} engin(s). La
                suppression pourrait affecter ces engins.
              </span>
            )}
          </DialogDescription>
          {/* <p>{JSON.stringify(site)}</p> */}
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
            onClick={handleClode}
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
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
