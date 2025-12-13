// app/api/pannes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "console";

export async function GET(request: NextRequest) {
  try {
    const panne = await prisma.panne.findFirst({
      where: {
        name: "A1",
        parcs: {
          some: { name: "789D" },
        },
      },
    });

    return NextResponse.json(panne);
  } catch (error) {
    console.error("Erreur lors du chargement de test:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de test" },
      { status: 500 }
    );
  }
}
