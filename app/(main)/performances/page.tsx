// app/(main)/performances/page.tsx
"use client";

import React, { useState, useMemo, useRef } from "react";
import { usePerformances } from "@/hooks/usePerformances";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
  BarChart3,
  Wrench,
  Droplets,
} from "lucide-react";
import { HrmModal } from "@/components/performances/HrmModal";
import { HimModal } from "@/components/performances/HimModal";
import { LubrifiantModal } from "@/components/performances/LubrifiantModal";
import { DeletePerformanceModal } from "@/components/performances/DeletePerformanceModal";
import {
  SaisiePerformance,
  SaisieHim,
  SaisieLubrifiant,
} from "@/lib/types/performance";
import { Engin, Site } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import { format } from "date-fns";

type SortField = "du" | "engin" | "site" | "hrm" | "createdAt";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  du: string;
  engin: string;
  site: string;
  hrm: string;
}

export default function PerformancesPage() {
  const {
    performancesQuery,
    enginsQuery,
    sitesQuery,
    pannesQuery,
    lubrifiantsQuery,
    typesConsommationQuery,
    createPerformance,
    updatePerformance,
    deletePerformance,
    createHim,
    updateHim,
    createLubrifiant,
    updateLubrifiant,
  } = usePerformances();

  const [isHrmModalOpen, setIsHrmModalOpen] = useState<boolean>(false);
  const [isHimModalOpen, setIsHimModalOpen] = useState<boolean>(false);
  const [isLubrifiantModalOpen, setIsLubrifiantModalOpen] =
    useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const [selectedPerformance, setSelectedPerformance] =
    useState<SaisiePerformance | null>(null);
  const [selectedHim, setSelectedHim] = useState<SaisieHim | null>(null);
  const [selectedLubrifiant, setSelectedLubrifiant] =
    useState<SaisieLubrifiant | null>(null);
  const [selectedSaisiehrmId, setSelectedSaisiehrmId] = useState<string>("");
  const [selectedSaisiehimId, setSelectedSaisiehimId] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    du: "",
    engin: "",
    site: "",
    hrm: "",
  });
  const [sortField, setSortField] = useState<SortField>("du");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Gestion des modals HRM
  const handleCreateHrm = (): void => {
    setSelectedPerformance(null);
    setError(null);
    setIsHrmModalOpen(true);
  };

  const handleEditHrm = (performance: SaisiePerformance): void => {
    setSelectedPerformance(performance);
    setError(null);
    setIsHrmModalOpen(true);
  };

  const handleCloseHrmModal = (): void => {
    setIsHrmModalOpen(false);
    setError(null);
    setSelectedPerformance(null);
  };

  // Gestion des modals HIM
  const handleCreateHim = (saisiehrmId: string): void => {
    setSelectedHim(null);
    setSelectedSaisiehrmId(saisiehrmId);
    setError(null);
    setIsHimModalOpen(true);
  };

  const handleEditHim = (him: SaisieHim): void => {
    setSelectedHim(him);
    setSelectedSaisiehrmId(him.saisiehrmId);
    setError(null);
    setIsHimModalOpen(true);
  };

  const handleCloseHimModal = (): void => {
    setIsHimModalOpen(false);
    setError(null);
    setSelectedHim(null);
    setSelectedSaisiehrmId("");
  };

  // Gestion des modals Lubrifiant
  const handleCreateLubrifiant = (saisiehimId: string): void => {
    setSelectedLubrifiant(null);
    setSelectedSaisiehimId(saisiehimId);
    setError(null);
    setIsLubrifiantModalOpen(true);
  };

  const handleEditLubrifiant = (lubrifiant: SaisieLubrifiant): void => {
    setSelectedLubrifiant(lubrifiant);
    setSelectedSaisiehimId(lubrifiant.saisiehimId);
    setError(null);
    setIsLubrifiantModalOpen(true);
  };

  const handleCloseLubrifiantModal = (): void => {
    setIsLubrifiantModalOpen(false);
    setError(null);
    setSelectedLubrifiant(null);
    setSelectedSaisiehimId("");
  };

  // Gestion de la suppression
  const handleDelete = (performance: SaisiePerformance): void => {
    setSelectedPerformance(performance);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setError(null);
    setSelectedPerformance(null);
  };

  // Fonction pour ajouter des lubrifiants après création HIM
  const handleAddLubrifiantAfterHim = (himId: string) => {
    handleCreateLubrifiant(himId);
  };

  // Filtrage et tri des performances
  const filteredAndSortedPerformances = useMemo((): SaisiePerformance[] => {
    if (!performancesQuery.data) return [];

    const performancesData = performancesQuery.data;
    const filtered = performancesData.filter(
      (performance: SaisiePerformance) => {
        const globalMatch =
          globalSearch === "" ||
          performance.engin.name
            .toLowerCase()
            .includes(globalSearch.toLowerCase()) ||
          performance.site.name
            .toLowerCase()
            .includes(globalSearch.toLowerCase()) ||
          performance.hrm.toString().includes(globalSearch);

        const duMatch =
          columnFilters.du === "" ||
          format(new Date(performance.du), "dd/MM/yyyy")
            .toLowerCase()
            .includes(columnFilters.du.toLowerCase());

        const enginMatch =
          columnFilters.engin === "" ||
          performance.engin.name
            .toLowerCase()
            .includes(columnFilters.engin.toLowerCase());

        const siteMatch =
          columnFilters.site === "" ||
          performance.site.name
            .toLowerCase()
            .includes(columnFilters.site.toLowerCase());

        const hrmMatch =
          columnFilters.hrm === "" ||
          performance.hrm.toString().includes(columnFilters.hrm);

        return Boolean(
          globalMatch && duMatch && enginMatch && siteMatch && hrmMatch
        );
      }
    );

    filtered.sort((a: SaisiePerformance, b: SaisiePerformance) => {
      let aValue: string | number | Date = "";
      let bValue: string | number | Date = "";

      switch (sortField) {
        case "du":
          aValue = new Date(a.du);
          bValue = new Date(b.du);
          break;
        case "engin":
          aValue = a.engin.name;
          bValue = b.engin.name;
          break;
        case "site":
          aValue = a.site.name;
          bValue = b.site.name;
          break;
        case "hrm":
          aValue = a.hrm;
          bValue = b.hrm;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = new Date(a.du);
          bValue = new Date(b.du);
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      return 0;
    });

    return filtered;
  }, [
    performancesQuery.data,
    globalSearch,
    columnFilters,
    sortField,
    sortDirection,
  ]);

  // Fonction d'export Excel
  const handleExportToExcel = (): void => {
    try {
      const exportData = filteredAndSortedPerformances.map(
        (performance: SaisiePerformance) => ({
          Date: format(new Date(performance.du), "dd/MM/yyyy"),
          Engin: performance.engin.name,
          Site: performance.site.name,
          HRM: performance.hrm,
          "Nombre de HIM": performance.saisiehim?.length || 0,
          "Date de création": format(
            new Date(performance.createdAt),
            "dd/MM/yyyy HH:mm"
          ),
          "Dernière modification": format(
            new Date(performance.updatedAt),
            "dd/MM/yyyy HH:mm"
          ),
        })
      );

      if (exportData.length === 0) {
        setError("Aucune donnée à exporter");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Performances");

      XLSX.writeFile(
        workbook,
        `performances_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      setError("Erreur lors de l'export des données");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Saisie des performances
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les saisies HRM, HIM et consommations de lubrifiants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={filteredAndSortedPerformances.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
          <Button onClick={handleCreateHrm}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle saisie HRM
          </Button>
        </div>
      </div>

      {/* Table des performances */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Engin</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>HRM</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performancesQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : filteredAndSortedPerformances.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Aucune performance trouvée
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedPerformances.map(
              (performance: SaisiePerformance) => (
                <React.Fragment key={performance.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      {format(new Date(performance.du), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {performance.engin.name}
                    </TableCell>
                    <TableCell>{performance.site.name}</TableCell>
                    <TableCell>{performance.hrm}h</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Bouton pour ajouter HIM */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateHim(performance.id)}
                          className="h-8 w-8 p-0"
                          title="Ajouter HIM"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                        </Button>

                        {/* Bouton pour modifier HRM */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditHrm(performance)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {/* Bouton pour supprimer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(performance)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Section pour afficher les HIM et Lubrifiants */}
                  {performance.saisiehim &&
                    performance.saisiehim.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50 p-0">
                          <div className="p-4">
                            <h4 className="font-medium mb-2">
                              Saisies HIM associées
                            </h4>
                            {performance.saisiehim.map((him) => (
                              <div
                                key={him.id}
                                className="border rounded-lg p-3 mb-2"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline">
                                      Panne: {him.panne.name}
                                    </Badge>
                                    <span>HIM: {him.him}h</span>
                                    <span>NI: {him.ni}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {/* Bouton pour ajouter lubrifiant */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleCreateLubrifiant(him.id)
                                      }
                                      className="h-6 w-6 p-0"
                                      title="Ajouter lubrifiant"
                                    >
                                      <Droplets className="h-3 w-3" />
                                    </Button>

                                    {/* Bouton pour modifier HIM */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditHim(him)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Affichage des lubrifiants */}
                                {him.saisielubrifiants &&
                                  him.saisielubrifiants.length > 0 && (
                                    <div className="mt-2">
                                      <h5 className="text-sm font-medium mb-1">
                                        Lubrifiants:
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {him.saisielubrifiants.map((lub) => (
                                          <Badge
                                            key={lub.id}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {lub.lubrifiant.name}: {lub.qte}L
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleEditLubrifiant(lub)
                                              }
                                              className="h-4 w-4 p-0 ml-1"
                                            >
                                              <Pencil className="h-2 w-2" />
                                            </Button>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                </React.Fragment>
              )
            )
          )}
        </TableBody>
      </Table>

      {/* Modals */}
      <HrmModal
        open={isHrmModalOpen}
        onClose={handleCloseHrmModal}
        performance={selectedPerformance}
        engins={(enginsQuery.data as unknown as Engin[]) || []}
        sites={(sitesQuery.data as unknown as Site[]) || []}
        createPerformance={async (data) => {
          await createPerformance.mutateAsync(data);
        }}
        updatePerformance={async (data) => {
          await updatePerformance.mutateAsync(data);
        }}
      />

      <HimModal
        open={isHimModalOpen}
        onClose={handleCloseHimModal}
        him={selectedHim}
        pannes={pannesQuery.data || []}
        engins={enginsQuery.data || []}
        saisiehrmId={selectedSaisiehrmId}
        createHim={createHim.mutateAsync}
        updateHim={updateHim.mutateAsync}
        onAddLubrifiant={handleAddLubrifiantAfterHim}
      />

      <LubrifiantModal
        open={isLubrifiantModalOpen}
        onClose={handleCloseLubrifiantModal}
        lubrifiant={selectedLubrifiant}
        lubrifiants={lubrifiantsQuery.data || []}
        typesConsommation={typesConsommationQuery.data || []}
        saisiehimId={selectedSaisiehimId}
        createLubrifiant={async (data) => {
          await createLubrifiant.mutateAsync(data);
        }}
        updateLubrifiant={async (data) => {
          await updateLubrifiant.mutateAsync(data);
        }}
      />

      <DeletePerformanceModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        performance={selectedPerformance}
        deletePerformance={deletePerformance.mutateAsync}
      />
    </div>
  );
}
