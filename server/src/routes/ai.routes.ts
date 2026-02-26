import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, AIAssistantRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { processAIRequest } from '../services/ai.service';
import { ValidationError } from '../utils/errors';

const router = Router();

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant.
 * Supports optional studentId context for student-specific queries.
 */
router.post('/chat', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { message, studentId, conversationId } = req.body as AIAssistantRequest;

    if (!message || message.trim().length === 0) {
      throw new ValidationError('message is required');
    }

    const result = await processAIRequest(req.teacher!.id, {
      message: message.trim(),
      studentId,
      conversationId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/conversations
 * Get the teacher's AI conversation history.
 */
router.get('/conversations', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../utils/prisma');
    const conversations = await prisma.aIConversation.findMany({
      where: { teacherId: req.teacher!.id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

export default router;
