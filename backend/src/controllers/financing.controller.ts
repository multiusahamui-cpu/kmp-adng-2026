
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { groupProjects, projectExpenses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

export const proposeProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, businessType, location, capitalTotal } = req.body;
    
    const [project] = await db.insert(groupProjects).values({
        leaderId: req.user.id,
        name,
        businessType,
        location,
        capitalTotal: capitalTotal.toString(),
        status: 'proposed'
    }).returning();

    return successResponse(res, project, "Proposal Diajukan");
  } catch (error) {
    return errorResponse(res, "Gagal ajukan proposal", 500);
  }
};

export const addExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = (req as any).params; 
    const { item, amount } = req.body;
    
    const [expense] = await db.insert(projectExpenses).values({
        projectId: id,
        item,
        amount: amount.toString()
    }).returning();

    return successResponse(res, expense, "Laporan Belanja Disimpan");
  } catch (error) {
    return errorResponse(res, "Gagal simpan expense", 500);
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response) => {
    const projects = await db.select().from(groupProjects)
        .where(eq(groupProjects.leaderId, req.user.id));
    
    return successResponse(res, projects, "Proyek Saya");
};
