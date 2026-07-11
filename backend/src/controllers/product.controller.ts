
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { products, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().min(100),
  stock: z.number().min(1),
  category: z.string(),
  location: z.string().optional(),
  image: z.string().url().optional(),
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    // Basic fetch, in real app use join for seller name
    const result = await db.select().from(products).orderBy(desc(products.createdAt));
    
    // Manual join seller name for simplicity or use query builder
    // Ideally use: db.query.products.findMany({ with: { seller: true } }) if relational query mode enabled
    return successResponse(res, result, "List Produk Berhasil");
  } catch (error) {
    return errorResponse(res, "Gagal mengambil data produk", 500);
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);
    const userId = req.user.id;

    const [newProduct] = await db.insert(products).values({
        sellerId: userId,
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        stock: data.stock,
        category: data.category,
        location: data.location,
        image: data.image,
        isOfficial: req.user.roles.includes('admin')
    }).returning();

    return successResponse(res, newProduct, "Produk Berhasil Ditambahkan", 201);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, "Gagal menambah produk", 500);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = (req as any).params;
    const userId = req.user.id;

    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return errorResponse(res, "Produk tidak ditemukan", 404);

    if (product.sellerId !== userId && !req.user.roles.includes('admin')) {
      return errorResponse(res, "Anda tidak memiliki akses menghapus produk ini", 403);
    }

    await db.delete(products).where(eq(products.id, id));
    return successResponse(res, null, "Produk Dihapus");
  } catch (error) {
    return errorResponse(res, "Gagal menghapus produk", 500);
  }
};
