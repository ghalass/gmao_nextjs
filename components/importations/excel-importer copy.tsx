// components/ui/excel-importer.tsx
"use client";

import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  FileUp,
  Sheet,
  ChevronDown,
  ChevronUp,
  Filter,
  FilterX,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types pour les filtres
export type FilterStatus =
  | "all"
  | "success"
  | "error"
  | "processing"
  | "pending";

export interface ExcelImporterProps {
  /** Fonction appelée pour traiter chaque ligne */
  onProcessRow: (data: {
    sheetName: string;
    rowData: Record<string, any>;
    rowIndex: number;
  }) => Promise<any>;

  /** Titre du composant */
  title?: string;

  /** Description du composant */
  description?: string;

  /** Texte du bouton de soumission */
  submitButtonText?: string;

  /** Hauteur maximale du tableau */
  tableMaxHeight?: number;

  /** Afficher uniquement certaines colonnes */
  visibleColumns?: string[];

  /** Rendu personnalisé pour les cellules */
  renderCell?: (
    value: any,
    column: string,
    rowIndex: number
  ) => React.ReactNode;

  /** Rendu personnalisé pour le statut */
  renderStatus?: (result: any, isProcessing: boolean) => React.ReactNode;

  /** Fonction pour formater les données de la ligne */
  formatRowData?: (
    row: any[],
    headers: string[],
    sheetName: string
  ) => Record<string, any>;

  /** Désactiver l'importation */
  disabled?: boolean;

  /** Message d'erreur si désactivé */
  disabledMessage?: string;

  /** Actions supplémentaires à afficher dans l'en-tête */
  additionalActions?: React.ReactNode;

  /** Callback appelé au début du chargement du fichier */
  onFileUploadStart?: () => void;

  /** Callback appelé à la fin du chargement du fichier */
  onFileUploadEnd?: () => void;

  /** Callback appelé au début du chargement de l'onglet */
  onSheetLoadStart?: () => void;

  /** Callback appelé à la fin du chargement de l'onglet */
  onSheetLoadEnd?: () => void;

  /** Activer les filtres par statut */
  enableStatusFilters?: boolean;
}

