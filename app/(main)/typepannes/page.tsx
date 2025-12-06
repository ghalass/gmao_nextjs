// app/typepannes/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { useTypepannes } from "@/hooks/useTypepannes";
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
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
  Wrench,
} from "lucide-react";
import { TypepanneModal } from "@/components/typepannes/TypepanneModal";
import { DeleteTypepanneModal } from "@/components/typepannes/DeleteTypepanneModal";
import { Typepanne } from "@/hooks/useTypepannes";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SortField = "name" | "createdAt" | "pannesCount" | "parcsCount";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  description: string;
}

export default function TypepannesPage() {
  const { typepannesQuery, createTypepanne, updateTypepanne, deleteTypepanne } =
    useTypepannes();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedTypepanne, setSelectedTypepanne] = useState<Typepanne | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // États pour les fonctionnalités de tableau
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    description: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    description: HTMLInputElement | null;
  }>({
    name: null,
    description: null,
  });

  const handleCreate = (): void => {
    setSelectedTypepanne(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (typepanne: Typepanne): void => {
    setSelectedTypepanne(typepanne);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (typepanne: Typepanne): void => {
    setSelectedTypepanne(typepanne);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setError(null);
    setSelectedTypepanne(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setError(null);
    setSelectedTypepanne(null);
  };

  // Gestion du tri
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Gestion des filtres de colonnes avec conservation du focus
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

  // Réinitialiser tous les filtres
  const handleClearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({
      name: "",
      description: "",
    });
    setCurrentPage(1);
  };

  // Filtrage et tri des données
  const filteredAndSortedTypepannes = useMemo((): Typepanne[] => {
    if (!typepannesQuery.data) return [];

    const typepannesData = typepannesQuery.data as unknown as Typepanne[];
    let filtered = typepannesData.filter((typepanne: Typepanne) => {
      // Filtre global
      const globalMatch =
        globalSearch === "" ||
        typepanne.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (typepanne.description &&
          typepanne.description
            .toLowerCase()
            .includes(globalSearch.toLowerCase()));

      // Filtres par colonne
      const nameMatch =
        columnFilters.name === "" ||
        typepanne.name.toLowerCase().includes(columnFilters.name.toLowerCase());

      const descriptionMatch =
        columnFilters.description === "" ||
        (typepanne.description &&
          typepanne.description
            .toLowerCase()
            .includes(columnFilters.description.toLowerCase()));

      return Boolean(globalMatch && nameMatch && descriptionMatch);
    });

    // Tri
    filtered.sort((a: Typepanne, b: Typepanne) => {
      let aValue: string | number | Date = "";
      let bValue: string | number | Date = "";

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "pannesCount":
          aValue = a._count?.pannes || 0;
          bValue = b._count?.pannes || 0;
          break;
        case "parcsCount":
          aValue = a._count?.typepanneParc || 0;
          bValue = b._count?.typepanneParc || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === "string" && typeof bValue === "string") {
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
    typepannesQuery.data,
    globalSearch,
    columnFilters,
    sortField,
    sortDirection,
  ]);

  // Pagination améliorée avec option "Tout afficher"
  const totalItems: number = filteredAndSortedTypepannes.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedTypepannes: Typepanne[] = showAll
    ? filteredAndSortedTypepannes
    : filteredAndSortedTypepannes.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || typepannesQuery.error?.message || null;

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  // Fonction d'export Excel
  const handleExportToExcel = (): void => {
    try {
      // Préparer les données pour l'export
      const exportData = filteredAndSortedTypepannes.map(
        (typepanne: Typepanne) => ({
          Nom: typepanne.name,
          Description: typepanne.description || "",
          "Nombre de pannes": typepanne._count?.pannes || 0,
          "Nombre de parcs associés": typepanne._count?.typepanneParc || 0,
          "Date de création": typepanne.createdAt
            ? new Date(typepanne.createdAt).toLocaleDateString("fr-FR")
            : "",
          "Dernière modification": typepanne.updatedAt
            ? new Date(typepanne.updatedAt).toLocaleDateString("fr-FR")
            : "",
        })
      );

      if (exportData.length === 0) {
        setError("Aucune donnée à exporter");
        return;
      }

      // Convertir en CSV (format simple compatible avec Excel)
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
        `types_pannes_${new Date().toISOString().split("T")[0]}.csv`
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

  // Composant d'en-tête de colonne avec tri amélioré
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

  if (typepannesQuery.isLoading) {
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
            <Wrench className="h-8 w-8" />
            Gestion des types de panne
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les différents types de pannes pour catégoriser les anomalies
            des engins miniers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={filteredAndSortedTypepannes.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau type
          </Button>
        </div>
      </div>

      {displayError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* Barre de recherche globale améliorée */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou description..."
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
            {columnFilters.name && (
              <Badge variant="secondary" className="text-xs">
                Nom: "{columnFilters.name}"
              </Badge>
            )}
            {columnFilters.description && (
              <Badge variant="secondary" className="text-xs">
                Description: "{columnFilters.description}"
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Contrôles de pagination en haut améliorés */}
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
            {totalItems} type(s) de panne trouvé(s)
            {!showAll &&
              totalPages > 1 &&
              ` • Page ${currentPage}/${totalPages}`}
          </span>
        </div>

        {filteredAndSortedTypepannes.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedTypepannes.length} ligne(s) exportable(s)
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
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

              <TableHead>
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
              </TableHead>

              <SortableHeader field="pannesCount">
                <span className="font-medium">Pannes</span>
              </SortableHeader>

              <SortableHeader field="parcsCount">
                <span className="font-medium">Parcs associés</span>
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
            {paginatedTypepannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-12 w-12 opacity-20" />
                    {typepannesQuery.data?.length === 0
                      ? "Aucun type de panne trouvé"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedTypepannes.length === 0 &&
                      typepannesQuery.data &&
                      typepannesQuery.data.length > 0 && (
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
              paginatedTypepannes.map((typepanne: Typepanne) => (
                <TableRow key={typepanne.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{typepanne.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm text-muted-foreground truncate">
                      {typepanne.description || (
                        <span className="italic text-muted-foreground/60">
                          Aucune description
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={typepanne._count?.pannes ? "default" : "outline"}
                    >
                      {typepanne._count?.pannes || 0} panne(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        typepanne._count?.typepanneParc
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {typepanne._count?.typepanneParc || 0} parc(s)
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(typepanne.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(typepanne)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(typepanne)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={
                          (typepanne._count?.pannes || 0) > 0 ||
                          (typepanne._count?.typepanneParc || 0) > 0
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination en bas améliorée */}
      {!showAll && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Affichage de <strong>{startIndex + 1}</strong> à{" "}
            <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong>{" "}
            sur <strong>{totalItems}</strong> types de panne
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

      <TypepanneModal
        open={isModalOpen}
        onClose={handleCloseModal}
        typepanne={selectedTypepanne}
        createTypepanne={createTypepanne}
        updateTypepanne={updateTypepanne}
      />

      <DeleteTypepanneModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        typepanne={selectedTypepanne}
        deleteTypepanne={deleteTypepanne}
      />
    </div>
  );
}
