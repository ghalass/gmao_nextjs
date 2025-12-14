"use client";

import { useState, useMemo, useEffect } from "react";
import { useSites } from "@/hooks/useSites";
import { useRapportRje } from "@/hooks/useRapportRje";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableHeader,
  TableBody,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Search,
  Loader2,
  MapPin,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Filter,
  Settings,
  Columns,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Building,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import { exportExcel } from "@/lib/xlsxFn";

// Toutes les colonnes possibles avec type de tri
const ALL_COLUMNS = [
  { key: "engin", label: "ENGIN", sortable: true, category: "identité" },
  { key: "siteName", label: "SITE", sortable: true, category: "identité" },
  { key: "parcName", label: "PARC", sortable: true, category: "identité" },

  {
    key: "dispo_j",
    label: "DISP J",
    sortable: true,
    category: "disponibilité",
  },
  {
    key: "dispo_m",
    label: "DISP M",
    sortable: true,
    category: "disponibilité",
  },
  {
    key: "dispo_a",
    label: "DISP C",
    sortable: true,
    category: "disponibilité",
  },

  { key: "tdm_j", label: "TDM J", sortable: true, category: "tdm" },
  { key: "tdm_m", label: "TDM M", sortable: true, category: "tdm" },
  { key: "tdm_a", label: "TDM C", sortable: true, category: "tdm" },

  { key: "mtbf_j", label: "MTBF J", sortable: true, category: "mtbf" },
  { key: "mtbf_m", label: "MTBF M", sortable: true, category: "mtbf" },
  { key: "mtbf_a", label: "MTBF C", sortable: true, category: "mtbf" },

  { key: "nho_j", label: "NHO J", sortable: true, category: "heures" },
  { key: "nho_m", label: "NHO M", sortable: true, category: "heures" },
  { key: "nho_a", label: "NHO A", sortable: true, category: "heures" },

  { key: "him_j", label: "HIM J", sortable: true, category: "heures" },
  { key: "him_m", label: "HIM M", sortable: true, category: "heures" },
  { key: "him_a", label: "HIM A", sortable: true, category: "heures" },

  { key: "hrm_j", label: "HRM J", sortable: true, category: "heures" },
  { key: "hrm_m", label: "HRM M", sortable: true, category: "heures" },
  { key: "hrm_a", label: "HRM A", sortable: true, category: "heures" },

  { key: "ni_j", label: "NI J", sortable: true, category: "incidents" },
  { key: "ni_m", label: "NI M", sortable: true, category: "incidents" },
  { key: "ni_a", label: "NI A", sortable: true, category: "incidents" },

  {
    key: "objectif_dispo",
    label: "OBJ DISP",
    sortable: true,
    category: "objectifs",
  },
  {
    key: "objectif_mtbf",
    label: "OBJ MTBF",
    sortable: true,
    category: "objectifs",
  },
  {
    key: "objectif_tdm",
    label: "OBJ TDM",
    sortable: true,
    category: "objectifs",
  },
];

// Catégories de colonnes
const COLUMN_CATEGORIES = [
  { id: "identité", label: "Identité", icon: <Info className="h-3 w-3" /> },
  {
    id: "disponibilité",
    label: "Disponibilité",
    icon: <Check className="h-3 w-3" />,
  },
  { id: "tdm", label: "TDM", icon: <AlertCircle className="h-3 w-3" /> },
  { id: "mtbf", label: "MTBF", icon: <AlertCircle className="h-3 w-3" /> },
  { id: "heures", label: "Heures", icon: <Calendar className="h-3 w-3" /> },
  { id: "incidents", label: "Incidents", icon: <X className="h-3 w-3" /> },
  { id: "objectifs", label: "Objectifs", icon: <Filter className="h-3 w-3" /> },
];

// Colonnes visibles par défaut
const DEFAULT_VISIBLE_COLUMNS = [
  "engin",
  "siteName",
  "parcName",
  "dispo_j",
  "dispo_m",
  "dispo_a",
  "tdm_j",
  "tdm_m",
  "tdm_a",
  "mtbf_j",
  "mtbf_m",
  "mtbf_a",
];

