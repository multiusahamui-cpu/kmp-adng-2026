
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { voteSessions, voteRecords, helpTickets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

export const getActiveVotes = async (req: AuthRequest, res: Response) => {
  // Simple fetch active sessions
  const sessions = await db.select().from(voteSessions).where(eq(voteSessions.status, 'active'));
  // Note: Fetching candidates requires separate query in basic Drizzle or Relation query
  return successResponse(res, sessions, "Sesi Voting Aktif");
};

export const castVote = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = (req as any).params;
    const { candidateId } = req.body;
    const voterId = req.user.id;

    // Check double vote
    const [existing] = await db.select().from(voteRecords)
        .where(and(eq(voteRecords.sessionId, sessionId), eq(voteRecords.voterId, voterId)));
    
    if (existing) return errorResponse(res, "Anda sudah memilih di sesi ini", 400);

    const [vote] = await db.insert(voteRecords).values({
        sessionId, candidateId, voterId
    }).returning();

    return successResponse(res, vote, "Suara Masuk");
  } catch (error) {
    return errorResponse(res, "Gagal voting", 500);
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { subject, message, category } = req.body;
        const [ticket] = await db.insert(helpTickets).values({
            userId: req.user.id,
            subject,
            message,
            category
        }).returning();
        
        return successResponse(res, ticket, "Tiket Terkirim");
    } catch (error) {
        return errorResponse(res, "Gagal kirim tiket", 500);
    }
};
