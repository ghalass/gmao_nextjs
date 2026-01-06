// app/api/type_lubrifiant/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "type_lubrifiant";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des types de lubrifiant
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const typesLubrifiant = await prisma.typelubrifiant.findMany({
      include: {
        _count: {
          select: { lubrifiants: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(typesLubrifiant);
  } catch (error) {
    console.error("Error fetching types lubrifiant:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des types de lubrifiant" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la permission de création des types de lubrifiant
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name } = body;

    // Validation basique
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Le nom du type de lubrifiant est requis" },
        { status: 400 }
      );
    }

    const typeLubrifiant = await prisma.typelubrifiant.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(typeLubrifiant, { status: 201 });
  } catch (error) {
    console.error("Error creating type lubrifiant:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Un type de lubrifiant avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la création du type de lubrifiant" },
      { status: 500 }
    );
  }
}
