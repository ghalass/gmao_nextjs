// app/(main)/rapports/pareto/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  Download,
  Calendar,
  HardDrive,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";

// Import de recharts avec alias pour éviter les conflits
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  Cell,
  LabelList,
} from "recharts";

// Types
interface Parc {
  id: string;
  name: string;
}

interface ParetoIndispoData {
  parc: string;
  year: string;
  month: string;
  nombe_engin: number;
  panne: string;
  panneDescription: string; // AJOUT: Description de la panne
  indispo: number;
  engins: Array<{ name: string; him: number }>;
  engins_mtbf: Array<{ name: string; ni: number }>;
}

interface ParetoMtbfData {
  mois: string;
  mtbf: number | null;
  engins_actifs: number;
  objectif_mtbf: number | null;
}

// Composant pour afficher la description de la panne
const PanneDescriptionTooltip = ({ description }: { description: string }) => {
  if (!description) return null;

  return (
    <div className="relative inline-block group">
      <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1 inline" />
      <div className="absolute z-50 invisible group-hover:visible bg-popover text-popover-foreground p-3 rounded-md shadow-lg border w-64 max-w-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2">
        <p className="text-sm whitespace-pre-line">{description}</p>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b"></div>
      </div>
    </div>
  );
};

// Composant personnalisé pour les étiquettes des barres
const CustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="#666"
      textAnchor="middle"
      fontSize={12}
      fontWeight="medium"
    >
      {value.toFixed(2)}%
    </text>
  );
};

// Composant personnalisé pour les étiquettes des points MTBF
const CustomMtbfLabel = (props: any) => {
  const { x, y, value } = props;
  if (value === undefined || value === null) return null;

  return (
    <text
      x={x}
      y={y - 15}
      fill="#8884d8"
      textAnchor="middle"
      fontSize={11}
      fontWeight="medium"
    >
      {value.toFixed(0)}h
    </text>
  );
};

// Composant personnalisé pour les étiquettes des points d'objectif MTBF
const CustomObjectifLabel = (props: any) => {
  const { x, y, value } = props;
  if (value === undefined || value === null) return null;

  return (
    <text
      x={x}
      y={y - 15}
      fill="#82ca9d"
      textAnchor="middle"
      fontSize={11}
      fontWeight="medium"
    >
      {value.toFixed(0)}h
    </text>
  );
};

