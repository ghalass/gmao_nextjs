"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useRapportMvtOrgane,
  type MvtOrganeData,
} from "@/hooks/useRapportMvtOrgane";

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
  Wrench,
  ArrowUpDown,
  FileWarning,
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
  { value: "11", label: "Novobre" },
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
    key: "enginName",
    label: "Engin",
    sortable: true,
    defaultVisible: true,
    category: "identite",
  },
  {
    key: "typeOrganeName",
    label: "Type Organe",
    sortable: true,
    defaultVisible: true,
    category: "identite",
  },
  {
    key: "dateDepose",
    label: "Date Dépose",
    sortable: true,
    defaultVisible: true,
    category: "depose",
  },
  {
    key: "organeDepose",
    label: "Organe Déposé",
    sortable: true,
    defaultVisible: true,
    category: "depose",
  },
  {
    key: "hrmDepose",
    label: "HRM (h)",
    sortable: true,
    defaultVisible: true,
    category: "depose",
  },
  {
    key: "datePose",
    label: "Date Pose",
    sortable: true,
    defaultVisible: true,
    category: "pose",
  },
  {
    key: "organePose",
    label: "Organe Posé",
    sortable: true,
    defaultVisible: true,
    category: "pose",
  },
  {
    key: "causeDepose",
    label: "Cause de Dépose",
    sortable: true,
    defaultVisible: true,
    category: "info",
  },
  {
    key: "typeCause",
    label: "Type Cause",
    sortable: true,
    defaultVisible: false,
    category: "info",
  },
  {
    key: "siteName",
    label: "Site",
    sortable: true,
    defaultVisible: false,
    category: "identite",
  },
  {
    key: "parcName",
    label: "Parc",
    sortable: true,
    defaultVisible: false,
    category: "identite",
  },
  {
    key: "typeParcName",
    label: "Type Parc",
    sortable: true,
    defaultVisible: false,
    category: "identite",
  },
  {
    key: "observations",
    label: "Observations",
    sortable: false,
    defaultVisible: false,
    category: "info",
  },
];

const COLUMN_CATEGORIES = [
  { id: "identite", label: "Identité", icon: <Info className="h-3 w-3" /> },
  { id: "depose", label: "Dépose", icon: <ArrowUpDown className="h-3 w-3" /> },
  { id: "pose", label: "Pose", icon: <Wrench className="h-3 w-3" /> },
  { id: "info", label: "Informations", icon: <Info className="h-3 w-3" /> },
];

