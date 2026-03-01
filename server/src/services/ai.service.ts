import { prisma } from '../utils/prisma';
import { teacherHasStudentAccess } from '../middleware/ferpa';
import { AIAssistantRequest } from '../types';

/**
 * AI Assistant Service — Teacher Scope
 *
 * The teacher-level AI assistant operates under strict FERPA constraints.
 * It can only access data the teacher is authorized to see.
 *
 * PERMITTED:
 * - Answer questions about student performance in teacher's class
 * - Draft parent communication
 * - Suggest instructional strategies
 * - Generate report card comments
 * - Summarize section performance
 *
 * BLOCKED:
 * - Cannot reveal dropout risk score, risk factors, or predictive model outputs
 * - Cannot reveal discipline history, suspension records
 * - Cannot reveal IEP content, disability category, or BIP details
 * - Cannot reveal socioeconomic data (lunch status, address)
 * - Cannot access students not in teacher's roster
 */

const SYSTEM_PROMPT = `You are an AI assistant for AtlasED Classroom, helping a teacher with their students.
You operate under strict FERPA data privacy rules. You can ONLY discuss:
- Student performance in the teacher's own classes
- Attendance data
- Instructional strategies and differentiation
- Parent communication drafts
- Report card comments based on available data
- 504/IEP accommodations applicable to the teacher's classroom

You MUST NEVER reveal or discuss:
- Dropout risk scores or predictive model outputs
- Discipline history or suspension records
- IEP documents, disability categories, or BIP details
- Free/reduced lunch status or socioeconomic data
- Students not in this teacher's roster
- Specific grades or data from other teachers' classes

Be helpful, concise, and action-oriented. Focus on what the teacher can do.`;

export async function processAIRequest(
  teacherId: string,
  request: AIAssistantRequest
): Promise<{ response: string; conversationId: string }> {
  // Verify student access if studentId provided
  if (request.studentId) {
    const hasAccess = await teacherHasStudentAccess(teacherId, request.studentId);
    if (!hasAccess) {
      return {
        response: 'I cannot access information about students who are not in your class roster.',
        conversationId: request.conversationId || '',
      };
    }
  }

  // Get or create conversation
  let conversationId = request.conversationId;
  if (!conversationId) {
    const conversation = await prisma.aIConversation.create({
      data: {
        teacherId,
        studentId: request.studentId,
      },
    });
    conversationId = conversation.id;
  }

  // Save user message
  await prisma.aIMessage.create({
    data: {
      conversationId,
      role: 'user',
      content: request.message,
    },
  });

  // Build context from student data if applicable
  let studentContext = '';
  if (request.studentId) {
    studentContext = await buildStudentContext(teacherId, request.studentId);
  }

  // Get conversation history
  const history = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  // In production, this would call the Claude API with SYSTEM_PROMPT + context + history
  // For demo, return polished context-aware mock responses
  const aiResponse = generateMockResponse(request.message, studentContext);

  // Save assistant response
  await prisma.aIMessage.create({
    data: {
      conversationId,
      role: 'assistant',
      content: aiResponse,
    },
  });

  return { response: aiResponse, conversationId };
}

