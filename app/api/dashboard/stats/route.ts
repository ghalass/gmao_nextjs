// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalRoles, totalPermissions, activeSites] =
      await Promise.all([
        prisma.user.count(),
        prisma.role.count(),
        prisma.permission.count(),
        prisma.site.count({ where: { active: true } }),
      ]);

    return NextResponse.json({
      totalUsers,
      totalRoles,
      totalPermissions,
      activeSites,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
