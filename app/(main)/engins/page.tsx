// app/(main)/engins/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { useEngins } from "@/hooks/useEngins";
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
  Truck,
} from "lucide-react";
import { EnginModal } from "@/components/engins/EnginModal";
import { DeleteEnginModal } from "@/components/engins/DeleteEnginModal";
import { Engin } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "parc" | "site" | "status" | "pannesCount";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  parc: string;
  site: string;
  status: string;
}

export default function EnginsPage() {
  const {
    enginsQuery,
    parcsQuery,
    sitesQuery,
    createEngin,
    updateEngin,
    deleteEngin,
    typeparcsQuery,
  } = useEngins();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedEngin, setSelectedEngin] = useState<Engin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    parc: "",
    site: "",
    status: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    parc: HTMLInputElement | null;
    site: HTMLInputElement | null;
    status: HTMLInputElement | null;
  }>({
    name: null,
    parc: null,
    site: null,
    status: null,
  });

  const handleCreate = (): void => {
    setSelectedEngin(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (engin: Engin): void => {
    setSelectedEngin(engin);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (engin: Engin): void => {
    setSelectedEngin(engin);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setError(null);
    setSelectedEngin(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setError(null);
    setSelectedEngin(null);
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

  const handleClearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({
      name: "",
      parc: "",
      site: "",
      status: "",
    });
    setCurrentPage(1);
  };

  const filteredAndSortedEngins = useMemo((): Engin[] => {
    if (!enginsQuery.data) return [];

    const enginsData = enginsQuery.data as unknown as Engin[];
    const filtered = enginsData.filter((engin: Engin) => {
      const globalMatch =
        globalSearch === "" ||
        engin?.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        engin?.parc?.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        engin?.site?.name.toLowerCase().includes(globalSearch.toLowerCase());

      const nameMatch =
        columnFilters.name === "" ||
        engin?.name.toLowerCase().includes(columnFilters.name.toLowerCase());

      const parcMatch =
        columnFilters.parc === "" ||
        engin?.parc?.name
          .toLowerCase()
          .includes(columnFilters.parc.toLowerCase());

      const siteMatch =
        columnFilters.site === "" ||
        engin?.site?.name
          .toLowerCase()
          .includes(columnFilters.site.toLowerCase());

      const statusMatch =
        columnFilters.status === "" ||
        (columnFilters.status === "actif" && engin?.active) ||
        (columnFilters.status === "inactif" && !engin?.active);

      return Boolean(
        globalMatch && nameMatch && parcMatch && siteMatch && statusMatch
      );
    });

    filtered.sort((a: any, b: any) => {
      let aValue: string | number | Date | boolean = "";
      let bValue: string | number | Date | boolean = "";

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "parc":
          aValue = a.parc?.name || "";
          bValue = b.parc?.name || "";
          break;
        case "site":
          aValue = a.site?.name || "";
          bValue = b.site?.name || "";
          break;
        case "status":
          aValue = a.active;
          bValue = b.active;
          break;
        case "pannesCount":
          aValue = a._count?.pannes || 0;
          bValue = b._count?.pannes || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return sortDirection === "asc"
          ? aValue === bValue
            ? 0
            : aValue
            ? -1
            : 1
          : aValue === bValue
          ? 0
          : aValue
          ? 1
          : -1;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      return 0;
    });

    return filtered;
  }, [enginsQuery.data, globalSearch, columnFilters, sortField, sortDirection]);

  const totalItems: number = filteredAndSortedEngins.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedEngins: Engin[] = showAll
    ? filteredAndSortedEngins
    : filteredAndSortedEngins.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || enginsQuery.error?.message || null;

  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  const handleExportToExcel = (): void => {
    try {
      exportExcel("my-table-id", "engins");
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      setError("Erreur lors de l'export des données");
    }
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

  if (
    enginsQuery.isLoading ||
    parcsQuery.isLoading ||
    sitesQuery.isLoading ||
    typeparcsQuery.isLoading
  ) {
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
            <Truck className="h-8 w-8" />
            Gestion des engins
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les engins miniers et leurs affectations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={filteredAndSortedEngins.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel engin
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
              placeholder="Rechercher par nom, parc ou site..."
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
                Recherche: {globalSearch}
              </Badge>
            )}
            {Object.entries(columnFilters).map(
              ([key, value]) =>
                value && (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {value}
                  </Badge>
                )
            )}
          </div>
        )}
      </div>

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
            {totalItems} engin(s) trouvé(s)
            {!showAll &&
              totalPages > 1 &&
              ` • Page ${currentPage}/${totalPages}`}
          </span>
        </div>

        {filteredAndSortedEngins.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedEngins.length} ligne(s) exportable(s)
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

              <SortableHeader field="parc">
                <div className="space-y-2">
                  <div className="font-medium">parc</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.parc = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.parc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("parc", e.target.value)
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

              <SortableHeader field="site">
                <div className="space-y-2">
                  <div className="font-medium">site</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.site = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.site}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("site", e.target.value)
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

              <SortableHeader field="status">
                <div className="space-y-2">
                  <div className="font-medium">Statut</div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.status = el;
                    }}
                    placeholder="actif/inactif"
                    value={columnFilters.status}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("status", e.target.value)
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

              <SortableHeader field="pannesCount">
                <span className="font-medium">Pannes</span>
              </SortableHeader>

              <TableHead className="text-right">
                <span className="font-medium">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEngins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-12 w-12 opacity-20" />
                    {enginsQuery.data?.length === 0
                      ? "Aucun engin trouvé"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedEngins.length === 0 &&
                      enginsQuery.data &&
                      enginsQuery.data.length > 0 && (
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
              paginatedEngins.map((engin: Engin) => (
                <TableRow key={engin?.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{engin?.name}</TableCell>
                  <TableCell>
                    <div>
                      <div>{engin?.parc?.name}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {engin?.parc?.typeparc?.name || "N/A"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{engin?.site?.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={engin?.active ? "default" : "secondary"}>
                      {engin?.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {engin?._count?.pannes || 0} panne(s)
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(engin)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(engin)}
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
            sur <strong>{totalItems}</strong> engins
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

      <EnginModal
        open={isModalOpen}
        onClose={handleCloseModal}
        engin={selectedEngin}
        parcs={parcsQuery.data || []}
        sites={sitesQuery.data || []}
        typeparcs={typeparcsQuery.data || []} // ← Ajouté
        createEngin={createEngin}
        updateEngin={updateEngin}
      />

      <DeleteEnginModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        engin={selectedEngin}
        deleteEngin={deleteEngin}
      />
    </div>
  );
}