export function ExcelImporter({
  onProcessRow,
  title = "Importation de données Excel",
  description = "Importez des données depuis un fichier Excel",
  submitButtonText = "Injecter",
  tableMaxHeight = 500,
  visibleColumns,
  renderCell,
  renderStatus,
  formatRowData: customFormatRowData,
  disabled = false,
  disabledMessage = "Importation désactivée",
  additionalActions,
  onFileUploadStart,
  onFileUploadEnd,
  onSheetLoadStart,
  onSheetLoadEnd,
  enableStatusFilters = true,
}: ExcelImporterProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [tableData, setTableData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    text: string;
  }>({ type: "info", text: "" });
  const [currentProcessingRow, setCurrentProcessingRow] = useState(-1);
  const [processingResults, setProcessingResults] = useState<
    Record<number, any>
  >({});
  const [previewMode, setPreviewMode] = useState<"full" | "preview">("preview");
  const [previewRowsCount, setPreviewRowsCount] = useState(50);

  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [expandedErrorDetails, setExpandedErrorDetails] = useState<number[]>(
    []
  );

  // Références pour la virtualisation
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);

  // DÉPLACER LA FONCTION AU DÉBUT DU COMPOSANT, AVANT LES HOOKS
  const isResultSuccessful = (result: any): boolean => {
    if (!result) return false;

    // Vérifier d'abord si result.success existe
    if (result.data[0].success !== undefined) {
      return result.data[0].success === true;
    }

    // Si result a une propriété data qui est un tableau
    if (result.data && Array.isArray(result.data)) {
      if (result.data.length === 0) return false;

      // Vérifier si tous les éléments sont des succès
      return result.data.every((item: any) => {
        if (!item) return false;
        if (item.success !== undefined) {
          return item.success === true;
        }
        return true;
      });
    }

    return false;
  };

  // Fonction pour obtenir le statut d'une ligne
  const getRowStatus = (rowIndex: number): FilterStatus => {
    const isProcessing = currentProcessingRow === rowIndex;
    const result = processingResults[rowIndex];

    if (isProcessing) return "processing";
    if (!result) return "pending";
    return isResultSuccessful(result) ? "success" : "error";
  };

  const defaultFormatRowData = (
    row: any[],
    headers: string[],
    sheetName: string
  ) => {
    const formatted: Record<string, any> = {};
    headers.forEach((header, index) => {
      if (header && header.trim() !== "") {
        const value = row[index];
        if (value !== undefined && value !== null) {
          formatted[header] = value;
        }
      }
    });
    return formatted;
  };

  const formatRowData = customFormatRowData || defaultFormatRowData;

  // Calculer les statistiques par statut
  const statusStats = useMemo(() => {
    const stats = {
      all: 0,
      success: 0,
      error: 0,
      processing: 0,
      pending: 0,
    };

    if (tableData.length === 0) return stats;

    tableData.forEach((_, index) => {
      const result = processingResults[index];
      const isProcessing = currentProcessingRow === index;

      if (isProcessing) {
        stats.processing++;
      } else if (!result) {
        stats.pending++;
      } else {
        const isSuccess = isResultSuccessful(result); // Maintenant accessible
        if (isSuccess) {
          stats.success++;
        } else {
          stats.error++;
        }
      }
      stats.all++;
    });

    return stats;
  }, [tableData, processingResults, currentProcessingRow]);

  // Filtrer les données selon le statut sélectionné
  const filteredData = useMemo(() => {
    if (statusFilter === "all" && !showOnlyErrors) {
      return tableData;
    }

    return tableData.filter((_, index) => {
      const rowStatus = getRowStatus(index);

      if (showOnlyErrors) {
        return rowStatus === "error";
      }

      return statusFilter === "all" || rowStatus === statusFilter;
    });
  }, [
    tableData,
    statusFilter,
    showOnlyErrors,
    processingResults,
    currentProcessingRow,
    getRowStatus,
  ]);

  // Fonction pour obtenir l'index original à partir de l'index filtré
  const getOriginalIndex = (filteredIndex: number): number => {
    if (statusFilter === "all" && !showOnlyErrors) {
      return filteredIndex;
    }

    let count = 0;
    for (let i = 0; i < tableData.length; i++) {
      const rowStatus = getRowStatus(i);
      const matchesFilter =
        statusFilter === "all" || rowStatus === statusFilter;
      const matchesErrorFilter = !showOnlyErrors || rowStatus === "error";

      if (matchesFilter && matchesErrorFilter) {
        if (count === filteredIndex) {
          return i;
        }
        count++;
      }
    }
    return -1;
  };

  // Virtualizer pour les lignes (basé sur les données filtrées)
  const rowVirtualizer = useVirtualizer({
    count:
      previewMode === "full"
        ? filteredData.length
        : Math.min(filteredData.length, previewRowsCount),
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => {
      const rowIndex = getOriginalIndex(index);
      const isExpanded = expandedErrorDetails.includes(rowIndex);
      const result = processingResults[rowIndex];

      // Si c'est une erreur avec des détails étendus, augmenter la hauteur
      if (isExpanded && result && result.data && Array.isArray(result.data)) {
        const itemCount = Math.min(result.data.length, 5); // Limiter à 5 éléments pour la hauteur
        return 40 + itemCount * 24; // Hauteur de base + hauteur des détails
      }

      return 40;
    },
    overscan: 10,
  });

  // Calculer les données à afficher (filtrées)
  const displayedData = useMemo(() => {
    if (previewMode === "preview") {
      return filteredData.slice(0, previewRowsCount);
    }
    return filteredData;
  }, [filteredData, previewMode, previewRowsCount]);

  // Synchroniser le scroll des en-têtes avec le tableau
  const handleTableScroll = () => {
    if (tableContainerRef.current && headerContainerRef.current) {
      headerContainerRef.current.scrollLeft =
        tableContainerRef.current.scrollLeft;
    }
  };

  // Gestion du basculement des détails d'erreur
  const toggleErrorDetails = (rowIndex: number) => {
    setExpandedErrorDetails((prev) =>
      prev.includes(rowIndex)
        ? prev.filter((idx) => idx !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const file = event.target.files?.[0];
    if (!file) return;

    // Début du chargement du fichier
    setIsFileUploading(true);
    setMessage({ type: "info", text: "Chargement du fichier en cours..." });
    onFileUploadStart?.();

    // Reset states
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setTableData([]);
    setHeaders([]);
    setProgress(0);
    setCurrentProcessingRow(-1);
    setProcessingResults({});
    setPreviewMode("preview");
    setStatusFilter("all");
    setShowOnlyErrors(false);
    setExpandedErrorDetails([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: "array",
          cellText: false,
          cellDates: true,
          cellNF: false,
          cellFormula: false,
        });

        setWorkbook(workbook);
        setSheetNames(workbook.SheetNames);

        setMessage({
          type: "success",
          text: `Fichier chargé avec succès. ${workbook.SheetNames.length} onglet(s) détecté(s).`,
        });
      } catch (error) {
        console.error("Erreur lors de la lecture du fichier:", error);
        setMessage({
          type: "error",
          text: "Erreur lors de la lecture du fichier Excel",
        });
      } finally {
        // Fin du chargement du fichier
        setIsFileUploading(false);
        onFileUploadEnd?.();
      }
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Erreur lors de la lecture du fichier",
      });
      setIsFileUploading(false);
      onFileUploadEnd?.();
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSheetSelect = async (value: string) => {
    if (disabled) return;

    // Début du chargement de l'onglet
    setIsSheetLoading(true);
    setMessage({ type: "info", text: `Chargement de l'onglet "${value}"...` });
    onSheetLoadStart?.();

    setSelectedSheet(value);
    setTableData([]);
    setHeaders([]);
    setProcessingResults({});
    setCurrentProcessingRow(-1);
    setPreviewMode("preview");
    setStatusFilter("all");
    setShowOnlyErrors(false);
    setExpandedErrorDetails([]);

    // Petit délai pour permettre à l'utilisateur de voir l'indicateur de chargement
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (workbook && value) {
      try {
        const worksheet = workbook.Sheets[value];
        if (!worksheet) {
          setMessage({
            type: "warning",
            text: `L'onglet "${value}" est vide ou n'existe pas`,
          });
          setIsSheetLoading(false);
          onSheetLoadEnd?.();
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          raw: false,
          rawNumbers: false,
          dateNF: "dd-mm-yyyy",
          defval: null,
          blankrows: false,
        });

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const firstRow = jsonData[0];
          const originalHeaders = firstRow.map((header: any) => {
            if (header == null) return "";
            if (header instanceof Date) {
              return header.toLocaleDateString("fr-FR");
            }
            return String(header).trim();
          });

          const dataRows = jsonData.slice(1).map((row: any) => {
            if (!Array.isArray(row)) return [];
            const paddedRow = [...Array(originalHeaders.length)].map((_, i) => {
              if (i < row.length) {
                const cellValue = row[i];
                if (cellValue instanceof Date) {
                  return cellValue.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                }
                return cellValue;
              }
              return null;
            });
            return paddedRow;
          });

          const filteredDataRows = dataRows.filter((row: any[]) =>
            row.some((cell) => cell != null && cell !== "")
          );

          setHeaders(originalHeaders);
          setTableData(filteredDataRows);

          setMessage({
            type: "success",
            text: `Onglet "${value}" chargé: ${filteredDataRows.length} ligne(s) de données`,
          });
        } else {
          setHeaders([]);
          setTableData([]);
          setMessage({
            type: "warning",
            text: `L'onglet "${value}" ne contient aucune donnée`,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la lecture de l'onglet:", error);
        setMessage({
          type: "error",
          text: "Erreur lors de la lecture de l'onglet sélectionné",
        });
      } finally {
        // Fin du chargement de l'onglet
        setIsSheetLoading(false);
        onSheetLoadEnd?.();
      }
    } else {
      setIsSheetLoading(false);
      onSheetLoadEnd?.();
    }
  };

  // Normaliser le résultat
  const normalizeResult = (result: any) => {
    if (!result) {
      return {
        success: false,
        message: "Aucun résultat retourné",
        data: null,
      };
    }

    if (typeof result === "object" && !Array.isArray(result)) {
      if (result.success !== undefined) {
        return {
          success: result.success === true,
          message: result.message || "",
          data: result.data || null,
        };
      }

      if (result.data && Array.isArray(result.data)) {
        const allSuccess =
          result.data.length > 0
            ? result.data.every((item: any) => item?.success === true)
            : false;

        return {
          success: allSuccess,
          message:
            result.message ||
            (allSuccess
              ? "Tous les éléments ont réussi"
              : "Certains éléments ont échoué"),
          data: result.data,
        };
      }
    }

    if (Array.isArray(result)) {
      if (
        result.length > 0 &&
        result.every((item) => item && typeof item === "object")
      ) {
        const hasSuccessField = result.some((item) => "success" in item);

        if (hasSuccessField) {
          const successfulItems = result.filter(
            (item) => item.success === true
          );
          const failedItems = result.filter((item) => item.success === false);
          const allSuccess = failedItems.length === 0 && result.length > 0;

          return {
            success: allSuccess,
            message: `${successfulItems.length} succès, ${failedItems.length} échec(s) sur ${result.length} élément(s)`,
            data: result,
          };
        } else {
          return {
            success: true,
            message: `${result.length} élément(s) traité(s)`,
            data: result,
          };
        }
      } else {
        return {
          success: true,
          message: `${result.length} élément(s) traité(s)`,
          data: result,
        };
      }
    }

    if (typeof result === "string") {
      const isError =
        result.toLowerCase().includes("erreur") ||
        result.toLowerCase().includes("échec") ||
        result.toLowerCase().includes("error") ||
        result.toLowerCase().includes("failed");

      return {
        success: !isError,
        message: result,
        data: null,
      };
    }

    if (typeof result === "boolean") {
      return {
        success: result,
        message: result ? "Succès" : "Échec",
        data: null,
      };
    }

    return {
      success: false,
      message: "Format de résultat non reconnu",
      data: result,
    };
  };

  const submit = async () => {
    if (disabled || !selectedSheet || tableData.length === 0) {
      setMessage({
        type: "warning",
        text: "Veuillez sélectionner un onglet avec des données",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setCurrentProcessingRow(-1);
    setProcessingResults({});
    setStatusFilter("all");
    setShowOnlyErrors(false);
    setExpandedErrorDetails([]);
    setMessage({ type: "info", text: "Début du traitement des données..." });

    try {
      const totalRows = tableData.length;
      let successfulRows = 0;
      let failedRows = 0;
      const detailedResults = [];

      for (let index = 0; index < totalRows; index++) {
        setCurrentProcessingRow(index);

        const rowData = tableData[index];
        const formattedData = formatRowData(rowData, headers, selectedSheet);

        if (Object.keys(formattedData).length === 0) {
          const emptyResult = {
            success: false,
            message: `Ligne ${index + 1} ignorée (données vides)`,
            data: null,
          };
          setProcessingResults((prev) => ({ ...prev, [index]: emptyResult }));
          detailedResults.push(emptyResult);
          failedRows++;
          continue;
        }

        try {
          const result = await onProcessRow({
            sheetName: selectedSheet,
            rowData: formattedData,
            rowIndex: index,
          });

          const normalizedResult = normalizeResult(result);
          setProcessingResults((prev) => ({
            ...prev,
            [index]: normalizedResult,
          }));
          detailedResults.push(normalizedResult);

          if (isResultSuccessful(normalizedResult)) {
            successfulRows++;
          } else {
            failedRows++;
          }
        } catch (error: any) {
          const errorResult = {
            success: false,
            message: `Erreur: ${error.message}`,
            data: null,
          };
          setProcessingResults((prev) => ({ ...prev, [index]: errorResult }));
          detailedResults.push(errorResult);
          failedRows++;
        }

        const newProgress = Math.round(((index + 1) / totalRows) * 100);
        setProgress(newProgress);
      }

      setCurrentProcessingRow(-1);
      setIsLoading(false);

      if (failedRows === 0 && successfulRows > 0) {
        setMessage({
          type: "success",
          text: `Traitement terminé avec succès ! ${successfulRows} ligne(s) importée(s) sans erreur`,
        });
      } else if (successfulRows > 0 && failedRows > 0) {
        setMessage({
          type: "warning",
          text: `Traitement partiellement réussi : ${successfulRows} succès, ${failedRows} échec(s).`,
        });
        // Si des erreurs sont détectées, on peut automatiquement filtrer pour les afficher
        if (enableStatusFilters && failedRows > 0) {
          setShowOnlyErrors(true);
          setStatusFilter("error");
        }
      } else if (failedRows > 0) {
        setMessage({
          type: "error",
          text: `Échec complet du traitement : ${failedRows} échec(s).`,
        });
        if (enableStatusFilters) {
          setShowOnlyErrors(true);
          setStatusFilter("error");
        }
      } else {
        setMessage({
          type: "info",
          text: `Traitement terminé sans lignes traitées.`,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du traitement:", error);
      setIsLoading(false);
      setCurrentProcessingRow(-1);
      setMessage({
        type: "error",
        text: `Une erreur est survenue lors du traitement des données: ${error.message}`,
      });
    }
  };

  const getFilteredHeaders = () => {
    if (!visibleColumns || visibleColumns.length === 0) {
      return headers;
    }
    return headers.filter((header) => visibleColumns.includes(header));
  };

  const getVisibleCellIndexes = () => {
    if (!visibleColumns || visibleColumns.length === 0) {
      return headers.map((_, index) => index);
    }
    return headers
      .map((header, index) => (visibleColumns.includes(header) ? index : -1))
      .filter((index) => index !== -1);
  };

  const visibleHeaders = getFilteredHeaders();
  const visibleCellIndexes = getVisibleCellIndexes();

  const defaultRenderCell = (value: any, column: string, rowIndex: number) => {
    return value !== undefined && value !== null && value !== "" ? (
      <div className="truncate" title={String(value)}>
        {value}
      </div>
    ) : (
      <span className="text-muted-foreground">-</span>
    );
  };

  const defaultRenderStatus = (result: any, isProcessing: boolean) => {
    if (isProcessing) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <Badge variant="secondary" className="font-medium">
            En traitement...
          </Badge>
        </div>
      );
    }

    if (!result) {
      return (
        <Badge variant="outline" className="font-medium">
          En attente
        </Badge>
      );
    }

    const isSuccess = isResultSuccessful(result);

    return (
      <Badge
        variant={isSuccess ? "default" : "destructive"}
        className="font-medium"
      >
        {isSuccess ? "Succès" : "Échec"}
      </Badge>
    );
  };

  const togglePreviewMode = () => {
    setPreviewMode((prev) => (prev === "preview" ? "full" : "preview"));
  };

  const changePreviewRowsCount = (count: number) => {
    setPreviewRowsCount(count);
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setStatusFilter("all");
    setShowOnlyErrors(false);
    setExpandedErrorDetails([]);
  };

  // Calculer la largeur totale des colonnes
  const columnWidths = {
    status: 100,
    result: 350,
    dataCell: 120,
  };

  const totalWidth =
    columnWidths.status +
    columnWidths.result +
    visibleHeaders.length * columnWidths.dataCell;

  return (
    <Card>
      <CardHeader>
        {disabled && (
          <>
            <Badge variant="outline" className="mx-auto px-4 py-2">
              <CardTitle className="text-2xl font-bold text-destructive">
                {disabledMessage}
              </CardTitle>
            </Badge>
            <CardDescription className="text-center text-destructive">
              Importation désactivée
            </CardDescription>
          </>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </div>

          {additionalActions && (
            <div className="flex flex-col gap-2">{additionalActions}</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section d'upload avec indicateurs de chargement */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Upload du fichier */}
          <div className="w-full md:w-auto relative">
            <Input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="w-full md:w-[300px] cursor-pointer pr-10"
              disabled={isLoading || disabled || isFileUploading}
            />
            {isFileUploading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
            {!isFileUploading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Sélection de l'onglet */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Select
                value={selectedSheet}
                onValueChange={handleSheetSelect}
                disabled={
                  !sheetNames.length || isLoading || disabled || isSheetLoading
                }
              >
                <SelectTrigger className="w-full md:w-[200px] pr-10">
                  <SelectValue placeholder="Sélectionnez un onglet" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {sheetNames.map((sheetName, index) => (
                    <SelectItem
                      key={index}
                      value={sheetName}
                      className="focus:bg-accent focus:text-accent-foreground"
                    >
                      {sheetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSheetLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              {!isSheetLoading && selectedSheet && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Sheet className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <Button
              onClick={submit}
              disabled={
                !selectedSheet ||
                tableData.length === 0 ||
                isLoading ||
                disabled ||
                isFileUploading ||
                isSheetLoading
              }
              className="w-full sm:w-auto relative"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </div>

        {/* Indicateurs de chargement visuels */}
        {(isFileUploading || isSheetLoading) && (
          <div className="space-y-2">
            {isFileUploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>Chargement du fichier en cours...</span>
              </div>
            )}

            {isSheetLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>
                  Chargement des données de l'onglet "{selectedSheet}"...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message d'alerte */}
        {message.text && (
          <Alert
            variant={
              message.type === "success"
                ? "default"
                : message.type === "error"
                ? "destructive"
                : "default"
            }
            className={`mt-2 ${
              message.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
                : message.type === "error"
                ? "border-red-500/20 bg-red-500/10"
                : message.type === "warning"
                ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                : "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            <AlertTitle className="font-semibold">
              {message.type === "success"
                ? "Succès"
                : message.type === "error"
                ? "Erreur"
                : message.type === "warning"
                ? "Avertissement"
                : "Information"}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Barre de progression */}
        {(isLoading || progress > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isLoading ? "Traitement en cours..." : "Traitement terminé"}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Section des filtres de statut */}
        {enableStatusFilters && tableData.length > 0 && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filtres par statut</h3>
                {(statusFilter !== "all" || showOnlyErrors) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-7 px-2"
                  >
                    <FilterX className="h-3 w-3 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <span>Tous:</span>
                  </div>
                  <Badge variant="outline">{statusStats.all}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Succès:</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400"
                  >
                    {statusStats.success}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Erreurs:</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400"
                  >
                    {statusStats.error}
                  </Badge>
                </div>
                {statusStats.processing > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>En cours:</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400"
                    >
                      {statusStats.processing}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Tabs
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as FilterStatus)
                }
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 md:grid-cols-5 w-full">
                  <TabsTrigger value="all">
                    <Eye className="h-4 w-4 mr-2" />
                    Tous
                  </TabsTrigger>
                  <TabsTrigger value="success">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Succès
                  </TabsTrigger>
                  <TabsTrigger value="error">
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Erreurs
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    <Clock className="h-4 w-4 mr-2 text-gray-600" />
                    En attente
                  </TabsTrigger>
                  {statusStats.processing > 0 && (
                    <TabsTrigger value="processing">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                      En cours
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>

            {/* Résumé du filtre actif */}
            {(statusFilter !== "all" || showOnlyErrors) && (
              <div className="mt-3 p-3 rounded bg-muted">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {showOnlyErrors ? (
                      <span className="font-medium">
                        Affichage des erreurs uniquement ({statusStats.error}{" "}
                        ligne{statusStats.error > 1 ? "s" : ""})
                      </span>
                    ) : statusFilter !== "all" ? (
                      <span className="font-medium">
                        Filtre actif: {statusFilter} (
                        {statusStats[statusFilter]} ligne
                        {statusStats[statusFilter] > 1 ? "s" : ""})
                      </span>
                    ) : null}
                    {showOnlyErrors &&
                      statusFilter !== "all" &&
                      statusFilter !== "error" && (
                        <span className="text-muted-foreground ml-2">
                          (Le filtre "uniquement les erreurs" est prioritaire)
                        </span>
                      )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredData.length} ligne
                    {filteredData.length > 1 ? "s" : ""} affichée
                    {filteredData.length > 1 ? "s" : ""} sur {tableData.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contrôles d'affichage */}
        {tableData.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {filteredData.length} ligne{filteredData.length > 1 ? "s" : ""}{" "}
                affichée{filteredData.length > 1 ? "s" : ""}
                {filteredData.length !== tableData.length && (
                  <span className="text-muted-foreground ml-1">
                    (sur {tableData.length})
                  </span>
                )}
              </Badge>

              {filteredData.length > 100 && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {previewMode === "preview"
                          ? `Prévisualisation (${previewRowsCount} lignes)`
                          : "Toutes les lignes"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => changePreviewRowsCount(50)}
                      >
                        50 premières lignes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => changePreviewRowsCount(100)}
                      >
                        100 premières lignes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => changePreviewRowsCount(200)}
                      >
                        200 premières lignes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={togglePreviewMode}>
                        {previewMode === "preview"
                          ? "Afficher toutes les lignes"
                          : "Revenir en prévisualisation"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {previewMode === "preview" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Optimisation des performances activée</span>
                      </>
                    ) : (
                      <>
                        <AlertDescription className="text-amber-600">
                          Toutes les lignes affichées - Attention aux
                          performances
                        </AlertDescription>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {previewMode === "preview"
                ? `Affichage des ${Math.min(
                    previewRowsCount,
                    filteredData.length
                  )} premières lignes sur ${filteredData.length}`
                : `Affichage de toutes les ${filteredData.length} lignes`}
            </div>
          </div>
        )}

        {/* Affichage du tableau avec virtualisation */}
        {displayedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-lg font-semibold">
                Contenu de l'onglet:{" "}
                <span className="text-primary">{selectedSheet}</span>
                {statusFilter !== "all" || showOnlyErrors ? (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (filtré)
                  </span>
                ) : null}
              </h3>
            </div>

            {/* Tableau virtuel */}
            <div className="rounded-lg border overflow-hidden">
              {/* En-têtes fixes */}
              <div
                ref={headerContainerRef}
                className="sticky top-0 bg-background border-b overflow-hidden z-10"
                style={{
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "hidden",
                }}
              >
                <div style={{ width: totalWidth, minWidth: "100%" }}>
                  <div className="flex text-center">
                    {/* Colonne Statut */}
                    <div
                      className="p-2 font-semibold border-r bg-background"
                      style={{
                        width: columnWidths.status,
                        minWidth: columnWidths.status,
                      }}
                    >
                      Statut
                    </div>

                    {/* Colonne Résultat */}
                    <div
                      className="p-2 font-semibold border-r bg-background"
                      style={{
                        width: columnWidths.result,
                        minWidth: columnWidths.result,
                      }}
                    >
                      Résultat
                    </div>

                    {/* Colonnes de données */}
                    {visibleHeaders.map((header, index) => (
                      <div
                        key={index}
                        className="p-2 font-semibold border-r bg-background last:border-r-0"
                        style={{
                          width: columnWidths.dataCell,
                          minWidth: columnWidths.dataCell,
                        }}
                      >
                        <div className="truncate" title={header}>
                          {header || `Colonne ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Corps du tableau avec virtualisation */}
              <div
                ref={tableContainerRef}
                onScroll={handleTableScroll}
                style={{
                  height: tableMaxHeight,
                  width: "100%",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: rowVirtualizer.getTotalSize(),
                    width: totalWidth,
                    minWidth: "100%",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const filteredIndex = virtualRow.index;
                    const originalIndex = getOriginalIndex(filteredIndex);
                    const row = displayedData[filteredIndex];
                    const rowResult = processingResults[originalIndex];
                    const isProcessing = currentProcessingRow === originalIndex;
                    const rowStatus = getRowStatus(originalIndex);
                    const isError = rowStatus === "error";

                    return (
                      <div
                        key={originalIndex}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`border-b ${
                          isProcessing
                            ? "bg-primary/10 dark:bg-primary/20"
                            : isError
                            ? "bg-red-50/50 dark:bg-red-950/20"
                            : filteredIndex % 2 === 0
                            ? "bg-background"
                            : "bg-muted/30"
                        }`}
                      >
                        <div className="flex h-full">
                          {/* Cellule Statut */}
                          <div
                            className="border-r flex items-center justify-center"
                            style={{
                              width: columnWidths.status,
                              minWidth: columnWidths.status,
                              height: "100%",
                            }}
                          >
                            <div className="flex items-center justify-center w-full h-full">
                              {renderStatus
                                ? renderStatus(rowResult, isProcessing)
                                : defaultRenderStatus(rowResult, isProcessing)}
                            </div>
                          </div>

                          {/* Cellule Résultat */}
                          <div
                            className="border-r overflow-hidden"
                            style={{
                              width: columnWidths.result,
                              minWidth: columnWidths.result,
                              height: "100%",
                            }}
                          >
                            <div className="h-full ">
                              <div className="p-2 space-y-1">
                                {rowResult && (
                                  <>
                                    {isError &&
                                      rowResult.data &&
                                      Array.isArray(rowResult.data) && (
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                          {rowResult.data.map(
                                            (item: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className={`text-xs p-2 rounded ${
                                                  item?.success === false
                                                    ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-l-2 border-red-500"
                                                    : item?.success === true
                                                    ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-l-2 border-green-500"
                                                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-l-2 border-gray-400"
                                                }`}
                                              >
                                                <div className="flex items-start gap-2">
                                                  {item?.success === false ? (
                                                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0`" />
                                                  ) : item?.success === true ? (
                                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0`" />
                                                  ) : (
                                                    <div className="h-3 w-3 rounded-full bg-gray-400 mt-0.5 shrink-0`" />
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">
                                                      {item?.message ||
                                                        "Aucun message"}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Cellules de données */}
                          {visibleCellIndexes.map((cellIndex) => {
                            const header = headers[cellIndex];
                            const value = row[cellIndex];
                            return (
                              <div
                                key={cellIndex}
                                className="border-r last:border-r-0"
                                style={{
                                  width: columnWidths.dataCell,
                                  minWidth: columnWidths.dataCell,
                                  height: "100%",
                                }}
                              >
                                <div className="flex items-center justify-center h-full p-2">
                                  {renderCell
                                    ? renderCell(value, header, originalIndex)
                                    : defaultRenderCell(
                                        value,
                                        header,
                                        originalIndex
                                      )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Indicateur de lignes non affichées en mode prévisualisation */}
            {previewMode === "preview" &&
              filteredData.length > previewRowsCount && (
                <div className="flex items-center justify-center gap-2 p-2 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <AlertDescription className="text-center">
                      {filteredData.length - previewRowsCount} lignes
                      supplémentaires non affichées
                    </AlertDescription>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePreviewMode}
                      className="h-8 px-3"
                    >
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Afficher toutes les lignes
                    </Button>
                  </div>
                </div>
              )}

            {/* Indicateur de mode complet */}
            {previewMode === "full" && filteredData.length > 100 && (
              <div className="flex items-center justify-center gap-2 p-2 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Mode complet activé - {filteredData.length} lignes
                      affichées
                    </span>
                  </div>
                </AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePreviewMode}
                  className="h-8 px-3"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Retour en prévisualisation
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Message si aucune donnée */}
        {selectedSheet && tableData.length === 0 && !isSheetLoading && (
          <div className="text-center py-12 border rounded-lg">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Aucune donnée trouvée dans l'onglet{" "}
                <span className="font-medium text-foreground">
                  {selectedSheet}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Assurez-vous que l'onglet contient des données
              </p>
            </div>
          </div>
        )}

        {/* Indicateur de chargement pendant la sélection d'onglet */}
        {selectedSheet && isSheetLoading && (
          <div className="text-center py-12 border rounded-lg">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Chargement des données de l'onglet{" "}
                  <span className="font-medium text-foreground">
                    {selectedSheet}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Veuillez patienter pendant le traitement...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message si aucun résultat après filtrage */}
        {tableData.length > 0 && filteredData.length === 0 && (
          <div className="text-center py-8 border rounded-lg">
            <div className="space-y-4">
              <FilterX className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  Aucune ligne ne correspond aux filtres
                </h3>
                <p className="text-muted-foreground mt-2">
                  Aucune ligne ne correspond aux critères de filtrage actuels.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
