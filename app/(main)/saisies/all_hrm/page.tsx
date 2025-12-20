"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Filter, Loader2, ListTodo, ListChecks } from "lucide-react";
import { SaisiehrmTable } from "@/components/saisiehrm/saisiehrm-table";
import {
  SaisiehrmWithRelations,
  PaginatedSaisiehrm,
} from "@/lib/types/saisiehrm";
import { Engin, Site, Parc, Typeparc } from "@prisma/client";
import { cn } from "@/lib/utils";

export default function SaisiehrmPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [data, setData] = useState<PaginatedSaisiehrm | null>(null);
  const [loading, setLoading] = useState(false);
  const [engins, setEngins] = useState<Engin[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [parcs, setParcs] = useState<Parc[]>([]);
  const [typeparcs, setTypeparcs] = useState<Typeparc[]>([]);
  const [filters, setFilters] = useState({
    enginId: "",
    siteId: "",
    parcId: "",
    typeparcId: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showAll, setShowAll] = useState(false);
  const [showPagination, setShowPagination] = useState(true);

  // Formater la date pour l'input de type date (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };

  // Charger les données pour les filtres
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [enginsRes, sitesRes, parcsRes, typeparcsRes] = await Promise.all(
          [
            fetch("/api/engins"),
            fetch("/api/sites"),
            fetch("/api/parcs"),
            fetch("/api/typeparcs"),
          ]
        );

        if (enginsRes.ok) {
          const enginsData = await enginsRes.json();
          setEngins(enginsData);
        }

        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          setSites(sitesData);
        }

        if (parcsRes.ok) {
          const parcsData = await parcsRes.json();
          setParcs(parcsData);
        }

        if (typeparcsRes.ok) {
          const typeparcsData = await typeparcsRes.json();
          setTypeparcs(typeparcsData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des filtres:", error);
      }
    };

    loadFiltersData();
  }, []);

  // Charger les données lorsque la date, les filtres, la page ou showAll changent
  useEffect(() => {
    loadData();
  }, [selectedDate, filters, page, pageSize, showAll]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Nettoyer les paramètres - enlever les valeurs vides
      const paramsObj: Record<string, string> = {
        date: selectedDate.toISOString(),
      };

      // Si showAll est activé, utiliser le paramètre showAll
      if (showAll) {
        paramsObj.showAll = "true";
      } else {
        // Sinon, utiliser la pagination par page
        paramsObj.page = page.toString();
        paramsObj.pageSize = pageSize.toString();
      }

      // Ajouter uniquement les filtres non vides
      if (filters.enginId && filters.enginId !== "") {
        paramsObj.enginId = filters.enginId;
      }

      if (filters.siteId && filters.siteId !== "") {
        paramsObj.siteId = filters.siteId;
      }

      if (filters.parcId && filters.parcId !== "") {
        paramsObj.parcId = filters.parcId;
      }

      if (filters.typeparcId && filters.typeparcId !== "") {
        paramsObj.typeparcId = filters.typeparcId;
      }

      const params = new URLSearchParams(paramsObj);
      console.log("Chargement des données avec params:", params.toString()); // Debug

      const response = await fetch(`/api/saisiehrm/list?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const result = await response.json();
      console.log("Données reçues:", result.data?.length, "éléments"); // Debug
      setData(result);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filters, page, pageSize, showAll]);

  // Fonction pour gérer le changement de filtre
  const handleFilterChange = (filterName: string, value: string) => {
    console.log(`Filtre ${filterName} changé:`, value); // Debug
    setFilters((prev) => ({
      ...prev,
      [filterName]: value === "all" ? "" : value,
    }));
    setPage(1); // Réinitialiser à la première page
  };

  // Fonction pour gérer le changement de typeparc (cela réinitialise aussi parc)
  const handleTypeparcFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      typeparcId: value === "all" ? "" : value,
      parcId: "", // Réinitialiser parc quand typeparc change
    }));
    setPage(1);
  };

  // Fonction pour gérer le changement de taille de page
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    setPage(1); // Réinitialiser à la première page
    setShowPagination(value !== "all");
    setShowAll(value === "all");
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        date: selectedDate.toISOString(),
        export: "csv",
        ...(filters.enginId && { enginId: filters.enginId }),
        ...(filters.siteId && { siteId: filters.siteId }),
        ...(filters.parcId && { parcId: filters.parcId }),
        ...(filters.typeparcId && { typeparcId: filters.typeparcId }),
      });

      const response = await fetch(`/api/saisiehrm/list?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saisies-hrm-${format(selectedDate, "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
    }
  };

  const handleResetFilters = () => {
    console.log("Réinitialisation des filtres"); // Debug
    setFilters({
      enginId: "",
      siteId: "",
      parcId: "",
      typeparcId: "",
    });
    setPage(1);
  };

  // Gérer le changement de date depuis l'input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setPage(1); // Réinitialiser à la première page
    }
  };

  // Rendu de la pagination
  const renderPagination = () => {
    if (!data?.totalPages || data.totalPages <= 1 || !showPagination)
      return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(data.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === page} onClick={() => setPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          {page > 1 && (
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              />
            </PaginationItem>
          )}
          {pages}
          {page < data.totalPages && (
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, data.totalPages))
                }
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saisies HRM</h1>
          <p className="text-muted-foreground">
            Consultation et gestion des heures de marche des engins
          </p>
        </div>
        <Button onClick={handleExport} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
              <CardDescription>
                {Object.values(filters).filter((f) => f).length} filtre(s)
                actif(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélection de date avec input type="date" */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <input
                  type="date"
                  id="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={handleDateChange}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>

              {/* Filtre par typeparc */}
              <div className="space-y-2">
                <Label htmlFor="typeparc">Type de parc</Label>
                <Select
                  value={filters.typeparcId || "all"}
                  onValueChange={handleTypeparcFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {typeparcs.map((typeparc) => (
                      <SelectItem key={typeparc.id} value={typeparc.id}>
                        {typeparc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par parc */}
              <div className="space-y-2">
                <Label htmlFor="parc">Parc</Label>
                <Select
                  value={filters.parcId || "all"}
                  onValueChange={(value) => handleFilterChange("parcId", value)}
                  disabled={filters.typeparcId === ""}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        filters.typeparcId
                          ? "Tous les parcs du type"
                          : "Sélectionnez d'abord un type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filters.typeparcId
                        ? "Tous les parcs du type"
                        : "Tous les parcs"}
                    </SelectItem>
                    {parcs
                      .filter(
                        (parc) =>
                          !filters.typeparcId ||
                          parc.typeparcId === filters.typeparcId
                      )
                      .map((parc) => (
                        <SelectItem key={parc.id} value={parc.id}>
                          {parc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par engin */}
              <div className="space-y-2">
                <Label htmlFor="engin">Engin</Label>
                <Select
                  value={filters.enginId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("enginId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les engins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les engins</SelectItem>
                    {engins
                      .filter((engin) => {
                        if (filters.parcId)
                          return engin.parcId === filters.parcId;
                        if (filters.typeparcId) {
                          const parc = parcs.find((p) => p.id === engin.parcId);
                          return parc?.typeparcId === filters.typeparcId;
                        }
                        return true;
                      })
                      .map((engin) => (
                        <SelectItem key={engin.id} value={engin.id}>
                          {engin.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par site */}
              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Select
                  value={filters.siteId || "all"}
                  onValueChange={(value) => handleFilterChange("siteId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="flex-1"
                >
                  Réinitialiser
                </Button>
                <Button
                  onClick={loadData}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Paramètres d'affichage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Affichage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélection du nombre de résultats par page */}
              <div className="space-y-2">
                <Label htmlFor="pageSize">Résultats par page</Label>
                <Select
                  value={showAll ? "all" : pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 résultats</SelectItem>
                    <SelectItem value="25">25 résultats</SelectItem>
                    <SelectItem value="50">50 résultats</SelectItem>
                    <SelectItem value="100">100 résultats</SelectItem>
                    <SelectItem value="all">Afficher tout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statistiques */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">
                    {data?.total?.toLocaleString() ||
                      data?.data?.length.toLocaleString() ||
                      0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Affichés:</span>
                  <span className="font-semibold">
                    {data?.data?.length.toLocaleString() || 0}
                  </span>
                </div>
                {!showAll && data?.totalPages && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages:</span>
                    <span className="font-semibold">{data.totalPages}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des données */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Saisies HRM</CardTitle>
                  <CardDescription>
                    {format(selectedDate, "EEEE dd MMMM yyyy", { locale: fr })}
                    {filters.typeparcId &&
                      ` • Type: ${
                        typeparcs.find((t) => t.id === filters.typeparcId)?.name
                      }`}
                    {filters.parcId &&
                      ` • Parc: ${
                        parcs.find((p) => p.id === filters.parcId)?.name
                      }`}
                    {filters.enginId &&
                      ` • Engin: ${
                        engins.find((e) => e.id === filters.enginId)?.name
                      }`}
                    {filters.siteId &&
                      ` • Site: ${
                        sites.find((s) => s.id === filters.siteId)?.name
                      }`}
                  </CardDescription>
                </div>
                {data && !showAll && (
                  <div className="text-sm text-muted-foreground">
                    Page {page} sur {data.totalPages} •
                    {(page - 1) * pageSize + 1} -{" "}
                    {Math.min(page * pageSize, data.total)} sur {data.total}{" "}
                    résultats
                  </div>
                )}
                {data && showAll && (
                  <div className="text-sm text-muted-foreground">
                    <ListChecks className="h-4 w-4 inline mr-1" />
                    Affichage complet: {data.data?.length} résultats
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2">Chargement des données...</span>
                </div>
              ) : data ? (
                <>
                  <SaisiehrmTable data={data.data} />

                  {/* Afficher un message si aucun résultat */}
                  {data.data.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune donnée trouvée pour les critères sélectionnés
                    </div>
                  )}

                  {/* Pagination */}
                  {!showAll && renderPagination()}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Sélectionnez une date pour afficher les données
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
