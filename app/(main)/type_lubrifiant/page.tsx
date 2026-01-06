// app/(main)/type_lubrifiant/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import {
  useTypelubrifiant,
  type Typelubrifiant,
} from "@/hooks/useTypelubrifiant";
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
  Droplet,
} from "lucide-react";
import { TypelubrifiantModal } from "@/components/type_lubrifiant/TypelubrifiantModal";
import { DeleteTypelubrifiantModal } from "@/components/type_lubrifiant/DeleteTypelubrifiantModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type TypelubrifiantFormData } from "@/lib/validations/type_lubrifiantSchema";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "lubrifiantsCount";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
}

export default function TypeLubrifiantPage() {
  const {
    typelubrifiantQuery,
    createTypelubrifiant,
    updateTypelubrifiant,
    deleteTypelubrifiant,
  } = useTypelubrifiant();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedTypeLubrifiant, setSelectedTypeLubrifiant] =
    useState<Typelubrifiant | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour les fonctionnalités avancées
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
  }>({
    name: null,
  });

  const handleCreate = (): void => {
    setSelectedTypeLubrifiant(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (typeLubrifiant: Typelubrifiant): void => {
    setSelectedTypeLubrifiant(typeLubrifiant);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (typeLubrifiant: Typelubrifiant): void => {
    setSelectedTypeLubrifiant(typeLubrifiant);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedTypeLubrifiant(null);
    setError(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedTypeLubrifiant(null);
    setError(null);
  };

  const handleSubmit = async (data: TypelubrifiantFormData): Promise<void> => {
    try {
      setError(null);
      if (selectedTypeLubrifiant) {
        await updateTypelubrifiant.mutateAsync({
          id: selectedTypeLubrifiant.id,
          data,
        });
      } else {
        await createTypelubrifiant.mutateAsync(data);
      }
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedTypeLubrifiant) return;

    try {
      setError(null);
      await deleteTypelubrifiant.mutateAsync(selectedTypeLubrifiant.id);
      handleCloseDeleteModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  // Filtrage et tri
  const filteredAndSortedData = useMemo(() => {
    if (!typelubrifiantQuery.data) return [];

    let filtered = typelubrifiantQuery.data.filter((item) => {
      // Recherche globale
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        if (!item.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtres par colonne
      if (
        columnFilters.name &&
        !item.name.toLowerCase().includes(columnFilters.name.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "lubrifiantsCount":
          aValue = a._count?.lubrifiants || 0;
          bValue = b._count?.lubrifiants || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    typelubrifiantQuery.data,
    globalSearch,
    columnFilters,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExportExcel = (): void => {
    const tableId = "type-lubrifiant-table";
    const table = document.getElementById(tableId);

    if (!table) {
      console.error(`Table avec ID "${tableId}" non trouvée`);
      return;
    }

    exportExcel(
      tableId,
      `types-lubrifiants-${new Date().toISOString().split("T")[0]}`
    );
  };

  const clearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({ name: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters = globalSearch || columnFilters.name;

  if (typelubrifiantQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (typelubrifiantQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {typelubrifiantQuery.error?.message ||
            "Erreur lors du chargement des types de lubrifiant"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Droplet className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Types de Lubrifiant
            </h1>
            <p className="text-muted-foreground">
              Gérez les différents types de lubrifiants utilisés dans votre parc
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Type
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filtres</h3>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Effacer les filtres
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recherche globale */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Recherche globale..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre par nom */}
          <Input
            placeholder="Filtrer par nom..."
            value={columnFilters.name}
            onChange={(e) =>
              setColumnFilters({ ...columnFilters, name: e.target.value })
            }
          />

          {/* Pagination */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="25">25 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
              <SelectItem value="100">100 par page</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Excel */}
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table id="type-lubrifiant-table">
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-semibold"
                >
                  Nom
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("lubrifiantsCount")}
                  className="h-auto p-0 font-semibold"
                >
                  Lubrifiants
                  {sortField === "lubrifiantsCount" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  {hasActiveFilters
                    ? "Aucun résultat trouvé"
                    : "Aucun type de lubrifiant trouvé"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((typeLubrifiant) => (
                <TableRow key={typeLubrifiant.id}>
                  <TableCell className="font-medium">
                    {typeLubrifiant.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        typeLubrifiant._count?.lubrifiants
                          ? "default"
                          : "secondary"
                      }
                    >
                      {typeLubrifiant._count?.lubrifiants || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(typeLubrifiant)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(typeLubrifiant)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}{" "}
            sur {filteredAndSortedData.length} résultats
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Modal de création/modification */}
      <TypelubrifiantModal
        open={isModalOpen}
        onClose={handleCloseModal}
        typeLubrifiant={selectedTypeLubrifiant || undefined}
        onSubmit={handleSubmit}
        isSubmitting={
          createTypelubrifiant.isPending || updateTypelubrifiant.isPending
        }
        error={error || undefined}
        title={
          selectedTypeLubrifiant
            ? "Modifier le type de lubrifiant"
            : "Nouveau type de lubrifiant"
        }
        description={
          selectedTypeLubrifiant
            ? "Modifiez les informations du type de lubrifiant"
            : "Ajoutez un nouveau type de lubrifiant à votre catalogue"
        }
      />

      {/* Modal de suppression */}
      <DeleteTypelubrifiantModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        typeLubrifiant={selectedTypeLubrifiant}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteTypelubrifiant.isPending}
        error={error || undefined}
      />
    </div>
  );
}
