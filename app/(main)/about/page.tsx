// app/(main)/about/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Key,
  Database,
  GitBranch,
  Globe,
  Settings,
  Lock,
  CheckCircle,
  ArrowRight,
  Code,
  Cpu,
} from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Shield,
    title: "Gestion des Rôles",
    description:
      "Système complet de gestion des rôles avec hiérarchie et héritage des permissions.",
    entities: ["Role", "UserRole"],
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: Key,
    title: "Contrôle des Permissions",
    description:
      "Permissions granulaires par ressource avec actions spécifiques (lecture, écriture, suppression).",
    entities: ["Permission", "RolePermission"],
    color:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    icon: Users,
    title: "Gestion des Utilisateurs",
    description:
      "Administration centralisée des utilisateurs avec attribution de rôles multiples.",
    entities: ["User"],
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    icon: Database,
    title: "Ressources Système",
    description:
      "Définition des ressources applicatives et de leurs labels pour une gestion cohérente.",
    entities: ["Resource"],
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    icon: Globe,
    title: "Sites Multi-tenants",
    description:
      "Support multi-sites avec activation/désactivation et isolation des données.",
    entities: ["Site"],
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    icon: Lock,
    title: "Sécurité RBAC",
    description:
      "Implémentation du modèle Role-Based Access Control pour une sécurité robuste.",
    entities: ["Toutes les entités"],
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
];

const entityDetails = [
  {
    name: "User",
    description:
      "Représente un utilisateur du système avec ses informations d'authentification et de profil.",
    fields: [
      { name: "email", type: "string", unique: true },
      { name: "name", type: "string" },
      { name: "password", type: "string" },
      { name: "roles", type: "UserRole[]", relation: true },
    ],
    icon: Users,
  },
  {
    name: "Role",
    description:
      "Définit un rôle métier avec ses permissions associées et sa description.",
    fields: [
      { name: "name", type: "string", unique: true },
      { name: "description", type: "string", optional: true },
      { name: "permissions", type: "RolePermission[]", relation: true },
      { name: "users", type: "UserRole[]", relation: true },
    ],
    icon: Shield,
  },
  {
    name: "Permission",
    description:
      "Représente une permission spécifique sur une ressource avec une action définie.",
    fields: [
      { name: "name", type: "string", unique: true },
      { name: "description", type: "string", optional: true },
      { name: "action", type: "string" },
      { name: "resourceId", type: "string", relation: true },
    ],
    icon: Key,
  },
  {
    name: "Resource",
    description:
      "Définit une ressource applicative qui peut être protégée par des permissions.",
    fields: [
      { name: "name", type: "string", unique: true },
      { name: "label", type: "string" },
      { name: "permissions", type: "Permission[]", relation: true },
    ],
    icon: Database,
  },
  {
    name: "UserRole",
    description:
      "Table de liaison entre les utilisateurs et les rôles (relation many-to-many).",
    fields: [
      { name: "userId", type: "string", relation: true },
      { name: "roleId", type: "string", relation: true },
    ],
    icon: GitBranch,
  },
  {
    name: "RolePermission",
    description:
      "Table de liaison entre les rôles et les permissions (relation many-to-many).",
    fields: [
      { name: "roleId", type: "string", relation: true },
      { name: "permissionId", type: "string", relation: true },
    ],
    icon: Settings,
  },
  {
    name: "Site",
    description:
      "Représente un site ou tenant dans une architecture multi-sites.",
    fields: [
      { name: "name", type: "string", unique: true },
      { name: "active", type: "boolean", default: "true" },
    ],
    icon: Globe,
  },
];

const technicalSpecs = [
  {
    category: "Base de données",
    items: [
      "PostgreSQL avec Prisma ORM",
      "Schéma relationnel normalisé",
      "Contraintes d'unicité et clés étrangères",
      "Timestamps automatiques (createdAt, updatedAt)",
    ],
    icon: Database,
  },
  {
    category: "Sécurité",
    items: [
      "Modèle RBAC (Role-Based Access Control)",
      "Permissions granulaires par ressource",
      "Hashage des mots de passe (bcrypt)",
      "Validation des données côté serveur",
    ],
    icon: Lock,
  },
  {
    category: "Architecture",
    items: [
      "Relations many-to-many avec tables de liaison",
      "Support multi-tenants avec entité Site",
      "Système extensible et modulaire",
      "API RESTful avec validation",
    ],
    icon: Cpu,
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        {/* En-tête */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm">
            RBAC Management System
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            À propos de l'application
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Système complet de gestion des accès basé sur les rôles (RBAC)
            permettant un contrôle granulaire des permissions utilisateurs.
          </p>
        </div>

        {/* Architecture Overview */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Cpu className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              Architecture du Système
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div
                    className={`inline-flex items-center justify-center p-3 rounded-lg border ${feature.color} mb-4`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Entités concernées :
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {feature.entities.map((entity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* Détails des Entités */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Database className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              Entités du Modèle de Données
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {entityDetails.map((entity, index) => (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <entity.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-foreground">
                      {entity.name}
                    </CardTitle>
                  </div>
                  <CardDescription>{entity.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Champs :
                    </span>
                    <div className="space-y-1">
                      {entity.fields.map((field, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm"
                        >
                          <code
                            className={`px-2 py-1 rounded text-xs ${
                              field.relation
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {field.name}
                          </code>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {field.type}
                            </span>
                            {field.unique && (
                              <Badge variant="secondary" className="text-xs">
                                UNIQUE
                              </Badge>
                            )}
                            {field.optional && (
                              <Badge variant="outline" className="text-xs">
                                OPTIONAL
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* Spécifications Techniques */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Code className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              Spécifications Techniques
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {technicalSpecs.map((spec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <spec.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg text-foreground">
                      {spec.category}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {spec.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Flux de Permission */}
        <section className="mb-16">
          <Card className="bg-muted/50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl text-foreground">
                <Lock className="h-6 w-6" />
                Flux d'Autorisation RBAC
              </CardTitle>
              <CardDescription className="text-base">
                Comment les permissions sont évaluées dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        Utilisateur
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Se connecte au système
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto md:rotate-90 md:my-4" />

                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Rôles</div>
                      <div className="text-sm text-muted-foreground">
                        Récupération des rôles attribués
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto md:rotate-90 md:my-4" />

                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        Permissions
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Aggrégation des permissions des rôles
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto md:rotate-90 md:my-4" />

                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      4
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Accès</div>
                      <div className="text-sm text-muted-foreground">
                        Vérification des permissions pour l'action
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-lg mb-3 text-foreground">
                    Avantages du système
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Gestion centralisée des accès
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Permissions granulaires
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Maintenance simplifiée
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Audit des accès facilité
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Conformité aux bonnes pratiques
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">
                Prêt à explorer le système ?
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
                Découvrez les fonctionnalités de gestion des utilisateurs, des
                rôles et des permissions selon vos accès dans le système.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Retour au tableau de bord
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
                  onClick={() => router.push("/profile")}
                >
                  Voir mon profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
