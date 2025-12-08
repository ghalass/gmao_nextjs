// app/api/parcs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parcSchema } from "@/lib/validations/parcSchema";
import { protectReadRoute, protectUpdateRoute } from "@/lib/rbac/middleware";

const the_resource = "parc";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const parcs = await prisma.parc.findMany({
      include: {
        typeparc: true,
        engins: true,
        _count: {
          select: {
            engins: true,
          },
        },
      },
      orderBy: [
        { name: "asc" },
        { typeparc: { name: "asc" } }, // Cela fonctionne dans certaines versions de Prisma
      ],
    });

    return NextResponse.json(parcs);
  } catch (error) {
    console.error("Error fetching parcs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des parcs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();

    const validatedData = await parcSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const existingParc = await prisma.parc.findUnique({
      where: { name: validatedData.name },
    });

    if (existingParc) {
      return NextResponse.json(
        { message: "Un parc avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const parc = await prisma.parc.create({
      data: validatedData,
      include: {
        typeparc: true,
        _count: {
          select: {
            engins: true,
          },
        },
      },
    });

    return NextResponse.json(parc, { status: 201 });
  } catch (error: any) {
    console.error("Error creating parc:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du parc" },
      { status: 500 }
    );
  }
}
