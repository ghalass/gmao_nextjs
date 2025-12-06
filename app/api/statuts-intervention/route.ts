import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const statutsIntervention = await prisma.statutIntervention.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(statutsIntervention);
  } catch (error) {
    console.error(
      "Erreur lors du chargement des statuts d'intervention:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors du chargement des statuts d'intervention" },
      { status: 500 }
    );
  }
}
