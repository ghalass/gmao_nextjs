// app/(main)/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  Code,
  Cpu,
  Mail,
  Globe,
  Wrench,
  Zap,
  Shield,
  Database,
  Users,
  Settings,
  BarChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            Tableau de bord GMAO
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Application de gestion de maintenance assistée par ordinateur pour
            l&apos;optimisation des équipements industriels
          </p>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Carte principale - À propos */}
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />À propos de
                l&apos;application
              </CardTitle>
              <CardDescription>
                Gestion complète de la maintenance industrielle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cette application GMAO (Gestion de Maintenance Assistée par
                Ordinateur) est conçue pour optimiser la gestion des équipements
                industriels, suivre les interventions de maintenance, et
                améliorer la disponibilité des machines.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-foreground">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Fonctionnalités principales
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Suivi des équipements (engins)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Gestion des interventions HRM/HIM
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Traçabilité des consommations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Suivi des anomalies
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-foreground">
                    <BarChart className="h-4 w-4 text-green-500" />
                    Avantages de la GMAO
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          Traçabilité complète
                        </span>
                        <p className="text-muted-foreground">
                          Historique détaillé des interventions, consommations
                          et heures de fonctionnement
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          Décision basée sur les données
                        </span>
                        <p className="text-muted-foreground">
                          Indicateurs de performance (KPI) et reporting pour une
                          prise de décision éclairée
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          Gestion proactive
                        </span>
                        <p className="text-muted-foreground">
                          Anticipation des défaillances et planification
                          optimale des ressources humaines
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          Optimisation de la disponibilité
                        </span>
                        <p className="text-muted-foreground">
                          Amélioration du TRS (Taux de Rendement Synthétique)
                          grâce à une maintenance préventive planifiée
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          Réduction des coûts de maintenance
                        </span>
                        <p className="text-muted-foreground">
                          Diminution des pannes critiques et optimisation des
                          stocks de pièces détachées
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          Conformité et sécurité
                        </span>
                        <p className="text-muted-foreground">
                          Respect des normes réglementaires et amélioration de
                          la sécurité des équipements
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carte développeur */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Développeur
              </CardTitle>
              <CardDescription>Créateur de l&apos;application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                  <Cpu className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground">GHALASS</h3>
                <p className="text-sm text-muted-foreground">
                  Electromechanical Engineer & Developer
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Freelancer & Hobby Developer
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href="mailto:msghalas@gmail.com"
                    className="text-primary hover:underline"
                  >
                    msghalas@gmail.com
                  </a>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href="https://www.ghalass.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://www.ghalass.com
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <Badge variant="outline" className="mr-2 mb-2">
                  Electromechanical Systems
                </Badge>
                <Badge variant="outline" className="mr-2 mb-2">
                  Automation
                </Badge>
                <Badge variant="outline" className="mr-2 mb-2">
                  Embedded Systems
                </Badge>
                <Badge variant="outline" className="mr-2 mb-2">
                  IoT
                </Badge>
                <Badge variant="outline" className="mr-2 mb-2">
                  Robotics
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section statistiques/features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gestion
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    Multi-sites
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Suivi
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    Anomalies
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sécurité
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">RBAC</h3>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Base de données
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    PostgreSQL
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carte bio */}
        <Card className="border shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Bio du développeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Passionné d&apos;
                <strong className="text-foreground">
                  ingénierie électromécanique
                </strong>{" "}
                avec un don pour l&apos;innovation et la résolution de
                problèmes.
              </p>

              <p>
                En tant que{" "}
                <strong className="text-foreground">Freelancer</strong>,
                j&apos;apporte une expertise technique à divers projets,
                combinant l&apos;ingénierie mécanique et électrique pour fournir
                des solutions efficaces et innovantes.
              </p>

              <p>
                Quand je ne fais pas d&apos;ingénierie, je suis un{" "}
                <strong className="text-foreground">Hobby Developer</strong>,
                bidouillant avec le code, l&apos;automatisation et les systèmes
                embarqués – explorant toujours de nouvelles façons de fusionner
                matériel et logiciel.
              </p>

              <p>
                Que ce soit la robotique, l&apos;IoT ou des projets DIY
                personnalisés (Do It Yourself, « Fais-le toi-même »),
                j&apos;aime transformer les idées en réalité.
              </p>

              <p>
                Motivé par la curiosité et une approche pratique, je prospère
                sur les défis qui repoussent les limites de la technologie.
              </p>

              <p className="font-medium text-foreground">
                Créons ensemble quelque chose d&apos;incroyable !
              </p>

              <Separator />

              <div className="pt-2">
                <p className="font-medium text-foreground mb-2">
                  Compétences techniques :
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Electromechanical Systems</Badge>
                  <Badge variant="secondary">Automation</Badge>
                  <Badge variant="secondary">Embedded Systems</Badge>
                  <Badge variant="secondary">CAD</Badge>
                  <Badge variant="secondary">Python/C++</Badge>
                  <Badge variant="secondary">JavaScript</Badge>
                  <Badge variant="secondary">IoT</Badge>
                  <Badge variant="secondary">Robotics</Badge>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm italic">
                  Toujours en apprentissage, toujours en création.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer / Call to action */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Application en production • Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
