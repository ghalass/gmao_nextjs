// components/resources/ResourcesList.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Folder,
  AlertCircle,
} from "lucide-react";
import { type Resource } from "@/hooks/useResources";

interface ResourcesListProps {
  resources: Resource[];
  isLoading: boolean;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onCreate: () => void;
  isDeleting: string | null;
}

export function ResourcesList({
  resources,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
  isDeleting,
}: ResourcesListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            Chargement des ressources...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Liste des ressources</CardTitle>
        <Button onClick={onCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle ressource
        </Button>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Aucune ressource</h3>
              <p className="text-muted-foreground mt-1">
                Commencez par créer votre première ressource
              </p>
            </div>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une ressource
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom technique</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Permissions associées</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-mono text-sm">
                      {resource.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {resource.label}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {resource.permissions &&
                        resource.permissions.length > 0 ? (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              {resource.permissions.length} permission(s)
                            </Badge>
                            {resource.permissions
                              .slice(0, 2)
                              .map((permission) => (
                                <Badge
                                  key={permission.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {permission.action}
                                </Badge>
                              ))}
                            {resource.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{resource.permissions.length - 2}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Aucune permission
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(resource.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(resource)}
                          disabled={isDeleting === resource.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(resource)}
                          disabled={
                            isDeleting === resource.id ||
                            (resource.permissions &&
                              resource.permissions.length > 0)
                          }
                        >
                          {isDeleting === resource.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                      {resource.permissions &&
                        resource.permissions.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            Impossible de supprimer
                          </p>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
