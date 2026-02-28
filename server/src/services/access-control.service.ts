import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export async function createRole(
  schoolId: string,
  input: { name: string; description?: string }
) {
  return prisma.role.create({
    data: {
      schoolId,
      name: input.name,
      description: input.description || null,
    },
    include: {
      _count: { select: { permissions: true, assignments: true } },
    },
  });
}

export async function getRoles(schoolId: string) {
  return prisma.role.findMany({
    where: { schoolId },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: { select: { assignments: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getRoleById(roleId: string, schoolId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, schoolId },
    include: {
      permissions: {
        include: { permission: true },
      },
      assignments: {
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  if (!role) {
    throw new NotFoundError('Role not found');
  }

  return role;
}

export async function updateRole(
  roleId: string,
  schoolId: string,
  input: { name?: string; description?: string }
) {
  const role = await prisma.role.findFirst({ where: { id: roleId, schoolId } });
  if (!role) {
    throw new NotFoundError('Role not found');
  }
  if (role.isSystem) {
    throw new ValidationError('System roles cannot be modified');
  }

  return prisma.role.update({
    where: { id: roleId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
}

export async function deleteRole(roleId: string, schoolId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, schoolId } });
  if (!role) {
    throw new NotFoundError('Role not found');
  }
  if (role.isSystem) {
    throw new ValidationError('System roles cannot be deleted');
  }

  // Remove all permission and assignment links, then the role
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  await prisma.userRoleAssignment.deleteMany({ where: { roleId } });
  await prisma.role.delete({ where: { id: roleId } });

  return { deleted: true };
}

export async function getPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });
}

export async function assignPermissionToRole(roleId: string, permissionId: string, schoolId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, schoolId } });
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  return prisma.rolePermission.create({
    data: { roleId, permissionId },
    include: { permission: true },
  });
}

export async function removePermissionFromRole(roleId: string, permissionId: string, schoolId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, schoolId } });
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId, permissionId },
  });

  return { removed: true };
}

export async function assignRoleToUser(
  teacherId: string,
  roleId: string,
  schoolId: string,
  grantedBy?: string
) {
  const role = await prisma.role.findFirst({ where: { id: roleId, schoolId } });
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  return prisma.userRoleAssignment.create({
    data: {
      teacherId,
      roleId,
      grantedBy: grantedBy || null,
    },
    include: {
      role: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function removeRoleFromUser(teacherId: string, roleId: string) {
  await prisma.userRoleAssignment.deleteMany({
    where: { teacherId, roleId },
  });
  return { removed: true };
}

export async function getUserRoles(teacherId: string) {
  return prisma.userRoleAssignment.findMany({
    where: { teacherId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });
}
