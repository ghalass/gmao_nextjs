// components/lubrifiant/LubrifiantModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LubrifiantForm } from "./LubrifiantForm";
import { type Lubrifiant } from "@/hooks/useLubrifiant";
import { type LubrifiantFormData } from "@/lib/validations/lubrifiantSchema";

interface LubrifiantModalProps {
  open: boolean;
  onClose: () => void;
  lubrifiant?: Lubrifiant;
  onSubmit: (data: LubrifiantFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  title: string;
  description: string;
}

export function LubrifiantModal({
  open,
  onClose,
  lubrifiant,
  onSubmit,
  isSubmitting,
  error,
  title,
  description,
}: LubrifiantModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <LubrifiantForm
          initialData={lubrifiant}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
