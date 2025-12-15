"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRapportHeureMarcheOrgane } from "@/hooks/useRapportHeureMarcheOrgane";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Colonnes configurables
const COLUMNS_CONFIG = [
  { id: "typeParc", label: "Type Parc", defaultVisible: true },
  { id: "parc", label: "Parc", defaultVisible: true },
  { id: "site", label: "Site", defaultVisible: true },
  { id: "engin", label: "Engin", defaultVisible: true },
  { id: "organe", label: "Organe", defaultVisible: true },
  { id: "typeOrgane", label: "Type Organe", defaultVisible: true },
  { id: "hrmMensuel", label: "HRM Mensuel", defaultVisible: true },
  { id: "hrmCumul", label: "HRM Cumul", defaultVisible: true },
  {
    id: "dateDernierePose",
    label: "Date Dernière Pose",
    defaultVisible: false,
  },
  { id: "dateDepose", label: "Date Dépose", defaultVisible: false },
  { id: "statut", label: "Statut", defaultVisible: true },
];

export default function RapportMensuelHeureMarcheOrgane() {
  const [date, setDate] = useState<Date>(new Date());
  const [mois, setMois] = useState<string | null>(null);
  const [annee, setAnnee] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedParcs, setSelectedParcs] = useState<string[]>([]);
  const [selectedTypeOrganes, setSelectedTypeOrganes] = useState<string[]>([]);

  // États pour les colonnes
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    COLUMNS_CONFIG.reduce((acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    }, {} as Record<string, boolean>)
  );

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Hook pour récupérer les données
  const {
    data: rapportData,
    isLoading,
    isError,
    error,
    refetch,
  } = useRapportHeureMarcheOrgane(mois, annee, {
    enabled: shouldFetch,
    refetchOnMount: false,
  });

  // Gérer la sélection de date
  useEffect(() => {
    if (date) {
      const moisStr = (date.getMonth() + 1).toString().padStart(2, "0");
      const anneeStr = date.getFullYear().toString();
      setMois(moisStr);
      setAnnee(anneeStr);
    }
  }, [date]);

  // Gérer le clic sur le bouton Générer
  const handleGenerateReport = () => {
    setShouldFetch(true);
    refetch();
    setPage(0);
  };

  // Préparer les données pour le tableau
  const flatData = useMemo(() => {
    if (!rapportData?.data) return [];

    const data: any[] = [];

    rapportData.data.forEach((typeParc: any) => {
      typeParc.engins.forEach((engin: any) => {
        engin.organes.forEach((organe: any) => {
          data.push({
            typeParc: typeParc.typeParcName,
            parc: engin.parcName,
            site: engin.siteName,
            engin: engin.enginName,
            organe: organe.organeName,
            typeOrgane: organe.typeOrganeName,
            hrmMensuel: organe.hrmMensuel,
            hrmCumul: organe.hrmCumul,
            dateDernierePose: organe.dateDernierePose,
            dateDepose: organe.dateDepose,
            statut: organe.estSurEngin ? "Sur engin" : "Déposé",
          });
        });
      });
    });

    return data;
  }, [rapportData]);

  // Filtrer les données
  const filteredData = useMemo(() => {
    let filtered = flatData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((row: any) =>
        Object.values(row).some((value: any) =>
          String(value).toLowerCase().includes(term)
        )
      );
    }

    if (selectedSites.length > 0) {
      filtered = filtered.filter((row: any) =>
        selectedSites.includes(row.site)
      );
    }

    if (selectedParcs.length > 0) {
      filtered = filtered.filter((row: any) =>
        selectedParcs.includes(row.parc)
      );
    }

    if (selectedTypeOrganes.length > 0) {
      filtered = filtered.filter((row: any) =>
        selectedTypeOrganes.includes(row.typeOrgane)
      );
    }

    return filtered;
  }, [flatData, searchTerm, selectedSites, selectedParcs, selectedTypeOrganes]);

  // Données paginées
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, page, rowsPerPage]);

  // Gérer le changement de page
  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  // Gérer la visibilité des colonnes
  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns((prev: any) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Formatage des nombres avec séparateurs
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          Erreur: {error?.message || "Impossible de charger les données"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Rapport Mensuel - Heure Marche Organes
        </h1>
        <p className="text-muted-foreground">
          Calcul des heures de marche (HRM) des organes par engin, parc et site
        </p>
      </div>

      {/* Carte de configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du rapport</CardTitle>
          <CardDescription>
            Sélectionnez le mois et générez le rapport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner un mois</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate: Date | undefined) =>
                      newDate && setDate(newDate)
                    }
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={handleGenerateReport}
                disabled={!mois || !annee || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Générer Rapport
                  </>
                )}
              </Button>
            </div>

            <div className="md:col-span-7 flex items-center justify-end gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Colonnes
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Colonnes à afficher</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {COLUMNS_CONFIG.map((column) => (
                        <div
                          key={column.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`column-${column.id}`}
                            checked={visibleColumns[column.id]}
                            onCheckedChange={() =>
                              toggleColumnVisibility(column.id)
                            }
                          />
                          <Label htmlFor={`column-${column.id}`}>
                            {column.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {rapportData && (
                <Badge variant="outline" className="px-3 py-1">
                  {flatData.length} enregistrements
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      {rapportData && (
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="site-filter">Sites</Label>
                  <Select
                    value={selectedSites.length > 0 ? selectedSites[0] : "all"}
                    onValueChange={(value) =>
                      setSelectedSites(value === "all" ? [] : [value])
                    }
                  >
                    <SelectTrigger id="site-filter">
                      <SelectValue placeholder="Tous les sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les sites</SelectItem>
                      {rapportData.sites.map((site: string) => (
                        <SelectItem key={site} value={site}>
                          {site}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSites.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedSites.map((site) => (
                        <Badge
                          key={site}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedSites(
                              selectedSites.filter((s) => s !== site)
                            )
                          }
                        >
                          {site} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="parc-filter">Parcs</Label>
                  <Select
                    value={selectedParcs.length > 0 ? selectedParcs[0] : "all"}
                    onValueChange={(value) =>
                      setSelectedParcs(value === "all" ? [] : [value])
                    }
                  >
                    <SelectTrigger id="parc-filter">
                      <SelectValue placeholder="Tous les parcs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les parcs</SelectItem>
                      {rapportData.parcs.map((parc: string) => (
                        <SelectItem key={parc} value={parc}>
                          {parc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedParcs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedParcs.map((parc) => (
                        <Badge
                          key={parc}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedParcs(
                              selectedParcs.filter((p) => p !== parc)
                            )
                          }
                        >
                          {parc} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="type-organe-filter">Types d'Organes</Label>
                  <Select
                    value={
                      selectedTypeOrganes.length > 0
                        ? selectedTypeOrganes[0]
                        : "all"
                    }
                    onValueChange={(value) =>
                      setSelectedTypeOrganes(value === "all" ? [] : [value])
                    }
                  >
                    <SelectTrigger id="type-organe-filter">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {rapportData.typeOrganes.map((type: string) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTypeOrganes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedTypeOrganes.map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedTypeOrganes(
                              selectedTypeOrganes.filter((t) => t !== type)
                            )
                          }
                        >
                          {type} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des résultats */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        rapportData && (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {COLUMNS_CONFIG.map(
                          (column) =>
                            visibleColumns[column.id] && (
                              <TableHead key={column.id}>
                                {column.label}
                              </TableHead>
                            )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={COLUMNS_CONFIG.length}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Aucune donnée disponible
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((row: any, index: number) => (
                          <TableRow key={index}>
                            {visibleColumns.typeParc && (
                              <TableCell>{row.typeParc}</TableCell>
                            )}
                            {visibleColumns.parc && (
                              <TableCell>{row.parc}</TableCell>
                            )}
                            {visibleColumns.site && (
                              <TableCell>{row.site}</TableCell>
                            )}
                            {visibleColumns.engin && (
                              <TableCell>{row.engin}</TableCell>
                            )}
                            {visibleColumns.organe && (
                              <TableCell>{row.organe}</TableCell>
                            )}
                            {visibleColumns.typeOrgane && (
                              <TableCell>{row.typeOrgane}</TableCell>
                            )}
                            {visibleColumns.hrmMensuel && (
                              <TableCell className="text-right">
                                {formatNumber(row.hrmMensuel)}
                              </TableCell>
                            )}
                            {visibleColumns.hrmCumul && (
                              <TableCell className="text-right">
                                {formatNumber(row.hrmCumul)}
                              </TableCell>
                            )}
                            {visibleColumns.dateDernierePose && (
                              <TableCell>{row.dateDernierePose}</TableCell>
                            )}
                            {visibleColumns.dateDepose && (
                              <TableCell>{row.dateDepose || "-"}</TableCell>
                            )}
                            {visibleColumns.statut && (
                              <TableCell>
                                <Badge
                                  variant={
                                    row.statut === "Sur engin"
                                      ? "default"
                                      : "outline"
                                  }
                                  className={
                                    row.statut === "Sur engin"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : ""
                                  }
                                >
                                  {row.statut}
                                </Badge>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Affichage de {page * rowsPerPage + 1} à{" "}
                  {Math.min((page + 1) * rowsPerPage, filteredData.length)} sur{" "}
                  {filteredData.length} enregistrements
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(page + 1)}
                    disabled={(page + 1) * rowsPerPage >= filteredData.length}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}

            {/* Résumé */}
            {filteredData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Total HRM Mensuel
                      </p>
                      <p className="text-2xl font-bold">
                        {formatNumber(
                          filteredData.reduce(
                            (sum: number, row: any) => sum + row.hrmMensuel,
                            0
                          )
                        )}{" "}
                        h
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Total HRM Cumul
                      </p>
                      <p className="text-2xl font-bold">
                        {formatNumber(
                          filteredData.reduce(
                            (sum: number, row: any) => sum + row.hrmCumul,
                            0
                          )
                        )}{" "}
                        h
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Organes sur engin
                      </p>
                      <p className="text-2xl font-bold">
                        {
                          filteredData.filter(
                            (row: any) => row.statut === "Sur engin"
                          ).length
                        }
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Organes déposés
                      </p>
                      <p className="text-2xl font-bold">
                        {
                          filteredData.filter(
                            (row: any) => row.statut === "Déposé"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )
      )}
    </div>
  );
}
