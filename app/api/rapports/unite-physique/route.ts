import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpStatusCode } from "axios";
import { log } from "console";

const ONE_DAY = 24 * 60 * 60 * 1000;

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function safeNumber(v: any) {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mois, annee } = body;
    log("API unité-physique - mois:", mois, "année:", annee);

    if (!mois || !annee) {
      return NextResponse.json(
        { message: "Paramètres 'mois' et 'année' obligatoires" },
        { status: 400 }
      );
    }

    const year = parseInt(annee);
    const monthIndex = parseInt(mois) - 1;

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return NextResponse.json(
        { message: "Mois ou année invalide" },
        { status: 400 }
      );
    }

    // Périodes
    const debutMois = new Date(year, monthIndex, 1);
    const finMois = new Date(
      year,
      monthIndex,
      daysInMonth(year, monthIndex),
      23,
      59,
      59,
      999
    );
    const debutAnnee = new Date(year, 0, 1);
    const finAnnee = finMois; // Du 1er janvier au dernier jour du mois

    // Récupérer tous les sites actifs
    const sites = await prisma.site.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Récupérer tous les types de parcs avec leurs parcs
    const typeParcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            engins: {
              where: { active: true },
              select: {
                id: true,
                name: true,
                site: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // Fonction pour agréger HRM/HIM pour un ensemble d'engins
    async function aggregateForEngins(
      enginIds: string[],
      start: Date,
      end: Date,
      isMensuel: boolean
    ) {
      if (!enginIds.length) return { totalHRM: 0, totalHIM: 0 };

      // Pour HRM (toujours le même calcul)
      const hrmAgg = await prisma.saisiehrm.aggregate({
        _sum: { hrm: true },
        where: {
          du: { gte: start, lte: end },
          enginId: { in: enginIds },
        },
      });

      // CORRECTION : Pour HIM, utiliser la même logique pour mensuel et annuel
      // HIM est lié à saisiehrm via la relation
      const himAgg = await prisma.saisiehim.aggregate({
        _sum: { him: true },
        where: {
          // Utiliser le du (date) de saisiehrm pour le filtrage temporel
          saisiehrm: {
            du: { gte: start, lte: end },
            enginId: { in: enginIds },
          },
        },
      });

      return {
        totalHRM: safeNumber(hrmAgg._sum.hrm),
        totalHIM: safeNumber(himAgg._sum.him),
      };
    }
    const result = [];

    for (const tp of typeParcs) {
      const typeparcObj: any = {
        typeParcId: tp.id,
        typeParcName: tp.name,
        parcs: [],
        totalTypeParc: {
          nbreEngins: 0,
          aggregatesMois: {
            totalHRM: 0,
            totalHIM: 0,
          },
          aggregatesAnnee: {
            totalHRM: 0,
            totalHIM: 0,
          },
        },
      };

      // Pour chaque parc
      for (const parc of tp.parcs) {
        const enginIds = parc.engins.map((e: any) => e.id);
        if (!enginIds.length) continue;

        // Calcul par site pour ce parc
        const siteStatsMois: Record<
          string,
          { hrm: number; him: number; nbre: number }
        > = {};
        const siteStatsAnnee: Record<
          string,
          { hrm: number; him: number; nbre: number }
        > = {};

        // Initialiser tous les sites
        sites.forEach((site) => {
          siteStatsMois[site.name] = { hrm: 0, him: 0, nbre: 0 };
          siteStatsAnnee[site.name] = { hrm: 0, him: 0, nbre: 0 };
        });

        // Compter les engins par site
        parc.engins.forEach((engin: any) => {
          const siteName = engin.site.name;
          if (siteStatsMois[siteName]) {
            siteStatsMois[siteName].nbre++;
            siteStatsAnnee[siteName].nbre++;
          }
        });

        // Récupérer les agrégats globaux pour ce parc
        const [aggM, aggA] = await Promise.all([
          aggregateForEngins(enginIds, debutMois, finMois, true),
          aggregateForEngins(enginIds, debutAnnee, finAnnee, false),
        ]);

        // Pour obtenir les statistiques par site
        for (const site of sites) {
          const enginsDuSite = parc.engins.filter(
            (e: any) => e.site.name === site.name
          );
          const siteEnginIds = enginsDuSite.map((e: any) => e.id);

          if (siteEnginIds.length > 0) {
            // Utiliser la même logique pour mensuel et annuel
            const [siteAggM, siteAggA] = await Promise.all([
              aggregateForEngins(siteEnginIds, debutMois, finMois, true),
              aggregateForEngins(siteEnginIds, debutAnnee, finAnnee, false),
            ]);

            siteStatsMois[site.name].hrm = siteAggM.totalHRM;
            siteStatsMois[site.name].him = siteAggM.totalHIM;

            siteStatsAnnee[site.name].hrm = siteAggA.totalHRM;
            siteStatsAnnee[site.name].him = siteAggA.totalHIM;
          }
        }

        const parcData = {
          parcId: parc.id,
          parcName: parc.name,
          nbreEngins: enginIds.length,
          siteStatsMois,
          siteStatsAnnee,
          aggregatesMois: {
            totalHRM: aggM.totalHRM,
            totalHIM: aggM.totalHIM,
          },
          aggregatesAnnee: {
            totalHRM: aggA.totalHRM,
            totalHIM: aggA.totalHIM,
          },
        };

        typeparcObj.parcs.push(parcData);

        // Mettre à jour les totaux du type de parc
        typeparcObj.totalTypeParc.nbreEngins += enginIds.length;
        typeparcObj.totalTypeParc.aggregatesMois.totalHRM += aggM.totalHRM;
        typeparcObj.totalTypeParc.aggregatesMois.totalHIM += aggM.totalHIM;
        typeparcObj.totalTypeParc.aggregatesAnnee.totalHRM += aggA.totalHRM;
        typeparcObj.totalTypeParc.aggregatesAnnee.totalHIM += aggA.totalHIM;
      }

      result.push(typeparcObj);
    }

    // Retourner avec les sites pour le frontend
    return NextResponse.json(
      {
        data: result,
        sites: sites.map((s) => s.name),
      },
      { status: HttpStatusCode.Ok }
    );
  } catch (error: any) {
    console.error("Erreur API unité-physique :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