async function buildStudentContext(teacherId: string, studentId: string): Promise<string> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      accommodations: { where: { isActive: true } },
      assessmentScores: { orderBy: { testDate: 'desc' }, take: 5 },
    },
  });

  if (!student) return '';

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: 'ACTIVE',
      section: { teachers: { some: { teacherId } } },
    },
    include: {
      section: {
        include: {
          assignments: {
            include: { grades: { where: { studentId } } },
            orderBy: { dueDate: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  const lines: string[] = [
    `Student: ${student.firstName} ${student.lastName}, Grade ${student.gradeLevel}`,
    `ELL: ${student.ellStatus ? 'Yes' : 'No'}, IEP: ${student.iepActive ? 'Active' : 'No'}, 504: ${student.has504 ? 'Yes' : 'No'}`,
    `Overall GPA: ${student.cumulativeGpa ?? 'N/A'}`,
  ];

  for (const enrollment of enrollments) {
    const section = enrollment.section;
    const grades = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.pointsEarned !== null)
    );
    const earned = grades.reduce((s, g) => s + (g.pointsEarned || 0), 0);
    const possible = section.assignments
      .filter((a) => a.grades.some((g) => g.pointsEarned !== null))
      .reduce((s, a) => s + a.pointsPossible, 0);
    const pct = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;
    const missing = section.assignments.flatMap((a) => a.grades.filter((g) => g.isMissing)).length;

    lines.push(`${section.courseName} (${section.period}): ${pct}%, ${missing} missing`);
  }

  if (student.accommodations.length > 0) {
    lines.push('Accommodations: ' + student.accommodations.map((a) => a.description).join('; '));
  }

  return lines.join('\n');
}

function generateMockResponse(message: string, context: string): string {
  const lowerMessage = message.toLowerCase();
  const lines = context.split('\n');
  const studentName = lines[0]?.replace('Student: ', '').split(',')[0] || 'this student';
  const hasContext = context.length > 0;

  // --- Parent email / communication ---
  if (lowerMessage.includes('email') || lowerMessage.includes('parent')) {
    if (!hasContext) {
      return 'Please select a specific student first so I can draft a personalized parent email based on their performance data.';
    }
    const missingLine = lines.find((l) => l.includes('missing'));
    const missingCount = missingLine?.match(/(\d+) missing/)?.[1] || '0';
    const gradeLine = lines.find((l) => l.includes('%'));
    const gradeInfo = gradeLine?.match(/(\d+\.?\d*)%/)?.[1] || '';

    return `Here's a draft parent email for ${studentName}:\n\n---\n\nSubject: Academic Update — ${studentName}\n\nDear Family,\n\nI'm writing to share an update on ${studentName}'s progress in my class. ${
      parseInt(missingCount) > 0
        ? `Currently, ${studentName} has ${missingCount} missing assignment${parseInt(missingCount) > 1 ? 's' : ''} that ${parseInt(missingCount) > 1 ? 'are' : 'is'} impacting their grade${gradeInfo ? ` (currently ${gradeInfo}%)` : ''}.`
        : `${studentName} is keeping up with assignments${gradeInfo ? ` and currently has a ${gradeInfo}%` : ''}.`
    }\n\nI'd love to discuss strategies we can work on together to support ${studentName}'s success. Would you be available for a brief phone call or meeting this week?\n\nPlease feel free to reach out at any time.\n\nWarm regards,\nMs. Martinez\n\n---\n\n*Feel free to edit this draft to match your tone. You can copy it directly into your email client.*`;
  }

  // --- Instructional strategies ---
  if (lowerMessage.includes('strateg') || lowerMessage.includes('differentiat') || lowerMessage.includes('help this student')) {
    if (!hasContext) {
      return 'Select a student to get personalized instructional strategies based on their learning profile and performance data.';
    }
    const isELL = context.includes('ELL: Yes');
    const hasIEP = context.includes('IEP: Active');
    const has504 = context.includes('504: Yes');
    const accommodations = lines.find((l) => l.startsWith('Accommodations:'));

    const strategies: string[] = [];

    if (isELL) {
      strategies.push(
        '**Language Support:** Provide bilingual glossaries for key math vocabulary. Use visual models (number lines, algebra tiles) alongside verbal explanations.',
        '**Sentence Frames:** Give structured sentence starters for showing work: "First I ___, then I ___, so the answer is ___."',
      );
    }
    if (hasIEP || has504) {
      strategies.push(
        `**Accommodation Compliance:** ${accommodations ? accommodations.replace('Accommodations: ', '') : 'Ensure all documented accommodations are consistently applied.'}`,
        '**Chunked Assignments:** Break longer assignments into smaller sections with check-in points.',
      );
    }

    const missingLine = lines.find((l) => l.includes('missing'));
    const missingCount = parseInt(missingLine?.match(/(\d+) missing/)?.[1] || '0');
    if (missingCount >= 3) {
      strategies.push(
        '**Missing Work Recovery:** Create a structured make-up plan with 2-3 prioritized assignments per week. Consider accepting partial credit to rebuild momentum.',
        '**Daily Check-In:** Brief 1-minute check at the start of class: "Do you have your homework? What do you need help with today?"',
      );
    }

    strategies.push(
      '**Formative Assessment:** Use exit tickets (2-3 quick problems) to identify specific skill gaps before they compound.',
      '**Peer Support:** Pair with a study partner for collaborative practice — research shows peer explanation deepens understanding for both students.',
    );

    return `Here are targeted strategies for ${studentName}:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}\n\n*These strategies are based on ${studentName}'s current performance data and learning profile. Adjust based on your classroom observations.*`;
  }

  // --- Report card comments ---
  if (lowerMessage.includes('report card') || lowerMessage.includes('comment')) {
    if (!hasContext) {
      return 'Select a student to generate a personalized report card comment based on their grades, attendance, and classroom performance.';
    }
    const gradeLine = lines.find((l) => l.includes('%'));
    const gradeStr = gradeLine?.match(/(\d+\.?\d*)%/)?.[1] || '';
    const grade = parseFloat(gradeStr) || 0;
    const missingCount = parseInt(lines.find((l) => l.includes('missing'))?.match(/(\d+) missing/)?.[1] || '0');

    if (grade >= 90) {
      return `**Report Card Comment for ${studentName}:**\n\n"${studentName} demonstrates exceptional understanding of course material and consistently produces high-quality work. Their ${grade}% average reflects strong effort and mastery of key concepts. ${studentName} is a positive contributor to class discussions and often helps peers understand difficult material. I encourage ${studentName} to continue seeking challenges and exploring advanced problem-solving approaches."\n\n*Adjust tone and specifics based on your personal observations.*`;
    } else if (grade >= 73) {
      return `**Report Card Comment for ${studentName}:**\n\n"${studentName} shows solid understanding of core concepts with a current average of ${grade}%. ${missingCount > 0 ? `Completing ${missingCount} outstanding assignment${missingCount > 1 ? 's' : ''} would help strengthen this grade further. ` : ''}With continued effort and consistent study habits, ${studentName} has the potential to excel. I recommend reviewing class notes regularly and attending office hours when questions arise."\n\n*Adjust tone and specifics based on your personal observations.*`;
    } else {
      return `**Report Card Comment for ${studentName}:**\n\n"${studentName} is working to build foundational skills in this course. Their current average of ${grade}% indicates a need for additional support. ${missingCount > 0 ? `Completing ${missingCount} missing assignment${missingCount > 1 ? 's' : ''} is a critical first step toward improvement. ` : ''}I am committed to helping ${studentName} succeed and recommend ${studentName} take advantage of tutoring resources and office hours. A consistent daily study routine will make a significant difference."\n\n*Adjust tone and specifics based on your personal observations.*`;
    }
  }

  // --- Grade trend ---
  if (lowerMessage.includes('trend') || lowerMessage.includes('grade') || lowerMessage.includes('performance') || lowerMessage.includes('doing')) {
    if (!hasContext) {
      return 'Select a student to see their grade trend analysis.';
    }
    const gradeLine = lines.find((l) => l.includes('%'));
    const gradeStr = gradeLine?.match(/(\d+\.?\d*)%/)?.[1] || '';
    const grade = parseFloat(gradeStr) || 0;
    const missingCount = parseInt(lines.find((l) => l.includes('missing'))?.match(/(\d+) missing/)?.[1] || '0');
    const gpaLine = lines.find((l) => l.includes('GPA'));
    const gpa = gpaLine?.match(/GPA: (\d+\.?\d*)/)?.[1] || 'N/A';

    return `**Performance Summary for ${studentName}:**\n\n• **Current Grade:** ${grade}% ${grade >= 90 ? '(Excellent)' : grade >= 73 ? '(Passing)' : grade >= 60 ? '(At Risk)' : '(Failing)'}\n• **Missing Assignments:** ${missingCount}${missingCount >= 3 ? ' ⚠️ This is significantly impacting the grade' : ''}\n• **Cumulative GPA:** ${gpa}\n\n${
      grade < 60
        ? '**⚠️ Immediate Action Needed:** This student is failing. Consider a structured intervention plan, parent contact, and daily check-ins.'
        : grade < 73
          ? '**Action Recommended:** This student is at risk of failing. Prioritize missing work recovery and consider Tier 1 supports.'
          : grade >= 90
            ? '**On Track:** This student is excelling. Consider enrichment opportunities or peer tutoring roles.'
            : '**Monitoring:** Grade is passing but watch for any downward trends. Stay proactive with encouragement.'
    }\n\n*Ask me to draft a parent email, suggest strategies, or generate a report card comment for more specific help.*`;
  }

  // --- Intervention / support ---
  if (lowerMessage.includes('intervention') || lowerMessage.includes('support') || lowerMessage.includes('tier')) {
    if (!hasContext) {
      return 'Select a student to get intervention recommendations based on their data profile.';
    }
    return `**Intervention Recommendations for ${studentName}:**\n\nBased on the available data, here's a tiered approach:\n\n**Tier 1 (Universal — Start Here):**\n• Structured daily check-in (1-2 minutes before class)\n• Provide graphic organizers and guided notes\n• Weekly progress monitoring with brief feedback\n\n**Tier 2 (If Tier 1 insufficient after 2-3 weeks):**\n• Small group targeted instruction (2-3x per week)\n• Peer tutoring pairing with structured activities\n• Missing work recovery plan with weekly check-in\n• Parent communication loop (bi-weekly updates)\n\n**Tier 3 (If Tier 2 insufficient after 4-6 weeks):**\n• SST referral for comprehensive support plan\n• 1:1 intervention sessions\n• Consider assessment for additional services\n\n**Documentation Tip:** Log each intervention attempt with dates and outcomes. This creates the paper trail needed for SST referrals and ensures continuity of support.\n\n*Would you like me to draft a parent email or create a specific intervention plan?*`;
  }

  // --- Attendance ---
  if (lowerMessage.includes('attend') || lowerMessage.includes('absent') || lowerMessage.includes('tardy')) {
    if (!hasContext) {
      return 'Select a student to analyze their attendance patterns.';
    }
    return `**Attendance Analysis for ${studentName}:**\n\nAttendance is one of the strongest predictors of academic success. Here are evidence-based steps:\n\n1. **Document the Pattern:** Note which days/periods have the most absences. Look for patterns (Mondays, after lunch, specific classes).\n\n2. **Student Conversation:** Have a private, non-judgmental check-in: "I've noticed you've been out. Is everything okay? I want to help."\n\n3. **Parent Contact:** Reach out to the family — sometimes absences signal issues at home that the school can help address.\n\n4. **Re-engagement Plan:** For students returning after absences:\n   • Provide a clear make-up work list (prioritize 2-3 key assignments)\n   • Assign a peer buddy to share notes\n   • Offer a brief 1:1 catch-up session\n\n5. **Escalation:** If absences continue, involve the counselor or attendance team. Document all outreach attempts.\n\n*Would you like me to draft a parent email about attendance concerns?*`;
  }

  // --- Fallback: general helpful response ---
  if (hasContext) {
    return `I can help you with ${studentName} in several ways:\n\n• **"Draft a parent email"** — I'll write a professional email based on their current performance\n• **"What strategies might help?"** — Targeted instructional strategies based on their profile\n• **"Generate a report card comment"** — Data-driven comment ready to paste\n• **"What's their grade trend?"** — Performance summary with action items\n• **"Suggest interventions"** — Tiered intervention recommendations\n• **"Attendance analysis"** — Patterns and re-engagement strategies\n\nJust ask, and I'll use ${studentName}'s real data to give you a specific, actionable response.`;
  }

  return `Welcome! I'm your AI teaching assistant. I can help you with:\n\n• **Draft parent emails** about student performance or concerns\n• **Suggest instructional strategies** tailored to individual learners\n• **Generate report card comments** based on real grade data\n• **Analyze grade trends** and flag at-risk students\n• **Recommend interventions** using a tiered support framework\n• **Discuss attendance patterns** and re-engagement strategies\n\nFor the most helpful responses, open a student's profile and click "AI Assistant" — I'll use their actual data to personalize my recommendations.\n\nWhat would you like help with?`;
}
