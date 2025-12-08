// app/anomalies/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAnomalies } from "@/hooks/useAnomalies";
import { useSites } from "@/hooks/useSites";
import { useEngins } from "@/hooks/useEngins";
import { AnomalieModal } from "@/components/anomalies/AnomalieModal";
import { DeleteAnomalieModal } from "@/components/anomalies/DeleteAnomalieModal";
import { AnomalieFilters } from "@/components/anomalies/AnomalieFilters";
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";
import { Anomalie } from "@/lib/types/anomalie";

export default function AnomaliesPage() {
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnomalie, setSelectedAnomalie] = useState<Anomalie | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"create" | "edit" | "view">(
    "create"
  );

  const { anomaliesQuery, statsQuery, deleteAnomalie } = useAnomalies(filters);
  const { sitesQuery } = useSites();
  const { enginsQuery } = useEngins();

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = () => {
    setSelectedAnomalie(null);
    setViewMode("create");
    setModalOpen(true);
  };

  const handleEdit = (anomalie: Anomalie) => {
    setSelectedAnomalie(anomalie);
    setViewMode("edit");
    setModalOpen(true);
  };

  const handleView = (anomalie: Anomalie) => {
    setSelectedAnomalie(anomalie);
    setViewMode("view");
    setModalOpen(true);
  };

  const handleDelete = (anomalie: Anomalie) => {
    setSelectedAnomalie(anomalie);
    setDeleteModalOpen(true);
  };

  const handleExport = () => {
    toast.info("Fonctionnalité d'export à implémenter");
  };

  const getStatusBadgeColor = (statut: StatutAnomalie) => {
    switch (statut) {
      case "ATTENTE_PDR":
        return "bg-yellow-100 text-yellow-800";
      case "PDR_PRET":
        return "bg-blue-100 text-blue-800";
      case "NON_PROGRAMMEE":
        return "bg-gray-100 text-gray-800";
      case "PROGRAMMEE":
        return "bg-purple-100 text-purple-800";
      case "EXECUTE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priorite: Priorite) => {
    switch (priorite) {
      case "ELEVEE":
        return "bg-red-100 text-red-800";
      case "MOYENNE":
        return "bg-orange-100 text-orange-800";
      case "FAIBLE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (anomaliesQuery.isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>Erreur lors du chargement des anomalies</p>
              <p className="text-sm">{anomaliesQuery.error?.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anomalies</h1>
          <p className="text-muted-foreground">
            Gestion des anomalies et des retours d'expérience
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle anomalie
        </Button>
      </div>

      {/* Filtres */}
      <AnomalieFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        sites={sitesQuery.data || []}
        engins={enginsQuery.data || []}
      />

      {/* Cartes de statistiques */}
      {statsQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statsQuery.data.total}</div>
              <p className="text-sm text-muted-foreground">Total anomalies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {statsQuery.data.parStatut.EXECUTE || 0}
              </div>
              <p className="text-sm text-muted-foreground">Exécutées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {statsQuery.data.parPriorite.ELEVEE || 0}
              </div>
              <p className="text-sm text-muted-foreground">Priorité élevée</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {statsQuery.data.parStatut.ATTENTE_PDR || 0}
              </div>
              <p className="text-sm text-muted-foreground">En attente PDR</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau des anomalies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des anomalies</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Backlog</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Engin/Site</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Date détection</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomaliesQuery.data?.map((anomalie) => (
                  <TableRow key={anomalie.id}>
                    <TableCell className="font-medium">
                      {anomalie.numeroBacklog}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {anomalie.description}
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
                        className={getStatusBadgeColor(anomalie.statut)}
                      >
                        {anomalie.statut.replace("_", " ").toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPriorityBadgeColor(anomalie.priorite)}
                      >
                        {anomalie.priorite.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(anomalie.dateDetection), "dd/MM/yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>{anomalie.source}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleView(anomalie)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(anomalie)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(anomalie)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {anomaliesQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        Aucune anomalie trouvée
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AnomalieModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        anomalie={selectedAnomalie}
        mode={viewMode}
      />

      <DeleteAnomalieModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        anomalie={selectedAnomalie}
        deleteAnomalie={deleteAnomalie}
      />
    </div>
  );
}
