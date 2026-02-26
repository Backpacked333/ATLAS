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

  // In production, this would call the Claude API
  // For now, return a structured response indicating the AI integration point
  const aiResponse = generatePlaceholderResponse(request.message, studentContext);

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
    const pct = possible > 0 ? Math.round((earned / possible) * 10) / 10 : 0;
    const missing = section.assignments.flatMap((a) => a.grades.filter((g) => g.isMissing)).length;

    lines.push(`${section.courseName} (${section.period}): ${pct}%, ${missing} missing`);
  }

  if (student.accommodations.length > 0) {
    lines.push('Accommodations: ' + student.accommodations.map((a) => a.description).join('; '));
  }

  return lines.join('\n');
}

function generatePlaceholderResponse(message: string, context: string): string {
  // This is a placeholder. In production, call Claude API with SYSTEM_PROMPT + context + message.
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email') || lowerMessage.includes('parent')) {
    return `[AI Integration Point: Draft parent email]\n\nTo generate a parent communication, the AI assistant would use the student context:\n${context || 'No specific student selected.'}\n\nConnect your Anthropic API key in server settings to enable AI-powered email drafting.`;
  }

  if (lowerMessage.includes('strategy') || lowerMessage.includes('differentiat')) {
    return `[AI Integration Point: Instructional strategies]\n\nBased on available student data, the AI would suggest targeted instructional strategies.\n\nConnect your Anthropic API key in server settings to enable AI-powered recommendations.`;
  }

  if (lowerMessage.includes('report card') || lowerMessage.includes('comment')) {
    return `[AI Integration Point: Report card comments]\n\nThe AI would draft personalized report card comments based on:\n${context || 'No specific student selected.'}\n\nConnect your Anthropic API key in server settings to enable AI-powered comment generation.`;
  }

  return `[AI Integration Point]\n\nYour question: "${message}"\n\nStudent context available: ${context ? 'Yes' : 'No'}\n\nConnect your Anthropic API key in server settings to enable the AI assistant.`;
}
