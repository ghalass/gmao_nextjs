"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useRapportEtatGeneral,
  type EnginEtatGeneral,
} from "@/hooks/useRapportEtatGeneral";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Loader2,
  Calendar,
  Columns,
  Download,
  ChevronUp,
  ChevronDown,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  HardDrive,
  AlertCircle,
  Info,
  Building,
  Filter,
  ChevronLeft,
  ChevronRight,
  FilterX,
  ChevronUpCircle,
  ChevronDownCircle,
} from "lucide-react";
import { exportExcel } from "@/lib/xlsxFn";

// Options pour les mois
const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

interface ColumnConfig {
  key: string;
  label: string;
  sortable: boolean;
  defaultVisible: boolean;
  category: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    key: "engin",
    label: "Engin",
    sortable: true,
    defaultVisible: true,
    category: "identite",
  },
  {
    key: "site",
    label: "Site",
    sortable: true,
    defaultVisible: true,
    category: "identite",
  },
  {
    key: "parc",
    label: "Parc",
    sortable: true,
    defaultVisible: true,
    category: "identite",
  },
  {
    key: "typeParc",
    label: "Type Parc",
    sortable: true,
    defaultVisible: true,
    category: "identite",
  },
  {
    key: "hrmMois",
    label: "HRM Mois (h)",
    sortable: true,
    defaultVisible: true,
    category: "performance",
  },
  {
    key: "heureChassisMois",
    label: "Heures Châssis Mois (h)",
    sortable: true,
    defaultVisible: true,
    category: "performance",
  },
  {
    key: "initialHeureChassis",
    label: "Heures Châssis Initiales (h)",
    sortable: true,
    defaultVisible: false,
    category: "performance",
  },
  {
    key: "totalHeureChassis",
    label: "Total Heures Châssis (h)",
    sortable: true,
    defaultVisible: true,
    category: "performance",
  },
];

const COLUMN_CATEGORIES = [
  { id: "identite", label: "Identité", icon: <Info className="h-3 w-3" /> },
  {
    id: "performance",
    label: "Performance",
    icon: <HardDrive className="h-3 w-3" />,
  },
];

