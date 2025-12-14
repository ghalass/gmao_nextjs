// app/(main)/pannes/page.tsx - Version corrigée
"use client";

import { useState, useMemo } from "react";
import { usePannes } from "@/hooks/usePannes";
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
  Loader2,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  AlertTriangle,
} from "lucide-react";
import { PanneModal } from "@/components/pannes/PanneModal";
import { DeletePanneModal } from "@/components/pannes/DeletePanneModal";
import { Panne } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "typepanne";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  typepanne: string;
}

export default function PannesPage() {
  const { pannesQuery, createPanne, updatePanne, deletePanne } = usePannes();
  const { typepannesQuery } = useTypepannes();
  const typesPanne = typepannesQuery.data;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedPanne, setSelectedPanne] = useState<Panne | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    typepanne: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const handleCreate = (): void => {
    setSelectedPanne(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (panne: Panne): void => {
    setSelectedPanne(panne);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (panne: Panne): void => {
    setSelectedPanne(panne);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setError(null);
    setSelectedPanne(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setError(null);
    setSelectedPanne(null);
  };

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleColumnFilter = (
    column: keyof ColumnFilters,
    value: string
  ): void => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({
      name: "",
      typepanne: "",
    });
    setCurrentPage(1);
  };

  // Fonction pour récupérer les engins associés à une panne
  const getEnginsAssocies = (panne: Panne): string => {
    if (!panne.saisiehim || panne.saisiehim.length === 0) {
      return "Aucun engin";
    }

    const enginsNoms = panne.saisiehim
      .map((s) => s.engin?.name)
      .filter(Boolean)
      .slice(0, 2); // Limiter à 2 engins pour l'affichage

    return enginsNoms.join(", ") + (panne.saisiehim.length > 2 ? "..." : "");
  };

  // Fonction pour récupérer le nombre total d'engins associés
  const getNombreEngins = (panne: Panne): number => {
    if (!panne.saisiehim) return 0;

    // Créer un Set pour éliminer les doublons d'engins
    const enginsIds = new Set(
      panne.saisiehim
        .map((s) => s.enginId)
        .filter((id): id is string => id !== undefined)
    );

    return enginsIds.size;
  };

  const filteredAndSortedPannes = useMemo((): Panne[] => {
    if (!pannesQuery.data) return [];

    const filtered = pannesQuery.data.filter((panne: Panne) => {
      const globalMatch =
        globalSearch === "" ||
        panne.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (panne.typepanne?.name || "")
          .toLowerCase()
          .includes(globalSearch.toLowerCase());

      const nameMatch =
        columnFilters.name === "" ||
        panne.name.toLowerCase().includes(columnFilters.name.toLowerCase());

      const typepanneMatch =
        columnFilters.typepanne === "" ||
        (panne.typepanne?.name || "")
          .toLowerCase()
          .includes(columnFilters.typepanne.toLowerCase());

      return Boolean(globalMatch && nameMatch && typepanneMatch);
    });

    filtered.sort((a: Panne, b: Panne) => {
      let aValue: string | Date = "";
      let bValue: string | Date = "";

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "typepanne":
          aValue = a.typepanne?.name || "";
          bValue = b.typepanne?.name || "";
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (
        aValue &&
        bValue &&
        !isNaN(new Date(aValue).getTime()) &&
        !isNaN(new Date(bValue).getTime())
      ) {
        // Utilisez Date.parse pour convertir les strings en timestamps
        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }
      return 0;
    });

    return filtered;
  }, [pannesQuery.data, globalSearch, columnFilters, sortField, sortDirection]);

  const totalItems: number = filteredAndSortedPannes.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedPannes: Panne[] = showAll
    ? filteredAndSortedPannes
    : filteredAndSortedPannes.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || pannesQuery.error?.message || null;
  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  const handleExport = () => {
    if (paginatedPannes.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("pannes-table", "Pannes");
  };

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

  if (pannesQuery.isLoading) {
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
            <AlertTriangle className="h-8 w-8" />
            Gestion des pannes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les différentes pannes pouvant affecter vos engins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredAndSortedPannes.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle panne
          </Button>
        </div>
      </div>

      {displayError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou type..."
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
      </div>

      <div className="border rounded-lg bg-card">
        <Table id="pannes-table">
          <TableHeader>
            <TableRow>
              <SortableHeader field="name">
                <div className="space-y-2">
                  <div className="font-medium">Nom</div>
                  <Input
                    placeholder="Filtrer..."
                    value={columnFilters.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("name", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                  />
                </div>
              </SortableHeader>

              <SortableHeader field="typepanne">
                <div className="space-y-2">
                  <div className="font-medium">Type</div>
                  <Input
                    placeholder="Filtrer..."
                    value={columnFilters.typepanne}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("typepanne", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                  />
                </div>
              </SortableHeader>

              <TableHead className="font-medium">Description</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* {JSON.stringify(typesPanne)} */}
            {paginatedPannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="h-12 w-12 opacity-20" />
                    {pannesQuery.data?.length === 0
                      ? "Aucune panne trouvée"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedPannes.length === 0 &&
                      pannesQuery.data &&
                      pannesQuery.data.length > 0 && (
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
              paginatedPannes.map((panne: Panne) => (
                <TableRow key={panne.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{panne.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {panne.typepanne?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {panne.typepanne?.description || "Aucune description"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(panne)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(panne)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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

      {!showAll && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Affichage de <strong>{startIndex + 1}</strong> à{" "}
            <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong>{" "}
            sur <strong>{totalItems}</strong> pannes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev: number) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
            >
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
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <PanneModal
        open={isModalOpen}
        onClose={handleCloseModal}
        panne={selectedPanne}
        typesPanne={typesPanne || []}
        createPanne={createPanne}
        updatePanne={updatePanne}
      />

      <DeletePanneModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        panne={selectedPanne}
        deletePanne={deletePanne}
      />
    </div>
  );
}
