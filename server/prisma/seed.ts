import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Date Helpers ─────────────────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

function daysAgo(n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

const semesterStart = new Date('2025-08-20');

async function main() {
  console.log('Seeding AtlasED Classroom demo database...');

  // ─── District & School ──────────────────────────────────────────────
  const district = await prisma.district.create({
    data: { name: 'Lincoln Unified School District', state: 'CA' },
  });

  const school = await prisma.school.create({
    data: { districtId: district.id, name: 'Lincoln High School', gradeSpan: '9-12' },
  });

  // ─── Teacher ────────────────────────────────────────────────────────
  const teacher = await prisma.teacher.create({
    data: {
      schoolId: school.id,
      email: 'teacher@demo.edu',
      firstName: 'Sarah',
      lastName: 'Martinez',
    },
  });

  // ─── Counselor ──────────────────────────────────────────────────────
  await prisma.counselor.create({
    data: {
      schoolId: school.id,
      email: 'counselor@demo.edu',
      firstName: 'David',
      lastName: 'Chen',
    },
  });

  // ─── Sections ───────────────────────────────────────────────────────
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

  const sections = [algebraP3, algebraP5, geometryP1];
  for (const section of sections) {
    await prisma.teacherSection.create({
      data: { teacherId: teacher.id, sectionId: section.id },
    });
  }

  // ─── Students ───────────────────────────────────────────────────────
  // Each student has a story that drives specific briefing cards.
  //
  // INDEX  NAME                SECTION     RISK          STORY
  // 0      James Washington    Alg P3      NEEDS_SUPPORT Absent 3 days, failing, intervention
  // 1      Maria Rodriguez     Alg P3      ON_TRACK      ELL, positive role model
  // 2      Tyler Chen          Alg P3      ON_TRACK      IEP, needs accommodation for quiz
  // 3      Sofia Hernandez     Alg P3      NEEDS_SUPPORT ELL+504, absent today, failing, missing work
  // 4      Aiden Johnson       Alg P3      ON_TRACK      Star student, positive observations
  // 5      Emma Williams       Alg P5      ON_TRACK      Good student, no recent contact (relationship)
  // 6      Liam Brown          Alg P5      WATCH         Grade slipping, missing work
  // 7      Olivia Davis        Alg P5      ON_TRACK      IEP, has accommodations
  // 8      Noah Garcia         Geo P1      ON_TRACK      No recent contact (relationship)
  // 9      Ava Martinez        Geo P1      WATCH         504, needs accommodation for quiz
  // 10     Ethan Miller        Geo P1      NEEDS_SUPPORT Absent 2 days, failing, missing work
  // 11     Isabella Wilson     Geo P1      ON_TRACK      ELL, no recent contact (relationship)
  // 12     Marcus Thompson     Alg P3      ON_TRACK      NEW STUDENT (enrolled 3 days ago), IEP

  const studentData = [
    { first: 'James',    last: 'Washington', grade: 9,  ell: false, iep: false, has504: false, gpa: 2.1, risk: 'NEEDS_SUPPORT' as const, section: algebraP3 },
    { first: 'Maria',    last: 'Rodriguez',  grade: 9,  ell: true,  iep: false, has504: false, gpa: 3.2, risk: 'ON_TRACK' as const,      section: algebraP3 },
    { first: 'Tyler',    last: 'Chen',       grade: 9,  ell: false, iep: true,  has504: false, gpa: 2.8, risk: 'ON_TRACK' as const,      section: algebraP3 },
    { first: 'Sofia',    last: 'Hernandez',  grade: 9,  ell: true,  iep: false, has504: true,  gpa: 1.9, risk: 'NEEDS_SUPPORT' as const, section: algebraP3 },
    { first: 'Aiden',    last: 'Johnson',    grade: 9,  ell: false, iep: false, has504: false, gpa: 3.8, risk: 'ON_TRACK' as const,      section: algebraP3 },
    { first: 'Emma',     last: 'Williams',   grade: 9,  ell: false, iep: false, has504: false, gpa: 3.5, risk: 'ON_TRACK' as const,      section: algebraP5 },
    { first: 'Liam',     last: 'Brown',      grade: 9,  ell: false, iep: false, has504: false, gpa: 2.4, risk: 'WATCH' as const,         section: algebraP5 },
    { first: 'Olivia',   last: 'Davis',      grade: 9,  ell: false, iep: true,  has504: false, gpa: 2.9, risk: 'ON_TRACK' as const,      section: algebraP5 },
    { first: 'Noah',     last: 'Garcia',     grade: 10, ell: false, iep: false, has504: false, gpa: 3.1, risk: 'ON_TRACK' as const,      section: geometryP1 },
    { first: 'Ava',      last: 'Martinez',   grade: 10, ell: false, iep: false, has504: true,  gpa: 2.6, risk: 'WATCH' as const,         section: geometryP1 },
    { first: 'Ethan',    last: 'Miller',     grade: 10, ell: false, iep: false, has504: false, gpa: 1.5, risk: 'NEEDS_SUPPORT' as const, section: geometryP1 },
    { first: 'Isabella', last: 'Wilson',     grade: 10, ell: true,  iep: false, has504: false, gpa: 3.4, risk: 'ON_TRACK' as const,      section: geometryP1 },
    { first: 'Marcus',   last: 'Thompson',   grade: 9,  ell: false, iep: true,  has504: false, gpa: 2.5, risk: 'ON_TRACK' as const,      section: algebraP3 },
  ];

  const guardianNames: [string, string][] = [
    ['Denise', 'Washington'], ['Carmen', 'Rodriguez'], ['Michael', 'Chen'],
    ['Rosa', 'Hernandez'], ['Robert', 'Johnson'], ['Jennifer', 'Williams'],
    ['Stephanie', 'Brown'], ['Amanda', 'Davis'], ['Carlos', 'Garcia'],
    ['Patricia', 'Martinez'], ['Karen', 'Miller'], ['Fatima', 'Wilson'],
    ['Tanya', 'Thompson'],
  ];

  const students: { id: string; index: number; section: typeof algebraP3 }[] = [];

  for (let i = 0; i < studentData.length; i++) {
    const sd = studentData[i];
    const isNew = i === 12; // Marcus Thompson

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
        enrollDate: isNew ? daysAgo(3) : semesterStart,
      },
    });

    students.push({ id: student.id, index: i, section: sd.section });

    const [gFirst, gLast] = guardianNames[i];
    await prisma.guardian.create({
      data: {
        studentId: student.id,
        firstName: gFirst,
        lastName: gLast,
        email: `${gFirst.toLowerCase()}.${gLast.toLowerCase()}@email.com`,
        phone: `(555) ${(200 + i * 3).toString()}-${(4100 + i * 7).toString()}`,
        relation: i % 3 === 0 ? 'Mother' : i % 3 === 1 ? 'Father' : 'Parent',
        isPrimary: true,
      },
    });
  }

  // ─── Assignments ────────────────────────────────────────────────────
  // 5 graded assignments (past) + 1 upcoming quiz (this week) per section.
  //
  // The upcoming quiz triggers ACCOMMODATION ALERTS for students with IEP/504.
  // OLD assignments (graded >14 days ago) vs NEW (graded <14 days ago) creates grade deltas.

  const assignmentDefs = [
    { name: 'Chapter 8 Review',     cat: 'Homework', pts: 20,  dueDaysAgo: 25, gradedDaysAgo: 23 },
    { name: 'Midterm Exam',         cat: 'Test',     pts: 100, dueDaysAgo: 18, gradedDaysAgo: 16 },
    { name: 'Chapter 9 HW',        cat: 'Homework', pts: 20,  dueDaysAgo: 10, gradedDaysAgo: 8 },
    { name: 'Unit 5 Quiz',         cat: 'Quiz',     pts: 20,  dueDaysAgo: 7,  gradedDaysAgo: 5 },
    { name: 'Group Project',       cat: 'Project',  pts: 50,  dueDaysAgo: 3,  gradedDaysAgo: 1 },
    // Upcoming — triggers accommodation alerts
    { name: 'Unit 6 Quiz',         cat: 'Quiz',     pts: 20,  dueDaysAgo: -2, gradedDaysAgo: null },
  ];

  // Deterministic grades per student. null = missing work (isMissing: true).
  // Indices: [Ch8 Review, Midterm, Ch9 HW, Unit5 Quiz, Group Project]
  // Unit 6 Quiz has no grades yet (upcoming).
  //
  // Grade alerts fire when: currentPct < 73% OR delta < -10
  // Missing work shows when: isMissing AND dueDate < today
  //
  // Student               Ch8  Mid  Ch9  U5Q  GrpP  | Total     Pct    Old%    Delta
  // 0  James Washington   16   65    8   null null  | 89/140    63.6%  67.5%   -3.9%  ALERT
  // 1  Maria Rodriguez    17   82   16    17   42   | 174/210   82.9%  82.5%   +0.4%
  // 2  Tyler Chen         16   78   15    15   36   | 160/210   76.2%  78.3%   -2.1%
  // 3  Sofia Hernandez    14   68    6   null null  | 88/140    62.9%  68.3%   -5.4%  ALERT
  // 4  Aiden Johnson      19   95   19    19   48   | 200/210   95.2%  95.0%   +0.2%
  // 5  Emma Williams      18   88   17    18   44   | 185/210   88.1%  88.3%   -0.2%
  // 6  Liam Brown         14   70   10    12  null  | 106/160   66.3%  70.0%   -3.7%  ALERT
  // 7  Olivia Davis       16   76   14    14   34   | 154/210   73.3%  76.7%   -3.3%
  // 8  Noah Garcia        17   80   16    16   40   | 169/210   80.5%  80.8%   -0.3%
  // 9  Ava Martinez       16   76   15    15   36   | 158/210   75.2%  76.7%   -1.4%
  // 10 Ethan Miller       14   78    5   null   15  | 112/190   58.9%  76.7%   -17.7% ALERT (big drop!)
  // 11 Isabella Wilson    17   85   16    17   42   | 177/210   84.3%  85.0%   -0.7%
  // 12 Marcus Thompson    (no grades — enrolled 3 days ago)

  const gradesByStudent: Record<number, (number | null)[]> = {
    0:  [16, 65,  8, null, null],
    1:  [17, 82, 16,  17,  42],
    2:  [16, 78, 15,  15,  36],
    3:  [14, 68,  6, null, null],
    4:  [19, 95, 19,  19,  48],
    5:  [18, 88, 17,  18,  44],
    6:  [14, 70, 10,  12, null],
    7:  [16, 76, 14,  14,  34],
    8:  [17, 80, 16,  16,  40],
    9:  [16, 76, 15,  15,  36],
    10: [14, 78,  5, null,  15],
    11: [17, 85, 16,  17,  42],
    // 12: Marcus — no grades
  };

  for (const section of sections) {
    const sectionStudents = students.filter((s) => s.section.id === section.id);

    for (let a = 0; a < assignmentDefs.length; a++) {
      const adef = assignmentDefs[a];
      const assignment = await prisma.assignment.create({
        data: {
          sectionId: section.id,
          name: adef.name,
          category: adef.cat,
          pointsPossible: adef.pts,
          dueDate: adef.dueDaysAgo >= 0 ? daysAgo(adef.dueDaysAgo) : daysFromNow(-adef.dueDaysAgo),
        },
      });

      // No grades for upcoming assignments
      if (adef.gradedDaysAgo === null) continue;

      for (const student of sectionStudents) {
        const scoreSet = gradesByStudent[student.index];
        if (!scoreSet) continue; // Marcus (index 12) — no grades

        const score = scoreSet[a];
        const missing = score === null;

        await prisma.grade.create({
          data: {
            studentId: student.id,
            assignmentId: assignment.id,
            pointsEarned: missing ? null : score,
            isMissing: missing,
            isLate: !missing && student.index === 6 && a === 3, // Liam's Unit 5 Quiz was late
            gradedAt: missing ? null : daysAgo(adef.gradedDaysAgo),
          },
        });
      }
    }
  }

  // ─── Attendance ─────────────────────────────────────────────────────
  // Deterministic: specific students absent on specific days.
  // The rest are present (with a few scattered tardies for realism).

  // Absence patterns:
  //   James (0):  absent today, yesterday, day-before (3 consecutive) → RED
  //   Sofia (3):  absent today only (1 day) → GRAY
  //   Ethan (10): absent today and yesterday (2 consecutive) → AMBER
  //   Others:     present (occasional past absences for realism)

  for (const student of students) {
    if (student.index === 12) continue; // Marcus — too new for attendance history

    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      if (isWeekend(date)) continue;

      let status: 'PRESENT' | 'ABSENT' | 'TARDY' = 'PRESENT';

      // James — absent 3 consecutive school days
      if (student.index === 0 && d < 3) status = 'ABSENT';
      // Sofia — absent today only
      if (student.index === 3 && d === 0) status = 'ABSENT';
      // Ethan — absent 2 consecutive school days
      if (student.index === 10 && d < 2) status = 'ABSENT';

      // Scattered tardies for realism
      if (student.index === 6 && d === 4) status = 'TARDY';
      if (student.index === 9 && d === 7) status = 'TARDY';
      if (student.index === 1 && d === 11) status = 'TARDY';

      // Scattered past absences (not consecutive, won't trigger today's alerts)
      if (student.index === 7 && d === 14) status = 'ABSENT';
      if (student.index === 6 && d === 18) status = 'ABSENT';
      if (student.index === 8 && d === 22) status = 'ABSENT';

      await prisma.attendanceRecord.create({
        data: { studentId: student.id, date, status },
      });
    }
  }

  // ─── Accommodations ─────────────────────────────────────────────────
  // Tyler Chen (IEP) — will trigger accommodation alert for Unit 6 Quiz
  await prisma.accommodation.create({
    data: {
      studentId: students[2].id, type: 'IEP',
      description: 'Extended time 1.5x on all assessments',
      category: 'Testing', startDate: new Date('2025-08-15'),
    },
  });
  await prisma.accommodation.create({
    data: {
      studentId: students[2].id, type: 'IEP',
      description: 'Check for understanding every 10 minutes',
      category: 'Classroom', startDate: new Date('2025-08-15'),
    },
  });

  // Sofia Hernandez (504) — will trigger accommodation alert for Unit 6 Quiz
  await prisma.accommodation.create({
    data: {
      studentId: students[3].id, type: 'PLAN_504',
      description: 'Preferential seating near teacher',
      category: 'Classroom', startDate: new Date('2025-08-15'),
    },
  });
  await prisma.accommodation.create({
    data: {
      studentId: students[3].id, type: 'PLAN_504',
      description: 'Extended time 1.5x on assessments',
      category: 'Testing', startDate: new Date('2025-08-15'),
    },
  });

  // Olivia Davis (IEP)
  await prisma.accommodation.create({
    data: {
      studentId: students[7].id, type: 'IEP',
      description: 'Reduced distraction testing environment',
      category: 'Testing', startDate: new Date('2025-08-15'),
    },
  });

  // Ava Martinez (504) — will trigger accommodation alert for Unit 6 Quiz
  await prisma.accommodation.create({
    data: {
      studentId: students[9].id, type: 'PLAN_504',
      description: 'Extended time 2x on all assessments',
      category: 'Testing', startDate: new Date('2025-08-15'),
    },
  });
  await prisma.accommodation.create({
    data: {
      studentId: students[9].id, type: 'PLAN_504',
      description: 'Graphic organizer provided for written responses',
      category: 'Classroom', startDate: new Date('2025-08-15'),
    },
  });

  // Marcus Thompson (IEP) — new student
  await prisma.accommodation.create({
    data: {
      studentId: students[12].id, type: 'IEP',
      description: 'Extended time 1.5x on assessments',
      category: 'Testing', startDate: new Date('2025-08-15'),
    },
  });

  // ─── Interventions ──────────────────────────────────────────────────
  await prisma.intervention.create({
    data: {
      studentId: students[0].id, // James
      tier: 'TIER_2',
      type: 'Daily Check-In',
      description: 'Daily 2-minute morning check-in to build rapport and monitor engagement.',
      teacherRole: '2-minute morning check-in, ask about homework completion.',
      startDate: new Date('2026-02-01'),
      status: 'ACTIVE',
    },
  });

  await prisma.intervention.create({
    data: {
      studentId: students[3].id, // Sofia
      tier: 'TIER_2',
      type: 'Modified Homework',
      description: 'Reduce homework volume by 50% while maintaining key skill practice.',
      teacherRole: 'Provide modified assignment list each Monday. Track completion.',
      startDate: new Date('2026-01-15'),
      status: 'ACTIVE',
    },
  });

  await prisma.intervention.create({
    data: {
      studentId: students[10].id, // Ethan
      tier: 'TIER_2',
      type: 'Peer Tutoring',
      description: 'Paired with high-performing student for 20-minute sessions twice weekly.',
      teacherRole: 'Facilitate pairing, provide structured problems, check progress weekly.',
      startDate: new Date('2026-02-10'),
      status: 'ACTIVE',
    },
  });

  // ─── Assessment Scores ──────────────────────────────────────────────
  const mapScores = [195, 218, 210, 188, 235, 228, 203, 212, 220, 207, 192, 225, 205];
  const mapPercentiles = [22, 55, 42, 15, 82, 72, 30, 45, 58, 35, 18, 70, 33];

  for (let i = 0; i < students.length; i++) {
    await prisma.assessmentScore.create({
      data: {
        studentId: students[i].id,
        assessmentName: 'MAP Math Fall 2025',
        assessmentType: 'MAP',
        subject: 'Math',
        score: mapScores[i],
        percentile: mapPercentiles[i],
        testDate: new Date('2025-09-15'),
      },
    });
  }

  // ─── Observations ───────────────────────────────────────────────────
  // James — attendance concern (recent, keeps him in teacher's awareness)
  await prisma.observation.create({
    data: {
      studentId: students[0].id, teacherId: teacher.id,
      category: 'ATTENDANCE', severity: 'CONCERN',
      content: 'James has been arriving late to class consistently. Appeared tired and disengaged during group work. Third absence this week.',
    },
  });

  // Sofia — academic concern (urgent)
  await prisma.observation.create({
    data: {
      studentId: students[3].id, teacherId: teacher.id,
      category: 'ACADEMIC', severity: 'URGENT',
      content: 'Sofia is struggling significantly with quadratic equations. Unable to complete problems independently. Language barrier may be compounding the issue.',
    },
  });

  // Aiden — positive (recent → keeps him OUT of relationship monitor)
  await prisma.observation.create({
    data: {
      studentId: students[4].id, teacherId: teacher.id,
      category: 'POSITIVE', severity: 'POSITIVE',
      content: 'Aiden showed excellent leadership during the group project. Helped two struggling classmates understand the material without being asked.',
    },
  });

  // Maria — positive (recent → keeps her OUT of relationship monitor)
  await prisma.observation.create({
    data: {
      studentId: students[1].id, teacherId: teacher.id,
      category: 'POSITIVE', severity: 'POSITIVE',
      content: 'Maria volunteered to help translate instructions for a new ELL student. Showed exceptional empathy and patience.',
    },
  });

  // Ethan — behavioral concern
  await prisma.observation.create({
    data: {
      studentId: students[10].id, teacherId: teacher.id,
      category: 'BEHAVIORAL', severity: 'CONCERN',
      content: 'Ethan was visibly frustrated during the lesson and shut down during independent practice. Would not engage with peers or accept help.',
      createdAt: daysAgo(5),
    },
  });

  // Liam — academic concern
  await prisma.observation.create({
    data: {
      studentId: students[6].id, teacherId: teacher.id,
      category: 'ACADEMIC', severity: 'CONCERN',
      content: 'Liam scored 60% on the Unit 5 Quiz after scoring 90% on the midterm. The drop suggests gaps in the new material on systems of equations.',
      createdAt: daysAgo(4),
    },
  });

  // ─── Parent Contacts ────────────────────────────────────────────────
  // James — concern contact (recent → keeps him out of relationship monitor)
  await prisma.parentContact.create({
    data: {
      studentId: students[0].id, teacherId: teacher.id,
      method: 'PHONE',
      subject: 'Attendance concerns — 3rd absence',
      notes: 'Called Denise Washington to discuss recent absences. She mentioned James is dealing with a family situation. She appreciated the call and will encourage him to attend. Following up next week.',
      sentiment: 'CONCERN',
    },
  });

  // Aiden — positive contact (recent)
  await prisma.parentContact.create({
    data: {
      studentId: students[4].id, teacherId: teacher.id,
      method: 'EMAIL',
      subject: 'Great work on the group project!',
      notes: 'Sent email to Robert Johnson highlighting Aiden\'s leadership during the group project. Parent replied thanking me.',
      sentiment: 'POSITIVE',
    },
  });

  // Sofia — concern contact (recent)
  await prisma.parentContact.create({
    data: {
      studentId: students[3].id, teacherId: teacher.id,
      method: 'PHONE',
      subject: 'Academic support discussion',
      notes: 'Spoke with Rosa Hernandez about Sofia\'s struggles with quadratic equations. Discussed tutoring options and the modified homework plan.',
      sentiment: 'CONCERN',
      createdAt: daysAgo(5),
    },
  });

  // ─── Notifications ──────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      teacherId: teacher.id, schoolId: school.id, studentId: students[0].id,
      type: 'ABSENT_STREAK',
      title: 'James Washington — 3 consecutive absences',
      body: 'James Washington has been absent for 3 consecutive school days. Consider reaching out to parent/guardian.',
      channel: 'BOTH',
    },
  });

  await prisma.notification.create({
    data: {
      teacherId: teacher.id, schoolId: school.id, studentId: students[3].id,
      type: 'GRADE_DROP',
      title: 'Sofia Hernandez — Grade dropped to D',
      body: 'Sofia\'s grade in Algebra I (P3) has dropped from 68% to 63%. Two missing assignments are contributing.',
      channel: 'IN_APP',
    },
  });

  await prisma.notification.create({
    data: {
      teacherId: teacher.id, schoolId: school.id, studentId: students[10].id,
      type: 'GRADE_DROP',
      title: 'Ethan Miller — Grade dropped 18 points',
      body: 'Ethan\'s grade in Geometry (P1) dropped from 77% to 59%. He had been passing until recently.',
      channel: 'BOTH',
    },
  });

  await prisma.notification.create({
    data: {
      teacherId: teacher.id, schoolId: school.id,
      type: 'ACCOMMODATION_REMINDER',
      title: 'Unit 6 Quiz this week — 4 students need accommodations',
      body: 'Tyler Chen (IEP), Sofia Hernandez (504), Olivia Davis (IEP), and Ava Martinez (504) have accommodations for the Unit 6 Quiz.',
      channel: 'IN_APP',
    },
  });

  await prisma.notification.create({
    data: {
      teacherId: teacher.id, schoolId: school.id,
      type: 'NEW_STUDENT',
      title: 'New student: Marcus Thompson',
      body: 'Marcus Thompson has been enrolled in your Algebra I (P3) class. He has an active IEP.',
      channel: 'IN_APP',
    },
  });

  // ─── Action Items (full lifecycle demo) ─────────────────────────────

  // 1. COMPLETED + REVIEWED: IMPROVED — Liam's grade was addressed, it worked
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[6].id, // Liam
      triggerType: 'GRADE_ALERT',
      title: "Address Liam's grade drop in Algebra I (P5)",
      suggestedAction: 'Check in on grade drop',
      status: 'COMPLETED',
      completedAt: daysAgo(5),
      actionTaken: '1on1_conference',
      completionNotes: 'Had a 10-minute conference. Liam missed key concepts from Chapter 9 on systems of equations. Scheduled him for peer tutoring with Emma.',
      reviewAfterDays: 3,
      reviewDueAt: daysAgo(2),
      outcomeStatus: 'IMPROVED',
      outcomeNotes: 'Liam scored 85% on a practice quiz after tutoring sessions. Engagement is much better. Will keep monitoring.',
      outcomeReviewedAt: daysAgo(1),
    },
  });

  // 2. COMPLETED + REVIEWED: NO_CHANGE — James absences, called home but still absent
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[0].id, // James
      triggerType: 'ABSENT',
      title: "Check in on James's absences (day 2)",
      suggestedAction: 'Reach out about absences',
      status: 'COMPLETED',
      completedAt: daysAgo(4),
      actionTaken: 'called_home',
      completionNotes: 'Spoke with Denise Washington. Family situation ongoing — she said James should be back soon.',
      reviewAfterDays: 3,
      reviewDueAt: daysAgo(1),
      outcomeStatus: 'NO_CHANGE',
      outcomeNotes: 'James is still absent (day 3 now). Will refer to counselor if not back by Monday.',
      outcomeReviewedAt: today,
    },
  });

  // 3. COMPLETED + PENDING REVIEW — Ethan's missing work was addressed, waiting to check
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[10].id, // Ethan
      triggerType: 'MISSING_WORK',
      triggerRef: 'Chapter 9 HW',
      title: "Follow up on Ethan's missing Chapter 9 HW",
      suggestedAction: 'Follow up on missing work',
      status: 'COMPLETED',
      completedAt: daysAgo(3),
      actionTaken: 'new_deadline',
      completionNotes: 'Extended deadline by 3 days. Ethan said he was confused about the word problems. Walked through two examples together.',
      reviewAfterDays: 3,
      reviewDueAt: today,
      outcomeStatus: 'PENDING',
    },
  });

  // 4. COMPLETED + PENDING REVIEW — Sofia's parent contact, waiting to check
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[3].id, // Sofia
      triggerType: 'GRADE_ALERT',
      title: "Intervene on Sofia's failing grade in Algebra I",
      suggestedAction: 'Intervene on failing grade',
      status: 'COMPLETED',
      completedAt: daysAgo(4),
      actionTaken: 'parent_contact',
      completionNotes: 'Called Rosa Hernandez. Discussed modified homework plan and extra tutoring sessions.',
      reviewAfterDays: 3,
      reviewDueAt: daysAgo(1),
      outcomeStatus: 'PENDING',
    },
  });

  // 5. PENDING — accommodation prep not yet done
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[2].id, // Tyler
      triggerType: 'ACCOMMODATION',
      triggerRef: 'Unit 6 Quiz',
      title: "Prepare accommodations for Tyler's Unit 6 Quiz",
      suggestedAction: 'Confirm accommodations are ready',
      status: 'PENDING',
      reviewAfterDays: 3,
    },
  });

  // 6. PENDING — new student welcome
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[12].id, // Marcus
      triggerType: 'NEW_STUDENT',
      title: 'Welcome Marcus Thompson to Algebra I',
      suggestedAction: 'Welcome and onboard new student',
      status: 'PENDING',
      reviewAfterDays: 5,
      createdAt: daysAgo(2),
    },
  });

  // 7. PENDING — relationship check-in
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[5].id, // Emma
      triggerType: 'RELATIONSHIP',
      title: 'Reconnect with Emma (22 days since last contact)',
      suggestedAction: 'Have a positive interaction',
      status: 'PENDING',
      reviewAfterDays: 3,
      createdAt: daysAgo(1),
    },
  });

  // 8. COMPLETED + REVIEWED: IMPROVED — relationship action
  await prisma.actionItem.create({
    data: {
      teacherId: teacher.id,
      studentId: students[1].id, // Maria
      triggerType: 'RELATIONSHIP',
      title: 'Reconnect with Maria',
      suggestedAction: 'Have a positive interaction',
      status: 'COMPLETED',
      completedAt: daysAgo(6),
      actionTaken: 'positive_comment',
      completionNotes: 'Praised Maria publicly for helping the new ELL student. She beamed.',
      reviewAfterDays: 3,
      reviewDueAt: daysAgo(3),
      outcomeStatus: 'IMPROVED',
      outcomeNotes: 'Maria has been more engaged and volunteering more in class since.',
      outcomeReviewedAt: daysAgo(2),
    },
  });

  console.log('');
  console.log('Demo seed completed!');
  console.log('─────────────────────────────────────────');
  console.log(`Created: 1 district, 1 school, 1 teacher, 3 sections, ${students.length} students`);
  console.log('');
  console.log('Expected briefing state:');
  console.log('  Absent Today:        3 (James 3d, Ethan 2d, Sofia 1d)');
  console.log('  Grade Alerts:        4 (James 63%, Sofia 63%, Liam 66%, Ethan 59%)');
  console.log('  Missing Work:        6 items across 4 students');
  console.log('  Intervention Tasks:  3 (James, Sofia, Ethan)');
  console.log('  Accommodation Alerts: 3-4 (Tyler, Sofia, Olivia, Ava — Unit 6 Quiz)');
  console.log('  New Students:        1 (Marcus Thompson, IEP)');
  console.log('  Relationship Monitor: 4+ students without recent positive contact');
  console.log('');
  console.log('Action Items dashboard:');
  console.log('  Pending:             3 (Tyler accommodation, Marcus welcome, Emma relationship)');
  console.log('  Pending Review:      2 (Ethan missing work, Sofia grade alert)');
  console.log('  Outcomes:            3 (Liam IMPROVED, James NO_CHANGE, Maria IMPROVED)');
  console.log('');
  console.log('Login: teacher@demo.edu');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
