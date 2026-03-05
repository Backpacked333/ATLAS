import { Router, Response, NextFunction } from 'express';
import { authenticateDistrictAdmin } from '../middleware/districtAuth';
import { AuthenticatedDistrictRequest } from '../types/command';
import { processDistrictAIRequest } from '../services/district-ai.service';

const router = Router();

/**
 * POST /api/command/ai/chat
 * Send a message to the district-level AI assistant.
 */
router.post(
  '/chat',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const { message, conversationId, context } = req.body;
      const result = await processDistrictAIRequest(
        req.districtAdmin!.id,
        req.districtAdmin!.districtId,
        { message, conversationId, context }
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/command/ai/conversations
 * Get conversation history for the current district admin.
 */
router.get(
  '/conversations',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../utils/prisma');
      const conversations = await prisma.aIConversation.findMany({
        where: { districtAdminId: req.districtAdmin!.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json(
        conversations.map((c) => ({
          id: c.id,
          createdAt: c.createdAt.toISOString(),
          lastMessage: c.messages[0]?.content.slice(0, 100) || '',
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
