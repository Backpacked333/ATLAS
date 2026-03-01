import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AtlasED Classroom database...');

  const district = await prisma.district.create({
    data: { name: 'Lincoln Unified School District', state: 'CA' },
  });
  const school = await prisma.school.create({
    data: { districtId: district.id, name: 'Lincoln High School', gradeSpan: '9-12' },
  });
  const teacher = await prisma.teacher.create({
    data: { schoolId: school.id, email: 'teacher@demo.edu', firstName: 'Sarah', lastName: 'Martinez' },
  });
  const counselor = await prisma.counselor.create({
    data: { schoolId: school.id, email: 'counselor@demo.edu', firstName: 'David', lastName: 'Chen' },
  });

  const algebraP3 = await prisma.section.create({
    data: { schoolId: school.id, courseName: 'Algebra I', period: 'P3', semester: '2025-26 S2', room: '204' },
  });
  const algebraP5 = await prisma.section.create({
    data: { schoolId: school.id, courseName: 'Algebra I', period: 'P5', semester: '2025-26 S2', room: '204' },
  });
  const geometryP1 = await prisma.section.create({
    data: { schoolId: school.id, courseName: 'Geometry', period: 'P1', semester: '2025-26 S2', room: '204' },
  });

  const sections = [algebraP3, algebraP5, geometryP1];
  for (const section of sections) {
    await prisma.teacherSection.create({ data: { teacherId: teacher.id, sectionId: section.id } });
  }

  // ── 28 Story-Driven Students ──────────────────────────────────────
  type Risk = 'ON_TRACK' | 'NEEDS_SUPPORT' | 'URGENT';
  interface StudentDef {
    first: string; last: string; grade: number;
    ell: boolean; iep: boolean; has504: boolean;
    gpa: number; risk: Risk;
    section: typeof algebraP3; story: string;
  }

  const studentData: StudentDef[] = [
    // Algebra I P3 (10)
    { first: 'James', last: 'Washington', grade: 9, ell: false, iep: false, has504: false, gpa: 2.1, risk: 'URGENT', section: algebraP3, story: 'attendance-crisis' },
    { first: 'Sofia', last: 'Hernandez', grade: 9, ell: true, iep: false, has504: true, gpa: 1.9, risk: 'URGENT', section: algebraP3, story: 'ell-504-struggling' },
    { first: 'Aiden', last: 'Johnson', grade: 9, ell: false, iep: false, has504: false, gpa: 3.8, risk: 'ON_TRACK', section: algebraP3, story: 'star-student' },
    { first: 'Maria', last: 'Rodriguez', grade: 9, ell: true, iep: false, has504: false, gpa: 3.2, risk: 'ON_TRACK', section: algebraP3, story: 'steady-ell' },
    { first: 'Tyler', last: 'Chen', grade: 9, ell: false, iep: true, has504: false, gpa: 2.8, risk: 'ON_TRACK', section: algebraP3, story: 'iep-progressing' },
    { first: 'Zoe', last: 'Kim', grade: 9, ell: false, iep: false, has504: false, gpa: 3.5, risk: 'ON_TRACK', section: algebraP3, story: 'solid-student' },
    { first: 'Marcus', last: 'Thompson', grade: 9, ell: false, iep: false, has504: false, gpa: 2.5, risk: 'NEEDS_SUPPORT', section: algebraP3, story: 'new-transfer' },
    { first: 'DeShawn', last: 'Williams', grade: 9, ell: false, iep: false, has504: false, gpa: 2.6, risk: 'NEEDS_SUPPORT', section: algebraP3, story: 'tardy-disengaged' },
    { first: 'Hannah', last: 'Baker', grade: 9, ell: false, iep: false, has504: false, gpa: 3.0, risk: 'ON_TRACK', section: algebraP3, story: 'average' },
    { first: 'Carlos', last: 'Rivera', grade: 9, ell: false, iep: false, has504: false, gpa: 2.3, risk: 'NEEDS_SUPPORT', section: algebraP3, story: 'turnaround' },
    // Algebra I P5 (9)
    { first: 'Emma', last: 'Williams', grade: 9, ell: false, iep: false, has504: false, gpa: 3.5, risk: 'ON_TRACK', section: algebraP5, story: 'solid-student' },
    { first: 'Liam', last: 'Brown', grade: 9, ell: false, iep: false, has504: false, gpa: 2.4, risk: 'NEEDS_SUPPORT', section: algebraP5, story: 'needs-help' },
    { first: 'Olivia', last: 'Davis', grade: 9, ell: false, iep: true, has504: false, gpa: 2.9, risk: 'ON_TRACK', section: algebraP5, story: 'iep-progressing' },
    { first: 'Priya', last: 'Patel', grade: 9, ell: false, iep: false, has504: false, gpa: 3.9, risk: 'ON_TRACK', section: algebraP5, story: 'test-anxiety' },
    { first: 'Jordan', last: 'Lee', grade: 9, ell: false, iep: false, has504: false, gpa: 3.1, risk: 'ON_TRACK', section: algebraP5, story: 'average' },
    { first: 'Lily', last: 'Nguyen', grade: 9, ell: true, iep: false, has504: false, gpa: 3.0, risk: 'ON_TRACK', section: algebraP5, story: 'ell-growth' },
    { first: 'Ryan', last: "O'Brien", grade: 9, ell: false, iep: false, has504: false, gpa: 2.7, risk: 'NEEDS_SUPPORT', section: algebraP5, story: 'needs-help' },
    { first: 'Jasmine', last: 'Taylor', grade: 9, ell: false, iep: false, has504: true, gpa: 2.5, risk: 'NEEDS_SUPPORT', section: algebraP5, story: '504-support' },
    { first: 'Brandon', last: 'Scott', grade: 9, ell: false, iep: false, has504: false, gpa: 3.3, risk: 'ON_TRACK', section: algebraP5, story: 'solid-student' },
    // Geometry P1 (9)
    { first: 'Noah', last: 'Garcia', grade: 10, ell: false, iep: false, has504: false, gpa: 3.1, risk: 'ON_TRACK', section: geometryP1, story: 'average' },
    { first: 'Ava', last: 'Martinez', grade: 10, ell: false, iep: false, has504: true, gpa: 2.6, risk: 'NEEDS_SUPPORT', section: geometryP1, story: '504-support' },
    { first: 'Ethan', last: 'Miller', grade: 10, ell: false, iep: false, has504: false, gpa: 1.5, risk: 'URGENT', section: geometryP1, story: 'failing-urgent' },
    { first: 'Isabella', last: 'Wilson', grade: 10, ell: true, iep: false, has504: false, gpa: 3.4, risk: 'ON_TRACK', section: geometryP1, story: 'steady-ell' },
    { first: 'Maya', last: 'Robinson', grade: 10, ell: false, iep: true, has504: false, gpa: 2.7, risk: 'ON_TRACK', section: geometryP1, story: 'iep-progressing' },
    { first: 'Daniel', last: 'Park', grade: 10, ell: false, iep: false, has504: false, gpa: 3.6, risk: 'ON_TRACK', section: geometryP1, story: 'solid-student' },
    { first: 'Aaliyah', last: 'Jackson', grade: 10, ell: false, iep: false, has504: false, gpa: 3.0, risk: 'ON_TRACK', section: geometryP1, story: 'average' },
    { first: 'Kevin', last: 'Zhang', grade: 10, ell: false, iep: false, has504: false, gpa: 3.7, risk: 'ON_TRACK', section: geometryP1, story: 'star-student' },
    { first: 'Samantha', last: 'Cooper', grade: 10, ell: false, iep: false, has504: false, gpa: 2.8, risk: 'ON_TRACK', section: geometryP1, story: 'average' },
  ];

  interface StudentRecord { id: string; section: typeof algebraP3; story: string; firstName: string; lastName: string }
  const students: StudentRecord[] = [];

  const guardianMap: Record<string, string> = {
    Washington: 'Patricia', Hernandez: 'Carmen', Johnson: 'Michelle', Rodriguez: 'Elena',
    Chen: 'Linda', Kim: 'Soo-Jin', Thompson: 'Angela', Williams: 'Denise',
    Baker: 'Jennifer', Rivera: 'Lucia', Brown: 'Catherine', Davis: 'Stephanie',
    Patel: 'Anita', Lee: 'Susan', Nguyen: 'Thuy', Taylor: 'Keisha',
    Scott: 'Laura', Garcia: 'Maria', Martinez: 'Rosa', Miller: 'Karen',
    Wilson: 'Camila', Robinson: 'Tanya', Park: 'Eunji', Jackson: 'Monique',
    Zhang: 'Li', Cooper: 'Diana', "O'Brien": 'Megan',
  };

  for (let i = 0; i < studentData.length; i++) {
    const sd = studentData[i];
    const student = await prisma.student.create({
      data: {
        schoolId: school.id, studentIdNo: `STU${(1000 + i)}`,
        firstName: sd.first, lastName: sd.last, gradeLevel: sd.grade,
        ellStatus: sd.ell, iepActive: sd.iep, has504: sd.has504,
        cumulativeGpa: sd.gpa, riskTier: sd.risk,
      },
    });
    await prisma.enrollment.create({
      data: { studentId: student.id, sectionId: sd.section.id, status: 'ACTIVE' },
    });
    students.push({ id: student.id, section: sd.section, story: sd.story, firstName: sd.first, lastName: sd.last });

    const gName = guardianMap[sd.last] || 'Parent';
    const cleanFirst = gName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = sd.last.toLowerCase().replace(/[^a-z]/g, '');
    await prisma.guardian.create({
      data: {
        studentId: student.id, firstName: gName, lastName: sd.last,
        email: `${cleanFirst}.${cleanLast}@email.com`,
        phone: `(555) ${200 + i}-${(3000 + i * 13).toString().slice(0, 4)}`,
        relation: 'Mother', isPrimary: true,
      },
    });
  }

  // ── Story-Driven Grade Profiles ───────────────────────────────────
  const today = new Date();
  const assignmentTemplates = [
    { name: 'Unit 5 Quiz: Linear Equations', category: 'Quiz', points: 25, daysAgo: 2 },
    { name: 'Chapter 10 Homework', category: 'Homework', points: 20, daysAgo: 4 },
    { name: 'Midterm Exam', category: 'Test', points: 100, daysAgo: 10 },
    { name: 'Weekly Problem Set 8', category: 'Homework', points: 20, daysAgo: 7 },
    { name: 'Weekly Problem Set 7', category: 'Homework', points: 20, daysAgo: 14 },
    { name: 'Group Project: Real-World Applications', category: 'Project', points: 50, daysAgo: 18 },
    { name: 'Chapter 9 Homework', category: 'Homework', points: 20, daysAgo: 21 },
    { name: 'Unit 4 Test: Systems of Equations', category: 'Test', points: 100, daysAgo: 25 },
    { name: 'Weekly Problem Set 6', category: 'Homework', points: 20, daysAgo: 28 },
    { name: 'Chapter 8 Homework', category: 'Homework', points: 20, daysAgo: 32 },
  ];

  // Each array = 10 scores matching assignmentTemplates. -1 means missing.
  function getGradeProfile(story: string): number[] {
    switch (story) {
      case 'attendance-crisis':   return [0.72, 0.70, 0.65, 0.55, -1, -1, 0.60, 0.75, 0.73, 0.78];
      case 'ell-504-struggling':  return [0.58, 0.52, 0.45, 0.48, 0.42, 0.50, 0.55, 0.40, 0.38, 0.35];
      case 'star-student':        return [0.96, 0.98, 0.94, 0.95, 0.92, 0.97, 0.93, 0.91, 0.95, 0.90];
      case 'steady-ell':          return [0.82, 0.80, 0.78, 0.85, 0.83, 0.79, 0.81, 0.76, 0.80, 0.77];
      case 'iep-progressing':     return [0.74, 0.70, 0.68, 0.72, 0.75, 0.65, 0.70, 0.62, 0.66, 0.60];
      case 'solid-student':       return [0.88, 0.85, 0.82, 0.87, 0.84, 0.90, 0.86, 0.83, 0.85, 0.81];
      case 'new-transfer':        return [0.70, 0.65, -1, -1, -1, -1, -1, -1, -1, -1];
      case 'tardy-disengaged':    return [0.78, -1, 0.72, 0.60, 0.82, -1, 0.75, 0.70, -1, 0.68];
      case 'turnaround':          return [0.75, 0.72, 0.65, 0.68, 0.55, 0.48, 0.42, 0.40, 0.38, 0.35];
      case 'average':             return [0.78, 0.75, 0.72, 0.76, 0.74, 0.80, 0.73, 0.71, 0.75, 0.70];
      case 'needs-help':          return [0.65, 0.62, 0.58, 0.60, 0.63, 0.55, 0.58, 0.60, 0.57, 0.55];
      case 'test-anxiety':        return [0.85, 0.92, 0.68, 0.90, 0.88, 0.95, 0.72, 0.93, 0.91, 0.94];
      case 'ell-growth':          return [0.82, 0.78, 0.75, 0.72, 0.68, 0.65, 0.60, 0.55, 0.50, 0.45];
      case '504-support':         return [0.70, 0.68, 0.65, 0.72, 0.67, 0.63, 0.70, 0.60, 0.65, 0.58];
      case 'failing-urgent':      return [0.35, -1, 0.30, -1, 0.40, -1, 0.28, 0.45, 0.42, 0.50];
      default:                    return [0.75, 0.73, 0.70, 0.72, 0.71, 0.74, 0.68, 0.70, 0.72, 0.69];
    }
  }

  for (const section of sections) {
    const sectionStudents = students.filter((s) => s.section.id === section.id);
    for (let a = 0; a < assignmentTemplates.length; a++) {
      const tmpl = assignmentTemplates[a];
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() - tmpl.daysAgo);
      const assignment = await prisma.assignment.create({
        data: { sectionId: section.id, name: tmpl.name, category: tmpl.category, pointsPossible: tmpl.points, dueDate },
      });
      for (const si of sectionStudents) {
        const profile = getGradeProfile(si.story);
        const scorePct = profile[a];
        const isMissing = scorePct < 0;
        await prisma.grade.create({
          data: {
            studentId: si.id, assignmentId: assignment.id,
            pointsEarned: isMissing ? null : Math.round(scorePct * tmpl.points * 10) / 10,
            isMissing,
            isLate: !isMissing && Math.random() < (si.story === 'tardy-disengaged' ? 0.3 : 0.05),
            gradedAt: isMissing ? null : dueDate,
          },
        });
      }
    }
  }

  // ── Story-Driven Attendance ───────────────────────────────────────
  for (const si of students) {
    for (let d = 0; d < 40; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      let status: 'PRESENT' | 'ABSENT' | 'TARDY' = 'PRESENT';
      switch (si.story) {
        case 'attendance-crisis':
          if (d < 3) status = 'ABSENT';
          else if (d < 10 && Math.random() < 0.3) status = 'ABSENT';
          else if (Math.random() < 0.1) status = 'TARDY';
          break;
        case 'tardy-disengaged':
          if (Math.random() < 0.35) status = 'TARDY';
          else if (Math.random() < 0.05) status = 'ABSENT';
          break;
        case 'failing-urgent':
          if (Math.random() < 0.2) status = 'ABSENT';
          else if (Math.random() < 0.1) status = 'TARDY';
          break;
        case 'new-transfer':
          if (d > 10) continue;
          break;
        default:
          if (Math.random() < 0.03) status = 'ABSENT';
          else if (Math.random() < 0.05) status = 'TARDY';
          break;
      }
      await prisma.attendanceRecord.create({ data: { studentId: si.id, date, status } });
    }
  }

  // ── Accommodations ────────────────────────────────────────────────
  const find = (first: string, last: string) => students.find((s) => s.firstName === first && s.lastName === last)!;

  await prisma.accommodation.createMany({ data: [
    { studentId: find('Tyler', 'Chen').id, type: 'IEP', description: 'Extended time 1.5x on all assessments', category: 'Testing', startDate: new Date('2025-08-15') },
    { studentId: find('Tyler', 'Chen').id, type: 'IEP', description: 'Check for understanding every 10 minutes', category: 'Classroom', startDate: new Date('2025-08-15') },
    { studentId: find('Tyler', 'Chen').id, type: 'IEP', description: 'Preferential seating near teacher', category: 'Classroom', startDate: new Date('2025-08-15') },
  ]});
  await prisma.accommodation.createMany({ data: [
    { studentId: find('Sofia', 'Hernandez').id, type: 'PLAN_504', description: 'Preferential seating near teacher', category: 'Classroom', startDate: new Date('2025-08-15') },
    { studentId: find('Sofia', 'Hernandez').id, type: 'PLAN_504', description: 'Extended time 1.5x on assessments', category: 'Testing', startDate: new Date('2025-08-15') },
    { studentId: find('Sofia', 'Hernandez').id, type: 'PLAN_504', description: 'Translated instructions in Spanish when available', category: 'Classroom', startDate: new Date('2025-08-15') },
    { studentId: find('Sofia', 'Hernandez').id, type: 'PLAN_504', description: 'Calculator permitted on all assignments', category: 'Testing', startDate: new Date('2025-08-15') },
  ]});
  await prisma.accommodation.createMany({ data: [
    { studentId: find('Olivia', 'Davis').id, type: 'IEP', description: 'Extended time 2x on tests', category: 'Testing', startDate: new Date('2025-08-15') },
    { studentId: find('Olivia', 'Davis').id, type: 'IEP', description: 'Reduced homework volume (every other problem)', category: 'Classroom', startDate: new Date('2025-08-15') },
  ]});
  await prisma.accommodation.createMany({ data: [
    { studentId: find('Jasmine', 'Taylor').id, type: 'PLAN_504', description: 'Breaks every 20 minutes during testing', category: 'Testing', startDate: new Date('2025-08-15') },
    { studentId: find('Jasmine', 'Taylor').id, type: 'PLAN_504', description: 'Access to noise-canceling headphones', category: 'Classroom', startDate: new Date('2025-08-15') },
  ]});
  await prisma.accommodation.createMany({ data: [
    { studentId: find('Maya', 'Robinson').id, type: 'IEP', description: 'Extended time 1.5x on all assessments', category: 'Testing', startDate: new Date('2025-08-15') },
    { studentId: find('Maya', 'Robinson').id, type: 'IEP', description: 'Graphic organizers for note-taking', category: 'Classroom', startDate: new Date('2025-08-15') },
    { studentId: find('Maya', 'Robinson').id, type: 'IEP', description: 'Written instructions in addition to verbal', category: 'Classroom', startDate: new Date('2025-08-15') },
  ]});
  await prisma.accommodation.createMany({ data: [
    { studentId: find('Ava', 'Martinez').id, type: 'PLAN_504', description: 'Extended time 1.5x on assessments', category: 'Testing', startDate: new Date('2025-08-15') },
    { studentId: find('Ava', 'Martinez').id, type: 'PLAN_504', description: 'Frequent check-ins during independent work', category: 'Classroom', startDate: new Date('2025-08-15') },
  ]});

  // ── Interventions ─────────────────────────────────────────────────
  const jamesIntervention = await prisma.intervention.create({
    data: {
      studentId: find('James', 'Washington').id, tier: 'TIER_2', type: 'Daily Check-In',
      description: 'Daily 2-minute morning check-in to build rapport and monitor engagement. Focus on attendance barriers.',
      teacherRole: '2-minute morning check-in before class. Ask about homework completion and barriers to attending. Log each interaction.',
      startDate: new Date('2026-02-01'), status: 'ACTIVE',
    },
  });
  await prisma.intervention.create({
    data: {
      studentId: find('James', 'Washington').id, tier: 'TIER_2', type: 'Parent Communication Plan',
      description: 'Weekly parent contact via phone/email about attendance and academic progress.',
      teacherRole: 'Contact parent every Friday afternoon. Document each contact attempt and response.',
      startDate: new Date('2026-02-15'), status: 'ACTIVE',
    },
  });
  await prisma.intervention.create({
    data: {
      studentId: find('Sofia', 'Hernandez').id, tier: 'TIER_2', type: 'Modified Homework',
      description: 'Reduce homework volume by 50% while maintaining key skill practice. Provide bilingual supports.',
      teacherRole: 'Provide modified assignment list each Monday. Track completion rates.',
      startDate: new Date('2026-01-15'), status: 'ACTIVE',
    },
  });
  await prisma.intervention.create({
    data: {
      studentId: find('Carlos', 'Rivera').id, tier: 'TIER_2', type: 'Daily Check-In',
      description: 'Daily morning check-in focused on homework completion. Student has shown marked improvement.',
      teacherRole: 'Brief check-in each morning. Positive reinforcement for completed work. Consider stepping down to Tier 1.',
      startDate: new Date('2026-01-10'), status: 'ACTIVE',
    },
  });
  await prisma.intervention.create({
    data: {
      studentId: find('Ethan', 'Miller').id, tier: 'TIER_2', type: 'Peer Tutoring',
      description: 'Paired with peer tutor for 30 min twice/week during study hall.',
      teacherRole: 'Check in with tutor and Ethan weekly. Monitor assignment completion.',
      startDate: new Date('2026-02-10'), status: 'ACTIVE',
    },
  });
  await prisma.intervention.create({
    data: {
      studentId: find('DeShawn', 'Williams').id, tier: 'TIER_1', type: 'Attendance Monitoring',
      description: 'Track tardiness pattern and provide positive reinforcement for on-time arrival.',
      teacherRole: 'Note arrival time daily. Verbal acknowledgment when on time. Contact parent if 3+ tardies in a week.',
      startDate: new Date('2026-02-20'), status: 'ACTIVE',
    },
  });

  // Intervention logs for James
  for (let d = 1; d <= 10; d++) {
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - d);
    if (logDate.getDay() === 0 || logDate.getDay() === 6) continue;
    await prisma.interventionLog.create({
      data: {
        interventionId: jamesIntervention.id, teacherId: teacher.id, date: logDate,
        completionStatus: d <= 3 ? 'NOT_COMPLETED' : d <= 6 ? 'PARTIALLY_COMPLETED' : 'COMPLETED',
        notes: d <= 3 ? 'James absent. Could not complete check-in.'
          : d <= 6 ? 'Brief hallway conversation. James seemed distracted but confirmed he has his materials.'
          : 'Full check-in completed. James engaged and had homework ready.',
      },
    });
  }

  // ── Assessment Scores (MAP with growth) ───────────────────────────
  for (const si of students) {
    let mapScore: number;
    let percentile: number;
    switch (si.story) {
      case 'star-student':       mapScore = 238; percentile = 88; break;
      case 'attendance-crisis':  mapScore = 210; percentile = 35; break;
      case 'ell-504-struggling': mapScore = 195; percentile = 18; break;
      case 'failing-urgent':     mapScore = 188; percentile = 12; break;
      case 'test-anxiety':       mapScore = 235; percentile = 85; break;
      case 'ell-growth':         mapScore = 208; percentile = 32; break;
      case 'turnaround':         mapScore = 212; percentile = 38; break;
      default: mapScore = 215 + Math.round(Math.random() * 20); percentile = 40 + Math.round(Math.random() * 30); break;
    }
    await prisma.assessmentScore.create({
      data: { studentId: si.id, assessmentName: 'MAP Math Fall 2025', assessmentType: 'MAP', subject: 'Math', score: mapScore, percentile, testDate: new Date('2025-09-15') },
    });
    const growth = si.story === 'ell-growth' ? 12 : si.story === 'turnaround' ? 5 : si.story === 'attendance-crisis' ? -3 : Math.round(Math.random() * 6);
    await prisma.assessmentScore.create({
      data: {
        studentId: si.id, assessmentName: 'MAP Math Winter 2026', assessmentType: 'MAP', subject: 'Math',
        score: mapScore + growth, percentile: Math.min(99, Math.max(1, percentile + Math.round(growth / 2))),
        testDate: new Date('2026-01-10'),
      },
    });
  }

  // ── Rich Teacher Observations ─────────────────────────────────────
  const james = find('James', 'Washington');
  const sofia = find('Sofia', 'Hernandez');
  const carlos = find('Carlos', 'Rivera');
  const ethan = find('Ethan', 'Miller');
  const deshawn = find('DeShawn', 'Williams');

  await prisma.observation.create({ data: { studentId: james.id, teacherId: teacher.id, category: 'ATTENDANCE', severity: 'URGENT',
    content: 'James has been absent for 3 consecutive days. No response from parent. He was already arriving late consistently last week and appeared tired during group work. Concerned about possible home situation.' }});
  await prisma.observation.create({ data: { studentId: james.id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'CONCERN',
    content: 'James missed the Unit 5 Quiz and Chapter 10 HW. Before the absences, his quiz scores had been declining from 78% to 55% over the past 3 weeks.',
    createdAt: new Date(today.getTime() - 5 * 86400000) }});

  await prisma.observation.create({ data: { studentId: sofia.id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'URGENT',
    content: 'Sofia is struggling significantly with quadratic equations. Even with translated instructions and extended time, she could not complete any problems independently. May need Tier 3 consideration.' }});
  await prisma.observation.create({ data: { studentId: sofia.id, teacherId: teacher.id, category: 'SOCIAL_EMOTIONAL', severity: 'CONCERN',
    content: 'Sofia seemed frustrated and put her head down during group activity. She told me she feels stupid compared to her classmates. I reassured her and paired her with Maria.',
    createdAt: new Date(today.getTime() - 3 * 86400000) }});

  await prisma.observation.create({ data: { studentId: find('Aiden', 'Johnson').id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'POSITIVE',
    content: 'Aiden showed excellent leadership during the group project. He helped James and Sofia understand systems of equations without giving away answers. Great candidate for peer tutoring program.' }});

  await prisma.observation.create({ data: { studentId: carlos.id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'POSITIVE',
    content: 'Carlos has turned a corner! Since starting the daily check-in intervention 6 weeks ago, his homework completion rate has gone from 40% to 85%. He scored a 75% on the latest quiz, his highest this semester.' }});
  await prisma.observation.create({ data: { studentId: carlos.id, teacherId: teacher.id, category: 'BEHAVIORAL', severity: 'CONCERN',
    content: 'Carlos was initially resistant to the daily check-ins and seemed embarrassed. We moved the check-in to a brief hallway conversation which helped.',
    createdAt: new Date(today.getTime() - 30 * 86400000) }});

  await prisma.observation.create({ data: { studentId: ethan.id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'URGENT',
    content: 'Ethan has 4 missing assignments and scored 30% on the midterm. He rarely participates in class and often has his head down. Multiple parent contact attempts have gone unanswered. Recommending SST referral.' }});
  await prisma.observation.create({ data: { studentId: deshawn.id, teacherId: teacher.id, category: 'ATTENDANCE', severity: 'CONCERN',
    content: 'DeShawn has been tardy 8 times in the last 3 weeks, typically arriving 5-10 minutes late. When present and on time, he is engaged and capable.' }});
  await prisma.observation.create({ data: { studentId: find('Lily', 'Nguyen').id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'POSITIVE',
    content: 'Lily has made incredible progress since September. Her MAP score grew 12 points and she is now scoring in the B range consistently.' }});
  await prisma.observation.create({ data: { studentId: find('Marcus', 'Thompson').id, teacherId: teacher.id, category: 'SOCIAL_EMOTIONAL', severity: 'CONCERN',
    content: 'Marcus transferred from Oakland Unified 2 weeks ago. He is quiet and has not connected with peers yet. His intake assessment suggests he is roughly on grade level.' }});
  await prisma.observation.create({ data: { studentId: find('Priya', 'Patel').id, teacherId: teacher.id, category: 'ACADEMIC', severity: 'CONCERN',
    content: 'Priya scores 90%+ on homework but drops to 68-72% on tests. She told me she freezes up during exams. Her parents are aware. Might benefit from test-taking strategies.' }});

  // ── SST Referral ──────────────────────────────────────────────────
  await prisma.sSTReferral.create({
    data: {
      studentId: ethan.id, referringTeacherId: teacher.id, assignedCounselorId: counselor.id,
      primaryConcern: 'ACADEMIC',
      narrative: 'Ethan is failing Geometry with a 35% average and 4 missing assignments. Parent contact attempts (3 calls, 2 emails) have been unsuccessful.',
      strategiesAttempted: JSON.stringify([
        { strategy: 'Peer Tutoring (2x/week)', date: '2026-02-10' },
        { strategy: 'Parent phone calls (3 attempts)', date: '2026-02-01' },
        { strategy: 'Parent emails (2 sent)', date: '2026-02-05' },
        { strategy: 'After-school homework help', date: '2026-01-20' },
      ]),
      urgency: 'URGENT', status: 'IN_REVIEW', meetingTime: new Date('2026-03-05T14:00:00'),
    },
  });

  // ── Parent Contacts ───────────────────────────────────────────────
  await prisma.parentContact.create({ data: {
    studentId: james.id, teacherId: teacher.id, method: 'PHONE',
    subject: 'Attendance concerns: 3 consecutive absences',
    notes: 'Called Patricia Washington at 4:15 PM. No answer, left voicemail. Expressed concern about 3 consecutive absences and declining grades.',
  }});
  await prisma.parentContact.create({ data: {
    studentId: james.id, teacherId: teacher.id, method: 'EMAIL',
    subject: 'Follow-up: attendance and grades',
    notes: 'Sent email summarizing attendance concerns and current grade (D-). Included links to missing assignments and offered to schedule a conference.',
    createdAt: new Date(today.getTime() - 86400000),
  }});
  await prisma.parentContact.create({ data: {
    studentId: carlos.id, teacherId: teacher.id, method: 'PHONE',
    subject: 'Positive update on progress',
    notes: 'Called Lucia Rivera to share positive news about improvement. She was thrilled. We agreed to continue the check-in routine through semester end.',
    createdAt: new Date(today.getTime() - 7 * 86400000),
  }});

  // ── Notifications ─────────────────────────────────────────────────
  const notifs = [
    { teacherId: teacher.id, schoolId: school.id, studentId: james.id, type: 'ABSENT_STREAK' as const, title: 'James Washington: 3 consecutive absences', body: 'James Washington has been absent for 3 consecutive school days. No parent response. Consider contacting the school counselor.', channel: 'BOTH' as const },
    { teacherId: teacher.id, schoolId: school.id, studentId: sofia.id, type: 'GRADE_DROP' as const, title: 'Sofia Hernandez: Grade dropped below D', body: 'Sofia Hernandez dropped from D to D- in your Algebra I (P3) class. She scored 45% on the midterm.', channel: 'IN_APP' as const },
    { teacherId: teacher.id, schoolId: school.id, studentId: ethan.id, type: 'GRADE_DROP' as const, title: 'Ethan Miller: Grade at 35% (F)', body: 'Ethan Miller has a 35% in Geometry (P1). He has 4 missing assignments. SST referral meeting scheduled for March 5.', channel: 'BOTH' as const },
    { teacherId: teacher.id, schoolId: school.id, type: 'INTERVENTION_ASSIGNED' as const, title: 'New intervention: Daily check-in with James Washington', body: 'Daily Check-In intervention assigned. Your role: 2-minute morning check-in before class.', channel: 'BOTH' as const },
    { teacherId: teacher.id, schoolId: school.id, studentId: deshawn.id, type: 'ABSENT_STREAK' as const, title: 'DeShawn Williams: Chronic tardiness alert', body: 'DeShawn Williams has been tardy 8 times in the last 3 weeks. Exceeds threshold of 5 tardies per month.', channel: 'IN_APP' as const },
    { teacherId: teacher.id, schoolId: school.id, studentId: find('Marcus', 'Thompson').id, type: 'NEW_STUDENT' as const, title: 'New student: Marcus Thompson', body: 'Marcus Thompson transferred from Oakland Unified and has been enrolled in your Algebra I (P3) section.', channel: 'IN_APP' as const },
    { teacherId: teacher.id, schoolId: school.id, type: 'ACCOMMODATION_REMINDER' as const, title: 'Accommodation reminder: Unit 5 Quiz tomorrow', body: 'Students with testing accommodations: Tyler Chen (1.5x), Sofia Hernandez (1.5x + calculator), Olivia Davis (2x).', channel: 'IN_APP' as const },
    { teacherId: teacher.id, schoolId: school.id, type: 'SST_MEETING_SCHEDULED' as const, title: 'SST Meeting: Ethan Miller on March 5 at 2:00 PM', body: 'SST meeting for Ethan Miller on March 5 at 2:00 PM. Please bring documentation of interventions attempted.', channel: 'BOTH' as const },
  ];
  for (const n of notifs) { await prisma.notification.create({ data: n }); }

  console.log('Seed completed successfully!');
  console.log(`Created: 1 district, 1 school, 1 teacher, 1 counselor, 3 sections, ${students.length} students`);
  console.log('Stories: attendance crisis, ELL+504, star student, new transfer, test anxiety, tardy, ELL growth, failing urgent, IEP progress, turnaround');
  console.log('Login with: teacher@demo.edu');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
