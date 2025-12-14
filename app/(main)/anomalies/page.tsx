// app/anomalies/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAnomalies } from "@/hooks/useAnomalies";
import { useSites } from "@/hooks/useSites";
import { useEngins } from "@/hooks/useEngins";
import { AnomalieModal } from "@/components/anomalies/AnomalieModal";
import { AnomalieFilters } from "@/components/anomalies/AnomalieFilters";
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";
import { Anomalie } from "@/lib/types/anomalie";
import { exportExcel } from "@/lib/xlsxFn";

const ITEMS_PER_PAGE = 10;

export default function AnomaliesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: "",
    statut: undefined as StatutAnomalie | undefined,
    priorite: undefined as Priorite | undefined,
    source: undefined as SourceAnomalie | undefined,
    enginId: undefined as string | undefined,
    siteId: undefined as string | undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnomalie, setSelectedAnomalie] = useState<Anomalie | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  const { anomaliesQuery, statsQuery } = useAnomalies(filters);
  const { sitesQuery } = useSites();
  const { enginsQuery } = useEngins();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = () => {
    setSelectedAnomalie(null);
    setViewMode("create");
    setModalOpen(true);
  };

  const handleView = (anomalie: Anomalie) => {
    router.push(`/anomalies/${anomalie.id}`);
  };

  const handleExport = () => {
    if (paginatedAnomalies.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("backlogs-table", "backlogs");
  };

  const getStatusBadgeColor = (statut: StatutAnomalie) => {
    switch (statut) {
      case "ATTENTE_PDR":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300";
      case "PDR_PRET":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300";
      case "NON_PROGRAMMEE":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300";
      case "PROGRAMMEE":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300";
      case "EXECUTE":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-300";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300";
    }
  };

  const getPriorityBadgeColor = (priorite: Priorite) => {
    switch (priorite) {
      case "ELEVEE":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-300";
      case "MOYENNE":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300";
      case "FAIBLE":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-300";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300";
    }
  };

  // Pagination logic
  const anomalies = anomaliesQuery.data || [];
  const totalItems = anomalies.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAnomalies = anomalies.slice(startIndex, endIndex);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            isActive={currentPage === 1}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis1" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis2" />);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            isActive={currentPage === totalPages}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (anomaliesQuery.isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">
              Chargement des anomalies...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (anomaliesQuery.isError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="text-lg font-semibold">Erreur lors du chargement</p>
              <p className="text-sm mt-2">{anomaliesQuery.error?.message}</p>
              <Button className="mt-4" onClick={() => anomaliesQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header avec statistiques */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Anomalies
          </h1>
          <p className="text-muted-foreground">
            Gestion des anomalies et retours d'expérience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button
            onClick={handleCreate}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle anomalie
          </Button>
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° backlog, description..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={filters.statut || "all"}
            onValueChange={(value) =>
              handleFilterChange("statut", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.values(StatutAnomalie).map((statut) => (
                <SelectItem key={statut} value={statut}>
                  {statut.replace("_", " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.priorite || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "priorite",
                value === "all" ? undefined : value
              )
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              {Object.values(Priorite).map((priorite) => (
                <SelectItem key={priorite} value={priorite}>
                  {priorite.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="text-sm font-medium">Filtres avancés</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({
                search: "",
                statut: undefined,
                priorite: undefined,
                source: undefined,
                enginId: undefined,
                siteId: undefined,
                dateFrom: undefined,
                dateTo: undefined,
              });
            }}
            disabled={Object.values(filters).every((v) => !v || v === "")}
          >
            Réinitialiser
          </Button>
        </div>
        <AnomalieFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          sites={sitesQuery.data || []}
          engins={enginsQuery.data || []}
        />
      </div>

      {/* Cartes de statistiques */}
      {statsQuery.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-linear-to-br from-background to-secondary/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statsQuery.data.total}</div>
              <p className="text-sm text-muted-foreground">Total anomalies</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-background to-green-500/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statsQuery.data.parStatut.EXECUTE || 0}
              </div>
              <p className="text-sm text-muted-foreground">Exécutées</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-background to-red-500/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {statsQuery.data.parPriorite.ELEVEE || 0}
              </div>
              <p className="text-sm text-muted-foreground">Priorité élevée</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-background to-yellow-500/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {statsQuery.data.parStatut.ATTENTE_PDR || 0}
              </div>
              <p className="text-sm text-muted-foreground">En attente PDR</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau des anomalies */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Anomalies ({totalItems})</CardTitle>
              <CardDescription>
                Liste des anomalies avec leurs informations principales
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Afficher</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table id="backlogs-table">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">N° Backlog</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Engin/Site</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">Priorité</TableHead>
                  <TableHead className="font-semibold">
                    Date détection
                  </TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAnomalies.length > 0 ? (
                  paginatedAnomalies.map((anomalie) => (
                    <TableRow
                      key={anomalie.id}
                      className="group hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleView(anomalie)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{anomalie.numeroBacklog}</span>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="line-clamp-2 text-sm">
                          {anomalie.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {anomalie.engin?.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {anomalie.site?.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`px-2 py-0.5 text-xs ${getStatusBadgeColor(
                            anomalie.statut
                          )}`}
                        >
                          {anomalie.statut.replace("_", " ").toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`px-2 py-0.5 text-xs ${getPriorityBadgeColor(
                            anomalie.priorite
                          )}`}
                        >
                          {anomalie.priorite.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(
                            new Date(anomalie.dateDetection),
                            "dd/MM/yyyy",
                            {
                              locale: fr,
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(anomalie);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Voir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Aucune anomalie trouvée
                        </p>
                        {Object.values(filters).some((v) => v && v !== "") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFilters({
                                search: "",
                                statut: undefined,
                                priorite: undefined,
                                source: undefined,
                                enginId: undefined,
                                siteId: undefined,
                                dateFrom: undefined,
                                dateTo: undefined,
                              });
                            }}
                          >
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)}{" "}
                sur {totalItems} anomalies
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <AnomalieModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        anomalie={selectedAnomalie}
        mode={viewMode}
      />
    </div>
  );
}
