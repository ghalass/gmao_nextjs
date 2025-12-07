// app/api/lubrifiants/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
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
