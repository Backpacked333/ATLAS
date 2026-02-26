import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AtlasED Classroom database...');

  // ─── District & School ────────────────────────────────────────────
  const district = await prisma.district.create({
    data: {
      name: 'Lincoln Unified School District',
      state: 'CA',
    },
  });

  const school = await prisma.school.create({
    data: {
      districtId: district.id,
      name: 'Lincoln High School',
      gradeSpan: '9-12',
    },
  });

  // ─── Teacher ──────────────────────────────────────────────────────
  const teacher = await prisma.teacher.create({
    data: {
      schoolId: school.id,
      email: 'teacher@demo.edu',
      firstName: 'Sarah',
      lastName: 'Martinez',
    },
  });

  // ─── Counselor ────────────────────────────────────────────────────
  await prisma.counselor.create({
    data: {
      schoolId: school.id,
      email: 'counselor@demo.edu',
      firstName: 'David',
      lastName: 'Chen',
    },
  });

  // ─── Sections ─────────────────────────────────────────────────────
  const algebraP3 = await prisma.section.create({
    data: {
      schoolId: school.id,
      courseName: 'Algebra I',
      period: 'P3',
      semester: '2025-26 S2',
      room: '204',
    },
  });

  const algebraP5 = await prisma.section.create({
    data: {
      schoolId: school.id,
      courseName: 'Algebra I',
      period: 'P5',
      semester: '2025-26 S2',
      room: '204',
    },
  });

  const geometryP1 = await prisma.section.create({
    data: {
      schoolId: school.id,
      courseName: 'Geometry',
      period: 'P1',
      semester: '2025-26 S2',
      room: '204',
    },
  });

  // Teacher-Section links
  const sections = [algebraP3, algebraP5, geometryP1];
  for (const section of sections) {
    await prisma.teacherSection.create({
      data: { teacherId: teacher.id, sectionId: section.id },
    });
  }

  // ─── Students ─────────────────────────────────────────────────────
  const studentData = [
    { first: 'James', last: 'Washington', grade: 9, ell: false, iep: false, has504: false, gpa: 2.1, risk: 'NEEDS_SUPPORT' as const, section: algebraP3 },
    { first: 'Maria', last: 'Rodriguez', grade: 9, ell: true, iep: false, has504: false, gpa: 3.2, risk: 'ON_TRACK' as const, section: algebraP3 },
    { first: 'Tyler', last: 'Chen', grade: 9, ell: false, iep: true, has504: false, gpa: 2.8, risk: 'ON_TRACK' as const, section: algebraP3 },
    { first: 'Sofia', last: 'Hernandez', grade: 9, ell: true, iep: false, has504: true, gpa: 1.9, risk: 'NEEDS_SUPPORT' as const, section: algebraP3 },
    { first: 'Aiden', last: 'Johnson', grade: 9, ell: false, iep: false, has504: false, gpa: 3.8, risk: 'ON_TRACK' as const, section: algebraP3 },
    { first: 'Emma', last: 'Williams', grade: 9, ell: false, iep: false, has504: false, gpa: 3.5, risk: 'ON_TRACK' as const, section: algebraP5 },
    { first: 'Liam', last: 'Brown', grade: 9, ell: false, iep: false, has504: false, gpa: 2.4, risk: 'WATCH' as const, section: algebraP5 },
    { first: 'Olivia', last: 'Davis', grade: 9, ell: false, iep: true, has504: false, gpa: 2.9, risk: 'ON_TRACK' as const, section: algebraP5 },
    { first: 'Noah', last: 'Garcia', grade: 10, ell: false, iep: false, has504: false, gpa: 3.1, risk: 'ON_TRACK' as const, section: geometryP1 },
    { first: 'Ava', last: 'Martinez', grade: 10, ell: false, iep: false, has504: true, gpa: 2.6, risk: 'WATCH' as const, section: geometryP1 },
    { first: 'Ethan', last: 'Miller', grade: 10, ell: false, iep: false, has504: false, gpa: 1.5, risk: 'NEEDS_SUPPORT' as const, section: geometryP1 },
    { first: 'Isabella', last: 'Wilson', grade: 10, ell: true, iep: false, has504: false, gpa: 3.4, risk: 'ON_TRACK' as const, section: geometryP1 },
  ];

  const students: Array<{ id: string; section: typeof algebraP3 }> = [];

  for (let i = 0; i < studentData.length; i++) {
    const sd = studentData[i];
    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        studentIdNo: `STU${(1000 + i).toString()}`,
        firstName: sd.first,
        lastName: sd.last,
        gradeLevel: sd.grade,
        ellStatus: sd.ell,
        iepActive: sd.iep,
        has504: sd.has504,
        cumulativeGpa: sd.gpa,
        riskTier: sd.risk,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sd.section.id,
        status: 'ACTIVE',
      },
    });

    students.push({ id: student.id, section: sd.section });

    // Add guardians
    await prisma.guardian.create({
      data: {
        studentId: student.id,
        firstName: `Parent`,
        lastName: sd.last,
        email: `parent.${sd.last.toLowerCase()}@email.com`,
        phone: `(555) ${(100 + i).toString()}-${(1000 + i * 7).toString().slice(0, 4)}`,
        relation: 'Parent',
        isPrimary: true,
      },
    });
  }

  // ─── Assignments & Grades ─────────────────────────────────────────
  const today = new Date();
  const assignmentNames = ['Unit 5 Quiz', 'Chapter 10 HW', 'Midterm Exam', 'Weekly Problem Set 8', 'Group Project'];

  for (const section of sections) {
    for (let a = 0; a < assignmentNames.length; a++) {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() - a * 5);

      const assignment = await prisma.assignment.create({
        data: {
          sectionId: section.id,
          name: assignmentNames[a],
          category: a === 2 ? 'Test' : a === 4 ? 'Project' : 'Homework',
          pointsPossible: a === 2 ? 100 : a === 4 ? 50 : 20,
          dueDate,
        },
      });

      // Create grades for enrolled students
      const enrollments = await prisma.enrollment.findMany({
        where: { sectionId: section.id, status: 'ACTIVE' },
      });

      for (const enrollment of enrollments) {
        const studentInfo = students.find((s) => s.id === enrollment.studentId);
        const baseScore = studentInfo ? 0.5 + Math.random() * 0.5 : 0.7;
        const isMissing = Math.random() < 0.15;

        await prisma.grade.create({
          data: {
            studentId: enrollment.studentId,
            assignmentId: assignment.id,
            pointsEarned: isMissing ? null : Math.round(baseScore * assignment.pointsPossible * 10) / 10,
            isMissing,
            isLate: !isMissing && Math.random() < 0.1,
            gradedAt: isMissing ? null : new Date(),
          },
        });
      }
    }
  }

  // ─── Attendance ───────────────────────────────────────────────────
  for (const { id } of students) {
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const rand = Math.random();
      const status = rand < 0.08 ? 'ABSENT' : rand < 0.12 ? 'TARDY' : 'PRESENT';

      await prisma.attendanceRecord.create({
        data: {
          studentId: id,
          date,
          status: status as 'PRESENT' | 'ABSENT' | 'TARDY',
        },
      });
    }
  }

  // Make James Washington absent for last 3 days (for demo)
  const jamesStudent = students[0];
  for (let d = 0; d < 3; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    await prisma.attendanceRecord.upsert({
      where: {
        studentId_date_period: {
          studentId: jamesStudent.id,
          date,
          period: '',
        },
      },
      update: { status: 'ABSENT' },
      create: {
        studentId: jamesStudent.id,
        date,
        status: 'ABSENT',
      },
    });
  }

  // ─── Accommodations ───────────────────────────────────────────────
  // Tyler Chen (IEP)
  const tyler = students[2];
  await prisma.accommodation.create({
    data: {
      studentId: tyler.id,
      type: 'IEP',
      description: 'Extended time 1.5x on all assessments',
      category: 'Testing',
      startDate: new Date('2025-08-15'),
    },
  });
  await prisma.accommodation.create({
    data: {
      studentId: tyler.id,
      type: 'IEP',
      description: 'Check for understanding every 10 minutes',
      category: 'Classroom',
      startDate: new Date('2025-08-15'),
    },
  });

  // Sofia Hernandez (504)
  const sofia = students[3];
  await prisma.accommodation.create({
    data: {
      studentId: sofia.id,
      type: 'PLAN_504',
      description: 'Preferential seating near teacher',
      category: 'Classroom',
      startDate: new Date('2025-08-15'),
    },
  });
  await prisma.accommodation.create({
    data: {
      studentId: sofia.id,
      type: 'PLAN_504',
      description: 'Extended time 1.5x on assessments',
      category: 'Testing',
      startDate: new Date('2025-08-15'),
    },
  });

  // ─── Interventions ────────────────────────────────────────────────
  await prisma.intervention.create({
    data: {
      studentId: jamesStudent.id,
      tier: 'TIER_2',
      type: 'Daily Check-In',
      description: 'Daily 2-minute morning check-in to build rapport and monitor engagement.',
      teacherRole: '2-minute morning check-in, ask about homework completion. Log each interaction.',
      startDate: new Date('2026-02-01'),
      status: 'ACTIVE',
    },
  });

  await prisma.intervention.create({
    data: {
      studentId: sofia.id,
      tier: 'TIER_2',
      type: 'Modified Homework',
      description: 'Reduce homework volume by 50% while maintaining key skill practice.',
      teacherRole: 'Provide modified assignment list each Monday. Track completion.',
      startDate: new Date('2026-01-15'),
      status: 'ACTIVE',
    },
  });

  // ─── Assessment Scores ────────────────────────────────────────────
  for (const { id } of students) {
    await prisma.assessmentScore.create({
      data: {
        studentId: id,
        assessmentName: 'MAP Math Fall 2025',
        assessmentType: 'MAP',
        subject: 'Math',
        score: 200 + Math.round(Math.random() * 40),
        percentile: 20 + Math.round(Math.random() * 60),
        testDate: new Date('2025-09-15'),
      },
    });
  }

  // ─── Observations ─────────────────────────────────────────────────
  await prisma.observation.create({
    data: {
      studentId: jamesStudent.id,
      teacherId: teacher.id,
      category: 'ATTENDANCE',
      severity: 'CONCERN',
      content: 'James has been arriving late to class consistently this week. Appeared tired and disengaged during group work.',
    },
  });

  await prisma.observation.create({
    data: {
      studentId: sofia.id,
      teacherId: teacher.id,
      category: 'ACADEMIC',
      severity: 'URGENT',
      content: 'Sofia is struggling significantly with the current unit on quadratic equations. She was unable to complete any problems independently during class.',
    },
  });

  await prisma.observation.create({
    data: {
      studentId: students[4].id,
      teacherId: teacher.id,
      category: 'ACADEMIC',
      severity: 'POSITIVE',
      content: 'Aiden showed excellent leadership during the group project. He helped two struggling classmates understand the material.',
    },
  });

  // Positive-category observation
  await prisma.observation.create({
    data: {
      studentId: students[1].id, // Maria Rodriguez
      teacherId: teacher.id,
      category: 'POSITIVE',
      severity: 'POSITIVE',
      content: 'Maria volunteered to help translate instructions for a new ELL student. She showed exceptional empathy and patience.',
    },
  });

  // ─── Parent Contacts ────────────────────────────────────────────────
  await prisma.parentContact.create({
    data: {
      studentId: jamesStudent.id,
      teacherId: teacher.id,
      method: 'PHONE',
      subject: 'Attendance concerns',
      notes: 'Called home to discuss recent absences. Parent mentioned James has been dealing with a family situation. Will follow up next week.',
      sentiment: 'CONCERN',
    },
  });

  await prisma.parentContact.create({
    data: {
      studentId: students[4].id, // Aiden Johnson
      teacherId: teacher.id,
      method: 'EMAIL',
      subject: 'Great work this week!',
      notes: 'Sent positive email about leadership during group project.',
      sentiment: 'POSITIVE',
    },
  });

  // ─── Notifications ────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      teacherId: teacher.id,
      schoolId: school.id,
      studentId: jamesStudent.id,
      type: 'ABSENT_STREAK',
      title: 'James Washington — 3 consecutive absences',
      body: 'James Washington has been absent for 3 consecutive days. Consider reaching out to parent.',
      channel: 'BOTH',
    },
  });

  await prisma.notification.create({
    data: {
      teacherId: teacher.id,
      schoolId: school.id,
      studentId: sofia.id,
      type: 'GRADE_DROP',
      title: 'Sofia Hernandez — Grade dropped below C',
      body: 'Sofia Hernandez dropped from C to D in your Algebra I (P3) class.',
      channel: 'IN_APP',
    },
  });

  await prisma.notification.create({
    data: {
      teacherId: teacher.id,
      schoolId: school.id,
      type: 'INTERVENTION_ASSIGNED',
      title: 'New intervention: Daily check-in with James Washington',
      body: 'Daily Check-In intervention assigned. Your role: 2-minute morning check-in. Starts today.',
      channel: 'BOTH',
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Created: 1 district, 1 school, 1 teacher, 3 sections, ${students.length} students`);
  console.log('Login with: teacher@demo.edu');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
