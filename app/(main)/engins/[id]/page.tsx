// app/(main)/engins/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  Truck,
  Wrench,
  AlertTriangle,
  BarChart3,
  Calendar,
  Settings,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  Printer,
  Download,
  History,
  Activity,
  Fuel,
  Gauge,
  Shield,
  HardHat,
  Users,
  FileText,
  Database,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useEngins } from "@/hooks/useEngins";
import { useAnomalies } from "@/hooks/useAnomalies";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { EnginStats } from "@/components/engins/EnginStats";
import { AnomaliesTable } from "@/components/anomalies/AnomaliesTable";
import { Progress } from "@/components/ui/progress";
import { API } from "@/lib/constantes";

interface EnginDetails {
  id: string;
  name: string;
  active: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis: number;
  createdAt: string;
  updatedAt: string;
  parc: {
    id: string;
    name: string;
    typeparcId: string;
    typeparc: {
      id: string;
      name: string;
    };
  };
  site: {
    id: string;
    name: string;
    active: boolean;
  };
  anomalies: Array<{
    id: string;
    numeroBacklog: string;
    dateDetection: string;
    description: string;
    source: "VS" | "VJ" | "INSPECTION" | "AUTRE";
    priorite: "ELEVEE" | "MOYENNE" | "FAIBLE";
    besoinPDR: boolean;
    quantite?: number;
    reference?: string;
    code?: string;
    stock?: string;
    numeroBS?: string;
    programmation?: string;
    sortiePDR?: string;
    equipe?: string;
    statut:
      | "ATTENTE_PDR"
      | "PDR_PRET"
      | "NON_PROGRAMMEE"
      | "PROGRAMMEE"
      | "EXECUTE";
    dateExecution?: string;
    confirmation?: string;
    observations?: string;
  }>;
  saisiehim: Array<any>;
  pannes: Array<any>;
  _count: {
    saisiehrm: number;
    saisiehim: number;
    anomalies: number;
  };
}

