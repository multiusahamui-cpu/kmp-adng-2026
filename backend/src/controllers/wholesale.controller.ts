
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { wholesaleItems, wholesaleBids, users } from '../db/schema';
import { eq, desc, ne } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const itemSchema = z.object({
  commodityName: z.string(),
  grade: z.string(),
  totalQty: z.number(),
  unit: z.string(),
  minOrder: z.number(),
  openPrice: z.number(),
  harvestDate: z.string(),
  location: z.string(),
  description: z.string().optional()
});

export const getItems = async (req: AuthRequest, res: Response) => {
  const items = await db.select({
      id: wholesaleItems.id,
      commodityName: wholesaleItems.commodityName,
      grade: wholesaleItems.grade,
      totalQty: wholesaleItems.totalQty,
      unit: wholesaleItems.unit,
      minOrder: wholesaleItems.minOrder,
      openPrice: wholesaleItems.openPrice,
      harvestDate: wholesaleItems.harvestDate,
      location: wholesaleItems.location,
      status: wholesaleItems.status,
      sellerName: users.name
  })
  .from(wholesaleItems)
  .innerJoin(users, eq(wholesaleItems.sellerId, users.id))
  .where(ne(wholesaleItems.status, 'sold'))
  .orderBy(desc(wholesaleItems.createdAt));

  return successResponse(res, items, "Daftar Komoditas");
};

export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const data = itemSchema.parse(req.body);
    const [item] = await db.insert(wholesaleItems).values({
        sellerId: req.user.id,
        commodityName: data.commodityName,
        grade: data.grade,
        totalQty: data.totalQty.toString(),
        unit: data.unit,
        minOrder: data.minOrder.toString(),
        openPrice: data.openPrice.toString(),
        harvestDate: data.harvestDate,
        location: data.location,
        description: data.description,
        status: 'open'
    }).returning();

    return successResponse(res, item, "Listing Berhasil Dibuat");
  } catch (error) {
    return errorResponse(res, "Gagal buat listing", 500);
  }
};

export const placeBid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = (req as any).params;
    const { bidPrice, notes } = req.body;
    
    const [bid] = await db.insert(wholesaleBids).values({
        itemId: id,
        distributorId: req.user.id,
        bidPrice: bidPrice.toString(),
        notes,
        status: 'pending'
    }).returning();
    
    await db.update(wholesaleItems)
        .set({ status: 'negotiation' })
        .where(eq(wholesaleItems.id, id));

    return successResponse(res, bid, "Penawaran Terkirim");
  } catch (error) {
    return errorResponse(res, "Gagal menawar", 500);
  }
};

export const acceptBid = async (req: AuthRequest, res: Response) => {
  try {
    const { bidId } = (req as any).params;
    
    const result = await db.transaction(async (tx) => {
       const [bid] = await tx.select().from(wholesaleBids).where(eq(wholesaleBids.id, bidId));
       if(!bid) throw new Error("Bid not found");

       const [updatedBid] = await tx.update(wholesaleBids)
           .set({ status: 'accepted' })
           .where(eq(wholesaleBids.id, bidId))
           .returning();
       
       await tx.update(wholesaleItems)
           .set({ status: 'sold' })
           .where(eq(wholesaleItems.id, bid.itemId));
       
       return updatedBid;
    });
    
    return successResponse(res, result, "Tawaran Diterima. Masuk Escrow.");
  } catch (error) {
    return errorResponse(res, "Gagal terima tawaran", 500);
  }
};
