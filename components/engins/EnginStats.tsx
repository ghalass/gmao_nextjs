// components/engins/EnginStats.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface EnginStatsProps {
  enginId: string;
}

export function EnginStats({ enginId }: EnginStatsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    disponibilite: 98.5,
    mtbf: 450,
    tdm: 2.3,
    anomaliesResolues: 85,
    anomaliesEnCours: 3,
    heuresFonctionnement: 1250,
    dernierIncident: "2024-03-15",
    coutMaintenance: 12500,
    performance: 92,
  });

  useEffect(() => {
    // Simulation de chargement des données
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [enginId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disponibilité
              </CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disponibilite}%</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">+2.5%</span>
              <span className="text-xs text-muted-foreground">
                vs mois dernier
              </span>
            </div>
            <Progress value={stats.disponibilite} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MTBF
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mtbf}h</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">+45h</span>
              <span className="text-xs text-muted-foreground">
                amélioration
              </span>
            </div>
            <Badge variant="outline" className="mt-2">
              Bonne fiabilité
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux de défaillance
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tdm}%</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">-0.8%</span>
              <span className="text-xs text-muted-foreground">réduction</span>
            </div>
            <Badge variant="outline" className="mt-2">
              Dans la cible
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anomalies
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {stats.anomaliesResolues}%
                </div>
                <div className="text-xs text-muted-foreground">Résolues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.anomaliesEnCours}
                </div>
                <div className="text-xs text-muted-foreground">En cours</div>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <Badge variant="outline" className="flex-1 text-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats.anomaliesResolues}%
              </Badge>
              <Badge variant="outline" className="flex-1 text-center">
                <XCircle className="h-3 w-3 mr-1" />
                {stats.anomaliesEnCours}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et détails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance sur 12 mois
            </CardTitle>
            <CardDescription>Évolution des indicateurs clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Graphique de performance</p>
                <p className="text-sm">
                  (Intégration avec bibliothèque de graphiques)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
            <CardDescription>Coûts de maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Maintenance préventive</span>
                  <span className="font-medium">8,200 €</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Maintenance corrective</span>
                  <span className="font-medium">3,800 €</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Pièces détachées</span>
                  <span className="font-medium">500 €</span>
                </div>
                <Progress value={5} className="h-2" />
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold">
                    {stats.coutMaintenance.toLocaleString()} €
                  </span>
                </div>
                <Badge variant="outline" className="mt-2">
                  Budget respecté
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
