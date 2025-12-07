// app/api/types-consommation/route.ts
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";
import { NextRequest, NextResponse } from "next/server";

const resource = "typeconsommation_lub";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, resource);
    if (protectionError) return protectionError;

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
