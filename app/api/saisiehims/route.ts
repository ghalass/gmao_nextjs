// app/api/saisiehims/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "saisiehrm";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filtres
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    // Filtre de recherche
    if (search) {
      where.OR = [
        { engin: { name: { contains: search, mode: "insensitive" } } },
        { site: { name: { contains: search, mode: "insensitive" } } },
        { panne: { name: { contains: search, mode: "insensitive" } } },
        { obs: { contains: search, mode: "insensitive" } },
      ];
    }

    // Tri
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "him") {
      orderBy.him = sortOrder;
    } else if (sortBy === "engin") {
      orderBy.engin = { name: sortOrder };
    } else if (sortBy === "site") {
      orderBy.engin = { site: { name: sortOrder } };
    }

    const [saisiehims, total] = await Promise.all([
      prisma.saisiehim.findMany({
        where,
        include: {
          panne: {
            include: {
              typepanne: true,
            },
          },
          saisiehrm: {
            include: {
              engin: {
                include: {
                  site: true,
                  parc: {
                    include: {
                      typeparc: true,
                    },
                  },
                },
              },
            },
          },
          engin: {
            include: {
              site: true,
              parc: {
                include: {
                  typeparc: true,
                },
              },
            },
          },
          saisielubrifiant: {
            include: {
              lubrifiant: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.saisiehim.count({ where }),
    ]);

    return NextResponse.json({
      data: saisiehims,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des saisies HIM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { panneId, him, ni, saisiehrmId, enginId, obs } = body;

    const saisiehim = await prisma.saisiehim.create({
      data: {
        panneId,
        him: parseFloat(him),
        ni: parseInt(ni),
        saisiehrmId,
        enginId: enginId || null,
        obs: obs || null,
      },
      include: {
        panne: true,
        saisiehrm: {
          include: {
            engin: {
              include: {
                parc: {
                  include: {
                    typeparc: true,
                  },
                },
              },
            },
            site: true,
          },
        },
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(saisiehim);
  } catch (error) {
    console.error("Erreur lors de la création de la saisie HIM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la saisie" },
      { status: 500 }
    );
  }
}
