// app/api/typeparcs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as yup from "yup";

// Schéma de validation Yup
const typeparcSchema = yup.object().shape({
  name: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .matches(
      /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
      "Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores"
    ),
});

export async function GET() {
  try {
    const typeparcs = await prisma.typeparc.findMany({
      include: { parcs: true },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(typeparcs);
  } catch (error) {
    console.error("Error fetching typeparcs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de parcs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation avec Yup
    let validatedData;
    try {
      validatedData = await typeparcSchema.validate(body, {
        abortEarly: false,
      });
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        return NextResponse.json(
          {
            error: "Données invalides",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Vérifier si le nom existe déjà
    const existingTypeparc = await prisma.typeparc.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTypeparc) {
      return NextResponse.json(
        { error: "Un type de parc avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const typeparc = await prisma.typeparc.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            parcs: true,
          },
        },
      },
    });

    return NextResponse.json(typeparc, { status: 201 });
  } catch (error) {
    console.error("Error creating typeparc:", error);

    if (error instanceof yup.ValidationError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du type de parc" },
      { status: 500 }
    );
  }
}