// Options de pagination
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, "Tout"];

export default function RapportRjePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [siteFilter, setSiteFilter] = useState("");
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showDateAlert, setShowDateAlert] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [currentReportDate, setCurrentReportDate] = useState("");

  // États pour le tri
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(25);

  // États UI supplémentaires
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [highlightTargets, setHighlightTargets] = useState(true);

  const { sitesQuery } = useSites();
  const sites = sitesQuery.data ?? [];

  // Utilisez une date vide initialement, puis la date actuelle seulement quand shouldFetch est true
  const rapportQuery = useRapportRje(shouldFetch ? date : "");

  const data = rapportQuery.data ?? [];

  // Gestion du changement de date
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setShouldFetch(false);
    resetPaginationAndSort();
  };

  // Fonction pour générer le rapport
  const handleGenerateReport = () => {
    if (!date) {
      setShowDateAlert(true);
      return;
    }

    setShouldFetch(true);
    setCurrentReportDate(date);
    resetPaginationAndSort();
  };

  // Fonction pour rafraîchir
  const handleRefresh = () => {
    if (!date) {
      setShowDateAlert(true);
      return;
    }

    rapportQuery.refetch();
  };

  // Réinitialiser pagination et tri
  const resetPaginationAndSort = () => {
    setCurrentPage(1);
    setSortColumn(null);
    setSortDirection("asc");
  };

  // Gestion du tri
  const handleSort = (columnKey: string) => {
    if (!ALL_COLUMNS.find((col) => col.key === columnKey)?.sortable) return;

    if (sortColumn === columnKey) {
      // Inverser la direction si même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, tri ascendant par défaut
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Retour à la première page après tri
  };

  // Filtrage
  const filtered = useMemo(() => {
    if (!data.length) return [];

    let result = data.filter((item) => {
      const matchSite = siteFilter === "" || item.siteId === siteFilter;
      const q = search.toLowerCase();
      const matchSearch =
        item.engin.toLowerCase().includes(q) ||
        (item.parcName ?? "").toLowerCase().includes(q) ||
        (item.siteName ?? "").toLowerCase().includes(q);
      return matchSite && matchSearch;
    });

    // Tri
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortColumn as keyof typeof a];
        const bValue = b[sortColumn as keyof typeof b];

        // Gestion des valeurs null/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? -1 : 1;
        if (bValue == null) return sortDirection === "asc" ? 1 : -1;

        // Tri numérique ou alphabétique
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortDirection === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [data, siteFilter, search, sortColumn, sortDirection]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (pageSize === "all") {
      return filtered;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, pageSize]);

  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(filtered.length / pageSize);

  // Navigation des pages
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Gestion des colonnes
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCategory = (categoryId: string) => {
    const categoryColumns = ALL_COLUMNS.filter(
      (col) => col.category === categoryId
    ).map((col) => col.key);

    const allSelected = categoryColumns.every((col) =>
      visibleColumns.includes(col)
    );

    if (allSelected) {
      // Désélectionner toutes les colonnes de la catégorie
      setVisibleColumns((prev) =>
        prev.filter((col) => !categoryColumns.includes(col))
      );
    } else {
      // Sélectionner toutes les colonnes de la catégorie
      setVisibleColumns((prev) => [...new Set([...prev, ...categoryColumns])]);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  // Couleur selon objectif avec support dark mode
  const getCellColor = (
    value: any,
    type: "dispo" | "mtbf" | "tdm",
    row: any
  ) => {
    if (!highlightTargets) return "";

    const val = parseFloat(value);
    let obj: number | undefined;
    if (type === "dispo") obj = parseFloat(row.objectif_dispo);
    if (type === "mtbf") obj = parseFloat(row.objectif_mtbf);
    if (type === "tdm") obj = parseFloat(row.objectif_tdm);

    if (!obj || isNaN(val)) return "";
    const ratio = val / obj;

    if (ratio >= 1) return "text-green-600 dark:text-green-400 font-semibold";
    if (ratio >= 0.95)
      return "text-yellow-600 dark:text-yellow-400 font-semibold";
    return "text-red-600 dark:text-red-400 font-semibold";
  };

  // Vérifier si les données affichées correspondent à la date sélectionnée
  const isDataForCurrentDate = currentReportDate === date && data.length > 0;

  // Obtenir l'icône de tri pour une colonne
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

  // Gérer l'export
  const handleExport = () => {
    if (data.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("rapport-rje-table", "Rapport_RJE");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* AlertDialog pour erreur de date */}
        <AlertDialog open={showDateAlert} onOpenChange={setShowDateAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Date manquante
              </AlertDialogTitle>
              <AlertDialogDescription>
                Veuillez sélectionner une date avant de générer le rapport.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowDateAlert(false)}>
                Compris
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Rapport Journalier des Engins
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualisez et analysez les performances quotidiennes des engins
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactMode(!compactMode)}
                  className="gap-2"
                >
                  {compactMode ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {compactMode ? "Normal" : "Compact"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {compactMode ? "Mode normal" : "Mode compact"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColumnManager(!showColumnManager)}
                  className="gap-2"
                >
                  <Columns className="h-4 w-4" />
                  <span className="hidden sm:inline">Colonnes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Gérer les colonnes</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2"
                  disabled={data.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exporter les données</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Cartes de filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sélection de la date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleGenerateReport}
                      disabled={rapportQuery.isFetching}
                      size="icon"
                      className="shrink-0"
                    >
                      {rapportQuery.isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Générer le rapport</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Filtre par site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={siteFilter === "" ? "all" : siteFilter}
                onValueChange={(v) => setSiteFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sites</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Engin, parc ou site..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={data.length === 0}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indicateurs et actions rapides */}
        {data.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isDataForCurrentDate ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  Rapport du {currentReportDate}
                </span>
                {!isDataForCurrentDate && (
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-300"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Date différente
                  </Badge>
                )}
              </div>

              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="highlight-targets"
                    className="text-sm cursor-pointer"
                  >
                    Surligner objectifs
                  </Label>
                  <Switch
                    id="highlight-targets"
                    checked={highlightTargets}
                    onCheckedChange={setHighlightTargets}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                {pageSize !== "all" && ` • Page ${currentPage}/${totalPages}`}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={rapportQuery.isFetching}
                className="gap-2"
              >
                {rapportQuery.isFetching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Rafraîchir
              </Button>
            </div>
          </div>
        )}

        {/* Gestionnaire de colonnes */}
        {showColumnManager && (
          <Card className="bg-card border-dashed">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Gestion des colonnes
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowColumnManager(false)}
                >
                  Fermer
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={resetColumns}>
                    Réinitialiser
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {visibleColumns.length} / {ALL_COLUMNS.length} colonnes
                  </div>
                </div>

                <ScrollArea className="h-60">
                  <div className="space-y-4 pr-4">
                    {COLUMN_CATEGORIES.map((category) => {
                      const categoryColumns = ALL_COLUMNS.filter(
                        (col) => col.category === category.id
                      );
                      const selectedCount = categoryColumns.filter((col) =>
                        visibleColumns.includes(col.key)
                      ).length;

                      return (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {category.icon}
                              <span className="text-sm font-medium">
                                {category.label}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {selectedCount}/{categoryColumns.length}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategory(category.id)}
                            >
                              {selectedCount === categoryColumns.length
                                ? "Tout masquer"
                                : "Tout afficher"}
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                            {categoryColumns.map((col) => (
                              <label
                                key={col.key}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.includes(col.key)}
                                  onChange={() => toggleColumn(col.key)}
                                  className="rounded border-gray-300 dark:border-gray-600"
                                />
                                <span className="text-sm">{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message si pas de données */}
        {data.length === 0 && !rapportQuery.isFetching && (
          <Card className="text-center border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <RefreshCw className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun rapport généré
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Sélectionnez une date et cliquez sur "Générer le Rapport"
                    pour afficher les données
                  </p>
                  <Button onClick={handleGenerateReport} size="lg">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Générer le Rapport
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message pendant le chargement */}
        {rapportQuery.isFetching && (
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Chargement du rapport
                  </h3>
                  <p className="text-muted-foreground">
                    Veuillez patienter pendant le chargement des données pour le{" "}
                    {date}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TABLE - Afficher seulement si des données existent et ne sont pas en cours de chargement */}
        {data.length > 0 && !rapportQuery.isFetching && (
          <>
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="p-3 bg-muted/30 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {pageSize === "all" ? (
                      <>Affichage de tous les résultats ({filtered.length})</>
                    ) : (
                      <>
                        Lignes {(currentPage - 1) * (pageSize as number) + 1} à{" "}
                        {Math.min(
                          currentPage * (pageSize as number),
                          filtered.length
                        )}{" "}
                        sur {filtered.length}
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="page-size"
                      className="text-sm whitespace-nowrap"
                    >
                      Lignes par page:
                    </Label>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        const newSize =
                          value === "Tout" ? "all" : parseInt(value);
                        setPageSize(newSize);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size === "Tout" ? "Tout" : size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="overflow-auto">
                <Table
                  id="rapport-rje-table"
                  className={compactMode ? "text-sm" : ""}
                >
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {ALL_COLUMNS.filter((c) =>
                        visibleColumns.includes(c.key)
                      ).map((c) => (
                        <TableHead
                          key={c.key}
                          className={`text-center ${
                            compactMode ? "py-2" : "py-3"
                          } ${
                            c.sortable
                              ? "cursor-pointer hover:bg-accent transition-colors"
                              : ""
                          }`}
                          onClick={() => c.sortable && handleSort(c.key)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{c.label}</span>
                            {getSortIcon(c.key)}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, index) => (
                      <TableRow
                        key={
                          row.engin +
                          (row.siteName ?? "") +
                          (row.parcName ?? "")
                        }
                        className={`hover:bg-accent/50 ${
                          index % 2 === 0 ? "bg-card" : "bg-muted/30"
                        }`}
                      >
                        {ALL_COLUMNS.filter((c) =>
                          visibleColumns.includes(c.key)
                        ).map((col) => {
                          let className = `text-center ${
                            compactMode ? "py-2" : "py-3"
                          }`;

                          // Coloration des valeurs par rapport à objectif
                          if (
                            ["dispo_j", "dispo_m", "dispo_a"].includes(col.key)
                          )
                            className +=
                              " " + getCellColor(row[col.key], "dispo", row);
                          if (["mtbf_j", "mtbf_m", "mtbf_a"].includes(col.key))
                            className +=
                              " " + getCellColor(row[col.key], "mtbf", row);
                          if (["tdm_j", "tdm_m", "tdm_a"].includes(col.key))
                            className +=
                              " " + getCellColor(row[col.key], "tdm", row);

                          const cellValue =
                            row[col.key as keyof typeof row] ?? "-";
                          const isValueCell = ["dispo", "mtbf", "tdm"].some(
                            (type) => col.key.includes(type)
                          );

                          return (
                            <TableCell key={col.key} className={className}>
                              <div className="flex items-center justify-center">
                                <span>{cellValue}</span>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination améliorée */}
            {pageSize !== "all" && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} • {filtered.length}{" "}
                  résultats
                </div>

                <Pagination>
                  <PaginationContent className="flex-wrap">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToPage(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                        if (i === 6) pageNum = totalPages;
                        else if (i === 5)
                          return <PaginationEllipsis key="ellipsis-end" />;
                      } else if (currentPage >= totalPages - 3) {
                        if (i === 0) pageNum = 1;
                        else if (i === 1)
                          return <PaginationEllipsis key="ellipsis-start" />;
                        else pageNum = totalPages - 6 + i;
                      } else {
                        if (i === 0) pageNum = 1;
                        else if (i === 1)
                          return <PaginationEllipsis key="ellipsis-start" />;
                        else if (i === 5)
                          return <PaginationEllipsis key="ellipsis-end" />;
                        else if (i === 6) pageNum = totalPages;
                        else pageNum = currentPage - 2 + (i - 2);
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => goToPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer min-w-10 justify-center"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToPage(currentPage + 1)}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Aller à:
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (!isNaN(page) && page >= 1 && page <= totalPages) {
                        goToPage(page);
                      }
                    }}
                    className="w-16"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
