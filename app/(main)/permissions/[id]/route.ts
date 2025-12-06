import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permission = await prisma.permission.findUnique({
    where: { id: params.id },
  });
  if (!permission)
    return NextResponse.json(
      { error: "Permission not found" },
      { status: 404 }
    );
  return NextResponse.json(permission);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await req.json();
  const permission = await prisma.permission.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(permission);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.permission.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Permission deleted" });
}
