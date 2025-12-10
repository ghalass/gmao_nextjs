// components/anomalies/AnomaliesTable.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MoreVertical,
  Wrench,
  XCircle,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Anomalie {
  id: string;
  numeroBacklog: string;
  dateDetection: string;
  description: string;
  source: "VS" | "VJ" | "INSPECTION" | "AUTRE";
  priorite: "ELEVEE" | "MOYENNE" | "FAIBLE";
  besoinPDR: boolean;
  quantite?: number;
  reference?: string;
  statut:
    | "ATTENTE_PDR"
    | "PDR_PRET"
    | "NON_PROGRAMMEE"
    | "PROGRAMMEE"
    | "EXECUTE";
  dateExecution?: string;
  observations?: string;
  engin?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
}

interface AnomaliesTableProps {
  anomalies: Anomalie[];
}

export function AnomaliesTable({ anomalies }: AnomaliesTableProps) {
  const [sortField, setSortField] = useState<keyof Anomalie>("dateDetection");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterStatut, setFilterStatut] = useState<string | null>(null);
  const [filterPriorite, setFilterPriorite] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (statut: Anomalie["statut"]) => {
    const config = {
      ATTENTE_PDR: {
        label: "Attente PDR",
        variant: "secondary",
        icon: <Clock className="h-3 w-3 mr-1" />,
      },
      PDR_PRET: {
        label: "PDR Prêt",
        variant: "default",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
      NON_PROGRAMMEE: {
        label: "Non Programmé",
        variant: "destructive",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
      PROGRAMMEE: {
        label: "Programmé",
        variant: "outline",
        icon: <Calendar className="h-3 w-3 mr-1" />,
      },
      EXECUTE: {
        label: "Exécuté",
        variant: "secondary",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
    };
    return config[statut];
  };

  const getPriorityBadge = (priorite: Anomalie["priorite"]) => {
    const config = {
      ELEVEE: {
        label: "Élevée",
        variant: "destructive",
        color: "text-red-600",
      },
      MOYENNE: {
        label: "Moyenne",
        variant: "outline",
        color: "text-orange-600",
      },
      FAIBLE: {
        label: "Faible",
        variant: "secondary",
        color: "text-green-600",
      },
    };
    return config[priorite];
  };

  const getSourceBadge = (source: Anomalie["source"]) => {
    const config = {
      VS: {
        label: "VS",
        variant: "secondary",
        icon: <Eye className="h-3 w-3 mr-1" />,
      },
      VJ: {
        label: "VJ",
        variant: "outline",
        icon: <User className="h-3 w-3 mr-1" />,
      },
      INSPECTION: {
        label: "Inspection",
        variant: "default",
        icon: <FileText className="h-3 w-3 mr-1" />,
      },
      AUTRE: {
        label: "Autre",
        variant: "secondary",
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      },
    };
    return config[source];
  };

  const filteredAnomalies = anomalies
    .filter((anomalie) => {
      if (filterStatut && anomalie.statut !== filterStatut) return false;
      if (filterPriorite && anomalie.priorite !== filterPriorite) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });

  const handleSort = (field: keyof Anomalie) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewDetails = (anomalieId: string) => {
    console.log("Voir détails anomalie:", anomalieId);
    // Ici, vous pouvez implémenter la navigation vers la page de détails de l'anomalie
    // router.push(`/anomalies/${anomalieId}`);
  };

  const handleEdit = (anomalieId: string) => {
    console.log("Modifier anomalie:", anomalieId);
    // Ici, vous pouvez implémenter la logique d'édition
  };

  const handleChangeStatus = (
    anomalieId: string,
    newStatus: Anomalie["statut"]
  ) => {
    console.log("Changer statut:", anomalieId, "->", newStatus);
    // Ici, vous pouvez implémenter la logique de changement de statut
  };

  const stats = {
    total: anomalies.length,
    enAttente: anomalies.filter((a) => a.statut === "ATTENTE_PDR").length,
    enCours: anomalies.filter((a) => a.statut === "PROGRAMMEE").length,
    resolues: anomalies.filter((a) => a.statut === "EXECUTE").length,
    critiques: anomalies.filter((a) => a.priorite === "ELEVEE").length,
  };

  return (
    <div className="space-y-4">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold text-orange-500">
                {stats.enAttente}
              </p>
            </div>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold text-blue-500">
                {stats.enCours}
              </p>
            </div>
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Résolues</p>
              <p className="text-2xl font-bold text-green-500">
                {stats.resolues}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critiques</p>
              <p className="text-2xl font-bold text-red-500">
                {stats.critiques}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrer par :</span>
        </div>

        <Button
          variant={filterStatut === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatut(null)}
        >
          Tous les statuts
        </Button>

        {[
          "ATTENTE_PDR",
          "PDR_PRET",
          "NON_PROGRAMMEE",
          "PROGRAMMEE",
          "EXECUTE",
        ].map((statut) => {
          const badge = getStatusBadge(statut as Anomalie["statut"]);
          return (
            <Button
              key={statut}
              variant={filterStatut === statut ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilterStatut(filterStatut === statut ? null : statut)
              }
              className="flex items-center gap-1"
            >
              {badge.icon}
              {badge.label}
            </Button>
          );
        })}

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant={filterPriorite === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterPriorite(null)}
        >
          Toutes priorités
        </Button>

        {["ELEVEE", "MOYENNE", "FAIBLE"].map((priorite) => {
          const badge = getPriorityBadge(priorite as Anomalie["priorite"]);
          return (
            <Button
              key={priorite}
              variant={filterPriorite === priorite ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilterPriorite(filterPriorite === priorite ? null : priorite)
              }
              className={badge.color}
            >
              {badge.label}
            </Button>
          );
        })}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("numeroBacklog")}
              >
                N° Backlog
                {sortField === "numeroBacklog" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("dateDetection")}
              >
                Date détection
                {sortField === "dateDetection" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnomalies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune anomalie trouvée avec les filtres actuels</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAnomalies.map((anomalie) => {
                const statusBadge = getStatusBadge(anomalie.statut);
                const priorityBadge = getPriorityBadge(anomalie.priorite);
                const sourceBadge = getSourceBadge(anomalie.source);

                return (
                  <TableRow key={anomalie.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">
                      {anomalie.numeroBacklog}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(anomalie.dateDetection)}</span>
                        {anomalie.dateExecution && (
                          <span className="text-xs text-muted-foreground">
                            Exécution: {formatDate(anomalie.dateExecution)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">{anomalie.description}</p>
                        {anomalie.observations && (
                          <p className="text-xs text-muted-foreground truncate">
                            {anomalie.observations}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sourceBadge.variant as any}
                        className="flex items-center w-fit"
                      >
                        {sourceBadge.icon}
                        {sourceBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={priorityBadge.variant as any}
                        className={priorityBadge.color}
                      >
                        {priorityBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadge.variant as any}
                        className="flex items-center w-fit"
                      >
                        {statusBadge.icon}
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(anomalie.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(anomalie.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Clock className="h-4 w-4 mr-2" />
                              Changer statut
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {[
                                  "ATTENTE_PDR",
                                  "PDR_PRET",
                                  "NON_PROGRAMMEE",
                                  "PROGRAMMEE",
                                  "EXECUTE",
                                ].map((statut) => (
                                  <DropdownMenuItem
                                    key={statut}
                                    onClick={() =>
                                      handleChangeStatus(
                                        anomalie.id,
                                        statut as Anomalie["statut"]
                                      )
                                    }
                                  >
                                    {
                                      getStatusBadge(
                                        statut as Anomalie["statut"]
                                      ).icon
                                    }
                                    <span>
                                      {
                                        getStatusBadge(
                                          statut as Anomalie["statut"]
                                        ).label
                                      }
                                    </span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination ou résumé */}
      {filteredAnomalies.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Affichage de <strong>1</strong> à{" "}
            <strong>{filteredAnomalies.length}</strong> sur{" "}
            <strong>{filteredAnomalies.length}</strong> anomalies
          </div>
          <div className="flex items-center gap-2">
            <span>Trier par:</span>
            <select
              className="bg-transparent border-none focus:outline-none"
              value={sortField}
              onChange={(e) => handleSort(e.target.value as keyof Anomalie)}
            >
              <option value="dateDetection">Date détection</option>
              <option value="numeroBacklog">N° Backlog</option>
              <option value="priorite">Priorité</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Si vous n'avez pas ces composants, voici une version simplifiée sans le sous-menu:
const SimplifiedAnomaliesTable = ({ anomalies }: AnomaliesTableProps) => {
  const [sortField, setSortField] = useState<keyof Anomalie>("dateDetection");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // ... (même logique que ci-dessus, mais avec un menu simplifié)

  return (
    <div className="space-y-4">
      {/* ... (même contenu que ci-dessus, mais avec menu simplifié) ... */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                // handleViewDetails(anomalie.id)
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // handleEdit(anomalie.id)
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // handleChangeStatus(anomalie.id, "EXECUTE")
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer comme résolu
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </div>
  );
};
