// app/api/origine-saisies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const origineSaisies = await prisma.origineSaisie.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(origineSaisies);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des origines de saisie:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
