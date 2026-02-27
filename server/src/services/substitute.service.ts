import { prisma } from '../utils/prisma';
import { SubstituteBrief } from '../types';

/**
 * Substitute Teacher Mode (Section 4.9)
 * Generates a minimal, safe brief for substitute teachers.
 * No risk scores, no grades, no attendance data, no IEP content, no parent info.
 * Only: seating, accommodation action items, intervention instructions, and teacher notes.
 */
export async function generateSubstituteBrief(
  teacherId: string,
  sectionId: string
): Promise<SubstituteBrief> {
  const section = await prisma.section.findUniqueOrThrow({
    where: { id: sectionId },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              accommodations: {
                where: { isActive: true, category: { in: ['Classroom', 'Testing'] } },
                select: { description: true },
              },
            },
          },
        },
      },
      seats: {
        orderBy: [{ row: 'asc' }, { col: 'asc' }],
      },
    },
  });

  // Build seat map for quick lookup
  const seatMap = new Map<string, string>();
  for (const seat of section.seats) {
    if (seat.studentId) {
      seatMap.set(seat.studentId, seat.label || `Row ${seat.row + 1}, Seat ${seat.col + 1}`);
    }
  }

  // Get active interventions for students in this section
  const studentIds = section.enrollments.map((e) => e.studentId);
  const interventions = await prisma.intervention.findMany({
    where: {
      studentId: { in: studentIds },
      status: 'ACTIVE',
      teacherRole: { not: null },
    },
    select: {
      studentId: true,
      type: true,
      teacherRole: true,
    },
  });

  const interventionMap = new Map<string, string>();
  for (const intervention of interventions) {
    const existing = interventionMap.get(intervention.studentId);
    const note = `${intervention.type}: ${intervention.teacherRole}`;
    interventionMap.set(intervention.studentId, existing ? `${existing}; ${note}` : note);
  }

  const students = section.enrollments.map((enrollment) => {
    const student = enrollment.student;
    const accommodationNotes =
      student.accommodations.length > 0
        ? student.accommodations.map((a) => a.description).join('. ')
        : null;

    return {
      firstName: student.firstName,
      lastName: student.lastName,
      seatLabel: seatMap.get(student.id) || null,
      accommodationNotes,
      interventionNotes: interventionMap.get(student.id) || null,
    };
  });

  // Sort alphabetically
  students.sort((a, b) => a.lastName.localeCompare(b.lastName));

  return {
    section: {
      courseName: section.courseName,
      period: section.period,
      room: section.room,
    },
    students,
    teacherNotes: null, // Could be extended to store teacher-written sub notes
    generatedAt: new Date().toISOString(),
  };
}
