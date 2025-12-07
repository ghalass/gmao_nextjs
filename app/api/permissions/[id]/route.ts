import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const permission = await prisma.permission.findUnique({
    where: { id: id },
  });
  if (!permission)
    return NextResponse.json(
      { error: "Permission not found" },
      { status: 404 }
    );
  return NextResponse.json(permission);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const data = await request.json();
  const permission = await prisma.permission.update({
    where: { id: id },
    data,
  });
  return NextResponse.json(permission);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.permission.delete({ where: { id: id } });
  return NextResponse.json({ message: "Permission deleted" });
}
