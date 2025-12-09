// app/importations/page.tsx
"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useImport } from "@/hooks/useImport";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";

// Configuration des en-têtes
const REQUIRED_HEADERS = {
  sites: ["name"],
  typeparcs: ["name"],
  parcs: ["name", "typeparcName"],
  engins: ["name", "parcName", "siteName", "active", "initialHeureChassis"],
  // ... autres configurations
};

const HEADER_MAPPINGS = {
  sites: {
    name: "name",
    "Nom du Site": "name",
    Site: "name",
    Nom: "name",
  },
  // ... autres mappings
};

export default function ImportPage() {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [tableData, setTableData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    text: string;
  }>({ type: "info", text: "" });
  const [currentProcessingRow, setCurrentProcessingRow] = useState(-1);
  const [processingResults, setProcessingResults] = useState<
    Record<number, any>
  >({});

  const importMutation = useImport();

  const { user } = useUser();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setTableData([]);
    setHeaders([]);
    setProgress(0);
    setMessage({ type: "info", text: "" });
    setCurrentProcessingRow(-1);
    setProcessingResults({});

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

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
      }
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Erreur lors de la lecture du fichier",
      });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSheetSelect = (value: string) => {
    setSelectedSheet(value);
    setTableData([]);
    setHeaders([]);
    setProcessingResults({});
    setCurrentProcessingRow(-1);

    if (workbook && value) {
      try {
        const worksheet = workbook.Sheets[value];
        if (!worksheet) {
          setMessage({
            type: "warning",
            text: `L'onglet "${value}" est vide ou n'existe pas`,
          });
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // CORRECTION ICI : Typer explicitement jsonData
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          // La première ligne contient les en-têtes
          const firstRow = jsonData[0] as any[];
          const headers = firstRow.map((header: any) => header || "");

          // Les lignes suivantes sont les données
          const dataRows = jsonData.slice(1).filter((row: any) => {
            if (!Array.isArray(row)) return false;
            return row.some(
              (cell) => cell !== null && cell !== undefined && cell !== ""
            );
          }) as any[][];

          setHeaders(headers);
          setTableData(dataRows);

          setMessage({
            type: "success",
            text: `Onglet "${value}" chargé: ${dataRows.length} ligne(s) de données`,
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
      }
    }
  };

  const formatRowData = (row: any[], headers: string[], sheetName: string) => {
    const formatted: Record<string, any> = {};
    headers.forEach((header, index) => {
      if (
        header &&
        row[index] !== undefined &&
        row[index] !== null &&
        row[index] !== ""
      ) {
        const mappedHeader =
          HEADER_MAPPINGS[sheetName as keyof typeof HEADER_MAPPINGS]?.[
            header as keyof (typeof HEADER_MAPPINGS)[keyof typeof HEADER_MAPPINGS]
          ] || header;
        formatted[mappedHeader as string] = row[index];
      }
    });
    return formatted;
  };

  const submit = async () => {
    if (!selectedSheet || tableData.length === 0) {
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
          setTimeout(() => {
            const result = {
              success: false,
              message: `Ligne ${index + 1} ignorée (données vides)`,
              data: null,
            };
            setProcessingResults((prev) => ({ ...prev, [index]: result }));
            detailedResults.push(result);
            failedRows++;
          }, 500);

          continue;
        }

        try {
          const result = await importMutation.mutateAsync({
            sheetName: selectedSheet,
            data: formattedData,
          });

          setProcessingResults((prev) => ({ ...prev, [index]: result }));
          detailedResults.push(result);

          if (result.success) {
            successfulRows++;
          } else {
            failedRows++;
          }
        } catch (error: any) {
          const result = {
            success: false,
            message: `Erreur ligne ${index + 1}: ${error.message}`,
            data: null,
          };
          setProcessingResults((prev) => ({ ...prev, [index]: result }));
          detailedResults.push(result);
          failedRows++;
        }

        const newProgress = Math.round(((index + 1) / totalRows) * 100);
        setProgress(newProgress);
      }

      setCurrentProcessingRow(-1);
      setIsLoading(false);

      if (successfulRows === totalRows) {
        setMessage({
          type: "success",
          text: `Traitement terminé avec succès ! ${successfulRows} ligne(s) importée(s)`,
        });
      } else if (successfulRows > 0) {
        setMessage({
          type: "warning",
          text: `Traitement partiellement réussi : ${successfulRows} succès, ${failedRows} échecs.`,
        });
      } else {
        setMessage({
          type: "error",
          text: `Échec du traitement : ${failedRows} échecs.`,
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

  const getStatusText = (rowIndex: number) => {
    if (currentProcessingRow === rowIndex) return "En traitement...";
    if (processingResults[rowIndex]) {
      return processingResults[rowIndex]?.data[0]?.success ? "Succès" : "Échec";
    }
    return "En attente";
  };

  const isAdminOrSuperAdmin =
    user?.roleNames?.includes("admin") ||
    user?.roleNames?.includes("super admin");

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          {!isAdminOrSuperAdmin && (
            <>
              <Badge variant="outline" className="mx-auto px-4 py-2">
                <CardTitle className="text-2xl font-bold text-destructive">
                  Nous n'êtez pas authorisé à faire les importations
                </CardTitle>
              </Badge>
              <CardDescription className="text-center text-destructive">
                Importez des données est reservé aux adminstrateurs
              </CardDescription>
            </>
          )}

          <CardTitle className="text-2xl font-bold">
            Importation de données Excel
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Importez des données depuis un fichier Excel vers la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Upload du fichier */}
            <div className="w-full md:w-auto">
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="w-full md:w-[300px] cursor-pointer"
                disabled={isLoading || !isAdminOrSuperAdmin}
              />
            </div>

            {/* Sélection de l'onglet */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select
                value={selectedSheet}
                onValueChange={handleSheetSelect}
                disabled={!sheetNames.length || isLoading}
              >
                <SelectTrigger className="w-full md:w-[200px]">
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

              <Button
                onClick={submit}
                disabled={
                  !selectedSheet ||
                  tableData.length === 0 ||
                  isLoading ||
                  !isAdminOrSuperAdmin
                }
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  "Injecter"
                )}
              </Button>
            </div>
          </div>

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

          {/* Affichage du tableau */}
          {tableData.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-semibold">
                  Contenu de l'onglet:{" "}
                  <span className="text-primary">{selectedSheet}</span>
                </h3>
                <Badge variant="outline" className="w-fit">
                  {tableData.length} ligne{tableData.length > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[120px] font-semibold text-foreground">
                          Statut
                        </TableHead>
                        {headers.map((header, index) => (
                          <TableHead
                            key={index}
                            className="font-semibold text-foreground"
                          >
                            {header || `Colonne ${index + 1}`}
                          </TableHead>
                        ))}
                        <TableHead className="w-[300px] font-semibold text-foreground">
                          Résultat
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className={
                            currentProcessingRow === rowIndex
                              ? "bg-primary/10 dark:bg-primary/20"
                              : ""
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {currentProcessingRow === rowIndex && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              )}
                              <Badge
                                variant={
                                  currentProcessingRow === rowIndex
                                    ? "secondary"
                                    : processingResults[rowIndex]?.data[0]
                                        ?.success
                                    ? "default"
                                    : "destructive"
                                }
                                className="font-medium"
                              >
                                {getStatusText(rowIndex)}
                              </Badge>
                            </div>
                          </TableCell>
                          {headers.map((header, cellIndex) => (
                            <TableCell
                              key={cellIndex}
                              className="text-foreground"
                            >
                              {row[cellIndex] !== undefined &&
                              row[cellIndex] !== null &&
                              row[cellIndex] !== "" ? (
                                row[cellIndex]
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {processingResults[rowIndex] && (
                              <div
                                className={
                                  processingResults[rowIndex]?.data[0]?.success
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-destructive"
                                }
                              >
                                <p className="text-sm font-medium">
                                  {processingResults[rowIndex]?.message}
                                </p>
                                {!processingResults[rowIndex]?.data[0]
                                  ?.success && (
                                  <p className="text-sm mt-1">
                                    {
                                      processingResults[rowIndex]?.data[0]
                                        ?.message
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Message si aucune donnée */}
          {selectedSheet && tableData.length === 0 && (
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
        </CardContent>
      </Card>
    </div>
  );
}
