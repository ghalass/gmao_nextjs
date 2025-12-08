// app/api/engins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "engin";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const typeparcId = searchParams.get("typeparcId");
    const parcId = searchParams.get("parcId");
    const siteId = searchParams.get("siteId");
    const active = searchParams.get("active");

    // Construire les filtres
    const where: any = {};

    if (typeparcId) {
      where.parc = {
        typeparcId: typeparcId,
      };
    }

    if (parcId) {
      where.parcId = parcId;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (active !== null) {
      where.active = active === "true";
    }

    const engins = await prisma.engin.findMany({
      where,
      include: {
        parc: {
          include: {
            typeparc: true,
          },
        },
        site: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(engins);
  } catch (error) {
    console.error("Error fetching engins:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des engins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name, active = true, parcId, siteId, initialHeureChassis } = body;

    // Validation
    if (!name || !parcId || !siteId) {
      return NextResponse.json(
        { message: "Le nom, le parc et le site sont requis" },
        { status: 400 }
      );
    }

    const engin = await prisma.engin.create({
      data: {
        name: name.trim(),
        active,
        parcId,
        siteId,
        initialHeureChassis: initialHeureChassis
          ? parseFloat(initialHeureChassis)
          : null,
      },
      include: {
        parc: {
          include: {
            typeparc: true,
          },
        },
        site: true,
      },
    });

    return NextResponse.json(engin, { status: 201 });
  } catch (error) {
    console.error("Error creating engin:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Un engin avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la création de l'engin" },
      { status: 500 }
    );
  }
}

// // app/api/engins/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { enginSchema } from "@/lib/validations/enginSchema";
// import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

// const the_resource = "engin";

// export async function GET(request: NextRequest) {
//   try {
//     // Vérifier la permission de lecture des sites (pas "users")
//     const protectionError = await protectReadRoute(request, the_resource);
//     if (protectionError) return protectionError;

//     const engins = await prisma.engin.findMany({
//       include: {
//         parc: {
//           include: {
//             typeparc: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//         },
//         site: {
//           select: {
//             id: true,
//             name: true,
//             active: true,
//           },
//         },
//       },
//       orderBy: {
//         name: "asc",
//       },
//     });

//     return NextResponse.json(engins);
//   } catch (error) {
//     console.error("Error fetching engins:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération des engins" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     // Vérifier la permission de lecture des sites (pas "users")
//     const protectionError = await protectCreateRoute(request, the_resource);
//     if (protectionError) return protectionError;

//     const body = await request.json();

//     const validatedData = await enginSchema.validate(body, {
//       abortEarly: false,
//       stripUnknown: true,
//     });

//     // Vérifier si l'engin existe déjà
//     const existingEngin = await prisma.engin.findUnique({
//       where: { name: validatedData.name },
//     });

//     if (existingEngin) {
//       return NextResponse.json(
//         { message: "Un engin avec ce nom existe déjà" },
//         { status: 409 }
//       );
//     }

//     // Vérifier si le parc existe
//     const parcExists = await prisma.parc.findUnique({
//       where: { id: validatedData.parcId },
//     });

//     if (!parcExists) {
//       return NextResponse.json(
//         { message: "Le parc spécifié n'existe pas" },
//         { status: 404 }
//       );
//     }

//     // Vérifier si le site existe
//     const siteExists = await prisma.site.findUnique({
//       where: { id: validatedData.siteId },
//     });

//     if (!siteExists) {
//       return NextResponse.json(
//         { message: "Le site spécifié n'existe pas" },
//         { status: 404 }
//       );
//     }

//     const engin = await prisma.engin.create({
//       data: validatedData,
//       include: {
//         parc: {
//           include: {
//             typeparc: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//         },
//         site: {
//           select: {
//             id: true,
//             name: true,
//             active: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(engin, { status: 201 });
//   } catch (error: any) {
//     console.error("Error creating engin:", error);

//     if (error.name === "ValidationError") {
//       return NextResponse.json(
//         {
//           error: "Données invalides",
//           details: error.errors,
//         },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Erreur lors de la création de l'engin" },
//       { status: 500 }
//     );
//   }
// }
