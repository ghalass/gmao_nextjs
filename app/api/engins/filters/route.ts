// app/api/engins/filters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "engin";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Récupérer tous les typesparc avec leurs parcs et engins
    const typeparcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            engins: {
              include: {
                site: true,
              },
              where: {
                active: true, // Seulement les engins actifs
              },
              orderBy: {
                name: "asc",
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Structure hiérarchique
    const hierarchicalData = typeparcs.map((typeparc) => ({
      id: typeparc.id,
      name: typeparc.name,
      parcs: typeparc.parcs.map((parc) => ({
        id: parc.id,
        name: parc.name,
        engins: parc.engins.map((engin) => ({
          id: engin.id,
          name: engin.name,
          site: engin.site,
          initialHeureChassis: engin.initialHeureChassis,
        })),
      })),
    }));

    return NextResponse.json(hierarchicalData);
  } catch (error) {
    console.error("Error fetching hierarchical engins:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des données hiérarchiques" },
      { status: 500 }
    );
  }
}
