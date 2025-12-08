// components/anomalies/AnomalieModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, MapPin, Wrench } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAnomalies } from "@/hooks/useAnomalies";
import { useSites } from "@/hooks/useSites";
import { useEngins } from "@/hooks/useEngins";
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";

import { AnomalieForm } from "./AnomalieForm";
import {
  Anomalie,
  AnomalieFormData,
  convertToAnomalieFormData,
} from "@/lib/types/anomalie";

interface AnomalieModalProps {
  open: boolean;
  onClose: () => void;
  anomalie: Anomalie | null;
  mode: "create" | "edit" | "view";
}

export function AnomalieModal({
  open,
  onClose,
  anomalie,
  mode,
}: AnomalieModalProps) {
  const [activeTab, setActiveTab] = useState("informations");
  const { createAnomalie, updateAnomalie } = useAnomalies();
  const { sitesQuery } = useSites();
  const { enginsQuery } = useEngins();

  useEffect(() => {
    if (open) {
      setActiveTab("informations");
    }
  }, [open]);

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

  const handleSubmit = async (data: AnomalieFormData) => {
    try {
      // Utiliser convertToAnomalieFormData pour s'assurer du bon type
      const formData = convertToAnomalieFormData(data);

      if (mode === "create") {
        await createAnomalie.mutateAsync(formData);
        toast.success("Anomalie créée avec succès");
      } else if (mode === "edit" && anomalie) {
        await updateAnomalie.mutateAsync({
          id: anomalie.id,
          data: formData,
        });
        toast.success("Anomalie modifiée avec succès");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Nouvelle anomalie";
      case "edit":
        return "Modifier l'anomalie";
      case "view":
        return "Détails de l'anomalie";
      default:
        return "Anomalie";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Remplissez les informations pour créer une nouvelle anomalie";
      case "edit":
        return "Modifiez les informations de l'anomalie";
      case "view":
        return "Consultez les détails complets de l'anomalie";
      default:
        return "";
    }
  };

  const isSubmitting = createAnomalie.isPending || updateAnomalie.isPending;

  if (mode === "view" && anomalie) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{getTitle()}</span>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className={getStatusBadgeColor(anomalie.statut)}
                >
                  {anomalie.statut.replace("_", " ").toLowerCase()}
                </Badge>
                <Badge
                  variant="outline"
                  className={getPriorityBadgeColor(anomalie.priorite)}
                >
                  {anomalie.priorite.toLowerCase()}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="space-y-4">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* En-tête */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {anomalie.numeroBacklog}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {anomalie.description.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="font-medium">Source: </span>
                          {anomalie.source}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Créée le: </span>
                          {format(
                            new Date(anomalie.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: fr }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Détails */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Identification</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Engin</p>
                            <p className="text-sm">
                              {anomalie.engin?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Site</p>
                            <p className="text-sm">
                              {anomalie.site?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <h4 className="font-semibold mt-6">Dates</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              Date de détection
                            </p>
                            <p className="text-sm">
                              {format(
                                new Date(anomalie.dateDetection),
                                "dd/MM/yyyy",
                                { locale: fr }
                              )}
                            </p>
                          </div>
                        </div>
                        {anomalie.dateExecution && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                Date d'exécution
                              </p>
                              <p className="text-sm">
                                {format(
                                  new Date(anomalie.dateExecution),
                                  "dd/MM/yyyy",
                                  { locale: fr }
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Détails techniques</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Besoin PDR</p>
                          <p className="text-sm">
                            {anomalie.besoinPDR ? "Oui" : "Non"}
                          </p>
                        </div>
                        {anomalie.quantite && (
                          <div>
                            <p className="text-sm font-medium">Quantité</p>
                            <p className="text-sm">{anomalie.quantite}</p>
                          </div>
                        )}
                        {anomalie.reference && (
                          <div>
                            <p className="text-sm font-medium">Référence</p>
                            <p className="text-sm">{anomalie.reference}</p>
                          </div>
                        )}
                        {anomalie.code && (
                          <div>
                            <p className="text-sm font-medium">Code</p>
                            <p className="text-sm">{anomalie.code}</p>
                          </div>
                        )}
                      </div>

                      <h4 className="font-semibold mt-6">Suivi</h4>
                      <div className="space-y-2">
                        {anomalie.numeroBS && (
                          <div>
                            <p className="text-sm font-medium">N° BS</p>
                            <p className="text-sm">{anomalie.numeroBS}</p>
                          </div>
                        )}
                        {anomalie.programmation && (
                          <div>
                            <p className="text-sm font-medium">Programmation</p>
                            <p className="text-sm">{anomalie.programmation}</p>
                          </div>
                        )}
                        {anomalie.equipe && (
                          <div>
                            <p className="text-sm font-medium">Équipe</p>
                            <p className="text-sm">{anomalie.equipe}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description complète */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Description complète</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-line">
                        {anomalie.description}
                      </p>
                    </div>
                  </div>

                  {/* Observations */}
                  {anomalie.observations && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Observations</h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-line">
                          {anomalie.observations}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="historique" className="space-y-4">
              <ScrollArea className="h-[60vh] pr-4">
                {anomalie.historiqueStatutAnomalies &&
                anomalie.historiqueStatutAnomalies.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold">
                      Historique des changements de statut
                    </h4>
                    <div className="space-y-3">
                      {anomalie.historiqueStatutAnomalies.map((historique) => (
                        <div
                          key={historique.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="outline" className="mr-2">
                                {historique.ancienStatut
                                  .replace("_", " ")
                                  .toLowerCase()}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="outline" className="ml-2">
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
                              <p className="font-medium">Commentaire:</p>
                              <p className="text-muted-foreground">
                                {historique.commentaire}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Aucun historique disponible
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Fonctionnalité documents à implémenter
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <AnomalieForm
            initialData={anomalie || undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            mode={mode}
            sites={sitesQuery.data || []}
            engins={enginsQuery.data || []}
            error={
              createAnomalie.error?.message ||
              updateAnomalie.error?.message ||
              undefined
            }
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
