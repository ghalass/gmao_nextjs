"use client";

import { useState, useMemo } from "react";
import { useEtatMensuel } from "@/hooks/useRapportEtatMensuel";

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
  AlertCircle,
  Info,
} from "lucide-react";

// Configuration des colonnes
const ALL_COLUMNS = [
  // Colonnes d'identité
  { key: "parc", label: "PARC", sortable: true, category: "identite" },
  { key: "nbre", label: "NBRE", sortable: true, category: "identite" },
  { key: "ratio", label: "RATIO", sortable: false, category: "identite" },

  // Colonnes NHO
  {
    key: "nho",
    label: "NHO",
    sortable: true,
    category: "nho",
    hasPeriods: true,
  },

  // Colonnes HIM
  {
    key: "him",
    label: "HIM",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Colonnes HRM
  {
    key: "hrm",
    label: "HRM",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Colonnes HRD
  {
    key: "hrd",
    label: "HRD",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Colonnes MTTR
  {
    key: "mttr",
    label: "MTTR",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Colonnes DISP
  {
    key: "disp",
    label: "DISP",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Colonnes UTIL
  {
    key: "util",
    label: "UTIL",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Colonnes SW
  {
    key: "sw",
    label: "SW",
    sortable: true,
    category: "indicateurs",
    hasPeriods: true,
  },

  // Objectifs
  { key: "obj_d", label: "OBJ-D", sortable: true, category: "objectifs" },
  { key: "obj_u", label: "OBJ-U", sortable: true, category: "objectifs" },
];

// Catégories de colonnes
const COLUMN_CATEGORIES = [
  { id: "identite", label: "Identité", icon: <Info className="h-3 w-3" /> },
  { id: "nho", label: "NHO", icon: <AlertCircle className="h-3 w-3" /> },
  {
    id: "indicateurs",
    label: "Indicateurs",
    icon: <Calendar className="h-3 w-3" />,
  },
  {
    id: "objectifs",
    label: "Objectifs",
    icon: <AlertCircle className="h-3 w-3" />,
  },
];

// Colonnes visibles par défaut
const DEFAULT_VISIBLE_COLUMNS = [
  "parc",
  "nbre",
  "ratio",
  "nho",
  "him",
  "hrm",
  "hrd",
  "mttr",
  "disp",
  "util",
  "sw",
  "obj_d",
  "obj_u",
];

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

export default function EtatMensuelPage() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    // Format: "YYYY-MM" (compatible avec l'input type="month")
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [shouldFetch, setShouldFetch] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [highlightTargets, setHighlightTargets] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [compactMode, setCompactMode] = useState(false);

  // Extraction du mois et de l'année depuis la date
  const [mois, annee] = useMemo(() => {
    if (!date) return ["", ""];
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear().toString();
    return [month, year];
  }, [date]);

  // Hook pour récupérer les données
  const etatMensuelQuery = useEtatMensuel(
    shouldFetch ? mois : null,
    shouldFetch ? annee : null
  );

  // Fonction pour générer le rapport
  const handleGenerateReport = () => {
    if (!date) return;
    setShouldFetch(true);
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    etatMensuelQuery.refetch();
  };

  // Gestion du tri
  const handleSort = (columnKey: string) => {
    if (!ALL_COLUMNS.find((col) => col.key === columnKey)?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // Préparer les données pour l'affichage
  const flatData = useMemo(() => {
    if (!etatMensuelQuery.data) return [];

    const data: any[] = [];

    etatMensuelQuery.data.forEach((typeparc) => {
      // Ajouter chaque parc
      typeparc.parcs.forEach((parc) => {
        // Ligne mensuelle
        data.push({
          id: `${parc.parcId}-mensuel`,
          type: "parc-mensuel",
          parc: parc.parcName,
          nbre: parc.nbreEngins,
          ratio: "Mensuel",
          // Valeurs mensuelles
          nho: parc.nhoMois,
          him: parc.aggregatesMois.him,
          hrm: parc.aggregatesMois.hrm,
          hrd: parc.aggregatesMois.hrd,
          mttr: parc.aggregatesMois.mttr,
          disp: parc.aggregatesMois.disp,
          util: parc.aggregatesMois.util,
          sw: parc.aggregatesMois.sw,
          // Objectifs
          obj_d: parc.objectifDispo,
          obj_u: parc.objectifUtil,
          period: "M", // Indicateur de période
        });

        // Ligne annuelle
        data.push({
          id: `${parc.parcId}-annuel`,
          type: "parc-annuel",
          parc: parc.parcName,
          nbre: parc.nbreEngins,
          ratio: "Annuel",
          // Valeurs annuelles
          nho: parc.nhoAnnee,
          him: parc.aggregatesAnnee.him,
          hrm: parc.aggregatesAnnee.hrm,
          hrd: parc.aggregatesAnnee.hrd,
          mttr: parc.aggregatesAnnee.mttr,
          disp: parc.aggregatesAnnee.disp,
          util: parc.aggregatesAnnee.util,
          sw: parc.aggregatesAnnee.sw,
          // Objectifs
          obj_d: parc.objectifDispo,
          obj_u: parc.objectifUtil,
          period: "A", // Indicateur de période
        });
      });

      // Ligne de total pour le type de parc
      data.push({
        id: `${typeparc.typeParcId}-total`,
        type: "total",
        parc: `TOTAL ${typeparc.typeParcName}`,
        nbre: typeparc.totalTypeParc.nbreEngins,
        ratio: "Total",
        // Valeurs mensuelles (totaux)
        nho: typeparc.totalTypeParc.nhoMois,
        him: typeparc.totalTypeParc.aggregatesMois.him,
        hrm: typeparc.totalTypeParc.aggregatesMois.hrm,
        hrd: typeparc.totalTypeParc.aggregatesMois.hrd,
        mttr: typeparc.totalTypeParc.aggregatesMois.mttr,
        disp: typeparc.totalTypeParc.aggregatesMois.disp,
        util: typeparc.totalTypeParc.aggregatesMois.util,
        sw: typeparc.totalTypeParc.aggregatesMois.sw,
        // Objectifs (pas d'objectifs pour les totaux)
        obj_d: null,
        obj_u: null,
        period: "T", // Indicateur de total
      });
    });

    return data;
  }, [etatMensuelQuery.data]);

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    let data = [...flatData];

    // Filtre de recherche
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.parc.toLowerCase().includes(searchLower) ||
          item.ratio.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    if (sortColumn) {
      data.sort((a, b) => {
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

    return data;
  }, [flatData, search, sortColumn, sortDirection]);

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
      setVisibleColumns((prev) =>
        prev.filter((col) => !categoryColumns.includes(col))
      );
    } else {
      setVisibleColumns((prev) => [...new Set([...prev, ...categoryColumns])]);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  // Formatage des nombres
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
  };

  // Formatage des valeurs de cellule
  const formatCellValue = (value: any, columnKey: string) => {
    if (value == null || value === "") return "-";

    if (columnKey === "disp" || columnKey === "util" || columnKey === "sw") {
      return `${parseFloat(value).toFixed(1)}%`;
    }

    if (typeof value === "number") {
      if (value > 1000) {
        return formatNumber(value);
      }
      if (columnKey === "mttr") {
        return value.toFixed(1);
      }
      return value.toFixed(0);
    }

    return value;
  };

  // Couleur selon objectif
  const getCellColor = (value: any, columnKey: string, row: any) => {
    if (!highlightTargets) return "";
    const val = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(val)) return "";

    if (columnKey === "disp" || columnKey === "obj_d") {
      const ratio = val / row.obj_d;
      if (ratio >= 1) return "text-green-600 dark:text-green-400 font-medium";
      if (ratio < 1 && ratio > 0.95)
        return "text-yellow-600 dark:text-yellow-400 font-medium";
      if (ratio <= 0.95 && ratio > 0.9)
        return "text-red-600 dark:text-red-400 font-medium";
      return "text-red-600 dark:text-red-400 font-medium";
    }

    if (columnKey === "util" || columnKey === "obj_u") {
      const ratio = val / row.obj_u;
      if (ratio >= 1) return "text-green-600 dark:text-green-400 font-medium";
      if (ratio < 1 && ratio > 0.95)
        return "text-yellow-600 dark:text-yellow-400 font-medium";
      if (ratio <= 0.95 && ratio > 0.9)
        return "text-red-600 dark:text-red-400 font-medium";
      return "text-red-600 dark:text-red-400 font-medium";
    }

    return "";
  };

  // Export des données
  const handleExport = () => {
    // TODO: Implémenter l'export CSV
    console.log("Export des données...");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              État Physique Mensuel des Engins
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rapport mensuel des performances des engins par parc et type
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
                disabled={etatMensuelQuery.isFetching || !date}
                className="w-full gap-2"
              >
                {etatMensuelQuery.isFetching ? (
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
                  placeholder="Rechercher par parc..."
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
                <Label htmlFor="highlight-targets" className="cursor-pointer">
                  Surligner objectifs
                </Label>
                <Switch
                  id="highlight-targets"
                  checked={highlightTargets}
                  onCheckedChange={setHighlightTargets}
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
                disabled={etatMensuelQuery.isFetching}
                className="w-full gap-2"
              >
                {etatMensuelQuery.isFetching ? (
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

        {etatMensuelQuery.isFetching && (
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

        {etatMensuelQuery.error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Erreur de chargement</h3>
                  <p className="text-sm">{etatMensuelQuery.error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tableau de données */}
        {flatData.length > 0 && !etatMensuelQuery.isFetching && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Résultats</CardTitle>
                  <CardDescription>
                    Rapport pour {MONTHS.find((m) => m.value === mois)?.label}{" "}
                    {annee} • {filteredAndSortedData.length} lignes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    <span>{"Ratio ≥ 1"}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                    <span>{"0.95 < Ratio < 1"}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    <span>{"Ratio ≤ 0.95"}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className={compactMode ? "text-sm" : ""}>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        {ALL_COLUMNS.filter((col) =>
                          visibleColumns.includes(col.key)
                        ).map((col) => (
                          <TableHead
                            key={col.key}
                            className={`text-center whitespace-nowrap ${
                              col.sortable
                                ? "cursor-pointer hover:bg-accent transition-colors"
                                : ""
                            } ${compactMode ? "py-2 px-2" : "py-3 px-4"}`}
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
                      {filteredAndSortedData.map((row) => (
                        <TableRow
                          key={row.id}
                          className={`
                            hover:bg-accent/50 transition-colors
                            ${compactMode ? "py-1" : "py-2"}
                          `}
                        >
                          {ALL_COLUMNS.filter((col) =>
                            visibleColumns.includes(col.key)
                          ).map((col) => {
                            const cellValue = row[col.key];
                            const formattedValue = formatCellValue(
                              cellValue,
                              col.key
                            );
                            const colorClass = getCellColor(
                              cellValue,
                              col.key,
                              row
                            );

                            return (
                              <TableCell
                                key={col.key}
                                className={`
                                  text-center whitespace-nowrap
                                  ${colorClass}
                                  ${compactMode ? "px-2" : "px-4"}
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
                  {filteredAndSortedData.length > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>Tri:</span>
                    {sortColumn ? (
                      <Badge variant="outline" className="gap-1">
                        {ALL_COLUMNS.find((c) => c.key === sortColumn)?.label}
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
