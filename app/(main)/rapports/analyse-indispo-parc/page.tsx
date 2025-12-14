"use client";

import { useState, useMemo } from "react";
import { useAnalyseIndisponibilite } from "@/hooks/useAnalyseIndisponibilite";
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
  AlertCircle,
  Filter,
  BarChart3,
} from "lucide-react";
import { exportExcel } from "@/lib/xlsxFn";

// Configuration des colonnes
const ALL_COLUMNS = [
  // Colonnes d'identité
  {
    key: "categorie",
    label: "CATÉGORIE",
    sortable: true,
    category: "identite",
  },
  { key: "panne", label: "PANNE", sortable: true, category: "identite" },

  // Colonnes NI (Nombre d'interventions)
  { key: "ni_mois", label: "NI Mens", sortable: true, category: "ni" },
  { key: "ni_annuel", label: "NI Annuel", sortable: true, category: "ni" },

  // Colonnes HIM (Heures d'immobilisation)
  { key: "him_mois", label: "HIM Mens", sortable: true, category: "him" },
  { key: "him_annuel", label: "HIM Annuel", sortable: true, category: "him" },

  // Colonnes coefficients NI
  {
    key: "coeff_ni_mois",
    label: "COEF NI Mens",
    sortable: true,
    category: "coeff_ni",
  },
  {
    key: "coeff_ni_annuel",
    label: "COEF NI Annuel",
    sortable: true,
    category: "coeff_ni",
  },

  // Colonnes coefficients HIM
  {
    key: "coeff_him_mois",
    label: "COEF HIM Mens",
    sortable: true,
    category: "coeff_him",
  },
  {
    key: "coeff_him_annuel",
    label: "COEF HIM Annuel",
    sortable: true,
    category: "coeff_him",
  },
];

// Catégories de colonnes
const COLUMN_CATEGORIES = [
  {
    id: "identite",
    label: "Identité",
    icon: <BarChart3 className="h-3 w-3" />,
  },
  { id: "ni", label: "NI", icon: <AlertCircle className="h-3 w-3" /> },
  { id: "him", label: "HIM", icon: <Calendar className="h-3 w-3" /> },
  { id: "coeff_ni", label: "COEF NI", icon: <Filter className="h-3 w-3" /> },
  { id: "coeff_him", label: "COEF HIM", icon: <Filter className="h-3 w-3" /> },
];

