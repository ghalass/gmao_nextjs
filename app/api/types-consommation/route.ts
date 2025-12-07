// app/api/types-consommation/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const typesConsommation = await prisma.typeconsommationlub.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(typesConsommation);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des types de consommation:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de consommation" },
      { status: 500 }
    );
  }
}
