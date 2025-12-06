// lib/rbac/core.ts (version simplifiée et fonctionnelle)
import { prisma } from "@/lib/prisma";

// Types pour les permissions
export interface PermissionCheck {
  action: string;
  resource: string;
}

export interface PermissionResult {
  [permissionString: string]: boolean;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  active: boolean;
  roles: Array<{
    id: string;
    name: string;
    permissions: Array<{
      id: string;
      resource: string;
      action: string; // Action enum
    }>;
  }>;
}

export async function getUserWithPermissions(
  userId: string
): Promise<UserWithPermissions | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
    },
  });
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  // ✅ APPROCHE SIMPLIFIÉE ET FONCTIONNELLE
  // 1. Récupérer l'utilisateur avec ses rôles et permissions
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: {
                    include: {
                      resource: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  // 2. Extraire toutes les permissions uniques
  const permissionsSet = new Set<string>();

  user.roles.forEach((userRole) => {
    userRole.role.permissions.forEach((rolePermission) => {
      const permissionString = `${rolePermission.permission.action}:${rolePermission.permission.resource.name}`;
      permissionsSet.add(permissionString);
    });
  });

  return Array.from(permissionsSet);
}

export async function hasPermission(
  userId: string,
  action: string,
  resourceName: string
): Promise<boolean> {
  // ✅ APPROCHE SIMPLIFIÉE : Utiliser getUserPermissions
  const userPermissions = await getUserPermissions(userId);
  const requiredPermission = `${action}:${resourceName}`;
  return userPermissions.includes(requiredPermission);
}

export async function hasRole(
  userId: string,
  roleName: string
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return false;
  }

  return user.roles.some((userRole) => userRole.role.name === roleName);
}

export async function assignRoleToUser(
  userId: string,
  roleId: string
): Promise<{ id: string; userId: string; roleId: string; createdAt: Date }> {
  return await prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
  });
}

export async function removeRoleFromUser(
  userId: string,
  roleId: string
): Promise<{ count: number }> {
  return await prisma.userRole.deleteMany({
    where: {
      userId,
      roleId,
    },
  });
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string
): Promise<{
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
}> {
  return await prisma.rolePermission.create({
    data: {
      roleId,
      permissionId,
    },
  });
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<{ count: number }> {
  return await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId,
    },
  });
}

export async function checkMultiplePermissions(
  userId: string,
  permissions: PermissionCheck[]
): Promise<PermissionResult> {
  const userPermissions = await getUserPermissions(userId);
  const result: PermissionResult = {};

  permissions.forEach(({ action, resource }) => {
    const permissionString = `${action}:${resource}`;
    result[permissionString] = userPermissions.includes(permissionString);
  });

  return result;
}

// Fonction utilitaire pour vérifier plusieurs permissions avec un seul appel
export async function hasAllPermissions(
  userId: string,
  permissions: PermissionCheck[]
): Promise<boolean> {
  const results = await checkMultiplePermissions(userId, permissions);
  return Object.values(results).every(Boolean);
}

// Fonction utilitaire pour vérifier au moins une permission
export async function hasAnyPermission(
  userId: string,
  permissions: PermissionCheck[]
): Promise<boolean> {
  const results = await checkMultiplePermissions(userId, permissions);
  return Object.values(results).some(Boolean);
}

// Fonction pour obtenir les rôles d'un utilisateur
export async function getUserRoles(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return user?.roles.map((userRole) => userRole.role.name) ?? [];
}

// Fonction pour vérifier si l'utilisateur est administrateur
export async function isAdmin(userId: string): Promise<boolean> {
  return await hasRole(userId, "admin");
}

// Fonction pour vérifier si l'utilisateur est super administrateur
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return await hasRole(userId, "super-admin");
}