// Colonnes visibles par défaut
const DEFAULT_VISIBLE_COLUMNS = [
  "categorie",
  "panne",
  "ni_mois",
  "ni_annuel",
  "him_mois",
  "him_annuel",
  "coeff_ni_mois",
  "coeff_ni_annuel",
  "coeff_him_mois",
  "coeff_him_annuel",
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

export default function AnalyseIndisponibilitePage() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [shouldFetch, setShouldFetch] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [highlightCoefficients, setHighlightCoefficients] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [compactMode, setCompactMode] = useState(true);
  const [selectedTypeParc, setSelectedTypeParc] = useState<string>("all");
  const [selectedParc, setSelectedParc] = useState<string>("all");

  // Extraction du mois et de l'année
  const [mois, annee] = useMemo(() => {
    if (!date) return ["", ""];
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear().toString();
    return [month, year];
  }, [date]);

  // Hook pour récupérer les données
  const analyseQuery = useAnalyseIndisponibilite(
    shouldFetch ? mois : null,
    shouldFetch ? annee : null
  );

  // Liste des typeparcs et parcs pour les filtres
  const typeparcList = useMemo(() => {
    if (!analyseQuery.data) return [];
    return analyseQuery.data.map((tp) => ({
      id: tp.typeParcId,
      name: tp.typeParcName,
    }));
  }, [analyseQuery.data]);

  const parcList = useMemo(() => {
    if (!analyseQuery.data || selectedTypeParc === "all") return [];
    const typeparc = analyseQuery.data.find(
      (tp) => tp.typeParcId === selectedTypeParc
    );
    if (!typeparc) return [];
    return typeparc.parcs.map((p) => ({
      id: p.parcId,
      name: p.parcName,
    }));
  }, [analyseQuery.data, selectedTypeParc]);

  // Fonction pour générer le rapport
  const handleGenerateReport = () => {
    if (!date) return;
    setShouldFetch(true);
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    analyseQuery.refetch();
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

  // Préparer les données pour l'affichage avec des clés uniques
  const flatData = useMemo(() => {
    if (!analyseQuery.data) return [];

    const data: any[] = [];
    let uniqueCounter = 0;

    analyseQuery.data.forEach((typeparc) => {
      // Filtrer par typeparc si sélectionné
      if (
        selectedTypeParc !== "all" &&
        selectedTypeParc !== typeparc.typeParcId
      ) {
        return;
      }

      // En-tête du type de parc avec nombre d'engins
      const totalEngins = typeparc.parcs.reduce(
        (sum, parc) => sum + parc.nbreEngins,
        0
      );

      data.push({
        id: `${typeparc.typeParcId}-header-${++uniqueCounter}`,
        type: "header",
        categorie: `${typeparc.typeParcName.toUpperCase()} (${totalEngins})`,
        panne: "",
        isHeader: true,
      });

      // Pour chaque parc dans le typeparc
      typeparc.parcs.forEach((parc) => {
        // Filtrer par parc si sélectionné
        if (selectedParc !== "all" && selectedParc !== parc.parcId) {
          return;
        }

        // Pour chaque type de panne dans le parc
        parc.pannes.forEach((typepanne) => {
          // Pour chaque panne dans le type de panne
          typepanne.pannes.forEach((panne) => {
            data.push({
              id: `${panne.panneId}-detail-${++uniqueCounter}`,
              type: "detail",
              categorie: typepanne.typepanneName,
              panne: panne.panneName,
              ni_mois: panne.niMois,
              ni_annuel: panne.niAnnee,
              him_mois: panne.himMois,
              him_annuel: panne.himAnnee,
              coeff_ni_mois: panne.coeffNiMois,
              coeff_ni_annuel: panne.coeffNiAnnee,
              coeff_him_mois: panne.coeffHimMois,
              coeff_him_annuel: panne.coeffHimAnnee,
              typeparcId: typeparc.typeParcId,
              parcId: parc.parcId,
              isDetail: true,
            });
          });

          // Ligne de total pour le type de panne
          data.push({
            id: `${typepanne.typepanneId}-total-type-${++uniqueCounter}`,
            type: "total-type",
            categorie: "",
            panne: `TOTAL ${typepanne.typepanneName.toUpperCase()}`,
            ni_mois: typepanne.totalTypePanne.niMois,
            ni_annuel: typepanne.totalTypePanne.niAnnee,
            him_mois: typepanne.totalTypePanne.himMois,
            him_annuel: typepanne.totalTypePanne.himAnnee,
            coeff_ni_mois: typepanne.totalTypePanne.coeffNiMois,
            coeff_ni_annuel: typepanne.totalTypePanne.coeffNiAnnee,
            coeff_him_mois: typepanne.totalTypePanne.coeffHimMois,
            coeff_him_annuel: typepanne.totalTypePanne.coeffHimAnnee,
            isTotalType: true,
          });
        });

        // Ligne de total pour le parc
        data.push({
          id: `${parc.parcId}-total-parc-${++uniqueCounter}`,
          type: "total-parc",
          categorie: "",
          panne: `TOTAL ${parc.parcName.toUpperCase()}`,
          ni_mois: parc.totalParc.niMois,
          ni_annuel: parc.totalParc.niAnnee,
          him_mois: parc.totalParc.himMois,
          him_annuel: parc.totalParc.himAnnee,
          coeff_ni_mois: parc.totalParc.coeffNiMois,
          coeff_ni_annuel: parc.totalParc.coeffNiAnnee,
          coeff_him_mois: parc.totalParc.coeffHimMois,
          coeff_him_annuel: parc.totalParc.coeffHimAnnee,
          isTotalParc: true,
        });
      });

      // Ligne de total pour le type de parc
      data.push({
        id: `${typeparc.typeParcId}-total-${++uniqueCounter}`,
        type: "total",
        categorie: "",
        panne: `TOTAL ${typeparc.typeParcName.toUpperCase()}`,
        ni_mois: typeparc.totalTypeParc.niMois,
        ni_annuel: typeparc.totalTypeParc.niAnnee,
        him_mois: typeparc.totalTypeParc.himMois,
        him_annuel: typeparc.totalTypeParc.himAnnee,
        coeff_ni_mois: typeparc.totalTypeParc.coeffNiMois,
        coeff_ni_annuel: typeparc.totalTypeParc.coeffNiAnnee,
        coeff_him_mois: typeparc.totalTypeParc.coeffHimMois,
        coeff_him_annuel: typeparc.totalTypeParc.coeffHimAnnee,
        isTotal: true,
      });
    });

    return data;
  }, [analyseQuery.data, selectedTypeParc, selectedParc]);

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    let data = [...flatData];

    // Filtre de recherche
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.categorie.toLowerCase().includes(searchLower) ||
          item.panne.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    if (sortColumn) {
      data.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (a.isHeader || b.isHeader) return 0;
        if (a.isTotal && b.isTotal) return 0;
        if (a.isTotal) return 1;
        if (b.isTotal) return -1;
        if (a.isTotalParc && b.isTotalParc) return 0;
        if (a.isTotalParc) return 1;
        if (b.isTotalParc) return -1;
        if (a.isTotalType && b.isTotalType) return 0;
        if (a.isTotalType) return 1;
        if (b.isTotalType) return -1;

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? -1 : 1;
        if (bValue == null) return sortDirection === "asc" ? 1 : -1;

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
  const formatNumber = (num: number, decimals: number = 0) => {
    if (decimals > 0) {
      return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
  };

  // Formatage des valeurs de cellule
  const formatCellValue = (value: any, columnKey: string) => {
    if (value == null || value === "") return "-";

    if (typeof value === "number") {
      if (columnKey.includes("coeff")) {
        return `${value.toFixed(2)}%`;
      }
      if (columnKey.includes("him")) {
        return formatNumber(value, 1);
      }
      return formatNumber(value, 0);
    }

    return value;
  };

  // Couleur selon le type de ligne
  const getRowClass = (row: any) => {
    if (row.isHeader) return "bg-primary/10 font-bold text-primary";
    if (row.isTotal) return "bg-secondary font-bold";
    if (row.isTotalParc) return "bg-muted font-semibold";
    if (row.isTotalType) return "bg-muted/50 font-medium";
    return "";
  };

  // Couleur des cellules pour les coefficients
  const getCellColor = (value: any, columnKey: string) => {
    if (!highlightCoefficients || !columnKey.includes("coeff")) return "";

    const val = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(val)) return "";

    if (val > 5) return "text-red-600 dark:text-red-400 font-medium";
    if (val > 2) return "text-orange-600 dark:text-orange-400 font-medium";
    if (val > 0.5) return "text-yellow-600 dark:text-yellow-400 font-medium";
    return "";
  };

  // Export des données
  const handleExport = () => {
    if (filteredAndSortedData?.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("rapport-analyse-indispo", "Rapport_Analyse_Indisponibilite");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Analyse d'Indisponibilité par Parc
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyse des pannes et indisponibilités par type de parc et parc
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
              <TooltipContent>Exporter les données en CSV</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filtres et options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                disabled={analyseQuery.isFetching || !date}
                className="w-full gap-2"
              >
                {analyseQuery.isFetching ? (
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
                <Filter className="h-4 w-4" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="typeparc">Type de Parc</Label>
                <Select
                  value={selectedTypeParc}
                  onValueChange={(value) => {
                    setSelectedTypeParc(value);
                    setSelectedParc("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {typeparcList.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id}>
                        {tp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parc">Parc</Label>
                <Select
                  value={selectedParc}
                  onValueChange={setSelectedParc}
                  disabled={selectedTypeParc === "all" || parcList.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les parcs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les parcs</SelectItem>
                    {parcList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  placeholder="Rechercher panne ou catégorie..."
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
                Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="highlight-coeff" className="cursor-pointer">
                  Surligner coefficients
                </Label>
                <Switch
                  id="highlight-coeff"
                  checked={highlightCoefficients}
                  onCheckedChange={setHighlightCoefficients}
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
                disabled={analyseQuery.isFetching}
                className="w-full gap-2"
              >
                {analyseQuery.isFetching ? (
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
                  <BarChart3 className="h-12 w-12 text-muted-foreground" />
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

        {analyseQuery.isFetching && (
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Chargement de l'analyse
                  </h3>
                  <p className="text-muted-foreground">
                    Calcul des données pour {mois}/{annee}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analyseQuery.error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Erreur de chargement</h3>
                  <p className="text-sm">{analyseQuery.error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tableau de données */}
        {flatData.length > 0 && !analyseQuery.isFetching && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Résultats de l'analyse</CardTitle>
                  <CardDescription>
                    Analyse pour {MONTHS.find((m) => m.value === mois)?.label}{" "}
                    {annee} • {filteredAndSortedData.length} lignes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    <span>{"COEF > 5%"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                    <span>{"2% < COEF ≤ 5%"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                    <span>{"0.5% < COEF ≤ 2%"}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    id="rapport-analyse-indispo"
                    className={compactMode ? "text-sm" : ""}
                  >
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        {ALL_COLUMNS.filter((col) =>
                          visibleColumns.includes(col.key)
                        ).map((col) => (
                          <TableHead
                            key={col.key}
                            className={`whitespace-nowrap ${
                              col.sortable
                                ? "cursor-pointer hover:bg-accent transition-colors"
                                : ""
                            } ${compactMode ? "py-2 px-2" : "py-3 px-4"}`}
                            onClick={() => col.sortable && handleSort(col.key)}
                          >
                            <div className="flex items-center gap-1">
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
                          key={row.id} // Utilisation de l'ID unique
                          className={`${getRowClass(row)} ${
                            compactMode ? "py-1" : "py-2"
                          }`}
                        >
                          {ALL_COLUMNS.filter((col) =>
                            visibleColumns.includes(col.key)
                          ).map((col) => {
                            const cellValue = row[col.key];
                            const formattedValue = formatCellValue(
                              cellValue,
                              col.key
                            );
                            const colorClass = getCellColor(cellValue, col.key);

                            return (
                              <TableCell
                                key={`${row.id}-${col.key}`} // Clé unique pour chaque cellule
                                className={`
                                  whitespace-nowrap
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
