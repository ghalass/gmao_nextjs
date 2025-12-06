// app/api/origine-pannes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const originePanne = await prisma.originePanne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    if (!originePanne) {
      return NextResponse.json(
        { error: "Origine de panne non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(originePanne);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'origine de panne:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier si l'origine de panne existe
    const existingOriginePanne = await prisma.originePanne.findUnique({
      where: { id },
    });

    if (!existingOriginePanne) {
      return NextResponse.json(
        { error: "Origine de panne non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si une autre origine de panne a déjà ce nom
    const duplicateOriginePanne = await prisma.originePanne.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (duplicateOriginePanne) {
      return NextResponse.json(
        { error: "Une origine de panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const originePanne = await prisma.originePanne.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    return NextResponse.json(originePanne);
  } catch (error) {
    console.error(
      "Erreur lors de la modification de l'origine de panne:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Vérifier si l'origine de panne existe
    const existingOriginePanne = await prisma.originePanne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    if (!existingOriginePanne) {
      return NextResponse.json(
        { error: "Origine de panne non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des dépendances
    if (existingOriginePanne._count.pannes > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cette origine de panne car elle est utilisée par des pannes",
          details: {
            pannes: existingOriginePanne._count.pannes,
          },
        },
        { status: 409 }
      );
    }

    await prisma.originePanne.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'origine de panne:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
