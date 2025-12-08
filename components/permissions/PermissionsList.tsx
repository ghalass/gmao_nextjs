// components/permissions/PermissionsList.tsx
"use client";

import { Permission } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";

interface PermissionsListProps {
  permissions: Permission[];
  isLoading: boolean;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
  onCreate: () => void;
  isDeleting?: string | null;
}

export function PermissionsList({
  permissions,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
  isDeleting,
}: PermissionsListProps) {
  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      read: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      create: "bg-green-100 text-green-800 hover:bg-green-100",
      update: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      delete: "bg-red-100 text-red-800 hover:bg-red-100",
      manage: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    };
    return colors[action] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      read: "Lecture",
      create: "Création",
      update: "Modification",
      delete: "Suppression",
      manage: "Gestion",
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Liste des permissions</h2>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle permission
        </Button>
      </div>

      {permissions.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">Aucune permission trouvée</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-medium">
                    {permission.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {permission.resource}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize ${getActionColor(
                        permission.action
                      )}`}
                    >
                      {getActionLabel(permission.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {permission.description || "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(permission.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(permission)}
                        disabled={isDeleting === permission.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(permission)}
                        disabled={isDeleting === permission.id}
                      >
                        {isDeleting === permission.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
