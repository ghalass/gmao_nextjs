// app/api/rapports/pareto-indispo/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parcId, date } = body;

    // Validation des paramètres
    if (!parcId || !date) {
      return NextResponse.json(
        { message: "parcId et date sont obligatoires" },
        { status: 400 }
      );
    }

    const inputDate = new Date(date);
    const year = inputDate.getFullYear();
    const month = inputDate.getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Calcul du nombre d'heures dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    const hoursInMonth = daysInMonth * 24;

    const parc = await prisma.parc.findUnique({
      where: { id: parcId },
      include: {
        engins: {
          where: {
            saisiehrm: {
              some: {
                du: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            saisiehrm: {
              where: {
                du: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!parc) {
      return NextResponse.json({ message: "Parc non trouvé" }, { status: 404 });
    }

    // Calcul du Nho (heures dans le mois * nombre d'engins)
    const nho = hoursInMonth * parc.engins.length;

    // Récupérer toutes les données pour le mois spécifié
    const records = await prisma.saisiehim.findMany({
      where: {
        saisiehrm: {
          enginId: { in: parc.engins.map((e) => e.id) },
          du: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        panneId: true,
        him: true,
        ni: true,
        enginId: true,
        saisiehrm: {
          select: {
            enginId: true,
            du: true,
          },
        },
      },
    });

    // Récupérer les noms et descriptions des pannes
    const panneIds = [...new Set(records.map((r) => r.panneId))];
    const pannes = await prisma.panne.findMany({
      where: { id: { in: panneIds } },
      select: { id: true, name: true, description: true },
    });
    const panneMap = new Map(
      pannes.map((panne) => [
        panne.id,
        {
          name: panne.name,
          description: panne.description,
        },
      ])
    );

    // Organiser les données par panne
    const dataByPanne: Record<
      string,
      {
        himTotal: number;
        niTotal: number;
        engins: Record<string, { him: number; ni: number }>;
      }
    > = {};

    records.forEach((record) => {
      const panneId = record.panneId;
      const enginId = record.enginId || record.saisiehrm.enginId;
      const dateDu = record.saisiehrm.du;

      if (dateDu >= startDate && dateDu <= endDate) {
        if (!dataByPanne[panneId]) {
          dataByPanne[panneId] = {
            himTotal: 0,
            niTotal: 0,
            engins: {},
          };
        }

        dataByPanne[panneId].himTotal += record.him;
        dataByPanne[panneId].niTotal += record.ni;

        if (!dataByPanne[panneId].engins[enginId]) {
          dataByPanne[panneId].engins[enginId] = {
            him: 0,
            ni: 0,
          };
        }

        dataByPanne[panneId].engins[enginId].him += record.him;
        dataByPanne[panneId].engins[enginId].ni += record.ni;
      }
    });

    // Préparer le résultat final
    const result = Object.entries(dataByPanne)
      .map(([panneId, data]) => {
        const panneInfo = panneMap.get(panneId);
        const enginsList = parc.engins
          .filter((engin) => data.engins[engin.id]?.him > 0)
          .map((engin) => ({
            name: engin.name,
            him: data.engins[engin.id].him,
          }))
          .sort((a, b) => b.him - a.him);

        const enginsMtbfList = parc.engins
          .filter((engin) => data.engins[engin.id]?.ni > 0)
          .map((engin) => ({
            name: engin.name,
            ni: data.engins[engin.id].ni,
          }))
          .sort((a, b) => b.ni - a.ni);

        const indispo =
          nho > 0 ? parseFloat(((100 * data.himTotal) / nho).toFixed(2)) : 0;

        return {
          parc: parc.name,
          year: year.toString(),
          month: month.toString(),
          nombe_engin: parc.engins.length,
          panne: panneInfo?.name || "Inconnue",
          panneDescription: panneInfo?.description || "",
          indispo: indispo,
          engins: enginsList,
          engins_mtbf: enginsMtbfList,
        };
      })
      .sort((a, b) => b.indispo - a.indispo);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API pareto-indispo :", error);
    return NextResponse.json(
      {
        message: "Erreur serveur",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
