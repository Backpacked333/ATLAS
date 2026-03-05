import { prisma } from '../utils/prisma';
import { DistrictAIRequest, DistrictAIResponse } from '../types/command';

/**
 * District AI Assistant Service — District Scope
 *
 * The district-level AI has access to all data across all schools.
 * It can answer questions that no single school can answer, perform
 * cross-school analysis, generate reports, model scenarios, and draft communications.
 */

const DISTRICT_SYSTEM_PROMPT = `You are an AI assistant for AtlasED Command, the district intelligence platform.
You operate at the district level with full access to cross-school data.

You CAN:
- Compare metrics across all schools in the district
- Analyze trends in attendance, discipline, MTSS, and compliance
- Identify schools that need intervention
- Generate board-ready summaries and talking points
- Model resource allocation scenarios
- Draft stakeholder communications
- Analyze equity data and disproportionality
- Project outcomes based on current trends
- Calculate cost-effectiveness and ROI

You MUST:
- Always cite data sources and be transparent about confidence levels
- Flag when data is insufficient for reliable conclusions
- Present findings objectively without advocacy
- Maintain student privacy in aggregate reporting
- Note when projections are based on historical trends vs. causal models`;

export async function processDistrictAIRequest(
  districtAdminId: string,
  districtId: string,
  request: DistrictAIRequest
): Promise<DistrictAIResponse> {
  // Get or create conversation
  let conversationId = request.conversationId;
  if (!conversationId) {
    const conversation = await prisma.aIConversation.create({
      data: {
        districtAdminId,
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

  // Build district context
  const context = await buildDistrictContext(districtId, request.context);

  // Get conversation history
  const history = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  // Generate response (placeholder for AI integration)
  const aiResponse = generateDistrictPlaceholderResponse(request.message, context);

  // Save assistant response
  await prisma.aIMessage.create({
    data: {
      conversationId,
      role: 'assistant',
      content: aiResponse.response,
    },
  });

  return { ...aiResponse, conversationId };
}

async function buildDistrictContext(
  districtId: string,
  requestContext?: { schoolIds?: string[]; reportType?: string }
): Promise<string> {
  const [schools, totalStudents, atRiskStudents, activeInterventions] = await Promise.all([
    prisma.school.findMany({
      where: { districtId },
      include: {
        students: { where: { enrollments: { some: { status: 'ACTIVE' } } }, select: { id: true } },
        counselors: { select: { id: true } },
      },
    }),
    prisma.student.count({ where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } } }),
    prisma.student.count({ where: { school: { districtId }, riskTier: { in: ['NEEDS_SUPPORT', 'URGENT'] } } }),
    prisma.intervention.count({ where: { student: { school: { districtId } }, status: 'ACTIVE' } }),
  ]);

  const lines: string[] = [
    `District: ${schools.length} schools, ${totalStudents.toLocaleString()} total students`,
    `At-risk students: ${atRiskStudents} (${totalStudents > 0 ? Math.round((atRiskStudents / totalStudents) * 100) : 0}%)`,
    `Active interventions: ${activeInterventions}`,
    '',
    'Schools:',
  ];

  for (const school of schools) {
    lines.push(`  ${school.name} (${school.gradeSpan}): ${school.students.length} students, ${school.counselors.length} counselors`);
  }

  return lines.join('\n');
}

function generateDistrictPlaceholderResponse(
  message: string,
  context: string
): { response: string; data?: Record<string, unknown> } {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('compare') || lowerMessage.includes('rank') || lowerMessage.includes('across')) {
    return {
      response: `[AI Integration Point: Cross-School Analysis]\n\nTo perform this cross-school comparison, the AI assistant would analyze data across all schools:\n\n${context}\n\nConnect your Anthropic API key in server settings to enable AI-powered district analysis.`,
    };
  }

  if (lowerMessage.includes('board') || lowerMessage.includes('presentation') || lowerMessage.includes('slide')) {
    return {
      response: `[AI Integration Point: Board Communication]\n\nThe AI would generate a board-ready presentation using the district context:\n\n${context}\n\nConnect your Anthropic API key to enable AI-powered board presentations.`,
    };
  }

  if (lowerMessage.includes('project') || lowerMessage.includes('predict') || lowerMessage.includes('forecast')) {
    return {
      response: `[AI Integration Point: Predictive Modeling]\n\nThe AI would generate projections based on current trends and historical data:\n\n${context}\n\nConnect your Anthropic API key to enable AI-powered predictive modeling.`,
    };
  }

  if (lowerMessage.includes('equity') || lowerMessage.includes('disproportionality') || lowerMessage.includes('disparity')) {
    return {
      response: `[AI Integration Point: Equity Analysis]\n\nThe AI would analyze equity data across all schools and demographic groups:\n\n${context}\n\nConnect your Anthropic API key to enable AI-powered equity analysis.`,
    };
  }

  if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('roi')) {
    return {
      response: `[AI Integration Point: Budget Analysis]\n\nThe AI would analyze budget-to-outcome data for all programs:\n\n${context}\n\nConnect your Anthropic API key to enable AI-powered budget analysis.`,
    };
  }

  return {
    response: `[AI Integration Point]\n\nYour question: "${message}"\n\nDistrict context available:\n${context}\n\nConnect your Anthropic API key in server settings to enable the district AI assistant.`,
  };
}
