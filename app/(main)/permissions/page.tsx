// app/permissions/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { usePermissions, type Permission } from "@/hooks/usePermissions";
import { type PermissionFormData } from "@/lib/validations/permissionSchema";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldUser,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
} from "lucide-react";
import { PermissionModal } from "@/components/permissions/PermissionModal";
import { DeleteConfirmationModal } from "@/components/permissions/DeleteConfirmationModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "resource" | "action" | "createdAt" | "description";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  resource: string;
  action: string;
  description: string;
}

export default function PermissionsPage() {
  const {
    permissionsQuery,
    createPermission,
    updatePermission,
    deletePermission,
  } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🆕 États pour les nouvelles fonctionnalités
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    resource: "",
    action: "",
    description: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // 🆕 Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    resource: HTMLInputElement | null;
    action: HTMLInputElement | null;
    description: HTMLInputElement | null;
  }>({
    name: null,
    resource: null,
    action: null,
    description: null,
  });

  const handleCreate = (): void => {
    setSelectedPermission(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (permission: Permission): void => {
    setSelectedPermission(permission);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (permission: Permission): void => {
    setSelectedPermission(permission);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedPermission(null);
    setError(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedPermission(null);
    setError(null);
  };

  const handleSubmit = async (data: PermissionFormData): Promise<void> => {
    try {
      if (selectedPermission) {
        const apiData = {
          name: data.name,
          description: data.description,
          action: data.action,
          resource: data.resource,
        };
        await updatePermission.mutateAsync({
          id: selectedPermission.id,
          data: apiData,
        });
      } else {
        const apiData = {
          name: data.name,
          description: data.description,
          action: data.action,
          resource: data.resource,
        };
        await createPermission.mutateAsync(apiData);
      }
      setError(null);
      handleCloseModal();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur est survenue";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!selectedPermission) return;

    try {
      await deletePermission.mutateAsync(selectedPermission.id);
      setError(null);
      handleCloseDeleteModal();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression";
      setError(errorMessage);
    }
  };

  // 🆕 Gestion du tri
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // 🆕 Gestion des filtres de colonnes avec conservation du focus
  const handleColumnFilter = (
    column: keyof ColumnFilters,
    value: string
  ): void => {
    const activeElement = document.activeElement as HTMLInputElement;

    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);

    setTimeout(() => {
      if (activeElement && columnFilterRefs.current[column]) {
        columnFilterRefs.current[column]?.focus();
        if (columnFilterRefs.current[column]) {
          const input = columnFilterRefs.current[column] as HTMLInputElement;
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }, 0);
  };

  // 🆕 Réinitialiser tous les filtres
  const handleClearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({
      name: "",
      resource: "",
      action: "",
      description: "",
    });
    setCurrentPage(1);
  };

  // 🆕 Filtrage et tri des données
  const filteredAndSortedPermissions = useMemo((): Permission[] => {
    if (!permissionsQuery.data) return [];

    const filtered = permissionsQuery.data.filter((permission: Permission) => {
      // Filtre global
      const globalMatch =
        globalSearch === "" ||
        permission.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (permission.description
          ?.toLowerCase()
          .includes(globalSearch.toLowerCase()) ??
          false) ||
        permission.action.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (permission.resource
          ?.toLowerCase()
          .includes(globalSearch.toLowerCase()) ??
          false);

      // Filtres par colonne
      const nameMatch =
        columnFilters.name === "" ||
        permission.name
          .toLowerCase()
          .includes(columnFilters.name.toLowerCase());

      const resourceMatch =
        columnFilters.resource === "" ||
        (permission.resource
          ?.toLowerCase()
          .includes(columnFilters.resource.toLowerCase()) ??
          false);

      const actionMatch =
        columnFilters.action === "" ||
        permission.action
          .toLowerCase()
          .includes(columnFilters.action.toLowerCase());

      const descriptionMatch =
        columnFilters.description === "" ||
        (permission.description
          ?.toLowerCase()
          .includes(columnFilters.description.toLowerCase()) ??
          false);

      return Boolean(
        globalMatch &&
          nameMatch &&
          resourceMatch &&
          actionMatch &&
          descriptionMatch
      );
    });

    // Tri
    filtered.sort((a: Permission, b: Permission) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "resource":
          aValue = a.resource || "";
          bValue = b.resource || "";
          break;
        case "action":
          aValue = a.action;
          bValue = b.action;
          break;
        case "description":
          aValue = a.description || "";
          bValue = b.description || "";
          break;

        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return filtered;
  }, [
    permissionsQuery.data,
    globalSearch,
    columnFilters,
    sortField,
    sortDirection,
  ]);

  // 🆕 Pagination améliorée avec option "Tout afficher"
  const totalItems: number = filteredAndSortedPermissions.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedPermissions: Permission[] = showAll
    ? filteredAndSortedPermissions
    : filteredAndSortedPermissions.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || permissionsQuery.error?.message || null;

  // 🆕 Vérifier s'il y a des filtres actifs
  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  // 🆕 Fonction d'export Excel
  const handleExport = () => {
    if (paginatedPermissions.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("permissions-table", "Permissions");
  };

  // 🆕 Composant d'en-tête de colonne avec tri amélioré
  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1 group">
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`h-3 w-3 -mb-1 ${
              sortField === field && sortDirection === "asc"
                ? "text-primary"
                : "text-muted-foreground opacity-40"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortDirection === "desc"
                ? "text-primary"
                : "text-muted-foreground opacity-40"
            }`}
          />
        </div>
      </div>
    </TableHead>
  );

  // 🆕 Fonctions utilitaires pour les actions
  const getActionColor = (action: string): string => {
    const colors: { [key: string]: string } = {
      read: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      create: "bg-green-100 text-green-800 hover:bg-green-100",
      update: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      delete: "bg-red-100 text-red-800 hover:bg-red-100",
      manage: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    };
    return colors[action] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
  };

  const getActionLabel = (action: string): string => {
    const labels: { [key: string]: string } = {
      read: "Lecture",
      create: "Création",
      update: "Modification",
      delete: "Suppression",
      manage: "Gestion",
    };
    return labels[action] || action;
  };

  if (permissionsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldUser className="h-8 w-8" />
            Gestion des permissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les permissions du système
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🆕 Bouton d'export Excel */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredAndSortedPermissions.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle permission
          </Button>
        </div>
      </div>

      {displayError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* 🆕 Barre de recherche globale améliorée */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, ressource, action ou description..."
              value={globalSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer les filtres
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtres actifs</span>
            {globalSearch && (
              <Badge variant="secondary" className="text-xs">
                Recherche: "{globalSearch}"
              </Badge>
            )}
            {Object.entries(columnFilters).map(
              ([key, value]) =>
                value && (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: "{value}"
                  </Badge>
                )
            )}
          </div>
        )}
      </div>

      {/* 🆕 Contrôles de pagination en haut améliorés */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afficher</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value: string) => {
                const newItemsPerPage = value === "all" ? -1 : Number(value);
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Tout afficher</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {showAll ? "éléments" : "éléments par page"}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalItems} permission(s) trouvée(s)
            {!showAll &&
              totalPages > 1 &&
              ` • Page ${currentPage}/${totalPages}`}
          </span>
        </div>

        {/* 🆕 Info d'export */}
        {filteredAndSortedPermissions.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedPermissions.length} ligne(s) exportable(s)
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card">
        <Table id="permissions-table">
          <TableHeader>
            <TableRow>
              <SortableHeader field="name">
                <div className="space-y-2">
                  <div className="font-medium">Nom</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.name = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("name", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <SortableHeader field="resource">
                <div className="space-y-2">
                  <div className="font-medium">Ressource</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.resource = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.resource}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("resource", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <SortableHeader field="action">
                <div className="space-y-2">
                  <div className="font-medium">Action</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.action = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.action}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("action", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <SortableHeader field="description">
                <div className="space-y-2">
                  <div className="font-medium">Description</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.description = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("description", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <TableHead className="text-right">
                <span className="font-medium">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPermissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-12 w-12 opacity-20" />
                    {permissionsQuery.data?.length === 0
                      ? "Aucune permission trouvée"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedPermissions.length === 0 &&
                      permissionsQuery.data &&
                      permissionsQuery.data.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFilters}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Effacer les filtres
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPermissions.map((permission) => (
                <TableRow key={permission.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {permission.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {permission.resource || (
                        <span className="text-muted-foreground/50">N/A</span>
                      )}
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
                  <TableCell className="max-w-[300px] truncate">
                    {permission.description || (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(permission)}
                        className="h-8 w-8 p-0"
                        disabled={deletePermission.isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(permission)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deletePermission.isPending}
                      >
                        {deletePermission.isPending &&
                        selectedPermission?.id === permission.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 🆕 Pagination en bas améliorée */}
      {!showAll && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Affichage de <strong>{startIndex + 1}</strong> à{" "}
            <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong>{" "}
            sur <strong>{totalItems}</strong> permissions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev: number) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Suivant
              <ChevronUp className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      )}

      <PermissionModal
        open={isModalOpen}
        onClose={handleCloseModal}
        permission={selectedPermission ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createPermission.isPending || updatePermission.isPending}
        error={error ?? undefined}
        title={
          selectedPermission
            ? "Modifier la permission"
            : "Créer une nouvelle permission"
        }
        description={
          selectedPermission
            ? "Modifiez les informations de la permission"
            : "Remplissez les informations pour créer une nouvelle permission"
        }
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        permission={selectedPermission}
        isDeleting={
          deletePermission.isPending && selectedPermission?.id !== undefined
        }
      />
    </div>
  );
}
