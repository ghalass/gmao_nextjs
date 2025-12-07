import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Compter le nombre total de pannes
    const totalPannes = await prisma.panne.count();

    // Compter les pannes par type
    const pannesParType = await prisma.typepanne.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    // Compter les pannes utilisées dans des saisies HIM
    const pannesAvecSaisies = await prisma.panne.count({
      where: {
        saisiehim: {
          some: {},
        },
      },
    });

    // Compter les pannes sans saisies HIM
    const pannesSansSaisies = await prisma.panne.count({
      where: {
        saisiehim: {
          none: {},
        },
      },
    });

    // Obtenir les 5 pannes les plus utilisées
    const pannesPlusUtilisees = await prisma.panne.findMany({
      include: {
        _count: {
          select: {
            saisiehim: true,
          },
        },
        typepanne: true,
      },
      orderBy: {
        saisiehim: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Obtenir les pannes récemment créées
    const pannesRecentees = await prisma.panne.findMany({
      include: {
        typepanne: true,
        _count: {
          select: {
            saisiehim: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const stats = {
      total: totalPannes,
      avecSaisies: pannesAvecSaisies,
      sansSaisies: pannesSansSaisies,
      parType: pannesParType.map((type) => ({
        id: type.id,
        type: type.name,
        count: type._count.pannes,
      })),
      plusUtilisees: pannesPlusUtilisees.map((panne) => ({
        id: panne.id,
        nom: panne.name,
        type: panne.typepanne?.name || "N/A",
        count: panne._count.saisiehim,
      })),
      recentees: pannesRecentees.map((panne) => ({
        id: panne.id,
        nom: panne.name,
        type: panne.typepanne?.name || "N/A",
        createdAt: panne.createdAt,
        saisies: panne._count.saisiehim,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors du chargement des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
