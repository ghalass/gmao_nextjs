import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalPannes = await prisma.panne.count();

    const pannesEnAttente = await prisma.panne.count({
      where: {
        dateExecution: null,
        dateCloture: null,
      },
    });

    const pannesEnCours = await prisma.panne.count({
      where: {
        dateExecution: { not: null },
        dateCloture: null,
      },
    });

    const pannesResolues = await prisma.panne.count({
      where: {
        dateCloture: { not: null },
      },
    });

    const pannesParType = await prisma.typepanne.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    const pannesParUrgence = await prisma.niveauUrgence.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    const pannesParSite = await prisma.site.findMany({
      include: {
        _count: {
          select: {
            engins: {
              where: {
                pannes: {
                  some: {},
                },
              },
            },
          },
        },
      },
    });

    const stats = {
      total: totalPannes,
      enAttente: pannesEnAttente,
      enCours: pannesEnCours,
      resolues: pannesResolues,
      parType: pannesParType.map((type) => ({
        type: type.name,
        count: type._count.pannes,
      })),
      parUrgence: pannesParUrgence.map((urgence) => ({
        urgence: urgence.name,
        count: urgence._count.pannes,
      })),
      parSite: pannesParSite.map((site) => ({
        site: site.name,
        count: site._count.engins,
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
