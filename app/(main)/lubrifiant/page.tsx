// app/(main)/lubrifiant/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { useLubrifiant, type Lubrifiant } from "@/hooks/useLubrifiant";
import { useTypelubrifiant } from "@/hooks/useTypelubrifiant";
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
import { LubrifiantModal } from "@/components/lubrifiant/LubrifiantModal";
import { DeleteLubrifiantModal } from "@/components/lubrifiant/DeleteLubrifiantModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type LubrifiantFormData } from "@/lib/validations/lubrifiantSchema";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "typelubrifiant" | "parcsCount";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  typelubrifiantId: string;
}

export default function LubrifiantPage() {
  const {
    lubrifiantQuery,
    createLubrifiant,
    updateLubrifiant,
    deleteLubrifiant,
  } = useLubrifiant();

  const { typelubrifiantQuery } = useTypelubrifiant();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedLubrifiant, setSelectedLubrifiant] =
    useState<Lubrifiant | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour les fonctionnalités avancées
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    typelubrifiantId: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    typelubrifiantId: HTMLInputElement | null;
  }>({
    name: null,
    typelubrifiantId: null,
  });

  const handleCreate = (): void => {
    setSelectedLubrifiant(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lubrifiant: Lubrifiant): void => {
    setSelectedLubrifiant(lubrifiant);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (lubrifiant: Lubrifiant): void => {
    setSelectedLubrifiant(lubrifiant);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedLubrifiant(null);
    setError(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedLubrifiant(null);
    setError(null);
  };

  const handleSubmit = async (data: LubrifiantFormData): Promise<void> => {
    try {
      setError(null);
      // Nettoyer les parcIds pour s'assurer qu'il n'y a que des strings
      const cleanParcIds = data.parcIds.filter(
        (id): id is string => id !== undefined && id !== null && id !== ""
      );

      // Forcer le type de manière plus radicale
      const cleanData: any = {
        name: data.name,
        typelubrifiantId: data.typelubrifiantId,
        parcIds: cleanParcIds,
      };

      if (selectedLubrifiant) {
        await updateLubrifiant.mutateAsync({
          id: selectedLubrifiant.id,
          data: cleanData,
        });
      } else {
        await createLubrifiant.mutateAsync(cleanData);
      }
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedLubrifiant) return;

    try {
      setError(null);
      await deleteLubrifiant.mutateAsync(selectedLubrifiant.id);
      handleCloseDeleteModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  // Filtrage et tri
  const filteredAndSortedData = useMemo(() => {
    if (!lubrifiantQuery.data) return [];

    let filtered = lubrifiantQuery.data.filter((item) => {
      // Recherche globale
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        if (
          !item.name.toLowerCase().includes(searchLower) &&
          !item.typelubrifiant?.name.toLowerCase().includes(searchLower)
        ) {
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

      if (
        columnFilters.typelubrifiantId &&
        item.typelubrifiantId !== columnFilters.typelubrifiantId
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
        case "typelubrifiant":
          aValue = a.typelubrifiant?.name.toLowerCase() || "";
          bValue = b.typelubrifiant?.name.toLowerCase() || "";
          break;
        case "parcsCount":
          aValue = a.parcs?.length || 0;
          bValue = b.parcs?.length || 0;
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
    lubrifiantQuery.data,
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
    const tableId = "lubrifiant-table";
    const table = document.getElementById(tableId);

    if (!table) {
      console.error(`Table avec ID "${tableId}" non trouvée`);
      return;
    }

    exportExcel(
      tableId,
      `lubrifiants-${new Date().toISOString().split("T")[0]}`
    );
  };

  const clearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({ name: "", typelubrifiantId: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    globalSearch || columnFilters.name || columnFilters.typelubrifiantId;

  if (lubrifiantQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (lubrifiantQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {lubrifiantQuery.error?.message ||
            "Erreur lors du chargement des lubrifiants"}
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
            <h1 className="text-3xl font-bold tracking-tight">Lubrifiants</h1>
            <p className="text-muted-foreground">
              Gérez les lubrifiants utilisés dans votre parc
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Lubrifiant
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

          {/* Filtre par type de lubrifiant */}
          <Select
            value={columnFilters.typelubrifiantId || "all"}
            onValueChange={(value) =>
              setColumnFilters({
                ...columnFilters,
                typelubrifiantId: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {typelubrifiantQuery.data?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        </div>

        {/* Export Excel */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table id="lubrifiant-table">
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
                  onClick={() => handleSort("typelubrifiant")}
                  className="h-auto p-0 font-semibold"
                >
                  Type
                  {sortField === "typelubrifiant" &&
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
                  onClick={() => handleSort("parcsCount")}
                  className="h-auto p-0 font-semibold"
                >
                  Parcs
                  {sortField === "parcsCount" &&
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
                <TableCell colSpan={4} className="text-center py-8">
                  {hasActiveFilters
                    ? "Aucun résultat trouvé"
                    : "Aucun lubrifiant trouvé"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((lubrifiant) => {
                const parcsCount = lubrifiant.parcs?.length || 0;
                return (
                  <TableRow key={lubrifiant.id}>
                    <TableCell className="font-medium">
                      {lubrifiant.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {lubrifiant.typelubrifiant?.name || "Non défini"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={parcsCount > 0 ? "default" : "secondary"}>
                        {parcsCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lubrifiant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lubrifiant)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
      <LubrifiantModal
        open={isModalOpen}
        onClose={handleCloseModal}
        lubrifiant={selectedLubrifiant || undefined}
        onSubmit={handleSubmit}
        isSubmitting={createLubrifiant.isPending || updateLubrifiant.isPending}
        error={error || undefined}
        title={
          selectedLubrifiant ? "Modifier le lubrifiant" : "Nouveau lubrifiant"
        }
        description={
          selectedLubrifiant
            ? "Modifiez les informations du lubrifiant"
            : "Ajoutez un nouveau lubrifiant à votre catalogue"
        }
      />

      {/* Modal de suppression */}
      <DeleteLubrifiantModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        lubrifiant={selectedLubrifiant}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteLubrifiant.isPending}
        error={error || undefined}
      />
    </div>
  );
}
