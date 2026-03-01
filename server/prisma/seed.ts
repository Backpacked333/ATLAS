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
    { first: 'Sofia', last: 'Hernandez', grade: 9, ell: true, iep: false, has504: true, gpa: 1.9, risk: 'URGENT' as const, section: algebraP3 },
    { first: 'Aiden', last: 'Johnson', grade: 9, ell: false, iep: false, has504: false, gpa: 3.8, risk: 'ON_TRACK' as const, section: algebraP3 },
    { first: 'Emma', last: 'Williams', grade: 9, ell: false, iep: false, has504: false, gpa: 3.5, risk: 'ON_TRACK' as const, section: algebraP5 },
    { first: 'Liam', last: 'Brown', grade: 9, ell: false, iep: false, has504: false, gpa: 2.4, risk: 'NEEDS_SUPPORT' as const, section: algebraP5 },
    { first: 'Olivia', last: 'Davis', grade: 9, ell: false, iep: true, has504: false, gpa: 2.9, risk: 'ON_TRACK' as const, section: algebraP5 },
    { first: 'Noah', last: 'Garcia', grade: 10, ell: false, iep: false, has504: false, gpa: 3.1, risk: 'ON_TRACK' as const, section: geometryP1 },
    { first: 'Ava', last: 'Martinez', grade: 10, ell: false, iep: false, has504: true, gpa: 2.6, risk: 'NEEDS_SUPPORT' as const, section: geometryP1 },
    { first: 'Ethan', last: 'Miller', grade: 10, ell: false, iep: false, has504: false, gpa: 1.5, risk: 'URGENT' as const, section: geometryP1 },
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

  // ═══════════════════════════════════════════════════════════════════
  // AtlasED Command — District-Level Seed Data
  // ═══════════════════════════════════════════════════════════════════

  // ─── District Admins ────────────────────────────────────────────
  await prisma.districtAdmin.create({
    data: {
      districtId: district.id,
      email: 'superintendent@demo.edu',
      firstName: 'Dr. Karen',
      lastName: 'Mitchell',
      role: 'SUPERINTENDENT',
    },
  });

  await prisma.districtAdmin.create({
    data: {
      districtId: district.id,
      email: 'dss@demo.edu',
      firstName: 'Robert',
      lastName: 'Nguyen',
      role: 'DIRECTOR_STUDENT_SERVICES',
    },
  });

  await prisma.districtAdmin.create({
    data: {
      districtId: district.id,
      email: 'cto@demo.edu',
      firstName: 'Lisa',
      lastName: 'Park',
      role: 'CTO',
    },
  });

  // ─── Student Demographics ───────────────────────────────────────
  const races = ['White', 'Hispanic', 'Black', 'Asian', 'Multi-Racial'];
  const genders = ['Male', 'Female'];
  for (let i = 0; i < students.length; i++) {
    await prisma.studentDemographic.create({
      data: {
        studentId: students[i].id,
        race: races[i % races.length],
        ethnicity: races[i % races.length] === 'Hispanic' ? 'Hispanic/Latino' : null,
        gender: genders[i % genders.length],
        frlStatus: i % 3 === 0,
        homeless: false,
        fosterCare: false,
        migrant: false,
      },
    });
  }

  // ─── Discipline Records ─────────────────────────────────────────
  const consequenceTypes = ['WARNING', 'DETENTION', 'ISS', 'OSS', 'RESTORATIVE'] as const;
  for (let i = 0; i < 6; i++) {
    const incidentDate = new Date(today);
    incidentDate.setDate(incidentDate.getDate() - i * 12);
    await prisma.disciplineRecord.create({
      data: {
        studentId: students[i % students.length].id,
        schoolId: school.id,
        incidentDate,
        referringStaff: 'Staff Member',
        infractionType: i % 2 === 0 ? 'Disruption' : 'Defiance',
        description: `Discipline incident ${i + 1}`,
        consequenceType: consequenceTypes[i % consequenceTypes.length],
        daysAssigned: i % 3 === 0 ? 1 : 0,
        restorativeOffered: i % 2 === 0,
        restorativeCompleted: i % 4 === 0,
      },
    });
  }

  // ─── Risk Score Snapshots ───────────────────────────────────────
  for (const student of students) {
    for (let d = 0; d < 5; d++) {
      const snapshotDate = new Date(today);
      snapshotDate.setDate(snapshotDate.getDate() - d * 7);
      await prisma.riskScoreSnapshot.create({
        data: {
          studentId: student.id,
          date: snapshotDate,
          score: Math.round(Math.random() * 100) / 100,
          factors: { attendance: Math.random() * 0.5, grades: Math.random() * 0.3, behavior: Math.random() * 0.2 },
        },
      });
    }
  }

  // ─── School Metrics Snapshots ───────────────────────────────────
  for (let d = 0; d < 4; d++) {
    const snapshotDate = new Date(today);
    snapshotDate.setDate(snapshotDate.getDate() - d * 7);
    await prisma.schoolMetricsSnapshot.create({
      data: {
        schoolId: school.id,
        date: snapshotDate,
        enrollmentCount: students.length,
        attendanceRate: 92.5 + Math.random() * 4,
        chronicAbsenceRate: 8.2 + Math.random() * 3,
        atRiskCount: 4,
        atRiskPercent: 33.3,
        mtssTier2Count: 2,
        mtssTier3Count: 0,
        interventionFidelity: 75 + Math.random() * 15,
        interventionSuccessRate: 60 + Math.random() * 20,
        sstBacklog: Math.floor(Math.random() * 5),
        suspensionRate: 2.5 + Math.random() * 2,
        suspensionCountIss: 2,
        suspensionCountOss: 1,
        iepComplianceRate: 95 + Math.random() * 5,
        courseFailureRate: 5 + Math.random() * 8,
        onTrackGraduation: 88 + Math.random() * 8,
        teacherEngagementRate: 80 + Math.random() * 15,
        counselorWorkload: 30 + Math.random() * 20,
        disproportionalityIndex: 1.0 + Math.random() * 1.5,
      },
    });
  }

  // ─── Budget Line Items ──────────────────────────────────────────
  const programs = [
    { name: 'Reading Recovery', budget: 45000, students: 30, success: 72, category: 'Intervention' },
    { name: 'Math Tutoring Lab', budget: 32000, students: 45, success: 65, category: 'Intervention' },
    { name: 'Check & Connect', budget: 28000, students: 20, success: 78, category: 'Intervention' },
    { name: 'Social Skills Groups', budget: 18000, students: 15, success: 60, category: 'Intervention' },
    { name: 'After-School Enrichment', budget: 55000, students: 80, success: 55, category: 'Intervention' },
  ];

  for (const prog of programs) {
    const costPerStudent = prog.students > 0 ? Math.round(prog.budget / prog.students) : 0;
    const successfulStudents = Math.round(prog.students * (prog.success / 100));
    const costPerSuccess = successfulStudents > 0 ? Math.round(prog.budget / successfulStudents) : 0;
    await prisma.budgetLineItem.create({
      data: {
        districtId: district.id,
        programName: prog.name,
        category: prog.category,
        annualBudget: prog.budget,
        amountSpent: Math.round(prog.budget * 0.7),
        fundingSource: 'Title I',
        fiscalYear: '2025-26',
        studentsServed: prog.students,
        successRate: prog.success,
        costPerStudent,
        costPerSuccess,
      },
    });
  }

  // ─── Vendor Contracts ───────────────────────────────────────────
  await prisma.vendorContract.create({
    data: {
      districtId: district.id,
      vendorName: 'ReadWorks Inc.',
      productName: 'ReadWorks Digital',
      annualCost: 12000,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      category: 'Curriculum',
      activeUsers: 180,
      usageRate: 0.72,
    },
  });

  await prisma.vendorContract.create({
    data: {
      districtId: district.id,
      vendorName: 'NWEA',
      productName: 'MAP Growth',
      annualCost: 25000,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      category: 'Assessment',
      activeUsers: students.length,
      usageRate: 1.0,
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Created: 1 district, 1 school, 1 teacher, 3 sections, ${students.length} students`);
  console.log('AtlasED Command: 3 district admins, discipline records, risk scores, budget items, vendor contracts');
  console.log('Login with: teacher@demo.edu (Classroom) | superintendent@demo.edu (Command)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