export default function EnginDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const enginId = params.id as string;

  const [engin, setEngin] = useState<EnginDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    anomaliesTotal: 0,
    anomaliesResolues: 0,
    anomaliesEnCours: 0,
    anomaliesCritiques: 0,
    tauxResolution: 0,
    dernierIncident: null as string | null,
    joursSansIncident: 0,
    besoinPDRCount: 0,
  });

  useEffect(() => {
    const fetchEnginDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API}/engins/${enginId}`);

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des détails de l'engin");
        }

        const data = await response.json();
        setEngin(data);

        // Calcul des statistiques
        if (data.anomalies) {
          const anomaliesResolues = data.anomalies.filter(
            (a: any) => a.statut === "EXECUTE"
          ).length;
          const anomaliesEnCours = data.anomalies.filter(
            (a: any) => a.statut !== "EXECUTE"
          ).length;
          const anomaliesCritiques = data.anomalies.filter(
            (a: any) => a.priorite === "ELEVEE"
          ).length;
          const besoinPDRCount = data.anomalies.filter(
            (a: any) => a.besoinPDR
          ).length;

          const anomaliesAvecDate = data.anomalies
            .filter((a: any) => a.dateDetection)
            .map((a: any) => new Date(a.dateDetection));

          const dernierIncident =
            anomaliesAvecDate.length > 0
              ? new Date(
                  Math.max(...anomaliesAvecDate.map((d: Date) => d.getTime()))
                )
              : null;

          const aujourdHui = new Date();
          const joursSansIncident = dernierIncident
            ? differenceInDays(aujourdHui, dernierIncident)
            : 0;

          setStats({
            anomaliesTotal: data.anomalies.length,
            anomaliesResolues,
            anomaliesEnCours,
            anomaliesCritiques,
            tauxResolution:
              data.anomalies.length > 0
                ? Math.round((anomaliesResolues / data.anomalies.length) * 100)
                : 100,
            dernierIncident: dernierIncident?.toISOString() || null,
            joursSansIncident,
            besoinPDRCount,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setLoading(false);
      }
    };

    if (enginId) {
      fetchEnginDetails();
    }
  }, [enginId]);

  const { anomaliesQuery } = useAnomalies({
    enginId: enginId,
  });

  const handleBack = () => {
    router.push("/engins");
  };

  const handleEdit = () => {
    router.push(`/engins/${enginId}/edit`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return dateString;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "EXECUTE":
        return "bg-green-100 text-green-800 border-green-200";
      case "PROGRAMMEE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ATTENTE_PDR":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PDR_PRET":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "NON_PROGRAMMEE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "ELEVEE":
        return "bg-red-100 text-red-800 border-red-200";
      case "MOYENNE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "FAIBLE":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "VS":
        return <Eye className="h-3 w-3 mr-1" />;
      case "VJ":
        return <Users className="h-3 w-3 mr-1" />;
      case "INSPECTION":
        return <FileText className="h-3 w-3 mr-1" />;
      default:
        return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !engin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error || "Engin non trouvé"}</AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-8 w-8" />
              {engin.name}
            </h1>
            <p className="text-muted-foreground">
              {engin.parc?.typeparc?.name} • ID: {engin.id.substring(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statut et KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={engin.active ? "default" : "secondary"}>
                    {engin.active ? "ACTIF" : "INACTIF"}
                  </Badge>
                  {engin.initialHeureChassis > 0 && (
                    <Badge variant="outline">
                      <Gauge className="h-3 w-3 mr-1" />
                      {engin.initialHeureChassis}h
                    </Badge>
                  )}
                </div>
              </div>
              <Activity
                className={`h-8 w-8 ${
                  engin.active ? "text-green-500" : "text-gray-400"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parc & Site</p>
                <p className="font-semibold">{engin.parc?.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {engin.site?.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${
                      engin.site?.active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {engin.site?.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <div className="flex items-center gap-4 mt-1">
                  <div>
                    <p className="text-2xl font-bold">{stats.anomaliesTotal}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.anomaliesResolues}
                    </p>
                    <p className="text-xs text-muted-foreground">Résolues</p>
                  </div>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Taux de résolution
                </p>
                <div className="mt-1">
                  <p className="text-2xl font-bold">{stats.tauxResolution}%</p>
                  <Progress value={stats.tauxResolution} className="mt-2" />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="informations" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="informations">
            <Settings className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="anomalies">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Anomalies
            {engin.anomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {engin.anomalies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance
            {engin._count.saisiehim > 0 && (
              <Badge variant="secondary" className="ml-2">
                {engin._count.saisiehim}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="statistiques">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Tab Informations */}
        <TabsContent value="informations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Informations techniques
                </CardTitle>
                <CardDescription>
                  Détails de configuration et caractéristiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID Engin</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {engin.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{engin.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Type de parc
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {engin.parc?.typeparc?.name}
                      </Badge>
                      <Badge variant="secondary">{engin.parc?.name}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Heures chassis
                    </p>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {engin.initialHeureChassis || "0"} heures
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Site</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{engin.site?.name}</span>
                      <Badge
                        variant={engin.site?.active ? "default" : "secondary"}
                      >
                        {engin.site?.active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Statut global
                    </p>
                    <Badge
                      variant={engin.active ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {engin.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <HardHat className="h-4 w-4" />
                    Dates importantes
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Créé le</span>
                      <Badge variant="outline">
                        {formatDateTime(engin.createdAt)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dernière modification</span>
                      <Badge variant="outline">
                        {formatRelativeTime(engin.updatedAt)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dernier incident</span>
                      <Badge variant="outline">
                        {stats.dernierIncident
                          ? formatRelativeTime(stats.dernierIncident)
                          : "Aucun"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Performance & Suivi
                </CardTitle>
                <CardDescription>
                  Indicateurs de performance et suivi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Indicateurs clés
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          Jours sans incident
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dernier incident:{" "}
                          {stats.dernierIncident
                            ? formatDate(stats.dernierIncident)
                            : "Jamais"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          stats.joursSansIncident > 30
                            ? "default"
                            : stats.joursSansIncident > 7
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {stats.joursSansIncident} jours
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          Anomalies en attente PDR
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Besoin de pièces détachées
                        </p>
                      </div>
                      <Badge
                        variant={
                          stats.besoinPDRCount > 0 ? "destructive" : "secondary"
                        }
                      >
                        {stats.besoinPDRCount}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          Anomalies critiques
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Priorité élevée
                        </p>
                      </div>
                      <Badge
                        variant={
                          stats.anomaliesCritiques > 0
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {stats.anomaliesCritiques}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Distribution des statuts</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      engin.anomalies.reduce((acc: any, anomalie) => {
                        acc[anomalie.statut] = (acc[anomalie.statut] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([statut, count]) => (
                      <div
                        key={statut}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              statut === "EXECUTE"
                                ? "bg-green-500"
                                : statut === "PROGRAMMEE"
                                ? "bg-blue-500"
                                : statut === "ATTENTE_PDR"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="text-sm capitalize">
                            {statut.toLowerCase().replace("_", " ")}
                          </span>
                        </div>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Anomalies */}
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Anomalies détectées
                  </CardTitle>
                  <CardDescription>
                    {engin.anomalies.length} anomalie(s) enregistrée(s) pour cet
                    engin
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Naviguer vers la création d'anomalie
                      router.push(`/anomalies/new?enginId=${enginId}`);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Déclarer une anomalie
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {engin.anomalies.length > 0 ? (
                <AnomaliesTable anomalies={engin.anomalies} />
              ) : (
                <div className="text-center py-12 space-y-4">
                  <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                  <div>
                    <h3 className="text-lg font-semibold">Aucune anomalie</h3>
                    <p className="text-muted-foreground mt-1">
                      Aucune anomalie n&apos;a été détectée pour cet engin
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      router.push(`/anomalies/new?enginId=${enginId}`);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Déclarer la première anomalie
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Maintenance */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Historique des pannes
                </CardTitle>
                <CardDescription>
                  {engin.pannes.length} panne(s) enregistrée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {engin.pannes.length > 0 ? (
                  <div className="space-y-3">
                    {engin.pannes.slice(0, 5).map((panne: any) => (
                      <div
                        key={panne.id}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{panne.name}</p>
                            {panne.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {panne.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {formatRelativeTime(panne.createdAt)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune panne enregistrée</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Prochaines interventions
                </CardTitle>
                <CardDescription>
                  Interventions programmées et préventives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Interventions programmées */}
                  {engin.anomalies
                    .filter((a) => a.statut === "PROGRAMMEE")
                    .slice(0, 3)
                    .map((anomalie) => (
                      <div
                        key={anomalie.id}
                        className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-300">
                              {anomalie.numeroBacklog}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                              {anomalie.description}
                            </p>
                            {anomalie.programmation && (
                              <p className="text-xs text-blue-500 dark:text-blue-500/80 mt-1">
                                Programmation: {anomalie.programmation}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                          >
                            Programmé
                          </Badge>
                        </div>
                      </div>
                    ))}

                  {/* Interventions en attente PDR */}
                  {engin.anomalies
                    .filter((a) => a.statut === "ATTENTE_PDR")
                    .slice(0, 3)
                    .map((anomalie) => (
                      <div
                        key={anomalie.id}
                        className="border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-300">
                              {anomalie.numeroBacklog}
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                              {anomalie.description}
                            </p>
                            {anomalie.reference && (
                              <p className="text-xs text-yellow-500 dark:text-yellow-500/80 mt-1">
                                Réf: {anomalie.reference}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                          >
                            Attente PDR
                          </Badge>
                        </div>
                      </div>
                    ))}

                  {/* Message si aucune intervention */}
                  {engin.anomalies.filter(
                    (a) =>
                      a.statut === "PROGRAMMEE" || a.statut === "ATTENTE_PDR"
                  ).length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 italic">
                      Aucune intervention programmée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Statistiques */}
        <TabsContent value="statistiques">
          <EnginStats enginId={enginId} />
        </TabsContent>

        {/* Tab Historique */}
        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique complet
              </CardTitle>
              <CardDescription>
                Chronologie des événements et modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Création de l'engin */}
                <div className="border-l-2 border-green-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Création de l&apos;engin</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(engin.createdAt)}
                      </p>
                      <p className="text-sm">
                        Engin créé avec l&apos;ID: {engin.id.substring(0, 8)}...
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Création
                    </Badge>
                  </div>
                </div>

                {/* Dernière mise à jour */}
                <div className="border-l-2 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Dernière mise à jour</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(engin.updatedAt)}
                      </p>
                      <p className="text-sm">
                        Dernière modification apportée à l&apos;engin
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Mise à jour
                    </Badge>
                  </div>
                </div>

                {/* Anomalies récentes */}
                {engin.anomalies
                  .sort(
                    (a, b) =>
                      new Date(b.dateDetection).getTime() -
                      new Date(a.dateDetection).getTime()
                  )
                  .slice(0, 3)
                  .map((anomalie) => (
                    <div
                      key={anomalie.id}
                      className="border-l-2 border-orange-500 pl-4 py-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Anomalie détectée</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(anomalie.dateDetection)}
                          </p>
                          <p className="text-sm">{anomalie.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getPrioriteColor(anomalie.priorite)}
                            >
                              {anomalie.priorite.toLowerCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getStatutColor(anomalie.statut)}
                            >
                              {anomalie.statut.toLowerCase().replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 border-orange-200"
                        >
                          Anomalie
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions rapides */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-medium">Actions rapides</h3>
              <p className="text-sm text-muted-foreground">
                Actions fréquemment utilisées pour cet engin
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/anomalies/new?enginId=${enginId}`);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Déclarer anomalie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Naviguer vers la création de saisie HIM
                  router.push(`/saisies/him/new?enginId=${enginId}`);
                }}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Saisie HIM
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Naviguer vers la création de saisie HRM
                  router.push(`/saisies/hrm/new?enginId=${enginId}`);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Saisie HRM
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier engin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
