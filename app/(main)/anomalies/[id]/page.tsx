// app/anomalies/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CalendarIcon,
  Clock,
  Edit,
  MapPin,
  Trash2,
  Wrench,
  ArrowLeft,
  FileText,
  Loader2,
  Package,
  Hash,
  ClipboardList,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAnomalie } from "@/hooks/useAnomalies";
import { StatutAnomalie, Priorite } from "@prisma/client";
import { DeleteAnomalieModal } from "@/components/anomalies/DeleteAnomalieModal";
import { AnomalieModal } from "@/components/anomalies/AnomalieModal";

export default function AnomalieDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { anomalieQuery, updateAnomalie, deleteAnomalie } = useAnomalie(id);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("informations");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      router.push("/anomalies");
    }
  }, [id, router]);

  const getStatusBadgeColor = (statut?: StatutAnomalie) => {
    if (!statut)
      return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300";

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

  const getPriorityBadgeColor = (priorite?: Priorite) => {
    if (!priorite)
      return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300";

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

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteAnomalie.mutateAsync(id);
      toast.success("Anomalie supprimée avec succès");
      router.push("/anomalies");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleUpdateSuccess = () => {
    anomalieQuery.refetch();
    toast.success("Anomalie mise à jour avec succès");
    setEditModalOpen(false);
  };

  // Gestion des états de chargement et d'erreur
  if (!id) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-semibold">ID non trouvé</p>
            <Button className="mt-4" onClick={() => router.push("/anomalies")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux anomalies
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (anomalieQuery.isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">
              Chargement de l'anomalie...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (anomalieQuery.isError || !anomalieQuery.data) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold">Erreur</p>
              <p className="text-sm">
                {anomalieQuery.error?.message ||
                  "Impossible de charger l'anomalie"}
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/anomalies")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux anomalies
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const anomalie = anomalieQuery.data;

  // Vérification de sécurité pour les propriétés
  if (!anomalie || typeof anomalie !== "object") {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-semibold">Données invalides</p>
            <p className="text-sm text-muted-foreground">
              Les données de l'anomalie sont invalides
            </p>
            <Button className="mt-4" onClick={() => router.push("/anomalies")}>
              Retour aux anomalies
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/anomalies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Anomalie #{anomalie.numeroBacklog || "N/A"}
            </h1>
            <p className="text-muted-foreground">Détails de l'anomalie</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setEditModalOpen(true)}
            disabled={updateAnomalie.isPending}
          >
            {updateAnomalie.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleteAnomalie.isPending || isDeleting}
          >
            {deleteAnomalie.isPending || isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Supprimer
          </Button>
        </div>
      </div>

      {/* Badges de statut avec vérifications */}
      <div className="flex items-center space-x-4">
        <Badge
          variant="outline"
          className={`px-3 py-1 ${getStatusBadgeColor(anomalie.statut)}`}
        >
          {anomalie.statut
            ? anomalie.statut.replace("_", " ").toLowerCase()
            : "Inconnu"}
        </Badge>
        <Badge
          variant="outline"
          className={`px-3 py-1 ${getPriorityBadgeColor(anomalie.priorite)}`}
        >
          {anomalie.priorite ? anomalie.priorite.toLowerCase() : "Inconnue"}
        </Badge>
        <div className="text-sm text-muted-foreground">
          Créée le{" "}
          {anomalie.createdAt
            ? format(new Date(anomalie.createdAt), "dd/MM/yyyy à HH:mm", {
                locale: fr,
              })
            : "Date inconnue"}
        </div>
      </div>

      {/* Contenu principal */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="informations">
            <FileText className="mr-2 h-4 w-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="historique">
            <TrendingUp className="mr-2 h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        N° Backlog
                      </p>
                      <p className="text-sm font-semibold">
                        {anomalie.numeroBacklog || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Source
                      </p>
                      <p className="text-sm font-semibold">
                        {anomalie.source || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-line">
                        {anomalie.description || "Aucune description"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Besoin PDR
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {anomalie.besoinPDR ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Oui</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Non</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Engin
                      </p>
                      <p className="text-sm font-semibold">
                        {anomalie.engin?.name || "N/A"}
                      </p>
                      {/* SUPPRIMEZ cette ligne ou remplacez-la par : */}
                      {anomalie.engin?.parc && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Parc : {anomalie.engin.name}
                        </p>
                      )}
                      {/* OU simplement supprimez-la si vous n'avez pas besoin de cette info */}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Site
                      </p>
                      <p className="text-sm font-semibold">
                        {anomalie.site?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Date de détection
                      </p>
                      <p className="text-sm font-semibold">
                        {anomalie.dateDetection
                          ? format(
                              new Date(anomalie.dateDetection),
                              "dd/MM/yyyy",
                              {
                                locale: fr,
                              }
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {anomalie.dateExecution && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            Date d'exécution
                          </p>
                          <p className="text-sm font-semibold">
                            {format(
                              new Date(anomalie.dateExecution),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Dernière mise à jour
                      </p>
                      <p className="text-sm font-semibold">
                        {anomalie.updatedAt
                          ? format(
                              new Date(anomalie.updatedAt),
                              "dd/MM/yyyy HH:mm",
                              {
                                locale: fr,
                              }
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suivi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Suivi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {anomalie.numeroBS && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        N° BS
                      </span>
                      <span className="text-sm font-semibold">
                        {anomalie.numeroBS}
                      </span>
                    </div>
                  )}

                  {anomalie.programmation && (
                    <>
                      {anomalie.numeroBS && <Separator />}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Programmation
                        </span>
                        <span className="text-sm font-semibold">
                          {anomalie.programmation}
                        </span>
                      </div>
                    </>
                  )}

                  {anomalie.sortiePDR && (
                    <>
                      {(anomalie.numeroBS || anomalie.programmation) && (
                        <Separator />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Sortie PDR
                        </span>
                        <span className="text-sm font-semibold">
                          {anomalie.sortiePDR}
                        </span>
                      </div>
                    </>
                  )}

                  {anomalie.equipe && (
                    <>
                      {(anomalie.numeroBS ||
                        anomalie.programmation ||
                        anomalie.sortiePDR) && <Separator />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Équipe
                          </span>
                        </div>
                        <span className="text-sm font-semibold">
                          {anomalie.equipe}
                        </span>
                      </div>
                    </>
                  )}

                  {anomalie.confirmation && (
                    <>
                      {(anomalie.numeroBS ||
                        anomalie.programmation ||
                        anomalie.sortiePDR ||
                        anomalie.equipe) && <Separator />}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Confirmation
                        </span>
                        <span className="text-sm font-semibold">
                          {anomalie.confirmation}
                        </span>
                      </div>
                    </>
                  )}

                  {!anomalie.numeroBS &&
                    !anomalie.programmation &&
                    !anomalie.sortiePDR &&
                    !anomalie.equipe &&
                    !anomalie.confirmation && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Aucune information de suivi
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            {anomalie.observations && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm whitespace-pre-line text-yellow-800 dark:text-yellow-300">
                      {anomalie.observations}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historique" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Historique des changements de statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {anomalie.historiqueStatutAnomalies &&
                anomalie.historiqueStatutAnomalies.length > 0 ? (
                  <div className="space-y-3">
                    {anomalie.historiqueStatutAnomalies.map((historique) => (
                      <div
                        key={historique.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {historique.ancienStatut
                                .replace("_", " ")
                                .toLowerCase()}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="outline" className="text-xs">
                              {historique.nouveauStatut
                                .replace("_", " ")
                                .toLowerCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(
                              new Date(historique.dateChangement),
                              "dd/MM/yyyy HH:mm",
                              { locale: fr }
                            )}
                          </div>
                        </div>
                        {historique.commentaire && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium text-muted-foreground">
                              Commentaire:
                            </p>
                            <p className="text-muted-foreground mt-1 p-2 bg-muted rounded">
                              {historique.commentaire}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucun historique disponible
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Les changements de statut apparaîtront ici
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnomalieModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        anomalie={anomalie}
        mode="edit"
        onSuccess={handleUpdateSuccess}
      />

      <DeleteAnomalieModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        anomalie={anomalie}
        deleteAnomalie={deleteAnomalie}
        isDeleting={isDeleting}
      />
    </div>
  );
}
