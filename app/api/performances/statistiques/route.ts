// app/api/performances/statistiques/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enginId = searchParams.get("enginId");
    const siteId = searchParams.get("siteId");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    const where: any = {};

    if (enginId) where.enginId = enginId;
    if (siteId) where.siteId = siteId;
    if (dateDebut || dateFin) {
      where.du = {};
      if (dateDebut) where.du.gte = new Date(dateDebut);
      if (dateFin) where.du.lte = new Date(dateFin);
    }

    // Récupérer les données pour les statistiques
    const performances = await prisma.saisiehrm.findMany({
      where,
      include: {
        engin: true,
        site: true,
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: true,
              },
            },
            saisielubrifiant: {
              include: {
                lubrifiant: true,
              },
            },
          },
        },
      },
      orderBy: {
        du: "asc",
      },
    });

    // Calculer les statistiques
    const statistiques = {
      totalSaisies: performances.length,
      totalHRM: performances.reduce((sum, perf) => sum + perf.hrm, 0),
      totalHIM: performances.reduce(
        (sum, perf) =>
          sum + perf.saisiehim.reduce((himSum, him) => himSum + him.him, 0),
        0
      ),
      totalPannes: performances.reduce(
        (sum, perf) => sum + perf.saisiehim.length,
        0
      ),
      totalLubrifiants: performances.reduce(
        (sum, perf) =>
          sum +
          perf.saisiehim.reduce(
            (lubSum, him) => lubSum + him.saisielubrifiant.length,
            0
          ),
        0
      ),
      parEngin: {} as any,
      parSite: {} as any,
      parMois: {} as any,
    };

    // Statistiques par engin
    performances.forEach((perf) => {
      const enginName = perf.engin.name;

      if (!statistiques.parEngin[enginName]) {
        statistiques.parEngin[enginName] = {
          totalHRM: 0,
          totalHIM: 0,
          totalPannes: 0,
          totalLubrifiants: 0,
        };
      }

      statistiques.parEngin[enginName].totalHRM += perf.hrm;
      statistiques.parEngin[enginName].totalHIM += perf.saisiehim.reduce(
        (sum, him) => sum + him.him,
        0
      );
      statistiques.parEngin[enginName].totalPannes += perf.saisiehim.length;
      statistiques.parEngin[enginName].totalLubrifiants +=
        perf.saisiehim.reduce(
          (sum, him) => sum + him.saisielubrifiant.length,
          0
        );
    });

    // Statistiques par site
    performances.forEach((perf) => {
      const siteName = perf.site.name;

      if (!statistiques.parSite[siteName]) {
        statistiques.parSite[siteName] = {
          totalHRM: 0,
          totalHIM: 0,
          totalPannes: 0,
          totalLubrifiants: 0,
        };
      }

      statistiques.parSite[siteName].totalHRM += perf.hrm;
      statistiques.parSite[siteName].totalHIM += perf.saisiehim.reduce(
        (sum, him) => sum + him.him,
        0
      );
      statistiques.parSite[siteName].totalPannes += perf.saisiehim.length;
      statistiques.parSite[siteName].totalLubrifiants += perf.saisiehim.reduce(
        (sum, him) => sum + him.saisielubrifiant.length,
        0
      );
    });

    // Statistiques par mois
    performances.forEach((perf) => {
      const mois = `${perf.du.getFullYear()}-${(perf.du.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (!statistiques.parMois[mois]) {
        statistiques.parMois[mois] = {
          totalHRM: 0,
          totalHIM: 0,
          totalPannes: 0,
          totalLubrifiants: 0,
        };
      }

      statistiques.parMois[mois].totalHRM += perf.hrm;
      statistiques.parMois[mois].totalHIM += perf.saisiehim.reduce(
        (sum, him) => sum + him.him,
        0
      );
      statistiques.parMois[mois].totalPannes += perf.saisiehim.length;
      statistiques.parMois[mois].totalLubrifiants += perf.saisiehim.reduce(
        (sum, him) => sum + him.saisielubrifiant.length,
        0
      );
    });

    return NextResponse.json(statistiques);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
