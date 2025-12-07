// app/api/lubrifiants/route.ts
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";
import { NextRequest, NextResponse } from "next/server";

const resource = "lubrifiant";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, resource);
    if (protectionError) return protectionError;

    const lubrifiants = await prisma.lubrifiant.findMany({
      include: {
        typelubrifiant: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(lubrifiants);
  } catch (error) {
    console.error("Erreur lors de la récupération des lubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lubrifiants" },
      { status: 500 }
    );
  }
}
