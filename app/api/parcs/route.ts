// app/api/parcs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parcSchema } from "@/lib/validations/parcSchema";

export async function GET() {
  try {
    const parcs = await prisma.parc.findMany({
      include: {
        typeparc: true,
        engins: true,
      },
      orderBy: {
        name: "asc",
      },
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
        { error: "Un parc avec ce nom existe déjà" },
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
