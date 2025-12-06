"use client";

import { useState, useMemo, useRef } from "react";
import { useResources } from "@/hooks/useResources";
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
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
} from "lucide-react";
import { ResourceModal } from "@/components/resources/ResourceModal";
import { DeleteConfirmationModal } from "@/components/resources/DeleteConfirmationModal";
import { Resource, ResourceCreateDto } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SortField = "name" | "label" | "createdAt" | "permissions";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  label: string;
  permissions: string;
}

export default function ResourcesPage() {
  const { resourcesQuery, createResource, updateResource, deleteResource } =
    useResources();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // 🆕 États pour les nouvelles fonctionnalités
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    label: "",
    permissions: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // 🆕 Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    label: HTMLInputElement | null;
    permissions: HTMLInputElement | null;
  }>({
    name: null,
    label: null,
    permissions: null,
  });

  const handleCreate = (): void => {
    setSelectedResource(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (resource: Resource): void => {
    setSelectedResource(resource);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (resource: Resource): void => {
    setSelectedResource(resource);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedResource(null);
    setError(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedResource(null);
    setError(null);
  };

  const handleSubmit = async (data: ResourceCreateDto): Promise<void> => {
    try {
      if (selectedResource) {
        const { id, ...resourceData } = data as any;
        await updateResource.mutateAsync({
          id: selectedResource.id,
          data: resourceData,
        });
      } else {
        await createResource.mutateAsync(data);
      }
      setError(null);
      handleCloseModal();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur est survenue";
      setError(errorMessage);
      throw error;
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!selectedResource) return;

    try {
      await deleteResource.mutateAsync(selectedResource.id);
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
      label: "",
      permissions: "",
    });
    setCurrentPage(1);
  };

  // 🆕 Filtrage et tri des données
  const filteredAndSortedResources = useMemo((): Resource[] => {
    if (!resourcesQuery.data) return [];

    let filtered = (resourcesQuery.data as any[]).filter((resource: any) => {
      // Filtre global
      const globalMatch =
        globalSearch === "" ||
        resource.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        resource.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
        Boolean(
          resource.permissions?.some((permission: { name: string }) =>
            permission.name.toLowerCase().includes(globalSearch.toLowerCase())
          )
        );

      // Filtres par colonne
      const nameMatch =
        columnFilters.name === "" ||
        resource.name.toLowerCase().includes(columnFilters.name.toLowerCase());

      const labelMatch =
        columnFilters.label === "" ||
        resource.label
          .toLowerCase()
          .includes(columnFilters.label.toLowerCase());

      const permissionsMatch =
        columnFilters.permissions === "" ||
        Boolean(
          resource.permissions?.some((permission: { name: string }) =>
            permission.name
              .toLowerCase()
              .includes(columnFilters.permissions.toLowerCase())
          )
        );

      return Boolean(
        globalMatch && nameMatch && labelMatch && permissionsMatch
      );
    });

    // Tri
    filtered.sort((a: Resource, b: Resource) => {
      let aValue: string | number | Date = "";
      let bValue: string | number | Date = "";

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "label":
          aValue = a.label;
          bValue = b.label;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "permissions":
          aValue = a.permissions?.[0]?.name || "";
          bValue = b.permissions?.[0]?.name || "";
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      return 0;
    });

    return filtered;
  }, [
    resourcesQuery.data,
    globalSearch,
    columnFilters,
    sortField,
    sortDirection,
  ]);

  // 🆕 Pagination améliorée avec option "Tout afficher"
  const totalItems: number = filteredAndSortedResources.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedResources: Resource[] = showAll
    ? filteredAndSortedResources
    : filteredAndSortedResources.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || resourcesQuery.error?.message || null;

  // 🆕 Vérifier s'il y a des filtres actifs
  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  // 🆕 Fonction d'export Excel
  const handleExportToExcel = (): void => {
    try {
      // Préparer les données pour l'export
      const exportData = filteredAndSortedResources.map(
        (resource: Resource) => ({
          "Nom technique": resource.name,
          Libellé: resource.label,
          "Permissions associées":
            resource.permissions?.map((p) => p.name).join(", ") || "Aucune",
          "Nombre de permissions": resource.permissions?.length || 0,
          "Date de création": resource.createdAt
            ? new Date(resource.createdAt).toLocaleDateString("fr-FR")
            : "",
          "Dernière modification": resource.updatedAt
            ? new Date(resource.updatedAt).toLocaleDateString("fr-FR")
            : "",
        })
      );

      // Convertir en CSV
      const headers = Object.keys(exportData[0] || {}).join(";");
      const csvData = exportData
        .map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(";")
        )
        .join("\n");

      const csvContent = `${headers}\n${csvData}`;

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ressources_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      setError("Erreur lors de l'export des données");
    }
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

  if (resourcesQuery.isLoading) {
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
            <FileText className="h-8 w-8" />
            Gestion des ressources
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les ressources et leurs permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🆕 Bouton d'export Excel */}
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={filteredAndSortedResources.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle ressource
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
              placeholder="Rechercher par nom, libellé ou permissions..."
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
            {totalItems} ressource(s) trouvée(s)
            {!showAll &&
              totalPages > 1 &&
              ` • Page ${currentPage}/${totalPages}`}
          </span>
        </div>

        {/* 🆕 Info d'export */}
        {filteredAndSortedResources.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedResources.length} ligne(s) exportable(s)
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="name">
                <div className="space-y-2">
                  <div className="font-medium">Nom technique</div>
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

              <SortableHeader field="label">
                <div className="space-y-2">
                  <div className="font-medium">Libellé</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.label = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.label}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("label", e.target.value)
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

              <SortableHeader field="permissions">
                <div className="space-y-2">
                  <div className="font-medium">Permissions associées</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.permissions = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.permissions}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("permissions", e.target.value)
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

              <SortableHeader field="createdAt">
                <span className="font-medium">Date de création</span>
              </SortableHeader>

              <TableHead className="text-right">
                <span className="font-medium">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 opacity-20" />
                    {resourcesQuery.data?.length === 0
                      ? "Aucune ressource trouvée"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedResources.length === 0 &&
                      resourcesQuery.data &&
                      resourcesQuery.data.length > 0 && (
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
              paginatedResources.map((resource) => (
                <TableRow key={resource.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      {resource.name}
                    </code>
                  </TableCell>
                  <TableCell>{resource.label}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {resource.permissions &&
                      resource.permissions.length > 0 ? (
                        <>
                          {resource.permissions
                            .slice(0, 3)
                            .map((permission) => (
                              <Badge
                                key={permission.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {permission.name}
                              </Badge>
                            ))}
                          {resource.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.permissions.length - 3}
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
                  <TableCell className="text-muted-foreground">
                    {new Date(resource.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(resource)}
                        className="h-8 w-8 p-0"
                        disabled={deleteResource.isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resource)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deleteResource.isPending}
                      >
                        {deleteResource.isPending &&
                        selectedResource?.id === resource.id ? (
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
            sur <strong>{totalItems}</strong> ressources
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

      <ResourceModal
        open={isModalOpen}
        onClose={handleCloseModal}
        resource={selectedResource ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createResource.isPending || updateResource.isPending}
        error={error || undefined}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        resource={selectedResource}
        isDeleting={
          deleteResource.isPending && selectedResource?.id !== undefined
        }
      />
    </div>
  );
}
