// app/api/lubrifiant/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "lubrifiant";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des lubrifiants
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const lubrifiants = await prisma.lubrifiant.findMany({
      include: {
        typelubrifiant: true,
        _count: {
          select: {
            saisielubrifiant: true,
            lubrifiantParc: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Récupérer les associations avec les parcs pour tous les lubrifiants
    const lubrifiantParcs = await prisma.lubrifiantParc.findMany({
      include: {
        parc: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Grouper les parcs par lubrifiant
    const parcsByLubrifiant = lubrifiantParcs.reduce((acc, lp) => {
      if (!acc[lp.lubrifiantId]) {
        acc[lp.lubrifiantId] = [];
      }
      acc[lp.lubrifiantId].push(lp.parc);
      return acc;
    }, {} as Record<string, { id: string; name: string }[]>);

    // Ajouter les parcs à chaque lubrifiant
    const lubrifiantsWithParcs = lubrifiants.map((lubrifiant) => ({
      ...lubrifiant,
      parcs: parcsByLubrifiant[lubrifiant.id] || [],
    }));

    return NextResponse.json(lubrifiantsWithParcs);
  } catch (error) {
    console.error("Error fetching lubrifiants:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des lubrifiants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la permission de création des lubrifiants
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name, typelubrifiantId, parcIds } = body;

    // Validation basique
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Le nom du lubrifiant est requis" },
        { status: 400 }
      );
    }

    if (!typelubrifiantId || typeof typelubrifiantId !== "string") {
      return NextResponse.json(
        { message: "Le type de lubrifiant est requis" },
        { status: 400 }
      );
    }

    if (!parcIds || !Array.isArray(parcIds) || parcIds.length === 0) {
      return NextResponse.json(
        { message: "Au moins un parc doit être sélectionné" },
        { status: 400 }
      );
    }

    // Vérifier que le type de lubrifiant existe
    const typeLubrifiantExists = await prisma.typelubrifiant.findUnique({
      where: { id: typelubrifiantId },
    });

    if (!typeLubrifiantExists) {
      return NextResponse.json(
        { message: "Le type de lubrifiant spécifié n'existe pas" },
        { status: 400 }
      );
    }

    // Vérifier que tous les parcs existent
    const parcs = await prisma.parc.findMany({
      where: { id: { in: parcIds } },
    });

    if (parcs.length !== parcIds.length) {
      return NextResponse.json(
        { message: "Un ou plusieurs parcs spécifiés n'existent pas" },
        { status: 400 }
      );
    }

    // Créer le lubrifiant et ses associations avec les parcs
    const result = await prisma.$transaction(async (tx) => {
      const lubrifiant = await tx.lubrifiant.create({
        data: {
          name: name.trim(),
          typelubrifiantId,
        },
        include: {
          typelubrifiant: true,
        },
      });

      // Créer les associations avec les parcs
      const lubrifiantParcs = parcIds.map((parcId) => ({
        parcId,
        lubrifiantId: lubrifiant.id,
      }));

      await tx.lubrifiantParc.createMany({
        data: lubrifiantParcs,
      });

      return lubrifiant;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating lubrifiant:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Un lubrifiant avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la création du lubrifiant" },
      { status: 500 }
    );
  }
}