export default function RapportMensuelMvtOrgane() {
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
  const [selectedTypeOrganes, setSelectedTypeOrganes] = useState<string[]>([]);

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
  const rapportQuery = useRapportMvtOrgane(
    shouldFetch ? mois : null,
    shouldFetch ? annee : null
  );

  // Extraire les données
  const typeParcsData = rapportQuery.data?.data || [];
  const allSites = rapportQuery.data?.sites || [];
  const allParcs = rapportQuery.data?.parcs || [];
  const allTypeOrganes = rapportQuery.data?.typeOrganes || [];

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
    if (allTypeOrganes.length > 0 && selectedTypeOrganes.length === 0) {
      setSelectedTypeOrganes([...allTypeOrganes]);
    }
  }, [allSites, allParcs, allTypeParcs, allTypeOrganes]);

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

        parc.mouvements.forEach((mvt: MvtOrganeData) => {
          // Filtrer par site
          if (
            selectedSites.length > 0 &&
            !selectedSites.includes(mvt.siteName)
          ) {
            return;
          }

          // Filtrer par type d'organe
          if (
            selectedTypeOrganes.length > 0 &&
            !selectedTypeOrganes.includes(mvt.typeOrganeName)
          ) {
            return;
          }

          data.push({
            id: `mvt-${idCounter++}`,
            ...mvt,
            hrmDeposeFormatted: new Intl.NumberFormat("fr-FR").format(
              mvt.hrmDepose
            ),
          });
        });
      });
    });

    return data;
  }, [
    typeParcsData,
    selectedSites,
    selectedParcs,
    selectedTypeParcs,
    selectedTypeOrganes,
  ]);

  // Filtrer par recherche
  const filteredData = useMemo(() => {
    if (!search.trim()) return flatData;

    const searchLower = search.toLowerCase();
    return flatData.filter(
      (item) =>
        item.enginName.toLowerCase().includes(searchLower) ||
        item.typeOrganeName.toLowerCase().includes(searchLower) ||
        item.organeDepose.toLowerCase().includes(searchLower) ||
        item.organePose.toLowerCase().includes(searchLower) ||
        item.causeDepose.toLowerCase().includes(searchLower)
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

      // Pour les dates
      if (sortColumn.includes("date")) {
        const dateA = aValue ? new Date(aValue).getTime() : 0;
        const dateB = bValue ? new Date(bValue).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

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

  const toggleTypeOrgane = (typeOrgane: string) => {
    setSelectedTypeOrganes((prev) =>
      prev.includes(typeOrgane)
        ? prev.filter((t) => t !== typeOrgane)
        : [...prev, typeOrgane]
    );
  };

  const toggleAllTypeOrganes = () => {
    if (selectedTypeOrganes.length === allTypeOrganes.length) {
      setSelectedTypeOrganes([]);
    } else {
      setSelectedTypeOrganes([...allTypeOrganes]);
    }
  };

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    setSelectedSites([...allSites]);
    setSelectedParcs([...allParcs]);
    setSelectedTypeParcs([...allTypeParcs]);
    setSelectedTypeOrganes([...allTypeOrganes]);
    setSearch("");
    setSortColumn(null);
    setSortDirection("asc");
    setCurrentPage(1);
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  const formatCellValue = (key: string, value: any) => {
    if (value == null || value === "") return "-";

    if (key.includes("date")) {
      return formatDate(value);
    }

    if (key === "hrmDepose") {
      return new Intl.NumberFormat("fr-FR").format(value);
    }

    return value;
  };

  // Générer le rapport
  const handleGenerateReport = () => {
    if (!date) return;
    setShouldFetch(true);
    setCurrentPage(1);
  };

  // Rafraîchir
  const handleRefresh = () => {
    rapportQuery.refetch();
  };

  // Export
  const handleExport = () => {
    if (paginatedData?.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("rapport-mvt-organe", "Rapport_Mouvements_Organes");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Rapport Mensuel des Mouvements d'Organes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Mouvements (Dépose/Pose) pour{" "}
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
                  placeholder="Rechercher par engin, organe, cause..."
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

              {/* Filtre par type d'organe */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>
                    Types d'Organe ({selectedTypeOrganes.length}/
                    {allTypeOrganes.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllTypeOrganes}
                    className="h-6 text-xs"
                  >
                    {selectedTypeOrganes.length === allTypeOrganes.length
                      ? "Désélectionner tout"
                      : "Sélectionner tout"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTypeOrganes.map((typeOrgane) => (
                    <Badge
                      key={typeOrgane}
                      variant={
                        selectedTypeOrganes.includes(typeOrgane)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleTypeOrgane(typeOrgane)}
                    >
                      {typeOrgane}
                      {selectedTypeOrganes.includes(typeOrgane) && (
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
                  {selectedTypeOrganes.length < allTypeOrganes.length && (
                    <Badge variant="secondary" className="gap-1">
                      <Wrench className="h-3 w-3" />
                      {selectedTypeOrganes.length} type
                      {selectedTypeOrganes.length > 1 ? "s" : ""} d'organe
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
                    !selectedTypeOrganes.length &&
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
            {selectedParcs.length} parcs, {selectedTypeParcs.length} types de
            parc, {selectedTypeOrganes.length} types d'organe)
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
                    Calcul des mouvements d'organes pour {mois}/{annee}
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

        {/* NOUVEAU MESSAGE : Aucun mouvement d'organe trouvé */}
        {shouldFetch &&
          !rapportQuery.isFetching &&
          !rapportQuery.error &&
          flatData.length === 0 && (
            <Card className="text-center border-dashed">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <FileWarning className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Aucun mouvement d'organe trouvé
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun mouvement d'organe (dépose) n'a été enregistré pour
                      la période sélectionnée
                    </p>
                    <div className="space-y-2 text-sm text-left max-w-md mx-auto bg-muted/30 p-4 rounded-lg">
                      <p className="font-medium">Période sélectionnée :</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Mois : {MONTHS.find((m) => m.value === mois)?.label}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Année : {annee}</span>
                        </li>
                      </ul>
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium">Suggestions :</p>
                        <ul className="text-muted-foreground list-disc pl-4 space-y-1">
                          <li>
                            Vérifiez que des mouvements d'organe (dépose)
                            existent pour cette période
                          </li>
                          <li>Essayez avec une autre période (mois/année)</li>
                          <li>Vérifiez les filtres appliqués</li>
                          <li>Assurez-vous que les engins sont actifs</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                      <Button
                        onClick={() => {
                          // Réinitialiser les filtres
                          resetAllFilters();
                          handleRefresh();
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Réessayer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Tableau de données */}
        {shouldFetch && flatData.length > 0 && !rapportQuery.isFetching && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Mouvements d'Organes</CardTitle>
                  <CardDescription>
                    {filteredData.length} mouvements •{" "}
                    {new Set(filteredData.map((d) => d.enginName)).size} engins
                    • {new Set(filteredData.map((d) => d.siteName)).size} sites
                    • {new Set(filteredData.map((d) => d.typeOrganeName)).size}{" "}
                    types d'organe
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <FileWarning className="h-3 w-3" />
                    {
                      flatData.filter((d) => !d.datePose || d.datePose === "")
                        .length
                    }{" "}
                    sans pose
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    id="rapport-mvt-organe"
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
                                  col.category === "depose"
                                    ? "bg-red-50 dark:bg-red-950/30"
                                    : col.category === "pose"
                                    ? "bg-green-50 dark:bg-green-950/30"
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
                            ${compactMode ? "py-1" : "py-2"}
                            hover:bg-accent/50 transition-colors
                            ${
                              !row.datePose || row.datePose === ""
                                ? "bg-yellow-50 dark:bg-yellow-950/20"
                                : ""
                            }
                          `}
                        >
                          {DEFAULT_COLUMNS.filter((col) =>
                            visibleColumns.includes(col.key)
                          ).map((col) => {
                            const formattedValue = formatCellValue(
                              col.key,
                              row[col.key]
                            );

                            return (
                              <TableCell
                                key={col.key}
                                className={`
                                    whitespace-nowrap
                                    ${compactMode ? "px-2" : "px-4"}
                                    ${
                                      col.category === "depose"
                                        ? "text-red-700 dark:text-red-300"
                                        : col.category === "pose"
                                        ? "text-green-700 dark:text-green-300"
                                        : ""
                                    }
                                    ${
                                      col.key === "hrmDepose"
                                        ? "text-right font-medium"
                                        : ""
                                    }
                                    ${
                                      (!row.datePose || row.datePose === "") &&
                                      col.key === "datePose"
                                        ? "text-amber-600 dark:text-amber-400 font-medium italic"
                                        : ""
                                    }
                                  `}
                              >
                                {(!row.datePose || row.datePose === "") &&
                                col.key === "datePose" &&
                                formattedValue === "-" ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1">
                                        <FileWarning className="h-3 w-3" />
                                        Non posé
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Cet organe n'a pas encore été reposé
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  formattedValue
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination et statistiques - reste le même */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* ... le code de pagination reste le même ... */}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
