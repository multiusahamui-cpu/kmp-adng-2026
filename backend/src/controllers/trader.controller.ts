
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { mobileTraders, traderMenus, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});

const menuSchema = z.object({
  name: z.string().min(3),
  price: z.number().min(100),
  category: z.string().optional()
});

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { isOnline } = req.body;
    const userId = req.user.id;

    const [existing] = await db.select().from(mobileTraders).where(eq(mobileTraders.userId, userId));

    let trader;
    if (existing) {
        [trader] = await db.update(mobileTraders)
            .set({ isOnline: Boolean(isOnline), lastUpdate: new Date() })
            .where(eq(mobileTraders.id, existing.id))
            .returning();
    } else {
        [trader] = await db.insert(mobileTraders).values({
            userId,
            tradeName: req.user.name, 
            category: 'Umum', 
            vehicleType: 'Motor', 
            isOnline: Boolean(isOnline),
            lastUpdate: new Date()
        }).returning();
    }

    return successResponse(res, trader, `Status Trader: ${isOnline ? 'Online' : 'Offline'}`);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Gagal update status", 500);
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = locationSchema.parse(req.body);
    const userId = req.user.id;

    await db.update(mobileTraders)
      .set({ latitude: latitude.toString(), longitude: longitude.toString(), lastUpdate: new Date() })
      .where(eq(mobileTraders.userId, userId));

    return successResponse(res, null, "Lokasi diperbarui");
  } catch (error) {
    return errorResponse(res, "Gagal update lokasi", 500);
  }
};

export const getNearbyTraders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.select({
        id: mobileTraders.id,
        tradeName: mobileTraders.tradeName,
        category: mobileTraders.category,
        vehicleType: mobileTraders.vehicleType,
        latitude: mobileTraders.latitude,
        longitude: mobileTraders.longitude,
        ownerName: users.name,
        ownerPhone: users.phone
    })
    .from(mobileTraders)
    .innerJoin(users, eq(mobileTraders.userId, users.id))
    .where(eq(mobileTraders.isOnline, true));
    
    return successResponse(res, result, "Pedagang di sekitar Anda");
  } catch (error) {
    return errorResponse(res, "Gagal mencari pedagang", 500);
  }
};

export const addMenu = async (req: AuthRequest, res: Response) => {
  try {
    const data = menuSchema.parse(req.body);
    const userId = req.user.id;

    const [trader] = await db.select().from(mobileTraders).where(eq(mobileTraders.userId, userId));
    if (!trader) return errorResponse(res, "Profil Trader belum aktif", 400);

    const [menu] = await db.insert(traderMenus).values({
        traderId: trader.id,
        name: data.name,
        price: data.price.toString(),
        category: data.category || 'Umum'
    }).returning();

    return successResponse(res, menu, "Menu berhasil ditambahkan");
  } catch (error) {
    return errorResponse(res, "Gagal tambah menu", 500);
  }
};
