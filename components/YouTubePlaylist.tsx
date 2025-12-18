"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";

export default function YouTubePlaylist() {
  // États
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Liste des vidéos de votre playlist
  const videos = [
    {
      id: "syaH7yQZeo4",
      title: "GMAO-Pro 01 - Création et activation d'un nouveau de compte",
    },
    {
      id: "ymKXp9febe0",
      title: "GMAO-Pro 02 - Gestion des comptes utilisateurs",
    },
    {
      id: "gRN6ioMUE3U",
      title: "GMAO-Pro 03 - Gestion des rôles et permissions Partie 1/2",
    },
    {
      id: "2Hbq8XbSUJo",
      title: "GMAO-Pro 04 - Gestion des rôles et permissions Partie 2/2",
    },
    {
      id: "HdjgMpVSXS8",
      title:
        "GMAO-Pro 05 - Gestion des engins (équipements), les sites et les pannes",
    },
    {
      id: "yidj0hv5RQE",
      title: "GMAO-Pro 06 - Saisie des données journalières des engins",
    },
    {
      id: "RNYSn48PmME",
      title: "GMAO-Pro 07 - Générer le rapport d'unité physique",
    },
    {
      id: "FimknIm7lZc",
      title: "GMAO-Pro 08 - Générer le rapport d'analyse de l'indisponibilité",
    },
    {
      id: "Y38CvKAa-_s",
      title: "GMAO-Pro 09 - Générer le rapport d'État Général des Engins",
    },
    {
      id: "m0_dDN6Ax2M",
      title: "GMAO Pro 10 - Gestion des anomalies backlogs",
    },
    {
      id: "ZdWX7hafkRM",
      title: "GMAO Pro 11 - Générer le rapport mouvement des organes",
    },
    {
      id: "_rpo4AnZZwI",
      title: "GMAO Pro 12 - Saisie des mouvements organes",
    },
  ];

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Playlist YouTube d'explication
          </h1>
          <p className="text-muted-foreground mt-2">
            Découvrez comment utiliser notre application étape par étape
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lecteur principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-background">
                <iframe
                  key={currentVideo.id}
                  src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={currentVideo.title}
                />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {currentVideo.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Vidéo {currentVideoIndex + 1} sur {videos.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Tutoriel
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://www.youtube.com/watch?v=${currentVideo.id}`,
                        "_blank"
                      )
                    }
                  >
                    Voir sur YouTube
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contrôles de navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentVideoIndex((prev) =>
                    prev === 0 ? videos.length - 1 : prev - 1
                  )
                }
                disabled={videos.length <= 1}
              >
                ← Précédent
              </Button>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Lecture en cours
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setCurrentVideoIndex((prev) =>
                    prev === videos.length - 1 ? 0 : prev + 1
                  )
                }
                disabled={videos.length <= 1}
              >
                Suivant →
              </Button>
            </div>
          </div>

          {/* Liste des vidéos */}
          <div className="space-y-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Playlist
                  </h3>
                  <Badge variant="secondary">{videos.length} vidéos</Badge>
                </div>

                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {videos.map((video, index) => (
                      <Card
                        key={video.id}
                        className={`cursor-pointer transition-all border-2 hover:border-primary/50 ${
                          index === currentVideoIndex
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        }`}
                        onClick={() => setCurrentVideoIndex(index)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Miniature avec overlay */}
                            <div className="relative shrink-0 group">
                              <div className="w-24 h-14 bg-muted rounded-lg overflow-hidden shadow-sm">
                                <img
                                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                  alt={video.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>

                              {/* Badge numéro */}
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                                {index + 1}
                              </div>

                              {/* Overlay de lecture */}
                              {index === currentVideoIndex && (
                                <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                    <div className="w-0 h-0 border-t-3 border-b-3 border-l-4 border-transparent border-l-white ml-0.5" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-medium text-sm line-clamp-2 ${
                                  index === currentVideoIndex
                                    ? "text-primary font-semibold"
                                    : "text-foreground"
                                }`}
                              >
                                {video.title}
                              </h4>
                            </div>

                            {/* Indicateur de lecture actuelle */}
                            {index === currentVideoIndex && (
                              <div className="shrink-0">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                  <span className="text-[10px] font-medium text-primary">
                                    En cours
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Bouton playlist complète */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        "https://www.youtube.com/playlist?list=PLQxVgc4_wyj68w_qYI39NAeZo8Gi8MF0D",
                        "_blank"
                      )
                    }
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                    Voir la playlist complète sur YouTube
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
