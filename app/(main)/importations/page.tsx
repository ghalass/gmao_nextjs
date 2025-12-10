// app/importations/page.tsx
"use client";

import React, { useEffect, useState } from "react";
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

const HEADER_MAPPINGS = {
  sites: {
    name: "name!!",
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

        // Option 1: Utiliser raw: true pour garder les valeurs brutes
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          raw: true, // ← IMPORTANT: Garder les valeurs brutes (pas de conversion auto)
          defval: "", // Valeur par défaut pour les cellules vides
          rawNumbers: true, // Garder les nombres comme nombres
        });

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const firstRow = jsonData[0];
          const headers = firstRow.map((header: any) => header || "");

          const dataRows = jsonData.slice(1).filter((row: any) => {
            if (!Array.isArray(row)) return false;
            return row.some((cell) => cell != null && cell !== "");
          });

          // Fonction améliorée pour convertir seulement les vraies dates Excel
          const convertExcelToDate = (excelNumber: number): string | number => {
            // Vérifier si c'est probablement une date Excel
            // Les dates Excel typiques sont entre ~43000 (2017) et ~45000 (2023)
            // Mais peuvent être plus anciennes (à partir de ~1000 pour 1902)
            if (excelNumber < 1 || excelNumber > 100000) {
              return excelNumber; // Pas une date Excel plausible
            }

            // Vérifier si c'est un entier (date sans heure) ou a une partie décimale (date avec heure)
            const isDateLike = excelNumber >= 1 && excelNumber <= 50000;

            if (isDateLike) {
              try {
                // Excel compte les jours depuis le 30 décembre 1899
                const excelEpoch = new Date(1899, 11, 30);

                // Correction pour le bug Excel (1900 considéré comme année bissextile)
                const adjustedNumber =
                  excelNumber > 60 ? excelNumber - 1 : excelNumber;

                const date = new Date(
                  excelEpoch.getTime() + adjustedNumber * 24 * 60 * 60 * 1000
                );

                // Vérifier si la date résultante est valide et raisonnable
                const year = date.getFullYear();
                if (year >= 1900 && year <= 2100) {
                  return date.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                }
              } catch (e) {
                // Si erreur de conversion, garder le nombre original
              }
            }

            return excelNumber; // Retourner le nombre si pas une date valide
          };

          // Identifier les colonnes qui ne doivent PAS être converties en dates
          const getNonDateColumnIndexes = (headers: string[]): number[] => {
            const nonDateHeaders = [
              "equipe",
              "numero",
              "numeroBacklog",
              "n°",
              "reference",
              "code",
              "id",
              "matricule",
            ];
            return headers
              .map((header, index) =>
                nonDateHeaders.some((nonDate) =>
                  header.toLowerCase().includes(nonDate.toLowerCase())
                )
                  ? index
                  : -1
              )
              .filter((index) => index !== -1);
          };

          const nonDateColumnIndexes = getNonDateColumnIndexes(headers);

          // Traiter les cellules de manière sélective
          const processedDataRows = dataRows.map((row) =>
            row.map((cell, cellIndex) => {
              // Si c'est une colonne qui ne doit PAS être traitée comme date
              if (nonDateColumnIndexes.includes(cellIndex)) {
                // Toujours convertir en string pour ces colonnes
                return cell != null ? String(cell) : "";
              }

              // Sinon, vérifier si c'est une date Excel
              if (typeof cell === "number") {
                return convertExcelToDate(cell);
              }

              return cell;
            })
          );

          setHeaders(headers);
          setTableData(processedDataRows);

          setMessage({
            type: "success",
            text: `Onglet "${value}" chargé: ${processedDataRows.length} ligne(s) de données`,
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
    // console.log(`row:${row}`);
    // console.log(`formatted:${JSON.stringify(formatted)}`);

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
          const result = {
            success: false,
            message: `Ligne ${index + 1} ignorée (données vides)`,
            data: null,
          };
          setProcessingResults((prev) => ({ ...prev, [index]: result }));
          detailedResults.push(result);
          failedRows++;
          continue;
        }

        try {
          const result = await importMutation.mutateAsync({
            sheetName: selectedSheet,
            data: formattedData,
          });

          setProcessingResults((prev) => ({ ...prev, [index]: result }));
          detailedResults.push(result);

          // CORRECTION ICI : Analyser le tableau data pour déterminer le succès réel
          let rowSuccess = false;
          let rowFailed = false;

          if (result.data && Array.isArray(result.data)) {
            // Si data est un tableau, vérifier chaque élément
            const allSuccess = result.data.every(
              (item: any) => item?.success === true
            );
            const anyFailure = result.data.some(
              (item: any) => item?.success === false
            );

            rowSuccess = allSuccess && result.data.length > 0;
            rowFailed = anyFailure;
          } else {
            // Sinon, utiliser le success global
            rowSuccess = result.success === true;
            rowFailed = result.success === false;
          }

          if (rowSuccess) {
            successfulRows++;
          } else if (rowFailed) {
            failedRows++;
          }
        } catch (error: any) {
          const result = {
            success: false,
            message: error.message,
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

      // CORRECTION : Afficher le message final basé sur le vrai succès
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
      } else if (failedRows > 0) {
        setMessage({
          type: "error",
          text: `Échec complet du traitement : ${failedRows} échec(s).`,
        });
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

  const getStatusText = (rowIndex: number) => {
    if (currentProcessingRow === rowIndex) return "En traitement...";

    const rowResult = processingResults[rowIndex];
    if (!rowResult) return "En attente";

    // Vérifier le succès dans différentes structures
    const success =
      // Cas 1: {success: true, data: [...]}
      rowResult.success === true ||
      // Cas 2: {data: [{success: true}, ...]}
      (Array.isArray(rowResult.data) &&
        rowResult.data.length > 0 &&
        rowResult.data[0]?.success === true) ||
      // Cas 3: {success: true} (sans data)
      rowResult.success;

    return success ? "Succès" : "Échec";
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
                        <TableHead className="w-[300px] font-semibold text-foreground">
                          Résultat
                        </TableHead>

                        {/*  */}
                        {headers.map((header, index) => (
                          <TableHead
                            key={index}
                            className="font-semibold text-foreground"
                          >
                            {header || `Colonne ${index + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    {/*  */}
                    <TableBody>
                      {tableData.map((row, rowIndex) => {
                        const rowResult = processingResults[rowIndex];
                        const isProcessing = currentProcessingRow === rowIndex;

                        // Déterminer le statut BASÉ SUR LE DATA, PAS LE SUCCESS GLOBAL
                        let status = "En attente";
                        let isSuccess = false;

                        if (isProcessing) {
                          status = "En traitement...";
                        } else if (rowResult) {
                          // VÉRIFIER D'ABORD LE DATA ARRAY POUR DÉTERMINER LE SUCCÈS RÉEL
                          if (rowResult.data && Array.isArray(rowResult.data)) {
                            // Si data est un tableau, vérifier le succès de chaque élément
                            const allItemsSuccessful = rowResult.data.every(
                              (item: any) => item?.success === true
                            );
                            const anyItemFailed = rowResult.data.some(
                              (item: any) => item?.success === false
                            );

                            if (allItemsSuccessful) {
                              status = "Succès";
                              isSuccess = true;
                            } else if (anyItemFailed) {
                              status = "Échec";
                              isSuccess = false;
                            }
                          } else {
                            // Si pas de data array, utiliser le success global comme fallback
                            if (rowResult.success === true) {
                              status = "Succès";
                              isSuccess = true;
                            } else if (rowResult.success === false) {
                              status = "Échec";
                              isSuccess = false;
                            }
                          }
                        }

                        return (
                          <TableRow
                            key={rowIndex}
                            className={
                              isProcessing
                                ? "bg-primary/10 dark:bg-primary/20"
                                : ""
                            }
                          >
                            {/*  */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isProcessing && (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                )}
                                <Badge
                                  variant={
                                    isProcessing
                                      ? "secondary"
                                      : isSuccess
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="font-medium"
                                >
                                  {status}
                                </Badge>
                              </div>
                            </TableCell>

                            <TableCell>
                              {rowResult && (
                                <div
                                  className={
                                    isSuccess
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-destructive"
                                  }
                                >
                                  {/* Afficher le message global */}
                                  <p className="text-sm font-medium">
                                    {rowResult.message}
                                  </p>

                                  {/* Afficher les messages d'erreur détaillés du data array */}
                                  {rowResult.data &&
                                    Array.isArray(rowResult.data) && (
                                      <div className="mt-1 space-y-1">
                                        {rowResult.data
                                          .filter(
                                            (item: any) =>
                                              item && item.success === false
                                          )
                                          .map((item: any, idx: number) => (
                                            <p key={idx} className="text-sm">
                                              {item.message}
                                            </p>
                                          ))}
                                      </div>
                                    )}
                                </div>
                              )}
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
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>

                    {/*  */}
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
