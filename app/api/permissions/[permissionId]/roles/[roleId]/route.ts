// app/api/permissions/[permissionId]/roles/[roleId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  assignPermissionToRole,
  removePermissionFromRole,
} from "@/lib/rbac/core";
import { protectCreateRoute, protectDeleteRoute } from "@/lib/rbac/middleware";

const the_resource = "permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: { permissionId: string; roleId: string } }
) {
  // 🔒 Vérifier les permissions
  const protectionError = await protectCreateRoute(request, the_resource);
  if (protectionError) return protectionError;

  const { permissionId, roleId } = await params;

  try {
    await assignPermissionToRole(roleId, permissionId);

    return NextResponse.json({
      message: "Permission assignée au rôle avec succès",
    });
  } catch (err) {
    console.error(err);

    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Cette permission est déjà assignée à ce rôle" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Impossible d'assigner la permission au rôle" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { permissionId: string; roleId: string } }
) {
  // 🔒 Vérifier les permissions
  const protectionError = await protectDeleteRoute(request, the_resource);
  if (protectionError) return protectionError;

  const { permissionId, roleId } = await params;

  try {
    await removePermissionFromRole(roleId, permissionId);

    return NextResponse.json({
      message: "Permission retirée du rôle avec succès",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Impossible de retirer la permission du rôle" },
      { status: 500 }
    );
  }
}
