import { prisma } from '../utils/prisma';
import { LogInterventionInput } from '../types';

export async function logIntervention(teacherId: string, input: LogInterventionInput) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.interventionLog.upsert({
    where: {
      interventionId_teacherId_date: {
        interventionId: input.interventionId,
        teacherId,
        date: today,
      },
    },
    update: {
      completionStatus: input.completionStatus,
      notes: input.notes,
    },
    create: {
      interventionId: input.interventionId,
      teacherId,
      date: today,
      completionStatus: input.completionStatus,
      notes: input.notes,
    },
  });
}

export async function getTeacherInterventions(teacherId: string) {
  return prisma.intervention.findMany({
    where: {
      status: 'ACTIVE',
      student: {
        enrollments: {
          some: {
            status: 'ACTIVE',
            section: {
              teachers: { some: { teacherId } },
            },
          },
        },
      },
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true },
      },
      logs: {
        where: { teacherId },
        orderBy: { date: 'desc' },
        take: 7,
      },
    },
    orderBy: { startDate: 'desc' },
  });
}
