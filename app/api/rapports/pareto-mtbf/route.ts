// app/api/rapports/pareto-indispo/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parcId, date } = body;

    // Validation des entrées
    if (!parcId || !date) {
      return NextResponse.json(
        { error: "parcId et date sont obligatoires" },
        { status: 400 }
      );
    }

    const inputDate = new Date(date);
    const year = inputDate.getFullYear();

    // Récupération du parc avec tous ses engins (actifs et inactifs)
    const parc = await prisma.parc.findUnique({
      where: { id: parcId },
      include: {
        engins: {
          select: {
            id: true,
            active: true,
          },
        },
      },
    });

    if (!parc) {
      return NextResponse.json({ error: "Parc non trouvé" }, { status: 404 });
    }

    // Récupérer l'objectif MTBF pour le parc et l'année
    const objectif = await prisma.objectif.findFirst({
      where: {
        AND: [{ annee: year }, { parcId: parcId }],
      },
      select: {
        mtbf: true,
      },
    });

    // Noms des mois en français
    const monthNames = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];

    // Préparer le résultat de base pour tous les mois
    const results = monthNames.map((monthName, index) => ({
      mois: monthName.slice(0, 3),
      mtbf: null as number | null,
      engins_actifs: 0,
      objectif_mtbf: objectif?.mtbf ?? null,
    }));

    // Filtrer seulement les engins actifs
    const activeEnginIds = parc.engins
      .filter((engin) => engin.active)
      .map((engin) => engin.id);

    // Si aucun engin actif, retourner le résultat vide
    if (activeEnginIds.length === 0) {
      return NextResponse.json({ data: results }, { status: 200 });
    }

    // Traitement pour chaque mois de l'année
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      // Récupération des HRM (somme des hrm)
      const hrmResult = await prisma.saisiehrm.aggregate({
        where: {
          enginId: { in: activeEnginIds },
          du: { gte: monthStart, lte: monthEnd },
        },
        _sum: { hrm: true },
      });
      const hrm = hrmResult._sum?.hrm || 0;

      // Récupération des NI (somme des ni)
      const niResult = await prisma.saisiehim.aggregate({
        where: {
          saisiehrm: {
            enginId: { in: activeEnginIds },
            du: { gte: monthStart, lte: monthEnd },
          },
        },
        _sum: { ni: true },
      });
      const ni = niResult._sum?.ni || 0;

      // Calcul du MTBF (avec 2 décimales)
      const mtbf = ni > 0 ? parseFloat((hrm / ni).toFixed(2)) : 0;

      // Mise à jour du résultat pour le mois courant
      results[month] = {
        ...results[month],
        mtbf: mtbf,
        engins_actifs: activeEnginIds.length,
      };
    }

    return NextResponse.json({ data: results }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur dans getParetoMtbfParc:", error);
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
