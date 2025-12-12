// app/rapports/unite-physique/page.tsx
"use client";

import { useState, useMemo, Fragment } from "react";
import { useRapportUnitePhysique } from "@/hooks/useRapportUnitePhysique";

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
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Search,
  Loader2,
  RefreshCw,
  Download,
  Calendar,
  AlertCircle,
  HardDrive,
} from "lucide-react";

// Définition des colonnes
const ALL_COLUMNS = [
  { key: "typeParc", label: "PARCS", category: "identité", fixed: true },
  { key: "nbre", label: "NBRE", category: "identité", fixed: true },
];

// Colonnes visibles par défaut
const DEFAULT_VISIBLE_COLUMNS = ["typeParc", "nbre"];

export default function UnitePhysiquePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showDateAlert, setShowDateAlert] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [currentReportDate, setCurrentReportDate] = useState("");
  const [showAllSites, setShowAllSites] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const rapportQuery = useRapportUnitePhysique(shouldFetch ? date : "");
  const data = rapportQuery.data ?? [];

  // Extraire tous les sites uniques
  const allSites = useMemo(() => {
    const sites = new Set<string>();
    data.forEach((item) => {
      item.parcs.forEach((parc) => {
        Object.keys(parc.siteStats).forEach((site) => {
          sites.add(site);
        });
      });
    });
    return Array.from(sites).sort();
  }, [data]);

  // Gestion du changement de date
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setShouldFetch(false);
    setCurrentPage(1);
  };

  // Fonction pour générer le rapport
  const handleGenerateReport = () => {
    if (!date) {
      setShowDateAlert(true);
      return;
    }

    setShouldFetch(true);
    setCurrentReportDate(date);
    setCurrentPage(1);
  };

  // Fonction pour rafraîchir
  const handleRefresh = () => {
    if (!date) {
      setShowDateAlert(true);
      return;
    }

    rapportQuery.refetch();
  };

  // Filtrer les données
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    return data.filter((item) => {
      if (!search) return true;

      const q = search.toLowerCase();
      return (
        item.typeParcName.toLowerCase().includes(q) ||
        item.parcs.some((parc) => parc.parcName.toLowerCase().includes(q))
      );
    });
  }, [data, search]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Navigation des pages
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Gérer l'export
  const handleExport = () => {
    // TODO: Implémenter l'export CSV/Excel
    console.log("Export des données...");
  };

  // Format des nombres
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
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
              <HardDrive className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Rapport Unité Physique
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rapport HRM/HIM par parc et par site
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Search className="h-4 w-4" />
                Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type parc, parc..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={data.length === 0}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indicateurs */}
        {data.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    currentReportDate === date
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  Rapport du {currentReportDate}
                </span>
                {currentReportDate !== date && (
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-300"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Date différente
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {" "}
                {filteredData.length} type{filteredData.length > 1 ? "s" : ""}{" "}
                de parc {` • Page ${currentPage}/${totalPages}`}{" "}
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

        {/* TABLE */}
        {data.length > 0 && !rapportQuery.isFetching && (
          <>
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="p-3 bg-muted/30 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Lignes {(currentPage - 1) * pageSize + 1} à{" "}
                    {Math.min(currentPage * pageSize, filteredData.length)} sur{" "}
                    {filteredData.length}
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
                        setPageSize(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <Table className={compactMode ? "text-sm" : ""}>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      {/* En-têtes fixes */}
                      <TableHead className="text-center py-3 font-bold bg-muted">
                        PARCS
                      </TableHead>
                      <TableHead className="text-center py-3 font-bold bg-muted">
                        NBRE
                      </TableHead>

                      {/* En-têtes des sites (HRM/HIM) */}
                      {allSites.map((site, key) => (
                        <Fragment key={key}>
                          <TableHead
                            key={`${site}_hrm_header`}
                            className="text-center py-3 font-bold bg-muted/70"
                            colSpan={2}
                          >
                            {site}
                          </TableHead>
                        </Fragment>
                      ))}

                      {/* Totaux mensuels */}
                      <TableHead
                        className="text-center py-3 font-bold bg-muted"
                        colSpan={2}
                      >
                        MENSUEL
                      </TableHead>

                      {/* Totaux annuels */}
                      <TableHead
                        className="text-center py-3 font-bold bg-muted"
                        colSpan={2}
                      >
                        ANNUEL
                      </TableHead>
                    </TableRow>

                    {/* Sous-en-têtes */}
                    <TableRow>
                      <TableHead className="text-center py-2 bg-muted/30"></TableHead>
                      <TableHead className="text-center py-2 bg-muted/30"></TableHead>

                      {/* Sous-en-têtes pour chaque site */}
                      {allSites.flatMap((site) => [
                        <TableHead
                          key={`${site}_hrm_sub`}
                          className="text-center py-2 bg-muted/30"
                        >
                          HRM
                        </TableHead>,
                        <TableHead
                          key={`${site}_him_sub`}
                          className="text-center py-2 bg-muted/30"
                        >
                          HIM
                        </TableHead>,
                      ])}

                      {/* Sous-en-têtes totaux */}
                      <TableHead className="text-center py-2 bg-muted/30">
                        HRM
                      </TableHead>
                      <TableHead className="text-center py-2 bg-muted/30">
                        HIM
                      </TableHead>
                      <TableHead className="text-center py-2 bg-muted/30">
                        HRM
                      </TableHead>
                      <TableHead className="text-center py-2 bg-muted/30">
                        HIM
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedData.map((item, index) => (
                      <>
                        {/* Type de parc */}
                        <TableRow
                          key={`type-${item.typeParcName}`}
                          className="bg-primary/5"
                        >
                          <TableCell className="font-bold py-3">
                            {item.typeParcName}
                          </TableCell>
                          <TableCell className="text-center py-3 font-bold">
                            {item.parcs.reduce(
                              (sum, parc) =>
                                sum +
                                Object.values(parc.siteStats).reduce(
                                  (s, stat) => s + (stat.nbre || 0),
                                  0
                                ),
                              0
                            )}
                          </TableCell>

                          {/* Données par site pour le type de parc (ligne vide) */}
                          {allSites.flatMap((site) => [
                            <TableCell
                              key={`${item.typeParcName}_${site}_hrm`}
                              className="text-center py-3"
                            ></TableCell>,
                            <TableCell
                              key={`${item.typeParcName}_${site}_him`}
                              className="text-center py-3"
                            ></TableCell>,
                          ])}

                          {/* Totaux mensuels type parc */}
                          <TableCell className="text-center py-3 font-bold">
                            {formatNumber(item.totalTypeParc.mensuel.totalHRM)}
                          </TableCell>
                          <TableCell className="text-center py-3 font-bold">
                            {formatNumber(item.totalTypeParc.mensuel.totalHIM)}
                          </TableCell>

                          {/* Totaux annuels type parc */}
                          <TableCell className="text-center py-3 font-bold">
                            {formatNumber(item.totalTypeParc.annuel.totalHRM)}
                          </TableCell>
                          <TableCell className="text-center py-3 font-bold">
                            {formatNumber(item.totalTypeParc.annuel.totalHIM)}
                          </TableCell>
                        </TableRow>

                        {/* Parcs individuels sous le type de parc */}
                        {item.parcs.map((parc) => (
                          <TableRow
                            key={`${item.typeParcName}-${parc.parcName}`}
                            className={
                              index % 2 === 0 ? "bg-card" : "bg-muted/30"
                            }
                          >
                            <TableCell className="py-2 pl-8">
                              {parc.parcName}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {Object.values(parc.siteStats).reduce(
                                (sum, stat) => sum + (stat.nbre || 0),
                                0
                              )}
                            </TableCell>

                            {/* Données par site */}
                            {allSites.map((site) => {
                              const stats = parc.siteStats[site] || {
                                hrm: 0,
                                him: 0,
                                nbre: 0,
                              };
                              return (
                                <>
                                  <TableCell
                                    key={`${parc.parcName}_${site}_hrm`}
                                    className="text-center py-2"
                                  >
                                    {stats.hrm > 0
                                      ? formatNumber(stats.hrm)
                                      : "-"}
                                  </TableCell>
                                  <TableCell
                                    key={`${parc.parcName}_${site}_him`}
                                    className="text-center py-2"
                                  >
                                    {stats.him > 0
                                      ? formatNumber(stats.him)
                                      : "-"}
                                  </TableCell>
                                </>
                              );
                            })}

                            {/* Totaux mensuels parc */}
                            <TableCell className="text-center py-2">
                              {formatNumber(
                                Object.values(parc.siteStats).reduce(
                                  (sum, stat) => sum + stat.hrm,
                                  0
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {formatNumber(
                                Object.values(parc.siteStats).reduce(
                                  (sum, stat) => sum + stat.him,
                                  0
                                )
                              )}
                            </TableCell>

                            {/* Totaux annuels parc (estimation basée sur mensuel * 12 pour HRM) */}
                            <TableCell className="text-center py-2">
                              {formatNumber(
                                Object.values(parc.siteStats).reduce(
                                  (sum, stat) => sum + stat.hrm,
                                  0
                                ) * 12
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {formatNumber(
                                Object.values(parc.siteStats).reduce(
                                  (sum, stat) => sum + stat.him,
                                  0
                                ) * 12
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} • {filteredData.length}{" "}
                  résultats
                </div>

                <Pagination>
                  <PaginationContent>
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

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) return null;
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
