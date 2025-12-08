// app/api/saisiehrm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "saisiehrm";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const saisiehrm = await prisma.saisiehrm.findMany({
      include: {
        engin: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: true,
              },
            },
          },
        },
      },
      orderBy: {
        du: "desc",
      },
    });

    return NextResponse.json(saisiehrm);
  } catch (error) {
    console.error("Error fetching saisiehrm:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des saisies HRM" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { du, hrm, enginId, siteId } = body;

    // Validation
    if (!du || !hrm || !enginId || !siteId) {
      return NextResponse.json(
        { message: "Tous les champs sont requis (du, hrm, enginId, siteId)" },
        { status: 400 }
      );
    }

    const saisiehrm = await prisma.saisiehrm.create({
      data: {
        du: new Date(du),
        hrm: parseFloat(hrm),
        enginId,
        siteId,
      },
      include: {
        engin: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(saisiehrm, { status: 201 });
  } catch (error) {
    console.error("Error creating saisiehrm:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Une saisie HRM existe déjà pour cet engin à cette date" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la création de la saisie HRM" },
      { status: 500 }
    );
  }
}
