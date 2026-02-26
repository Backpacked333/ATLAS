import { prisma } from '../utils/prisma';
import { CreateObservationInput } from '../types';

export async function createObservation(teacherId: string, input: CreateObservationInput) {
  const observation = await prisma.observation.create({
    data: {
      studentId: input.studentId,
      teacherId,
      category: input.category,
      severity: input.severity,
      content: input.content,
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
    },
  });

  // If severity is URGENT, create a notification for the counselor
  if (input.severity === 'URGENT') {
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
      select: { schoolId: true, firstName: true, lastName: true },
    });

    if (student) {
      await prisma.notification.create({
        data: {
          schoolId: student.schoolId,
          studentId: input.studentId,
          type: 'GRADE_DROP', // Using as general urgent alert
          title: `Urgent observation for ${student.firstName} ${student.lastName}`,
          body: input.content,
          channel: 'BOTH',
        },
      });
    }
  }

  return observation;
}

export async function updateObservation(
  observationId: string,
  teacherId: string,
  content: string
) {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
  });

  if (!observation) throw new Error('Observation not found');
  if (observation.teacherId !== teacherId) throw new Error('Not authorized to edit this observation');

  // Check 24-hour edit window
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  if (observation.createdAt < twentyFourHoursAgo) {
    throw new Error('Observations can only be edited within 24 hours of creation');
  }

  return prisma.observation.update({
    where: { id: observationId },
    data: { content },
  });
}

export async function getStudentObservations(teacherId: string, studentId: string) {
  return prisma.observation.findMany({
    where: {
      studentId,
      teacherId,
    },
    orderBy: { createdAt: 'desc' },
  });
}
