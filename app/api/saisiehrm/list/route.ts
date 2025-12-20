// app/api/saisiehrm/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { format, startOfDay, endOfDay } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const cursor = searchParams.get("cursor");
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : null;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : 50;
    const limit = parseInt(searchParams.get("limit") || "100");
    const enginId = searchParams.get("enginId");
    const siteId = searchParams.get("siteId");
    const parcId = searchParams.get("parcId");
    const typeparcId = searchParams.get("typeparcId");
    const exportParam = searchParams.get("export");
    const showAll = searchParams.get("showAll") === "true";

    // Validation de la date
    if (!dateParam) {
      return NextResponse.json(
        { error: "La date est requise" },
        { status: 400 }
      );
    }

    const selectedDate = new Date(dateParam);

    // Calcul des dates de début et fin de la journée
    const startDate = startOfDay(selectedDate);
    const endDate = endOfDay(selectedDate);

    // Construction du filtre
    const where = {
      du: {
        gte: startDate,
        lte: endDate,
      },
      ...(enginId && { enginId }),
      ...(siteId && { siteId }),
      ...(parcId && {
        engin: {
          parcId: parcId,
        },
      }),
      ...(typeparcId && {
        engin: {
          parc: {
            typeparcId: typeparcId,
          },
        },
      }),
    };

    // Pour l'export ou "afficher tout", retourner toutes les données sans pagination
    if (exportParam === "csv" || showAll) {
      const data = await prisma.saisiehrm.findMany({
        where,
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
          site: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          du: "desc",
        },
      });

      return NextResponse.json({ data });
    }

    // Pagination par page (nouvelle méthode)
    if (page !== null) {
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const [data, total] = await Promise.all([
        prisma.saisiehrm.findMany({
          where,
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
            site: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            du: "desc",
          },
          skip,
          take,
        }),
        prisma.saisiehrm.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return NextResponse.json({
        data,
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      });
    }

    // Pagination avec cursor pour meilleures performances (méthode originale)
    const take = Math.min(limit, 200); // Limite maximale de 200
    let cursorCondition = {};

    if (cursor) {
      cursorCondition = {
        id: {
          gt: cursor,
        },
      };
    }

    // Requête optimisée pour grandes quantités de données
    const [data, total, nextCursor] = await Promise.all([
      prisma.saisiehrm.findMany({
        where: {
          ...where,
          ...cursorCondition,
        },
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
          site: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          id: "asc", // Important pour la pagination par cursor
        },
        take: take + 1, // Prendre un de plus pour savoir s'il y a une suite
      }),
      prisma.saisiehrm.count({ where }),
      prisma.saisiehrm.findFirst({
        where,
        select: {
          id: true,
        },
        orderBy: {
          id: "desc",
        },
      }),
    ]);

    // Déterminer s'il y a plus de données
    const hasMore = data.length > take;
    const items = hasMore ? data.slice(0, take) : data;
    const nextCursorValue = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      data: items,
      total,
      hasMore,
      nextCursor: nextCursorValue,
      lastCursor: nextCursor?.id,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des saisies HRM:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