export default function EtatGeneralPage() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [shouldFetch, setShouldFetch] = useState(false);
  const [search, setSearch] = useState("");
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [compactMode, setCompactMode] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    DEFAULT_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key)
  );

  // Filtres
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedParcs, setSelectedParcs] = useState<string[]>([]);
  const [selectedTypeParcs, setSelectedTypeParcs] = useState<string[]>([]);

  // Nouvel état pour afficher/masquer les filtres
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Extraction du mois et de l'année
  const [mois, annee] = useMemo(() => {
    if (!date) return ["", ""];
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear().toString();
    return [month, year];
  }, [date]);

  // Hook pour récupérer les données
  const rapportQuery = useRapportEtatGeneral(
    shouldFetch ? mois : null,
    shouldFetch ? annee : null
  );

  // Extraire les données
  const typeParcsData = rapportQuery.data?.data || [];
  const allSites = rapportQuery.data?.sites || [];
  const allParcs = rapportQuery.data?.parcs || [];

  // Extraire tous les types de parcs
  const allTypeParcs = useMemo(() => {
    return typeParcsData.map((tp) => tp.typeParcName);
  }, [typeParcsData]);

  // Initialiser les filtres
  useEffect(() => {
    if (allSites.length > 0 && selectedSites.length === 0) {
      setSelectedSites([...allSites]);
    }
    if (allParcs.length > 0 && selectedParcs.length === 0) {
      setSelectedParcs([...allParcs]);
    }
    if (allTypeParcs.length > 0 && selectedTypeParcs.length === 0) {
      setSelectedTypeParcs([...allTypeParcs]);
    }
  }, [allSites, allParcs, allTypeParcs]);

  // Aplatir les données pour l'affichage
  const flatData = useMemo(() => {
    const data: any[] = [];
    let idCounter = 1;

    typeParcsData.forEach((typeParc) => {
      // Filtrer par type de parc
      if (
        selectedTypeParcs.length > 0 &&
        !selectedTypeParcs.includes(typeParc.typeParcName)
      ) {
        return;
      }

      typeParc.parcs.forEach((parc) => {
        // Filtrer par parc
        if (
          selectedParcs.length > 0 &&
          !selectedParcs.includes(parc.parcName)
        ) {
          return;
        }

        parc.engins.forEach((engin) => {
          // Filtrer par site
          if (
            selectedSites.length > 0 &&
            !selectedSites.includes(engin.siteName)
          ) {
            return;
          }

          data.push({
            id: `engin-${idCounter++}`,
            type: "engin",
            engin: engin.enginName,
            site: engin.siteName,
            parc: engin.parcName,
            typeParc: engin.typeParcName,
            hrmMois: engin.hrmMois,
            heureChassisMois: engin.heureChassisMois,
            initialHeureChassis: engin.initialHeureChassis,
            totalHeureChassis: engin.totalHeureChassis,
            typeParcId: typeParc.typeParcId,
            parcId: parc.parcId,
          });
        });

        // Ligne de total pour le parc
        data.push({
          id: `total-parc-${parc.parcId}`,
          type: "total-parc",
          engin: `TOTAL ${parc.parcName}`,
          site: "",
          parc: "",
          typeParc: "",
          hrmMois: parc.totalParc.totalHRMMois,
          heureChassisMois: parc.totalParc.totalHeureChassisMois,
          initialHeureChassis: 0,
          totalHeureChassis: 0,
          typeParcId: typeParc.typeParcId,
          parcId: parc.parcId,
        });
      });

      // Ligne de total pour le type de parc
      data.push({
        id: `total-typeparc-${typeParc.typeParcId}`,
        type: "total-typeparc",
        engin: `TOTAL ${typeParc.typeParcName}`,
        site: "",
        parc: "",
        typeParc: "",
        hrmMois: typeParc.totalTypeParc.totalHRMMois,
        heureChassisMois: typeParc.totalTypeParc.totalHeureChassisMois,
        initialHeureChassis: 0,
        totalHeureChassis: 0,
        typeParcId: typeParc.typeParcId,
        parcId: "",
      });
    });

    return data;
  }, [typeParcsData, selectedSites, selectedParcs, selectedTypeParcs]);

  // Filtrer par recherche
  const filteredData = useMemo(() => {
    if (!search.trim()) return flatData;

    const searchLower = search.toLowerCase();
    return flatData.filter(
      (item) =>
        item.type === "engin" &&
        (item.engin.toLowerCase().includes(searchLower) ||
          item.site.toLowerCase().includes(searchLower) ||
          item.parc.toLowerCase().includes(searchLower) ||
          item.typeParc.toLowerCase().includes(searchLower))
    );
  }, [flatData, search]);

  // Trier les données
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Gestion du tri
  const handleSort = (columnKey: string) => {
    const column = DEFAULT_COLUMNS.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // Gestion des colonnes
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCategory = (categoryId: string) => {
    const categoryColumns = DEFAULT_COLUMNS.filter(
      (col) => col.category === categoryId
    ).map((col) => col.key);

    const allSelected = categoryColumns.every((col) =>
      visibleColumns.includes(col)
    );

    if (allSelected) {
      setVisibleColumns((prev) =>
        prev.filter((col) => !categoryColumns.includes(col))
      );
    } else {
      setVisibleColumns((prev) => [...new Set([...prev, ...categoryColumns])]);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(
      DEFAULT_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key)
    );
  };

  // Gestion des filtres
  const toggleSite = (site: string) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  };

  const toggleAllSites = () => {
    if (selectedSites.length === allSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites([...allSites]);
    }
  };

  const toggleParc = (parc: string) => {
    setSelectedParcs((prev) =>
      prev.includes(parc) ? prev.filter((p) => p !== parc) : [...prev, parc]
    );
  };

  const toggleAllParcs = () => {
    if (selectedParcs.length === allParcs.length) {
      setSelectedParcs([]);
    } else {
      setSelectedParcs([...allParcs]);
    }
  };

  const toggleTypeParc = (typeParc: string) => {
    setSelectedTypeParcs((prev) =>
      prev.includes(typeParc)
        ? prev.filter((t) => t !== typeParc)
        : [...prev, typeParc]
    );
  };

  const toggleAllTypeParcs = () => {
    if (selectedTypeParcs.length === allTypeParcs.length) {
      setSelectedTypeParcs([]);
    } else {
      setSelectedTypeParcs([...allTypeParcs]);
    }
  };

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    setSelectedSites([...allSites]);
    setSelectedParcs([...allParcs]);
    setSelectedTypeParcs([...allTypeParcs]);
    setSearch("");
    setSortColumn(null);
    setSortDirection("asc");
    setCurrentPage(1);
  };

  // Formatage des nombres
  const formatNumber = (num: number) => {
    if (num === 0) return "0";
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
  };

  const formatCellValue = (value: any) => {
    if (value == null || value === "") return "-";
    if (typeof value === "number") {
      if (value === 0) return "0";
      return formatNumber(value);
    }
    return value;
  };

  // Style de ligne
  const getRowStyle = (row: any) => {
    if (row.type === "total-typeparc") {
      return "bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2 border-blue-200";
    }
    if (row.type === "total-parc") {
      return "bg-gray-100 dark:bg-gray-900 font-semibold border-t border-gray-200";
    }
    return "";
  };

  // Générer le rapport
  const handleGenerateReport = () => {
    if (!date) return;
    setShouldFetch(true);
    setCurrentPage(1); // Reset à la première page
  };

  // Rafraîchir
  const handleRefresh = () => {
    rapportQuery.refetch();
  };

  // Export (à implémenter)
  const handleExport = () => {
    if (paginatedData?.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("rapport-etat-general", "Rapport_Etat_General");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <HardDrive className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              État Général des Engins
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rapport détaillé par engin pour{" "}
              {MONTHS.find((m) => m.value === mois)?.label} {annee}
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
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  {showFilters ? (
                    <ChevronUpCircle className="h-4 w-4" />
                  ) : (
                    <ChevronDownCircle className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {showFilters ? "Masquer Filtres" : "Afficher Filtres"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2"
                  disabled={flatData.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exporter les données</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filtres et Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Période */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Période
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="date">Mois/Année</Label>
                <Input
                  id="date"
                  type="month"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={rapportQuery.isFetching || !date}
                className="w-full gap-2"
              >
                {rapportQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Générer le Rapport
              </Button>
            </CardContent>
          </Card>

          {/* Recherche */}
          <Card>
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
                  placeholder="Rechercher par engin, site, parc..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={flatData.length === 0}
                />
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode" className="cursor-pointer">
                  Mode compact
                </Label>
                <Switch
                  id="compact-mode"
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-filters" className="cursor-pointer">
                  Afficher filtres
                </Label>
                <Switch
                  id="show-filters"
                  checked={showFilters}
                  onCheckedChange={setShowFilters}
                />
              </div>
              <div className="space-y-2">
                <Label>Lignes par page</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => setPageSize(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={rapportQuery.isFetching}
                className="w-full gap-2"
              >
                {rapportQuery.isFetching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Rafraîchir
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Gestionnaire de colonnes */}
        {showColumnManager && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Columns className="h-4 w-4" />
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
                    {visibleColumns.length} / {DEFAULT_COLUMNS.length} colonnes
                  </div>
                </div>

                <ScrollArea className="h-60">
                  <div className="space-y-4 pr-4">
                    {COLUMN_CATEGORIES.map((category) => {
                      const categoryColumns = DEFAULT_COLUMNS.filter(
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
                                {col.sortable && (
                                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                )}
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

        {/* Filtres avancés */}
        {showFilters && flatData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres avancés
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="gap-2"
                  >
                    <ChevronUpCircle className="h-4 w-4" />
                    Masquer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllFilters}
                    className="gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtre par site */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>
                    Sites ({selectedSites.length}/{allSites.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllSites}
                    className="h-6 text-xs"
                  >
                    {selectedSites.length === allSites.length
                      ? "Désélectionner tout"
                      : "Sélectionner tout"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allSites.map((site) => (
                    <Badge
                      key={site}
                      variant={
                        selectedSites.includes(site) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleSite(site)}
                    >
                      {site}
                      {selectedSites.includes(site) && (
                        <span className="ml-1">✓</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filtre par parc */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>
                    Parcs ({selectedParcs.length}/{allParcs.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllParcs}
                    className="h-6 text-xs"
                  >
                    {selectedParcs.length === allParcs.length
                      ? "Désélectionner tout"
                      : "Sélectionner tout"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allParcs.map((parc) => (
                    <Badge
                      key={parc}
                      variant={
                        selectedParcs.includes(parc) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleParc(parc)}
                    >
                      {parc}
                      {selectedParcs.includes(parc) && (
                        <span className="ml-1">✓</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filtre par type de parc */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>
                    Types de Parc ({selectedTypeParcs.length}/
                    {allTypeParcs.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllTypeParcs}
                    className="h-6 text-xs"
                  >
                    {selectedTypeParcs.length === allTypeParcs.length
                      ? "Désélectionner tout"
                      : "Sélectionner tout"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTypeParcs.map((typeParc) => (
                    <Badge
                      key={typeParc}
                      variant={
                        selectedTypeParcs.includes(typeParc)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleTypeParc(typeParc)}
                    >
                      {typeParc}
                      {selectedTypeParcs.includes(typeParc) && (
                        <span className="ml-1">✓</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Résumé des filtres actifs */}
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Filtres actifs</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSites.length < allSites.length && (
                    <Badge variant="secondary" className="gap-1">
                      <Building className="h-3 w-3" />
                      {selectedSites.length} site
                      {selectedSites.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {selectedParcs.length < allParcs.length && (
                    <Badge variant="secondary" className="gap-1">
                      <HardDrive className="h-3 w-3" />
                      {selectedParcs.length} parc
                      {selectedParcs.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {selectedTypeParcs.length < allTypeParcs.length && (
                    <Badge variant="secondary" className="gap-1">
                      <Info className="h-3 w-3" />
                      {selectedTypeParcs.length} type
                      {selectedTypeParcs.length > 1 ? "s" : ""} de parc
                    </Badge>
                  )}
                  {search && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="h-3 w-3" />"{search}"
                    </Badge>
                  )}
                  {!selectedSites.length &&
                    !selectedParcs.length &&
                    !selectedTypeParcs.length &&
                    !search && (
                      <span className="text-sm text-muted-foreground">
                        Aucun filtre actif
                      </span>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton pour afficher les filtres lorsqu'ils sont masqués */}
        {!showFilters && flatData.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(true)}
            className="w-full gap-2"
          >
            <Filter className="h-4 w-4" />
            Afficher les filtres ({selectedSites.length} sites,{" "}
            {selectedParcs.length} parcs, {selectedTypeParcs.length} types)
          </Button>
        )}

        {/* Messages d'état */}
        {!shouldFetch && (
          <Card className="text-center border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sélectionnez une période
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Choisissez un mois et une année, puis cliquez sur "Générer
                    le Rapport"
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
                    Calcul des données pour {mois}/{annee}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rapportQuery.error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Erreur de chargement</h3>
                  <p className="text-sm">{rapportQuery.error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tableau de données */}
        {flatData.length > 0 && !rapportQuery.isFetching && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Résultats détaillés</CardTitle>
                  <CardDescription>
                    {filteredData.filter((d) => d.type === "engin").length}{" "}
                    engins •
                    {
                      new Set(
                        filteredData
                          .filter((d) => d.type === "engin")
                          .map((d) => d.site)
                      ).size
                    }{" "}
                    sites •
                    {
                      new Set(
                        filteredData
                          .filter((d) => d.type === "engin")
                          .map((d) => d.parc)
                      ).size
                    }{" "}
                    parcs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Total type parc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <span>Total parc</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    id="rapport-etat-general"
                    className={compactMode ? "text-sm" : ""}
                  >
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        {DEFAULT_COLUMNS.filter((col) =>
                          visibleColumns.includes(col.key)
                        ).map((col) => (
                          <TableHead
                            key={col.key}
                            className={`
                                whitespace-nowrap
                                ${
                                  col.sortable
                                    ? "cursor-pointer hover:bg-accent transition-colors"
                                    : ""
                                }
                                ${compactMode ? "py-2 px-2" : "py-3 px-4"}
                                ${
                                  col.category === "performance"
                                    ? "bg-blue-50 dark:bg-blue-950/30"
                                    : ""
                                }
                              `}
                            onClick={() => col.sortable && handleSort(col.key)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>{col.label}</span>
                              {col.sortable &&
                                sortColumn === col.key &&
                                (sortDirection === "asc" ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                ))}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row) => (
                        <TableRow
                          key={row.id}
                          className={`
                            ${getRowStyle(row)}
                            ${compactMode ? "py-1" : "py-2"}
                            hover:bg-accent/50 transition-colors
                          `}
                        >
                          {DEFAULT_COLUMNS.filter((col) =>
                            visibleColumns.includes(col.key)
                          ).map((col) => {
                            const cellValue = row[col.key];
                            const formattedValue = formatCellValue(cellValue);

                            return (
                              <TableCell
                                key={col.key}
                                className={`
                                    whitespace-nowrap
                                    ${compactMode ? "px-2" : "px-4"}
                                    ${
                                      row.type.includes("total")
                                        ? "font-semibold"
                                        : ""
                                    }
                                    ${
                                      col.category === "performance"
                                        ? "text-right"
                                        : ""
                                    }
                                  `}
                              >
                                {formattedValue}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination et statistiques */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Affichage {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, sortedData.length)} sur{" "}
                  {sortedData.length} lignes
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
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
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Tri:{" "}
                    {sortColumn
                      ? `${
                          DEFAULT_COLUMNS.find((c) => c.key === sortColumn)
                            ?.label
                        } ${sortDirection === "asc" ? "↑" : "↓"}`
                      : "Aucun"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSortColumn(null);
                      setSortDirection("asc");
                    }}
                    disabled={!sortColumn}
                  >
                    Réinitialiser le tri
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
