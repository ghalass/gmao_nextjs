// app/api/auth/me/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
// import { verifyJwt } from "@/lib/jwt";

export async function GET() {
  try {
    // ✅ await cookies() pour obtenir le cookieStore
    // const cookieStore = await cookies();
    // const token = cookieStore.get("token")?.value;

    const session = await getSession();

    // if (!token) return NextResponse.json({ user: null });
    if (!session.isLoggedIn) return NextResponse.json({ user: null });

    // const decoded = verifyJwt(token) as { userId: string } | null;
    const decoded = session as { userId: string } | null;
    if (!decoded) return NextResponse.json({ user: null }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const { password, ...userWithoutPassword } = user || {};

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error(
      "Erreur lors de récupération de l'utilisateur conncté:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
