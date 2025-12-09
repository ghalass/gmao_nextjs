// app/(main)/anomalies/stats/page.tsx
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Filter,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useAnomalies } from "@/hooks/useAnomalies";
import { useSites } from "@/hooks/useSites";
import { useEngins } from "@/hooks/useEngins";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";

// Composants de graphique
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnomalieStatsPage() {
  const [filters, setFilters] = useState({
    siteId: "all" as string | "all",
    enginId: "all" as string | "all",
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
  });

  const { statsQuery, anomaliesQuery, evolutionQuery } = useAnomalies({
    siteId: filters.siteId === "all" ? undefined : filters.siteId,
    enginId: filters.enginId === "all" ? undefined : filters.enginId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const { sitesQuery } = useSites();
  const { enginsQuery } = useEngins();

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    console.log("Export des statistiques");
  };

  // Données pour le graphique en barres (par statut)
  const statutData = statsQuery.data?.parStatut
    ? Object.entries(statsQuery.data.parStatut).map(([statut, count]) => ({
        name: statut.replace("_", " ").toLowerCase(),
        value: count,
        statut,
      }))
    : [];

  // Données pour le graphique en camembert (par priorité)
  const prioriteData = statsQuery.data?.parPriorite
    ? Object.entries(statsQuery.data.parPriorite).map(([priorite, count]) => ({
        name: priorite.toLowerCase(),
        value: count,
        priorite,
      }))
    : [];

  // Données pour le graphique en barres (par source)
  const sourceData = statsQuery.data?.parSource
    ? Object.entries(statsQuery.data.parSource).map(([source, count]) => ({
        name: source,
        value: count,
        source,
      }))
    : [];

  // Couleurs pour les graphiques
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  const PRIORITY_COLORS: Record<Priorite, string> = {
    ELEVEE: "#EF4444",
    MOYENNE: "#F59E0B",
    FAIBLE: "#10B981",
  };

  const STATUT_COLORS: Record<StatutAnomalie, string> = {
    ATTENTE_PDR: "#F59E0B",
    PDR_PRET: "#3B82F6",
    NON_PROGRAMMEE: "#6B7280",
    PROGRAMMEE: "#8B5CF6",
    EXECUTE: "#10B981",
  };

  if (statsQuery.isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Chargement des statistiques...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const calculateTempsResoluAnomalies = (priorite: Priorite): string => {
    if (!evolutionQuery.data?.tempsMoyenResolution) return "N/A";

    switch (priorite) {
      case "ELEVEE":
        return (evolutionQuery.data.tempsMoyenResolution * 0.6).toFixed(1);
      case "MOYENNE":
        return evolutionQuery.data.tempsMoyenResolution.toFixed(1);
      case "FAIBLE":
        return (evolutionQuery.data.tempsMoyenResolution * 1.5).toFixed(1);
      default:
        return evolutionQuery.data.tempsMoyenResolution.toFixed(1);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tableau de bord des anomalies
          </h1>
          <p className="text-muted-foreground">
            Statistiques et indicateurs de performance
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-foreground">Filtres</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Site */}
            <div className="space-y-2">
              <Label htmlFor="siteId" className="text-foreground">
                Site
              </Label>
              <Select
                value={filters.siteId}
                onValueChange={(value) => {
                  handleFilterChange("siteId", value);
                  if (value === "all") {
                    handleFilterChange("enginId", "all");
                  }
                }}
              >
                <SelectTrigger className="bg-background text-foreground border-input">
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border-border">
                  <SelectItem value="all">Tous les sites</SelectItem>
                  {sitesQuery.data?.map((site) => (
                    <SelectItem
                      key={site.id}
                      value={site.id}
                      className="focus:bg-accent focus:text-accent-foreground"
                    >
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Engin */}
            <div className="space-y-2">
              <Label htmlFor="enginId" className="text-foreground">
                Engin
              </Label>
              <Select
                value={filters.enginId}
                onValueChange={(value) => handleFilterChange("enginId", value)}
                disabled={!filters.siteId || filters.siteId === "all"}
              >
                <SelectTrigger className="bg-background text-foreground border-input">
                  <SelectValue
                    placeholder={
                      !filters.siteId || filters.siteId === "all"
                        ? "Sélectionnez d'abord un site"
                        : "Tous les engins"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border-border">
                  <SelectItem value="all">Tous les engins</SelectItem>
                  {enginsQuery.data
                    ?.filter(
                      (engin) =>
                        !filters.siteId ||
                        filters.siteId === "all" ||
                        engin.siteId === filters.siteId
                    )
                    .map((engin) => (
                      <SelectItem
                        key={engin.id}
                        value={engin.id}
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        {engin.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Période */}
            <div className="space-y-2">
              <Label className="text-foreground">Période</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="dateFrom"
                    className="text-xs text-muted-foreground"
                  >
                    De
                  </Label>
                  <input
                    type="date"
                    id="dateFrom"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "dateFrom",
                        e.target.value || undefined
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="dateTo"
                    className="text-xs text-muted-foreground"
                  >
                    À
                  </Label>
                  <input
                    type="date"
                    id="dateTo"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value || undefined)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte 1 : Total anomalies avec évolution */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total anomalies</p>
                <div className="text-3xl font-bold mt-2 text-foreground">
                  {statsQuery.data?.total || 0}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {evolutionQuery.data?.comparaisonMensuelle && (
                <div className="flex items-center space-x-1">
                  {evolutionQuery.data.comparaisonMensuelle.pourcentage !==
                  0 ? (
                    <>
                      <span
                        className={
                          evolutionQuery.data.comparaisonMensuelle.pourcentage >
                          0
                            ? "text-destructive"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {evolutionQuery.data.comparaisonMensuelle.pourcentage >
                        0
                          ? "↑"
                          : "↓"}
                        {Math.abs(
                          evolutionQuery.data.comparaisonMensuelle.pourcentage
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="text-xs">
                        vs{" "}
                        {evolutionQuery.data.comparaisonMensuelle.moisPrecedent
                          ?.mois || "mois précédent"}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Aucune variation
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carte 2 : Anomalies résolues avec tendance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exécutées</p>
                <div className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
                  {statsQuery.data?.parStatut?.EXECUTE || 0}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  {statsQuery.data?.total
                    ? Math.round(
                        ((statsQuery.data.parStatut?.EXECUTE || 0) /
                          statsQuery.data.total) *
                          100
                      )
                    : 0}
                  % du total
                </Badge>
                {evolutionQuery.data?.comparaisonMensuelle && (
                  <Badge
                    variant="outline"
                    className={
                      (evolutionQuery.data.comparaisonMensuelle.moisCourant
                        ?.tauxResolution || 0) >
                      (evolutionQuery.data.comparaisonMensuelle.moisPrecedent
                        ?.tauxResolution || 0)
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    }
                  >
                    {evolutionQuery.data.comparaisonMensuelle.moisCourant
                      ?.tauxResolution
                      ? `${evolutionQuery.data.comparaisonMensuelle.moisCourant.tauxResolution.toFixed(
                          1
                        )}%`
                      : "0%"}{" "}
                    ce mois
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte 3 : Anomalies en attente avec alertes */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente PDR</p>
                <div className="text-3xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">
                  {statsQuery.data?.parStatut?.ATTENTE_PDR || 0}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                >
                  {statsQuery.data?.total
                    ? Math.round(
                        ((statsQuery.data.parStatut?.ATTENTE_PDR || 0) /
                          statsQuery.data.total) *
                          100
                      )
                    : 0}
                  % du total
                </Badge>
                {evolutionQuery.data?.comparaisonMensuelle &&
                  evolutionQuery.data.comparaisonMensuelle.moisCourant
                    ?.attentePDR &&
                  evolutionQuery.data.comparaisonMensuelle.moisCourant
                    .attentePDR > 10 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Élevé
                    </Badge>
                  )}
              </div>
              {evolutionQuery.data?.comparaisonMensuelle && (
                <div className="text-xs text-muted-foreground">
                  {evolutionQuery.data.comparaisonMensuelle.moisCourant
                    ?.attentePDR || 0}{" "}
                  ce mois
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carte 4 : Priorité élevée avec tendance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Priorité élevée</p>
                <div className="text-3xl font-bold mt-2 text-destructive">
                  {statsQuery.data?.parPriorite?.ELEVEE || 0}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <div className="mt-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-destructive/10 text-destructive"
                  >
                    {statsQuery.data?.total
                      ? Math.round(
                          ((statsQuery.data.parPriorite?.ELEVEE || 0) /
                            statsQuery.data.total) *
                            100
                        )
                      : 0}
                    % du total
                  </Badge>
                  {evolutionQuery.data?.evolutionPeriodes && (
                    <Badge
                      variant="outline"
                      className={
                        evolutionQuery.data.evolutionPeriodes
                          .pourcentageTrimestriel > 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-green-500/10 text-green-700 dark:text-green-400"
                      }
                    >
                      {evolutionQuery.data.evolutionPeriodes
                        .pourcentageTrimestriel > 0
                        ? "↑"
                        : "↓"}
                      {Math.abs(
                        evolutionQuery.data.evolutionPeriodes
                          .pourcentageTrimestriel
                      ).toFixed(1)}
                      % sur 3 mois
                    </Badge>
                  )}
                </div>
                {evolutionQuery.data?.evolutionPeriodes && (
                  <div className="text-xs text-muted-foreground flex items-center space-x-1">
                    <span>Tendance:</span>
                    <span
                      className={
                        evolutionQuery.data.evolutionPeriodes.tendance ===
                        "hausse"
                          ? "text-destructive font-medium"
                          : evolutionQuery.data.evolutionPeriodes.tendance ===
                            "baisse"
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {evolutionQuery.data.evolutionPeriodes.tendance ===
                      "hausse"
                        ? "À la hausse"
                        : evolutionQuery.data.evolutionPeriodes.tendance ===
                          "baisse"
                        ? "À la baisse"
                        : "Stable"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et visualisations */}
      <Tabs defaultValue="statut" className="space-y-4">
        <TabsList className="bg-background border border-input">
          <TabsTrigger
            value="statut"
            className="flex items-center data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Par statut
          </TabsTrigger>
          <TabsTrigger
            value="priorite"
            className="flex items-center data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <PieChart className="mr-2 h-4 w-4" />
            Par priorité
          </TabsTrigger>
          <TabsTrigger
            value="source"
            className="flex items-center data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Par source
          </TabsTrigger>
          <TabsTrigger
            value="evolution"
            className="flex items-center data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Évolution
          </TabsTrigger>
        </TabsList>

        {/* Graphique par statut */}
        <TabsContent value="statut" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Répartition par statut
              </CardTitle>
              <CardDescription>Nombre d'anomalies par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statutData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(value) =>
                        value.charAt(0).toUpperCase() + value.slice(1)
                      }
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value) => [value, "Nombre"]}
                      labelFormatter={(label) => `Statut: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Nombre d'anomalies"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    >
                      {statutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUT_COLORS[entry.statut as StatutAnomalie] ||
                            COLORS[index % COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Légende détaillée */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
                {statutData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          STATUT_COLORS[item.statut as StatutAnomalie] ||
                          COLORS[index % COLORS.length],
                      }}
                    />
                    <span className="text-sm text-foreground capitalize">
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-foreground ml-auto">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique par priorité */}
        <TabsContent value="priorite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Répartition par priorité
              </CardTitle>
              <CardDescription>
                Distribution des anomalies par niveau de priorité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Graphique camembert */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={prioriteData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${
                            percent ? (percent * 100).toFixed(0) : "0"
                          }%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prioriteData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PRIORITY_COLORS[entry.priorite as Priorite] ||
                              COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value) => [value, "Nombre"]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return payload[0].payload?.name || label;
                          }
                          return label;
                        }}
                      />
                      <Legend
                        formatter={(value, entry) => {
                          const payload = entry.payload as any;
                          return payload?.name || value;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Détails par priorité */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Détails par priorité
                  </h3>
                  {prioriteData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                PRIORITY_COLORS[item.priorite as Priorite] ||
                                COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="font-medium text-foreground capitalize">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-foreground">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              (item.value / (statsQuery.data?.total || 1)) * 100
                            }%`,
                            backgroundColor:
                              PRIORITY_COLORS[item.priorite as Priorite] ||
                              COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        {Math.round(
                          (item.value / (statsQuery.data?.total || 1)) * 100
                        )}
                        % du total
                      </div>
                    </div>
                  ))}

                  {/* Statistiques additionnelles */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="font-semibold text-foreground mb-4">
                      Temps de résolution moyen
                    </h4>
                    {evolutionQuery.data?.tempsMoyenResolution ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {evolutionQuery.data.tempsMoyenResolution.toFixed(
                              1
                            )}
                          </div>
                          <div className="text-xs text-primary">
                            jours (Moyenne globale)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {calculateTempsResoluAnomalies("ELEVEE")}
                          </div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-400">
                            jours (Priorité élevée)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {evolutionQuery.data.repartitionStatut?.resolues ||
                              0}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            anomalies résolues
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Données de temps de résolution non disponibles</p>
                        <p className="text-sm">
                          Les anomalies doivent avoir une date d'exécution pour
                          calculer cette métrique
                        </p>
                      </div>
                    )}

                    {/* Métriques additionnelles */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {prioriteData.find((p) => p.priorite === "ELEVEE")
                            ?.value || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Priorité élevée
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(
                            ((prioriteData.find((p) => p.priorite === "ELEVEE")
                              ?.value || 0) /
                              (statsQuery.data?.total || 1)) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          du total (Élevée)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique par source */}
        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Répartition par source
              </CardTitle>
              <CardDescription>Origine des anomalies détectées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value) => [value, "Nombre"]}
                      labelFormatter={(label) => `Source: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Nombre d'anomalies"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Insights sur les sources */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    Source majoritaire
                  </h4>
                  <p className="text-primary text-sm">
                    {sourceData.length > 0
                      ? `Les inspections (${
                          Object.values(SourceAnomalie)[0]
                        }) représentent ${Math.round(
                          (Math.max(...sourceData.map((d) => d.value)) /
                            (statsQuery.data?.total || 1)) *
                            100
                        )}% des détections`
                      : "Aucune donnée disponible"}
                  </p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    Taux de détection
                  </h4>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    {sourceData.length > 0
                      ? `${sourceData.reduce(
                          (acc, curr) => acc + curr.value,
                          0
                        )} anomalies détectées sur la période sélectionnée`
                      : "Aucune donnée disponible"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Évolution temporelle */}
        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Évolution temporelle
              </CardTitle>
              <CardDescription>
                Trend des anomalies sur les 6 derniers mois
                {evolutionQuery.data?.evolution && (
                  <Badge
                    variant={
                      evolutionQuery.data.evolution > 0
                        ? "destructive"
                        : "default"
                    }
                    className="ml-2"
                  >
                    {evolutionQuery.data.evolution > 0 ? "↑" : "↓"}
                    {Math.abs(evolutionQuery.data.evolution).toFixed(1)}%
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evolutionQuery.isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={evolutionQuery.data?.evolutionMensuelle || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="mois" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value, name) => {
                            const labelMap: Record<string, string> = {
                              anomalies: "Anomalies détectées",
                              resolues: "Anomalies résolues",
                              attentePDR: "En attente PDR",
                              programmées: "Programmées",
                            };
                            return [value, labelMap[name as string] || name];
                          }}
                        />
                        <Legend
                          formatter={(value) => {
                            const labelMap: Record<string, string> = {
                              anomalies: "Détectées",
                              resolues: "Résolues",
                              attentePDR: "Attente PDR",
                              programmées: "Programmées",
                            };
                            return labelMap[value] || value;
                          }}
                        />
                        <Bar
                          dataKey="anomalies"
                          name="anomalies"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="resolues"
                          name="resolues"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="attentePDR"
                          name="attentePDR"
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="programmées"
                          name="programmées"
                          fill="#8B5CF6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Métriques de performance dynamiques */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {evolutionQuery.data?.tauxResolution
                              ? `${evolutionQuery.data.tauxResolution.toFixed(
                                  1
                                )}%`
                              : "0%"}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Taux de résolution
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {evolutionQuery.data?.tempsMoyenResolution || 0}j
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Temps moyen de résolution
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {evolutionQuery.data?.repartitionStatut
                              ?.programmées || 0}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Programmées
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-destructive">
                            {evolutionQuery.data?.anomaliesCritiques || 0}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Critiques (&gt;7j)
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analyse détaillée */}
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-foreground">
                          Répartition mensuelle détaillée
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {evolutionQuery.data?.evolutionMensuelle.map(
                            (month, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-foreground">
                                    {month.mois}
                                  </span>
                                  <Badge variant="outline">
                                    {month.anomalies} anomalies
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Résolues
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {month.resolues}
                                    </span>
                                  </div>
                                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{
                                        width: `${
                                          month.anomalies > 0
                                            ? (month.resolues /
                                                month.anomalies) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      En attente PDR
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {month.attentePDR}
                                    </span>
                                  </div>
                                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-yellow-500 rounded-full"
                                      style={{
                                        width: `${
                                          month.anomalies > 0
                                            ? (month.attentePDR /
                                                month.anomalies) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-foreground">
                          Performances globales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Tendance */}
                          <div
                            className={`p-3 rounded-lg ${
                              evolutionQuery.data?.evolution &&
                              evolutionQuery.data.evolution > 0
                                ? "bg-destructive/10"
                                : "bg-green-500/10"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">
                                Tendance globale
                              </span>
                              <Badge
                                variant={
                                  evolutionQuery.data?.evolution &&
                                  evolutionQuery.data.evolution > 0
                                    ? "destructive"
                                    : "default"
                                }
                              >
                                {evolutionQuery.data?.evolution &&
                                evolutionQuery.data.evolution > 0
                                  ? "↑"
                                  : "↓"}
                                {evolutionQuery.data?.evolution
                                  ? Math.abs(
                                      evolutionQuery.data.evolution
                                    ).toFixed(1)
                                  : "0"}
                                %
                              </Badge>
                            </div>
                            <p className="text-sm mt-1 text-foreground">
                              {evolutionQuery.data?.evolution &&
                              evolutionQuery.data.evolution > 0
                                ? "Le nombre d'anomalies est en augmentation"
                                : "Le nombre d'anomalies est stable ou en diminution"}
                            </p>
                          </div>

                          {/* Efficacité de résolution */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground">
                                Efficacité de résolution
                              </span>
                              <Badge
                                variant={
                                  evolutionQuery.data?.tauxResolution &&
                                  evolutionQuery.data.tauxResolution > 80
                                    ? "default"
                                    : evolutionQuery.data?.tauxResolution &&
                                      evolutionQuery.data.tauxResolution > 60
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {evolutionQuery.data?.tauxResolution
                                  ? evolutionQuery.data.tauxResolution.toFixed(
                                      1
                                    )
                                  : "0"}
                                %
                              </Badge>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${
                                    evolutionQuery.data?.tauxResolution || 0
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between">
                              <span>Objectif: 80%</span>
                              <span>
                                Actuel:{" "}
                                {evolutionQuery.data?.tauxResolution
                                  ? evolutionQuery.data.tauxResolution.toFixed(
                                      1
                                    )
                                  : "0"}
                                %
                              </span>
                            </div>
                          </div>

                          {/* Temps de résolution */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground">
                                Délai moyen de résolution
                              </span>
                              <Badge
                                variant={
                                  evolutionQuery.data?.tempsMoyenResolution &&
                                  evolutionQuery.data.tempsMoyenResolution <= 5
                                    ? "default"
                                    : evolutionQuery.data
                                        ?.tempsMoyenResolution &&
                                      evolutionQuery.data
                                        .tempsMoyenResolution <= 10
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {evolutionQuery.data?.tempsMoyenResolution || 0}{" "}
                                jours
                              </Badge>
                            </div>
                            <div className="text-sm text-foreground">
                              {evolutionQuery.data?.tempsMoyenResolution &&
                              evolutionQuery.data.tempsMoyenResolution <= 5
                                ? "Excellent délai de résolution"
                                : evolutionQuery.data?.tempsMoyenResolution &&
                                  evolutionQuery.data.tempsMoyenResolution <= 10
                                ? "Délai acceptable"
                                : "Délai à améliorer"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top anomalies critiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Anomalies critiques en attente
          </CardTitle>
          <CardDescription>
            Anomalies de priorité élevée nécessitant une attention immédiate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomaliesQuery.data
              ?.filter(
                (anomalie) =>
                  anomalie.priorite === "ELEVEE" &&
                  anomalie.statut !== "EXECUTE"
              )
              .slice(0, 5)
              .map((anomalie) => (
                <div
                  key={anomalie.id}
                  className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Élevée</Badge>
                      <span className="font-medium text-foreground">
                        {anomalie.numeroBacklog}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {anomalie.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{anomalie.engin?.name}</span>
                      <span>•</span>
                      <span>{anomalie.site?.name}</span>
                      <span>•</span>
                      <span>
                        {format(
                          new Date(anomalie.dateDetection),
                          "dd/MM/yyyy",
                          { locale: fr }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    >
                      {anomalie.statut.replace("_", " ").toLowerCase()}
                    </Badge>
                    <div className="text-xs text-destructive mt-1">
                      {Math.floor(
                        (new Date().getTime() -
                          new Date(anomalie.dateDetection).getTime()) /
                          (1000 * 3600 * 24)
                      )}{" "}
                      jours
                    </div>
                  </div>
                </div>
              ))}

            {(!anomaliesQuery.data ||
              anomaliesQuery.data.filter(
                (a) => a.priorite === "ELEVEE" && a.statut !== "EXECUTE"
              ).length === 0) && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Aucune anomalie critique en attente
                </p>
                <p className="text-sm text-muted-foreground">
                  Excellent travail d'équipe !
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes et recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Recommandations</CardTitle>
          <CardDescription>Suggestions basées sur les données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">
                📈 Amélioration continue
              </h4>
              <ul className="text-primary text-sm space-y-1">
                <li>
                  • Augmenter les inspections préventives pour réduire les
                  détections VS
                </li>
                <li>• Mettre en place un système d'alerte précoce</li>
                <li>
                  • Former les équipes aux bonnes pratiques de maintenance
                </li>
              </ul>
            </div>
            <div className="bg-green-500/10 p-4 rounded-lg">
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                ✅ Actions prioritaires
              </h4>
              <ul className="text-green-600 dark:text-green-400 text-sm space-y-1">
                <li>
                  • Résoudre les anomalies de priorité élevée dans les 48h
                </li>
                <li>
                  • Réviser le stock de PDR pour les anomalies récurrentes
                </li>
                <li>
                  • Optimiser la planification des interventions programmées
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
