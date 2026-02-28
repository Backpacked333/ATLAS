import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function registerDevice(
  teacherId: string,
  input: {
    deviceToken: string;
    platform: string;
    deviceName?: string;
  }
) {
  return prisma.deviceRegistration.upsert({
    where: {
      teacherId_deviceToken: {
        teacherId,
        deviceToken: input.deviceToken,
      },
    },
    update: {
      platform: input.platform as any,
      deviceName: input.deviceName || null,
      isActive: true,
      lastActiveAt: new Date(),
    },
    create: {
      teacherId,
      deviceToken: input.deviceToken,
      platform: input.platform as any,
      deviceName: input.deviceName || null,
    },
  });
}

export async function getDeviceRegistrations(teacherId: string) {
  return prisma.deviceRegistration.findMany({
    where: { teacherId },
    orderBy: { lastActiveAt: 'desc' },
  });
}

export async function deactivateDevice(deviceId: string, teacherId: string) {
  const device = await prisma.deviceRegistration.findFirst({
    where: { id: deviceId, teacherId },
  });
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  return prisma.deviceRegistration.update({
    where: { id: deviceId },
    data: { isActive: false },
  });
}

export async function getMobilePreferences(teacherId: string) {
  let prefs = await prisma.mobilePreference.findUnique({
    where: { teacherId },
  });

  if (!prefs) {
    prefs = await prisma.mobilePreference.create({
      data: { teacherId },
    });
  }

  return prefs;
}

export async function updateMobilePreferences(
  teacherId: string,
  input: {
    pushNotificationsEnabled?: boolean;
    alertSound?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    dataSaverMode?: boolean;
    offlineCacheEnabled?: boolean;
  }
) {
  return prisma.mobilePreference.upsert({
    where: { teacherId },
    update: {
      ...(input.pushNotificationsEnabled !== undefined ? { pushNotificationsEnabled: input.pushNotificationsEnabled } : {}),
      ...(input.alertSound !== undefined ? { alertSound: input.alertSound } : {}),
      ...(input.quietHoursStart !== undefined ? { quietHoursStart: input.quietHoursStart } : {}),
      ...(input.quietHoursEnd !== undefined ? { quietHoursEnd: input.quietHoursEnd } : {}),
      ...(input.dataSaverMode !== undefined ? { dataSaverMode: input.dataSaverMode } : {}),
      ...(input.offlineCacheEnabled !== undefined ? { offlineCacheEnabled: input.offlineCacheEnabled } : {}),
    },
    create: {
      teacherId,
      pushNotificationsEnabled: input.pushNotificationsEnabled ?? true,
      alertSound: input.alertSound ?? true,
      quietHoursStart: input.quietHoursStart || null,
      quietHoursEnd: input.quietHoursEnd || null,
      dataSaverMode: input.dataSaverMode ?? false,
      offlineCacheEnabled: input.offlineCacheEnabled ?? true,
    },
  });
}

export async function updateDeviceActivity(deviceToken: string, teacherId: string) {
  await prisma.deviceRegistration.updateMany({
    where: { teacherId, deviceToken },
    data: { lastActiveAt: new Date() },
  });
}
