import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pieces = await prisma.piece.findMany({
      include: {
        categoriePiece: true,
      },
      orderBy: { designation: "asc" },
    });

    return NextResponse.json(pieces);
  } catch (error) {
    console.error("Erreur lors du chargement des pièces:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des pièces" },
      { status: 500 }
    );
  }
}
