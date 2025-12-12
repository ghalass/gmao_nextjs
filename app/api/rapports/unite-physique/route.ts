// app/api/rapports/unite-physique/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ message: "Date requise" }, { status: 400 });
    }

    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const firstDayOfNextMonth = new Date(year, month, 1);
    const firstDayOfYear = new Date(year, 0, 1);
    const firstDayOfNextYear = new Date(year + 1, 0, 1);

    // Récupérer tous les sites actifs
    const sites = await prisma.site.findMany({
      where: { active: true },
      select: { id: true, name: true },
    });

    // Récupérer tous les types de parcs avec leurs parcs
    const typeParcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            engins: {
              where: { active: true },
              include: {
                site: true,
                // HRM pour le mois sélectionné
                saisiehrm: {
                  where: {
                    du: {
                      gte: firstDayOfMonth,
                      lt: firstDayOfNextMonth,
                    },
                  },
                  include: {
                    saisiehim: true,
                  },
                },
                // HIM pour l'année sélectionnée
                saisiehim: {
                  where: {
                    createdAt: {
                      gte: firstDayOfYear,
                      lt: firstDayOfNextYear,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = typeParcs.map((typeParc) => {
      const parcsData = typeParc.parcs.map((parc) => {
        // Initialiser les statistiques par site
        const siteStats: Record<
          string,
          { hrm: number; him: number; nbre: number }
        > = {};

        sites.forEach((site) => {
          siteStats[site.name] = { hrm: 0, him: 0, nbre: 0 };
        });

        // Pour chaque engin du parc
        parc.engins.forEach((engin) => {
          const siteName = engin.site.name;

          // Calculer HRM mensuel
          const hrmMensuel = engin.saisiehrm.reduce((sum, saisie) => {
            return sum + (saisie?.hrm || 0);
          }, 0);

          // Calculer HIM mensuel (depuis saisiehim liée à saisiehrm)
          let himMensuel = 0;
          engin.saisiehrm.forEach((saisie) => {
            if (saisie?.saisiehim && saisie.saisiehim.length > 0) {
              himMensuel += saisie.saisiehim.reduce((sum, himItem) => {
                return sum + (himItem?.him || 0);
              }, 0);
            }
          });

          // Calculer HIM annuel
          const himAnnuel = engin.saisiehim.reduce((sum, saisie) => {
            return sum + (saisie?.him || 0);
          }, 0);

          // Mettre à jour les stats du site
          const currentStats = siteStats[siteName] || {
            hrm: 0,
            him: 0,
            nbre: 0,
          };
          siteStats[siteName] = {
            hrm: currentStats.hrm + hrmMensuel,
            him: currentStats.him + himMensuel,
            nbre: currentStats.nbre + 1,
          };
        });

        return {
          parcName: parc.name,
          siteStats,
        };
      });

      // Calculer les totaux pour le type de parc
      let totalHRMMensuel = 0;
      let totalHIMMensuel = 0;
      let totalHIMAnnuel = 0;

      typeParc.parcs.forEach((parc) => {
        parc.engins.forEach((engin) => {
          // HRM mensuel
          engin.saisiehrm.forEach((saisie) => {
            totalHRMMensuel += saisie?.hrm || 0;

            // HIM mensuel (depuis saisiehim liée)
            if (saisie?.saisiehim) {
              saisie.saisiehim.forEach((himItem) => {
                totalHIMMensuel += himItem?.him || 0;
              });
            }
          });

          // HIM annuel
          engin.saisiehim.forEach((saisie) => {
            totalHIMAnnuel += saisie?.him || 0;
          });
        });
      });

      return {
        typeParcName: typeParc.name,
        parcs: parcsData,
        totalTypeParc: {
          mensuel: {
            totalHRM: totalHRMMensuel,
            totalHIM: totalHIMMensuel,
          },
          annuel: {
            // Pour HRM annuel, on multiplie le mensuel par 12 (estimation)
            totalHRM: totalHRMMensuel * 12,
            totalHIM: totalHIMAnnuel,
          },
        },
      };
    });

    // Filtrer les types de parcs qui ont des données
    const filteredResult = result.filter(
      (item) =>
        item.parcs.some((parc) =>
          Object.values(parc.siteStats).some(
            (stat) => stat.hrm > 0 || stat.him > 0 || stat.nbre > 0
          )
        ) ||
        item.totalTypeParc.mensuel.totalHRM > 0 ||
        item.totalTypeParc.mensuel.totalHIM > 0
    );

    return NextResponse.json(filteredResult);
  } catch (error) {
    console.error("Erreur génération rapport Unité Physique:", error);
    return NextResponse.json(
      {
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
