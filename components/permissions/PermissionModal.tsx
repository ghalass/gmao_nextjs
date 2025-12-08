// components/permissions/PermissionModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionForm } from "./PermissionForm";
import { PermissionFormData } from "@/lib/validations/permissionSchema";
import { Permission } from "@/hooks/usePermissions";

interface PermissionModalProps {
  open: boolean;
  onClose: () => void;
  permission?: Permission;
  onSubmit: (data: PermissionFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  title: string;
  description: string;
}

export function PermissionModal({
  open,
  onClose,
  permission,
  onSubmit,
  isSubmitting,
  error,
  title,
  description,
}: PermissionModalProps) {
  const handleSubmit = async (data: PermissionFormData) => {
    await onSubmit(data);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[525px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <PermissionForm
          initialData={permission}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