export default function ParetoIndisponibilitePage() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [selectedParc, setSelectedParc] = useState<string>("");
  const [selectedParcName, setSelectedParcName] = useState<string>("");
  const [shouldFetch, setShouldFetch] = useState(false);
  const [expandedPanne, setExpandedPanne] = useState<string | null>(null);

  // Récupérer la liste des parcs
  const { data: parcs = [], isLoading: isLoadingParcs } = useQuery<Parc[]>({
    queryKey: ["parcs"],
    queryFn: async () => {
      const res = await fetch("/api/parcs");
      if (!res.ok) throw new Error("Erreur lors du chargement des parcs");
      return res.json();
    },
  });

  // Query pour Pareto Indisponibilités
  const {
    data: paretoIndispoData,
    isLoading: isLoadingIndispo,
    isError: isErrorIndispo,
    error: errorIndispo,
    refetch: refetchIndispo,
  } = useQuery<ParetoIndispoData[]>({
    queryKey: ["pareto-indispo", selectedParc, date],
    queryFn: async () => {
      if (!selectedParc || !date) throw new Error("Paramètres manquants");

      const res = await fetch("/api/rapports/pareto-indispo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcId: selectedParc, date }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors du chargement des données"
        );
      }
      const data = await res.json();
      return data.data;
    },
    enabled: shouldFetch && !!selectedParc && !!date,
  });

  // Query pour Pareto MTBF
  const {
    data: paretoMtbfData,
    isLoading: isLoadingMtbf,
    isError: isErrorMtbf,
    error: errorMtbf,
    refetch: refetchMtbf,
  } = useQuery<ParetoMtbfData[]>({
    queryKey: ["pareto-mtbf", selectedParc, date],
    queryFn: async () => {
      if (!selectedParc || !date) throw new Error("Paramètres manquants");

      const res = await fetch("/api/rapports/pareto-mtbf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcId: selectedParc, date }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors du chargement des données"
        );
      }
      const data = await res.json();
      return data.data;
    },
    enabled: shouldFetch && !!selectedParc && !!date,
  });

  const handleGenerateReport = () => {
    setShouldFetch(true);
    refetchIndispo();
    refetchMtbf();
  };

  const handleParcChange = (value: string) => {
    const parc = parcs.find((p) => p.id === value);
    setSelectedParc(value);
    setSelectedParcName(parc?.name || "");
    setShouldFetch(false);
    setExpandedPanne(null);
  };

  const togglePanneDescription = (panneName: string) => {
    if (expandedPanne === panneName) {
      setExpandedPanne(null);
    } else {
      setExpandedPanne(panneName);
    }
  };

  const isLoading = isLoadingIndispo || isLoadingMtbf;
  const hasError = isErrorIndispo || isErrorMtbf;

  // Données formatées pour les graphiques
  const indispoChartData = paretoIndispoData?.slice(0, 10) || [];
  const mtbfChartData =
    paretoMtbfData?.filter((item) => item.mtbf !== null) || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            Pareto Indisponibilités
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse Pareto des indisponibilités et évolution MTBF par parc
          </p>
        </div>
      </div>

      {/* Contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres d'analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parc">Parc</Label>
              <Select
                value={selectedParc}
                onValueChange={handleParcChange}
                disabled={isLoadingParcs || isLoading}
              >
                <SelectTrigger id="parc">
                  <SelectValue placeholder="Sélectionner un parc" />
                </SelectTrigger>
                <SelectContent>
                  {parcs.map((parc) => (
                    <SelectItem key={parc.id} value={parc.id}>
                      {parc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Période</Label>
              <Input
                id="date"
                type="month"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="invisible">Générer</Label>
              <Button
                onClick={handleGenerateReport}
                disabled={isLoading || !selectedParc}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Générer les rapports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des erreurs */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {(errorIndispo as Error)?.message ||
              (errorMtbf as Error)?.message ||
              "Une erreur est survenue"}
          </AlertDescription>
        </Alert>
      )}

      {!selectedParc ? (
        <Card className="text-center border-dashed">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <HardDrive className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Sélectionnez un parc
                </h3>
                <p className="text-muted-foreground mb-6">
                  Choisissez un parc dans la liste déroulante ci-dessus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="indispo" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="indispo" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Pareto Indisponibilités
            </TabsTrigger>
            <TabsTrigger value="mtbf" className="gap-2">
              <LineChartIcon className="h-4 w-4" />
              Évolution MTBF
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Pareto Indisponibilités */}
          <TabsContent value="indispo">
            <Card>
              <CardHeader>
                <CardTitle>
                  Pareto Indisponibilités - {selectedParcName} -{" "}
                  {date.split("-").reverse().join("-")}
                </CardTitle>
                <CardDescription>
                  Top 10 des pannes les plus affectantes en termes
                  d'indisponibilité
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingIndispo ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : paretoIndispoData?.length ? (
                  <>
                    {/* Graphique Pareto */}
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={indispoChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="panne"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `${value}%`,
                              "Indisponibilité",
                            ]}
                            labelFormatter={(label, payload) => {
                              if (payload?.[0]?.payload?.panneDescription) {
                                return `${label} - ${payload[0].payload.panneDescription}`;
                              }
                              return label;
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="indispo"
                            name="Indisponibilité (%)"
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                          >
                            {/* Ajout des valeurs au-dessus des barres */}
                            <LabelList
                              dataKey="indispo"
                              content={<CustomBarLabel />}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Tableau des engins affectés */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-center">
                        Top 10 pannes les plus affectantes [HIM]
                      </h3>
                      <ScrollArea className="h-[500px] rounded-md border">
                        <Table>
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead className="w-1/3">
                                Panne
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                  (cliquez pour voir la description)
                                </span>
                              </TableHead>
                              <TableHead className="w-1/4">
                                Indisponibilité
                              </TableHead>
                              <TableHead className="w-1/2">
                                Engins affectés
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paretoIndispoData
                              .slice(0, 10)
                              .map((item, index) => (
                                <React.Fragment key={index}>
                                  <TableRow
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                      togglePanneDescription(item.panne)
                                    }
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center">
                                        <div className="line-clamp-1">
                                          {item.panne}-{item.panneDescription}
                                        </div>
                                        {item.panneDescription && (
                                          <Info className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          item.indispo > 5
                                            ? "text-red-600 border-red-600"
                                            : item.indispo > 2
                                            ? "text-orange-600 border-orange-600"
                                            : "text-green-600 border-green-600"
                                        }`}
                                      >
                                        {item.indispo.toFixed(2)}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {item.engins
                                          ?.filter((e) => e.him !== 0)
                                          .slice(0, 3)
                                          .map((engin, idx) => (
                                            <div
                                              key={idx}
                                              className="text-sm flex justify-between"
                                            >
                                              <span className="truncate mr-2">
                                                {engin.name}
                                              </span>
                                              <span className="text-muted-foreground font-medium">
                                                {engin.him}h
                                              </span>
                                            </div>
                                          ))}
                                        {item.engins?.filter((e) => e.him !== 0)
                                          .length > 3 && (
                                          <div className="text-xs text-muted-foreground pt-1">
                                            +
                                            {item.engins.filter(
                                              (e) => e.him !== 0
                                            ).length - 3}{" "}
                                            autres engins affectés
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      Aucune donnée d'indisponibilité disponible pour ce parc
                    </p>
                    <p className="text-sm mt-2">
                      Vérifiez que le parc a des données HRM/HIM pour la période
                      sélectionnée
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Évolution MTBF */}
          <TabsContent value="mtbf">
            <Card>
              <CardHeader>
                <CardTitle>
                  Évolution MTBF - {selectedParcName} -{" "}
                  {date.split("-").reverse().join("-")}
                </CardTitle>
                <CardDescription>
                  Évolution du MTBF mensuel avec objectif de référence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMtbf ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : paretoMtbfData?.length ? (
                  <>
                    {/* Graphique MTBF */}
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={mtbfChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === "mtbf")
                                return [`${value} h`, "MTBF"];
                              if (name === "objectif_mtbf")
                                return [`${value} h`, "Objectif MTBF"];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="mtbf"
                            name="MTBF (h)"
                            stroke="#8884d8"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          >
                            {/* Ajout des valeurs sur les points MTBF */}
                            <LabelList
                              dataKey="mtbf"
                              position="top"
                              content={<CustomMtbfLabel />}
                            />
                          </Line>
                          {mtbfChartData.some(
                            (item) => item.objectif_mtbf !== null
                          ) && (
                            <Line
                              type="monotone"
                              dataKey="objectif_mtbf"
                              name="Objectif MTBF"
                              stroke="#82ca9d"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                            >
                              {/* Ajout des valeurs sur les points d'objectif */}
                              <LabelList
                                dataKey="objectif_mtbf"
                                position="top"
                                content={<CustomObjectifLabel />}
                              />
                            </Line>
                          )}
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Tableau des pannes fréquentes */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-center">
                        Top 10 pannes les plus fréquentes [NI]
                      </h3>
                      <ScrollArea className="h-[500px] rounded-md border">
                        <Table>
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead className="w-1/2">
                                Panne
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                  (cliquez pour voir la description)
                                </span>
                              </TableHead>
                              <TableHead className="w-1/2">
                                Engins affectés (Occurrences)
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              // Créer un tableau pour stocker les données avec le total des occurrences
                              const pannesAvecOccurrences =
                                paretoIndispoData?.map((item) => {
                                  // Calculer le total des occurrences (ni) pour cette panne
                                  const totalOccurrences =
                                    item.engins_mtbf?.reduce(
                                      (sum, engin) => sum + engin.ni,
                                      0
                                    ) || 0;
                                  return {
                                    ...item,
                                    totalOccurrences,
                                  };
                                }) || [];

                              // Trier par totalOccurrences décroissant
                              const sortedPannes = [
                                ...pannesAvecOccurrences,
                              ].sort(
                                (a, b) =>
                                  b.totalOccurrences - a.totalOccurrences
                              );

                              // Prendre les 10 premiers
                              const top10Pannes = sortedPannes.slice(0, 10);

                              return top10Pannes.map((item, index) => (
                                <React.Fragment key={index}>
                                  <TableRow
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                      togglePanneDescription(item.panne)
                                    }
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center">
                                        <div className="line-clamp-1">
                                          {item.panne}-{item.panneDescription}
                                        </div>
                                        {item.panneDescription && (
                                          <Info className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Total occurrences:{" "}
                                        <span className="font-semibold">
                                          {item.totalOccurrences}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {item.engins_mtbf
                                          ?.filter((e) => e.ni !== 0)
                                          .sort((a, b) => b.ni - a.ni) // Trier les engins par nombre d'occurrences décroissant
                                          .slice(0, 3)
                                          .map((engin, idx) => (
                                            <div
                                              key={idx}
                                              className="text-sm flex justify-between"
                                            >
                                              <span className="truncate mr-2">
                                                {engin.name}
                                              </span>
                                              <span className="text-muted-foreground font-medium">
                                                {engin.ni} occ.
                                              </span>
                                            </div>
                                          ))}
                                        {item.engins_mtbf?.filter(
                                          (e) => e.ni !== 0
                                        ).length > 3 && (
                                          <div className="text-xs text-muted-foreground pt-1">
                                            +
                                            {item.engins_mtbf.filter(
                                              (e) => e.ni !== 0
                                            ).length - 3}{" "}
                                            autres engins
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              ));
                            })()}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {/* Résumé statistique */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Engins actifs
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {paretoMtbfData[0]?.engins_actifs || 0}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            MTBF moyen
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(() => {
                              const validMtbf = mtbfChartData.filter(
                                (item) => item.mtbf !== null
                              );
                              const avg =
                                validMtbf.reduce(
                                  (sum, item) => sum + (item.mtbf || 0),
                                  0
                                ) / validMtbf.length;
                              return validMtbf.length
                                ? `${avg.toFixed(2)} h`
                                : "N/A";
                            })()}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Objectif MTBF
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {paretoMtbfData.some(
                              (item) => item.objectif_mtbf !== null
                            )
                              ? `${paretoMtbfData
                                  .find((item) => item.objectif_mtbf !== null)
                                  ?.objectif_mtbf?.toFixed(2)} h`
                              : "Non défini"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune donnée MTBF disponible pour ce parc</p>
                    <p className="text-sm mt-2">
                      Vérifiez que le parc a des engins actifs avec des données
                      HRM/HIM
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
