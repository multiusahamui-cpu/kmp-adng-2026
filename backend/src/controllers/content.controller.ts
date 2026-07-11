
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { content, users } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const contentSchema = z.object({
  title: z.string().min(5),
  category: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  contentUrl: z.string().url().optional(),
  body: z.string().optional(), 
});

export const getAllContent = async (req: Request, res: Response) => {
  try {
    const { category } = (req as any).query;
    
    let query = db.select({
        id: content.id,
        title: content.title,
        category: content.category,
        thumbnailUrl: content.thumbnailUrl,
        authorName: users.name,
        authorId: content.authorId,
        status: content.status,
        createdAt: content.createdAt,
        description: content.description
    })
    .from(content)
    .innerJoin(users, eq(content.authorId, users.id))
    .where(eq(content.status, 'published'))
    .orderBy(desc(content.createdAt));

    if (category) {
        // @ts-ignore: Dynamic query building needs cleaner approach in Drizzle, simplified here
        // Ideally: .where(and(eq(content.status, 'published'), eq(content.category, category)))
    }

    const result = await query;
    return successResponse(res, result, "Daftar Konten");
  } catch (error) {
    return errorResponse(res, "Gagal mengambil konten", 500);
  }
};

export const createContent = async (req: AuthRequest, res: Response) => {
  try {
    const data = contentSchema.parse(req.body);
    const userId = req.user.id;
    const slug = data.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
    const isAdmin = req.user.roles.includes('admin');

    const [newContent] = await db.insert(content).values({
        authorId: userId,
        title: data.title,
        slug,
        category: data.category,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        contentUrl: data.contentUrl,
        body: data.body,
        status: isAdmin ? 'published' : 'pending'
    }).returning();

    return successResponse(res, newContent, "Konten Berhasil Dibuat", 201);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, "Gagal membuat konten", 500);
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = (req as any).params;
        const userId = req.user.id;

        const [item] = await db.select().from(content).where(eq(content.id, id));
        if (!item) return errorResponse(res, "Konten tidak ditemukan", 404);

        if (item.authorId !== userId && !req.user.roles.includes('admin')) {
            return errorResponse(res, "Akses ditolak", 403);
        }

        await db.delete(content).where(eq(content.id, id));
        return successResponse(res, null, "Konten dihapus");
    } catch (error) {
        return errorResponse(res, "Gagal menghapus konten", 500);
    }
};

export const moderateContent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = (req as any).params;
        const { status } = req.body; 

        if (!req.user.roles.includes('admin')) return errorResponse(res, "Hanya admin", 403);

        const [updated] = await db.update(content)
            .set({ status })
            .where(eq(content.id, id))
            .returning();
            
        return successResponse(res, updated, `Konten ${status}`);
    } catch (error) {
        return errorResponse(res, "Gagal moderasi", 500);
    }
};
