import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const niveauxUrgence = await prisma.niveauUrgence.findMany({
      orderBy: { level: "asc" },
    });

    return NextResponse.json(niveauxUrgence);
  } catch (error) {
    console.error("Erreur lors du chargement des niveaux d'urgence:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des niveaux d'urgence" },
      { status: 500 }
    );
  }
}
