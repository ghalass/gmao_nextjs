// components/sites/SiteModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteForm } from "./SiteForm";
import { type Site } from "@/hooks/useSites";
import { type SiteFormData } from "@/lib/validations/siteSchema";

interface SiteModalProps {
  open: boolean;
  onClose: () => void;
  site?: Site; // ✅ Doit être optionnel
  onSubmit: (data: SiteFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  title: string;
  description: string;
}

export function SiteModal({
  open,
  onClose, // ✅ Utilisez onClose
  site,
  onSubmit,
  isSubmitting,
  error,
  title,
  description,
}: SiteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      {" "}
      {/* ✅ Passez onClose à onOpenChange */}
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SiteForm
          initialData={site}
          onSubmit={onSubmit}
          onCancel={onClose} // ✅ Passez onClose comme onCancel
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
