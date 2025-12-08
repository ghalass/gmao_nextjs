// app/api/anomalies/evolution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const the_resource = "anomalie";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { searchParams } = new URL(request.url);

    const siteId = searchParams.get("siteId");
    const enginId = searchParams.get("enginId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};

    if (siteId && siteId !== "all") where.siteId = siteId;
    if (enginId && enginId !== "all") where.enginId = enginId;

    // Utiliser une période par défaut des 6 derniers mois si aucune date n'est spécifiée
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    where.dateDetection = {
      gte: dateFrom ? new Date(dateFrom) : sixMonthsAgo,
      lte: dateTo ? new Date(dateTo) : now,
    };

    // Récupérer toutes les anomalies avec leurs dates et statuts
    const anomalies = await prisma.anomalie.findMany({
      where,
      select: {
        id: true,
        dateDetection: true,
        statut: true,
        priorite: true,
        source: true,
        dateExecution: true,
        engin: {
          select: {
            name: true,
          },
        },
        site: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { dateDetection: "asc" },
    });

    // Créer un tableau des 6 derniers mois
    const monthsData: Array<{
      mois: string;
      moisComplet: string;
      dateDebut: Date;
      dateFin: Date;
      anomalies: number;
      resolues: number;
      attentePDR: number;
      programmées: number;
      nonProgrammées: number;
      pdrPret: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const moisDebut = startOfMonth(date);
      const moisFin = endOfMonth(date);

      const moisKey = format(date, "MMM", { locale: fr });
      const moisComplet = format(date, "MMMM yyyy", { locale: fr });

      monthsData.push({
        mois: moisKey.charAt(0).toUpperCase() + moisKey.slice(1),
        moisComplet,
        dateDebut: moisDebut,
        dateFin: moisFin,
        anomalies: 0,
        resolues: 0,
        attentePDR: 0,
        programmées: 0,
        nonProgrammées: 0,
        pdrPret: 0,
      });
    }

    // Analyser chaque anomalie et l'assigner au mois correspondant
    anomalies.forEach((anomalie) => {
      const dateDetection = new Date(anomalie.dateDetection);

      // Trouver le mois correspondant
      const monthData = monthsData.find(
        (month) =>
          dateDetection >= month.dateDebut && dateDetection <= month.dateFin
      );

      if (monthData) {
        monthData.anomalies++;

        switch (anomalie.statut) {
          case "EXECUTE":
            monthData.resolues++;
            break;
          case "ATTENTE_PDR":
            monthData.attentePDR++;
            break;
          case "PROGRAMMEE":
            monthData.programmées++;
            break;
          case "NON_PROGRAMMEE":
            monthData.nonProgrammées++;
            break;
          case "PDR_PRET":
            monthData.pdrPret++;
            break;
        }
      }
    });

    // Calculer les métriques globales
    const totalAnomalies = anomalies.length;
    const anomaliesResolues = anomalies.filter(
      (a) => a.statut === "EXECUTE"
    ).length;
    const anomaliesCritiques = anomalies.filter(
      (a) =>
        a.priorite === "ELEVEE" &&
        a.statut !== "EXECUTE" &&
        new Date().getTime() - new Date(a.dateDetection).getTime() >
          7 * 24 * 60 * 60 * 1000
    ).length;

    // Calculer le temps moyen de résolution uniquement pour les anomalies résolues
    let totalTempsResolution = 0;
    let countResoluesAvecDate = 0;

    anomalies
      .filter((a) => a.statut === "EXECUTE" && a.dateExecution)
      .forEach((a) => {
        const detectionDate = new Date(a.dateDetection);
        const executionDate = new Date(a.dateExecution!);
        const temps = executionDate.getTime() - detectionDate.getTime();
        totalTempsResolution += temps;
        countResoluesAvecDate++;
      });

    const tempsMoyenResolution =
      countResoluesAvecDate > 0
        ? Math.round(
            (totalTempsResolution /
              countResoluesAvecDate /
              (1000 * 60 * 60 * 24)) *
              10
          ) / 10
        : 0;

    // Répartition par priorité
    const repartitionPriorite = await prisma.anomalie.groupBy({
      by: ["priorite"],
      where,
      _count: true,
    });

    // Répartition par source
    const repartitionSource = await prisma.anomalie.groupBy({
      by: ["source"],
      where,
      _count: true,
    });

    // Calculer l'évolution (comparaison entre les deux derniers mois)
    let evolution = 0;
    if (monthsData.length >= 2) {
      const dernierMois = monthsData[monthsData.length - 1];
      const avantDernierMois = monthsData[monthsData.length - 2];

      if (avantDernierMois.anomalies > 0) {
        evolution =
          ((dernierMois.anomalies - avantDernierMois.anomalies) /
            avantDernierMois.anomalies) *
          100;
      }
    }

    // Top 5 des engins avec le plus d'anomalies
    const topEngins = await prisma.anomalie.groupBy({
      by: ["enginId"],
      where,
      _count: true,
      orderBy: {
        _count: {
          enginId: "desc",
        },
      },
      take: 5,
    });

    // Récupérer les noms des engins
    const topEnginsAvecNoms = await Promise.all(
      topEngins.map(async (engin) => {
        const enginDetails = await prisma.engin.findUnique({
          where: { id: engin.enginId },
          select: { name: true },
        });
        return {
          enginId: engin.enginId,
          name: enginDetails?.name || "Engin inconnu",
          count: engin._count,
        };
      })
    );

    // Anomalies récentes (dernières 48h)
    const quaranteHuitHeures = new Date();
    quaranteHuitHeures.setHours(quaranteHuitHeures.getHours() - 48);

    const anomaliesRecent = anomalies.filter(
      (a) => new Date(a.dateDetection) >= quaranteHuitHeures
    );

    // Calculer l'évolution pour différentes périodes
    const evolutionPeriodes = {
      // Évolution mensuelle (mois courant vs mois précédent)
      mensuelle:
        monthsData.length >= 2
          ? monthsData[monthsData.length - 1].anomalies -
            monthsData[monthsData.length - 2].anomalies
          : 0,

      // Pourcentage d'évolution mensuelle
      pourcentageMensuel:
        monthsData.length >= 2 &&
        monthsData[monthsData.length - 2].anomalies > 0
          ? ((monthsData[monthsData.length - 1].anomalies -
              monthsData[monthsData.length - 2].anomalies) /
              monthsData[monthsData.length - 2].anomalies) *
            100
          : 0,

      // Évolution trimestrielle (3 derniers mois vs 3 mois précédents)
      trimestrielle: () => {
        if (monthsData.length >= 6) {
          const troisDerniersMois = monthsData
            .slice(-3)
            .reduce((sum, month) => sum + month.anomalies, 0);
          const troisMoisPrecedents = monthsData
            .slice(-6, -3)
            .reduce((sum, month) => sum + month.anomalies, 0);
          return troisMoisPrecedents > 0
            ? ((troisDerniersMois - troisMoisPrecedents) /
                troisMoisPrecedents) *
                100
            : 0;
        }
        return 0;
      },

      // Tendance sur les 6 mois (régression linéaire simple)
      tendanceSixMois: () => {
        if (monthsData.length >= 3) {
          const anomaliesParMois = monthsData.map((month) => month.anomalies);
          const n = anomaliesParMois.length;
          const sumX = anomaliesParMois.reduce((sum, _, i) => sum + i, 0);
          const sumY = anomaliesParMois.reduce((sum, val) => sum + val, 0);
          const sumXY = anomaliesParMois.reduce(
            (sum, val, i) => sum + i * val,
            0
          );
          const sumX2 = anomaliesParMois.reduce((sum, _, i) => sum + i * i, 0);

          const pente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
          return pente > 0 ? "hausse" : pente < 0 ? "baisse" : "stable";
        }
        return "stable";
      },
    };

    return NextResponse.json({
      // Données mensuelles
      evolutionMensuelle: monthsData.map((month) => ({
        mois: month.mois,
        moisComplet: month.moisComplet,
        anomalies: month.anomalies,
        resolues: month.resolues,
        attentePDR: month.attentePDR,
        programmées: month.programmées,
        nonProgrammées: month.nonProgrammées,
        pdrPret: month.pdrPret,
        tauxResolution:
          month.anomalies > 0 ? (month.resolues / month.anomalies) * 100 : 0,
      })),

      // Métriques globales
      totalAnomalies,
      anomaliesResolues,
      anomaliesCritiques,
      anomaliesRecent: anomaliesRecent.length,
      tauxResolution:
        totalAnomalies > 0 ? (anomaliesResolues / totalAnomalies) * 100 : 0,
      tempsMoyenResolution,

      // Répartition
      repartitionPriorite: repartitionPriorite.reduce(
        (acc, item) => ({
          ...acc,
          [item.priorite]: item._count,
        }),
        {}
      ),

      repartitionSource: repartitionSource.reduce(
        (acc, item) => ({
          ...acc,
          [item.source]: item._count,
        }),
        {}
      ),

      repartitionStatut: monthsData.reduce(
        (acc, month) => ({
          anomalies: acc.anomalies + month.anomalies,
          resolues: acc.resolues + month.resolues,
          attentePDR: acc.attentePDR + month.attentePDR,
          programmées: acc.programmées + month.programmées,
          nonProgrammées: acc.nonProgrammées + month.nonProgrammées,
          pdrPret: acc.pdrPret + month.pdrPret,
        }),
        {
          anomalies: 0,
          resolues: 0,
          attentePDR: 0,
          programmées: 0,
          nonProgrammées: 0,
          pdrPret: 0,
        }
      ),

      // Tendances
      evolution,

      // Top engins
      topEngins: topEnginsAvecNoms,

      // Statistiques temporelles
      periode: {
        debut: format(where.dateDetection.gte, "dd/MM/yyyy", { locale: fr }),
        fin: format(where.dateDetection.lte, "dd/MM/yyyy", { locale: fr }),
        jours: Math.round(
          (where.dateDetection.lte.getTime() -
            where.dateDetection.gte.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      },

      // Métriques avancées
      metriques: {
        moyenneMensuelle:
          monthsData.length > 0
            ? monthsData.reduce((sum, month) => sum + month.anomalies, 0) /
              monthsData.length
            : 0,
        meilleurMois:
          monthsData.length > 0
            ? monthsData.reduce((prev, current) => {
                const tauxPrev =
                  prev.anomalies > 0
                    ? (prev.resolues / prev.anomalies) * 100
                    : 0;
                const tauxCurrent =
                  current.anomalies > 0
                    ? (current.resolues / current.anomalies) * 100
                    : 0;
                return tauxPrev > tauxCurrent ? prev : current;
              })
            : null,
        pireMois:
          monthsData.length > 0
            ? monthsData.reduce((prev, current) => {
                const tauxPrev =
                  prev.anomalies > 0
                    ? (prev.resolues / prev.anomalies) * 100
                    : 0;
                const tauxCurrent =
                  current.anomalies > 0
                    ? (current.resolues / current.anomalies) * 100
                    : 0;
                return tauxPrev < tauxCurrent ? prev : current;
              })
            : null,
      },
      //

      evolutionPeriodes: {
        mensuelle: evolutionPeriodes.mensuelle,
        pourcentageMensuel: evolutionPeriodes.pourcentageMensuel,
        pourcentageTrimestriel: evolutionPeriodes.trimestrielle(),
        tendance: evolutionPeriodes.tendanceSixMois(),
      },

      // Ajoutez aussi les totaux pour le mois précédent et courant
      comparaisonMensuelle: {
        moisCourant:
          monthsData.length > 0 ? monthsData[monthsData.length - 1] : null,
        moisPrecedent:
          monthsData.length > 1 ? monthsData[monthsData.length - 2] : null,
        difference: evolutionPeriodes.mensuelle,
        pourcentage: evolutionPeriodes.pourcentageMensuel,
      },
    });
  } catch (error) {
    console.error("Error fetching anomaly evolution:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la récupération de l'évolution des anomalies",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
