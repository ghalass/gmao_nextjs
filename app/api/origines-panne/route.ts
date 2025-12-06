import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const originesPanne = await prisma.originePanne.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(originesPanne);
  } catch (error) {
    console.error("Erreur lors du chargement des origines de panne:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des origines de panne" },
      { status: 500 }
    );
  }
}
