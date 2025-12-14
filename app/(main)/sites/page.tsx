// app/sites/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { useSites, type Site } from "@/hooks/useSites";
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
  MapPin,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
  Globe,
} from "lucide-react";
import { SiteModal } from "@/components/sites/SiteModal";
import { DeleteSiteModal } from "@/components/sites/DeleteSiteModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type SiteFormData } from "@/lib/validations/siteSchema";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "active";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  active: string;
}

export default function SitesPage() {
  const { sitesQuery, createSite, updateSite, deleteSite } = useSites();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🆕 États pour les nouvelles fonctionnalités
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    active: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // 🆕 Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    active: HTMLInputElement | null;
  }>({
    name: null,
    active: null,
  });

  const handleCreate = (): void => {
    setSelectedSite(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (site: Site): void => {
    setSelectedSite(site);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (site: Site): void => {
    setSelectedSite(site);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedSite(null);
    setError(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedSite(null);
    setError(null);
  };

  const handleSubmit = async (data: SiteFormData): Promise<void> => {
    try {
      if (selectedSite) {
        await updateSite.mutateAsync({ id: selectedSite.id, data });
      } else {
        await createSite.mutateAsync(data);
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
    // Sauvegarder l'élément actif avant la mise à jour
    const activeElement = document.activeElement as HTMLInputElement;

    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);

    // Restaurer le focus après le re-rendu
    setTimeout(() => {
      if (activeElement && columnFilterRefs.current[column]) {
        columnFilterRefs.current[column]?.focus();
        // Optionnel: replacer le curseur à la fin du texte
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
      active: "",
    });
    setCurrentPage(1);
  };

  // 🆕 Filtrage et tri des données
  const filteredAndSortedSites = useMemo((): Site[] => {
    if (!sitesQuery.data) return [];

    const filtered = sitesQuery.data.filter((site: Site) => {
      // Filtre global
      const globalMatch =
        globalSearch === "" ||
        site.name.toLowerCase().includes(globalSearch.toLowerCase());

      // Filtres par colonne
      const nameMatch =
        columnFilters.name === "" ||
        site.name.toLowerCase().includes(columnFilters.name.toLowerCase());

      const activeMatch =
        columnFilters.active === "" ||
        (columnFilters.active === "actif" && site.active) ||
        (columnFilters.active === "inactif" && !site.active);

      return Boolean(globalMatch && nameMatch && activeMatch);
    });

    // Tri
    filtered.sort((a: Site, b: Site) => {
      let aValue: string | number | Date | boolean = "";
      let bValue: string | number | Date | boolean = "";

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "active":
          aValue = a.active;
          bValue = b.active;
          break;

        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
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
      }
      return 0;
    });

    return filtered;
  }, [sitesQuery.data, globalSearch, columnFilters, sortField, sortDirection]);

  // 🆕 Pagination améliorée avec option "Tout afficher"
  const totalItems: number = filteredAndSortedSites.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedSites: Site[] = showAll
    ? filteredAndSortedSites
    : filteredAndSortedSites.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || sitesQuery.error?.message || null;

  // 🆕 Vérifier s'il y a des filtres actifs
  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  // 🆕 Fonction d'export Excel
  const handleExport = () => {
    if (paginatedSites.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("sites-table", "Sites");
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

  if (sitesQuery.isLoading) {
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
            <MapPin className="h-8 w-8" />
            Gestion des sites
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les sites de votre application
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🆕 Bouton d'export Excel */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredAndSortedSites.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau site
          </Button>
        </div>
      </div>

      {displayError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* 🆕 Barre de recherche globale améliorée */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
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
            {totalItems} site(s) trouvé(s)
            {!showAll &&
              totalPages > 1 &&
              ` • Page ${currentPage}/${totalPages}`}
          </span>
        </div>

        {/* 🆕 Info d'export */}
        {filteredAndSortedSites.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedSites.length} ligne(s) exportable(s)
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card">
        <Table id="sites-table">
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

              <SortableHeader field="active">
                <div className="space-y-2">
                  <div className="font-medium">Statut</div>
                  <Select
                    value={columnFilters.active}
                    onValueChange={(value: string) =>
                      handleColumnFilter("active", value)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-full">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>{" "}
                      {/* ← Changed from "" to "all" */}
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SortableHeader>

              <TableHead className="text-right">
                <span className="font-medium">Nombre des engins</span>
              </TableHead>

              <TableHead className="text-right">
                <span className="font-medium">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Globe className="h-12 w-12 opacity-20" />
                    {sitesQuery.data?.length === 0
                      ? "Aucun site trouvé"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedSites.length === 0 &&
                      sitesQuery.data &&
                      sitesQuery.data.length > 0 && (
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
              paginatedSites.map((site: Site) => (
                <TableRow key={site.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={site.active ? "default" : "secondary"}
                      className={
                        site.active
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {site.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground ">
                    {site?._count?.engins}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(site)}
                        className="h-8 w-8 p-0"
                        disabled={deleteSite.isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(site)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deleteSite.isPending}
                      >
                        {deleteSite.isPending &&
                        selectedSite?.id === site.id ? (
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
            sur <strong>{totalItems}</strong> sites
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

      <SiteModal
        open={isModalOpen}
        onClose={handleCloseModal}
        site={selectedSite ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createSite.isPending || updateSite.isPending}
        error={error ?? undefined}
        title={selectedSite ? "Modifier le site" : "Créer un nouveau site"}
        description={
          selectedSite
            ? "Modifiez les informations du site"
            : "Remplissez les informations pour créer un nouveau site"
        }
      />

      <DeleteSiteModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        site={selectedSite}
        deleteSite={deleteSite}
      />
    </div>
  );
}
