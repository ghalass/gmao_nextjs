"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useRapportUnitePhysique,
  type UnitePhysiqueItem,
} from "@/hooks/useRapportUnitePhysique";

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

// Années (5 dernières années)
const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));
};

// Catégories de colonnes
const COLUMN_CATEGORIES = [
  { id: "identite", label: "Identité", icon: <Info className="h-3 w-3" /> },
  { id: "sites", label: "Sites", icon: <Building className="h-3 w-3" /> },
  { id: "totaux", label: "Totaux", icon: <HardDrive className="h-3 w-3" /> },
];

interface ColumnConfig {
  key: string;
  label: string;
  sortable: boolean;
  category: string;
  subcategory?: string;
  period?: string;
}

export default function UnitePhysiquePage() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    // Format: "YYYY-MM" (compatible avec l'input type="month")
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
  const [showAllSites, setShowAllSites] = useState(true);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  // Extraction du mois et de l'année depuis la date
  const [mois, annee] = useMemo(() => {
    if (!date) return ["", ""];
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear().toString();
    return [month, year];
  }, [date]);

  // Hook pour récupérer les données
  const rapportQuery = useRapportUnitePhysique(
    shouldFetch ? mois : null,
    shouldFetch ? annee : null
  );

  // Extraire les données et les sites
  const data = rapportQuery.data?.data || [];
  const allSites = rapportQuery.data?.sites || [];

  // Effet pour initialiser selectedSites avec tous les sites quand ils sont disponibles
  useEffect(() => {
    if (allSites.length > 0 && selectedSites.length === 0) {
      setSelectedSites([...allSites]);
    }
  }, [allSites]);

  // Gérer la sélection des sites
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

  // Sites à afficher
  const sitesToShow = useMemo(() => {
    if (showAllSites) return allSites;
    return selectedSites;
  }, [showAllSites, selectedSites, allSites]);

  // Générer les colonnes dynamiquement
  const generateColumns = useMemo(() => {
    const baseColumns: ColumnConfig[] = [
      { key: "parc", label: "PARCS", sortable: true, category: "identite" },
      { key: "nbre", label: "NBRE", sortable: true, category: "identite" },
    ];

    // Colonnes par site
    const siteColumns = sitesToShow.flatMap((site) => [
      {
        key: `${site}_hrm_mois`,
        label: `${site} HRM`,
        sortable: true,
        category: "sites",
        subcategory: site,
        period: "M",
      },
      {
        key: `${site}_him_mois`,
        label: `${site} HIM`,
        sortable: true,
        category: "sites",
        subcategory: site,
        period: "M",
      },
    ]);

    // Colonnes de totaux
    const totalColumns: ColumnConfig[] = [
      {
        key: "total_hrm_mois",
        label: "HRM_M",
        sortable: true,
        category: "totaux",
        period: "M",
      },
      {
        key: "total_him_mois",
        label: "HIM_M",
        sortable: true,
        category: "totaux",
        period: "M",
      },
      {
        key: "total_hrm_annee",
        label: "HRM_C",
        sortable: true,
        category: "totaux",
        period: "A",
      },
      {
        key: "total_him_annee",
        label: "HIM_C",
        sortable: true,
        category: "totaux",
        period: "A",
      },
    ];

    return [...baseColumns, ...siteColumns, ...totalColumns];
  }, [sitesToShow]);

  // Colonnes visibles par défaut
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const defaultColumns = ["parc", "nbre"];
    sitesToShow.forEach((site) => {
      defaultColumns.push(`${site}_hrm_mois`, `${site}_him_mois`);
    });
    defaultColumns.push(
      "total_hrm_mois",
      "total_him_mois",
      "total_hrm_annee",
      "total_him_annee"
    );
    return defaultColumns;
  });

  // Fonction pour générer le rapport
  const handleGenerateReport = () => {
    if (!date) return;
    setShouldFetch(true);
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    rapportQuery.refetch();
  };

  // Gestion du tri
  const handleSort = (columnKey: string) => {
    const column = generateColumns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // Interface pour les données aplaties
  interface FlatDataItem {
    id: string;
    type: "parc" | "total-type";
    parc: string;
    nbre: number;
    typeParcName: string;
    total_hrm_mois: number;
    total_him_mois: number;
    total_hrm_annee: number;
    total_him_annee: number;
    [key: string]: any; // Pour les colonnes dynamiques de sites
  }

  // Préparer les données pour l'affichage
  const flatData = useMemo(() => {
    if (!data.length) return [];

    const dataArray: FlatDataItem[] = [];

    data.forEach((typeParc) => {
      // Ajouter chaque parc
      typeParc.parcs.forEach((parc) => {
        const rowData: FlatDataItem = {
          id: `${parc.parcId}`,
          type: "parc",
          parc: parc.parcName,
          nbre: parc.nbreEngins,
          typeParcName: typeParc.typeParcName,
          // Totaux mensuels
          total_hrm_mois: parc.aggregatesMois.totalHRM,
          total_him_mois: parc.aggregatesMois.totalHIM,
          // Totaux annuels
          total_hrm_annee: parc.aggregatesAnnee.totalHRM,
          total_him_annee: parc.aggregatesAnnee.totalHIM,
        };

        // Ajouter les données par site
        sitesToShow.forEach((site) => {
          const statsMois = parc.siteStatsMois[site] || { hrm: 0, him: 0 };
          rowData[`${site}_hrm_mois`] = statsMois.hrm;
          rowData[`${site}_him_mois`] = statsMois.him;
        });

        dataArray.push(rowData);
      });

      // Ligne de total pour le type de parc
      const totalRow: FlatDataItem = {
        id: `${typeParc.typeParcId}-total`,
        type: "total-type",
        parc: `TOTAL ${typeParc.typeParcName}`,
        nbre: typeParc.totalTypeParc.nbreEngins,
        typeParcName: typeParc.typeParcName,
        // Totaux mensuels
        total_hrm_mois: typeParc.totalTypeParc.aggregatesMois.totalHRM,
        total_him_mois: typeParc.totalTypeParc.aggregatesMois.totalHIM,
        // Totaux annuels
        total_hrm_annee: typeParc.totalTypeParc.aggregatesAnnee.totalHRM,
        total_him_annee: typeParc.totalTypeParc.aggregatesAnnee.totalHIM,
      };

      // Calculer les totaux par site pour le type de parc
      sitesToShow.forEach((site) => {
        let totalHrmMois = 0;
        let totalHimMois = 0;

        typeParc.parcs.forEach((parc) => {
          const statsMois = parc.siteStatsMois[site] || { hrm: 0, him: 0 };
          totalHrmMois += statsMois.hrm;
          totalHimMois += statsMois.him;
        });

        totalRow[`${site}_hrm_mois`] = totalHrmMois;
        totalRow[`${site}_him_mois`] = totalHimMois;
      });

      dataArray.push(totalRow);
    });

    return dataArray;
  }, [data, sitesToShow]);

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    let dataArray = [...flatData];

    // Filtre de recherche
    if (search) {
      const searchLower = search.toLowerCase();
      dataArray = dataArray.filter(
        (item) =>
          item.parc.toLowerCase().includes(searchLower) ||
          item.typeParcName.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    if (sortColumn) {
      dataArray.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Gestion des valeurs nulles
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? -1 : 1;
        if (bValue == null) return sortDirection === "asc" ? 1 : -1;

        // Gestion des nombres
        const aParsed =
          typeof aValue === "number" ? aValue : parseFloat(aValue);
        const bParsed =
          typeof bValue === "number" ? bValue : parseFloat(bValue);

        if (sortDirection === "asc") {
          return (aParsed || 0) - (bParsed || 0);
        } else {
          return (bParsed || 0) - (aParsed || 0);
        }
      });
    }

    return dataArray;
  }, [flatData, search, sortColumn, sortDirection]);

  // Gestion des colonnes
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCategory = (categoryId: string) => {
    const categoryColumns = generateColumns
      .filter((col) => col.category === categoryId)
      .map((col) => col.key);

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
    const defaultColumns = ["parc", "nbre"];
    sitesToShow.forEach((site) => {
      defaultColumns.push(`${site}_hrm_mois`, `${site}_him_mois`);
    });
    defaultColumns.push(
      "total_hrm_mois",
      "total_him_mois",
      "total_hrm_annee",
      "total_him_annee"
    );
    setVisibleColumns(defaultColumns);
  };

  // Formatage des nombres
  const formatNumber = (num: number) => {
    if (num === 0) return "0";
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
  };

  // Formatage des valeurs de cellule
  const formatCellValue = (value: any, columnKey: string) => {
    if (value == null || value === "") return "-";
    if (typeof value === "number") {
      if (value === 0) return "0";
      return formatNumber(value);
    }
    return value;
  };

  // Style de ligne selon le type
  const getRowStyle = (row: FlatDataItem) => {
    if (row.type === "total-type") {
      return "bg-gray-100 dark:bg-gray-900 font-semibold";
    }
    return "";
  };

  // Export des données
  const handleExport = () => {
    if (data.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("rapport-unite-physique", "Rapport_Unite_Physique");
  };

  const toggleShowAllSites = (checked: boolean) => {
    setShowAllSites(checked);

    if (checked) {
      // Quand on active "Afficher tous les sites", sélectionner tous les sites
      setSelectedSites([...allSites]);
    } else {
      // Quand on désactive, on pourrait:
      // Option 1: Garder la sélection actuelle
      // Option 2: Réinitialiser à vide
      // Option 3: Garder certains sites par défaut
      if (selectedSites.length === allSites.length) {
        // Si tous étaient sélectionnés, réinitialiser
        setSelectedSites([]);
      }
      // Sinon, garder la sélection actuelle
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <HardDrive className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Rapport Unité Physique des Engins
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rapport HRM/HIM par parc, type et site pour{" "}
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

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="Rechercher par parc ou type..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={flatData.length === 0}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Options d'affichage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-all-sites" className="cursor-pointer">
                  Afficher tous les sites
                </Label>
                <Switch
                  id="show-all-sites"
                  checked={showAllSites}
                  onCheckedChange={toggleShowAllSites}
                />
              </div>
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
                Rafraîchir les données
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
                    {visibleColumns.length} / {generateColumns.length} colonnes
                  </div>
                </div>

                {/* Sélection des sites */}
                {!showAllSites && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      Sélection des sites
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAllSites}
                      >
                        {selectedSites.length === allSites.length
                          ? "Désélectionner tout"
                          : "Sélectionner tout"}
                      </Button>
                      {allSites.map((site) => (
                        <Button
                          key={site}
                          variant={
                            selectedSites.includes(site) ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => toggleSite(site)}
                        >
                          {site}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <ScrollArea className="h-60">
                  <div className="space-y-4 pr-4">
                    {COLUMN_CATEGORIES.map((category) => {
                      const categoryColumns = generateColumns.filter(
                        (col) => col.category === category.id
                      );
                      const selectedCount = categoryColumns.filter((col) =>
                        visibleColumns.includes(col.key)
                      ).length;

                      // Grouper par site pour la catégorie "sites"
                      if (category.id === "sites") {
                        const sitesGrouped = sitesToShow.reduce((acc, site) => {
                          const siteColumns = categoryColumns.filter(
                            (col) => col.subcategory === site
                          );
                          if (siteColumns.length > 0) {
                            acc[site] = siteColumns;
                          }
                          return acc;
                        }, {} as Record<string, ColumnConfig[]>);

                        return (
                          <div key={category.id} className="space-y-4">
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

                            {Object.entries(sitesGrouped).map(
                              ([site, siteCols]) => {
                                const siteSelectedCount = siteCols.filter(
                                  (col) => visibleColumns.includes(col.key)
                                ).length;

                                return (
                                  <div key={site} className="space-y-2 pl-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        Site: {site}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const siteColumnKeys = siteCols.map(
                                            (col) => col.key
                                          );
                                          const allSiteSelected =
                                            siteColumnKeys.every((key) =>
                                              visibleColumns.includes(key)
                                            );

                                          if (allSiteSelected) {
                                            setVisibleColumns((prev) =>
                                              prev.filter(
                                                (key) =>
                                                  !siteColumnKeys.includes(key)
                                              )
                                            );
                                          } else {
                                            setVisibleColumns((prev) => [
                                              ...new Set([
                                                ...prev,
                                                ...siteColumnKeys,
                                              ]),
                                            ]);
                                          }
                                        }}
                                      >
                                        {siteSelectedCount === siteCols.length
                                          ? "Masquer site"
                                          : "Afficher site"}
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pl-2">
                                      {siteCols.map((col) => (
                                        <label
                                          key={col.key}
                                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={visibleColumns.includes(
                                              col.key
                                            )}
                                            onChange={() =>
                                              toggleColumn(col.key)
                                            }
                                            className="rounded border-gray-300 dark:border-gray-600"
                                          />
                                          <span className="text-sm">
                                            {col.label}
                                          </span>
                                          {col.sortable && (
                                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        );
                      }

                      // Pour les autres catégories
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
                    Rapport pour {MONTHS.find((m) => m.value === mois)?.label}{" "}
                    {annee} • {filteredAndSortedData.length} lignes •{" "}
                    {sitesToShow.length} sites
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                    <span>Total par type</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    id="rapport-unite-physique"
                    className={compactMode ? "text-sm" : ""}
                  >
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        {generateColumns
                          .filter((col) => visibleColumns.includes(col.key))
                          .map((col) => (
                            <TableHead
                              key={col.key}
                              className={`text-center whitespace-nowrap ${
                                col.sortable
                                  ? "cursor-pointer hover:bg-accent transition-colors"
                                  : ""
                              } ${compactMode ? "py-2 px-2" : "py-3 px-4"} ${
                                col.category === "totaux"
                                  ? "bg-blue-50 dark:bg-blue-950/30"
                                  : ""
                              }`}
                              onClick={() =>
                                col.sortable && handleSort(col.key)
                              }
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
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
                      {filteredAndSortedData.map((row) => (
                        <TableRow
                          key={row.id}
                          className={`
                            hover:bg-accent/50 transition-colors
                            ${getRowStyle(row)}
                            ${compactMode ? "py-1" : "py-2"}
                          `}
                        >
                          {generateColumns
                            .filter((col) => visibleColumns.includes(col.key))
                            .map((col) => {
                              const cellValue = row[col.key];
                              const formattedValue = formatCellValue(
                                cellValue,
                                col.key
                              );

                              return (
                                <TableCell
                                  key={col.key}
                                  className={`
                                    text-center whitespace-nowrap
                                    ${compactMode ? "px-2" : "px-4"}
                                    ${
                                      col.category === "totaux" ||
                                      row.type === "total-type"
                                        ? "font-semibold"
                                        : ""
                                    }
                                    ${
                                      row.type === "total-type"
                                        ? "bg-gray-50 dark:bg-gray-900/50"
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

              {/* Statistiques */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                <div>
                  Affichage de {filteredAndSortedData.length} ligne
                  {filteredAndSortedData.length > 1 ? "s" : ""} •{" "}
                  {sitesToShow.length} sites
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>Tri:</span>
                    {sortColumn ? (
                      <Badge variant="outline" className="gap-1">
                        {
                          generateColumns.find((c) => c.key === sortColumn)
                            ?.label
                        }
                        {sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Badge>
                    ) : (
                      <span className="italic">Aucun</span>
                    )}
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
