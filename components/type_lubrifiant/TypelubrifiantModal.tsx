// components/type_lubrifiant/TypelubrifiantModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TypelubrifiantForm } from "./TypelubrifiantForm";
import { type Typelubrifiant } from "@/hooks/useTypelubrifiant";
import { type TypelubrifiantFormData } from "@/lib/validations/type_lubrifiantSchema";

interface TypelubrifiantModalProps {
  open: boolean;
  onClose: () => void;
  typeLubrifiant?: Typelubrifiant;
  onSubmit: (data: TypelubrifiantFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  title: string;
  description: string;
}

export function TypelubrifiantModal({
  open,
  onClose,
  typeLubrifiant,
  onSubmit,
  isSubmitting,
  error,
  title,
  description,
}: TypelubrifiantModalProps) {
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
        <TypelubrifiantForm
          initialData={typeLubrifiant}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
