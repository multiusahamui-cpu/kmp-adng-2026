import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { locations } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

// GET LOCATIONS (Bisa filter by Type atau Parent)
export const getLocations = async (req: AuthRequest, res: Response) => {
    try {
        const { type, parentCode, code } = (req as any).query;
        
        let query = db.select().from(locations).orderBy(asc(locations.code)).$dynamic();

        if (code) {
            // @ts-ignore
            query = query.where(eq(locations.code, code as string));
        } else if (type) {
            // @ts-ignore
            query = query.where(eq(locations.type, type as string));
        }
        
        if (parentCode) {
            // @ts-ignore
            query = query.where(eq(locations.parentCode, parentCode as string));
        }

        const result = await query;
        return successResponse(res, result, "Data Lokasi Berhasil Diambil");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data lokasi", 500);
    }
};

// CREATE LOCATION
export const createLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, type, parentCode } = req.body;

        if (!code || !name || !type) {
            return errorResponse(res, "Kode, Nama, dan Tipe wajib diisi", 400);
        }

        // Cek duplikat
        const [existing] = await db.select().from(locations).where(eq(locations.code, code));
        if (existing) {
            return errorResponse(res, "Kode Wilayah sudah ada.", 400);
        }

        const [newLoc] = await db.insert(locations).values({
            code,
            name,
            type,
            parentCode: parentCode || null,
            memberCounter: 0 // Inisialisasi counter untuk KTA
        }).returning();

        return successResponse(res, newLoc, "Lokasi Berhasil Ditambahkan", 201);

    } catch (error: any) {
        console.error(error);
        return errorResponse(res, "Gagal menambah lokasi", 500);
    }
};

// DELETE LOCATION
export const deleteLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { code } = (req as any).params;

        // Cek apakah punya child (misal: Hapus Provinsi tapi masih ada Kota di dalamnya)
        const children = await db.select().from(locations).where(eq(locations.parentCode, code));
        if (children.length > 0) {
            return errorResponse(res, "Gagal hapus: Wilayah ini memiliki sub-wilayah (child) yang aktif.", 400);
        }

        await db.delete(locations).where(eq(locations.code, code));
        return successResponse(res, null, "Lokasi Dihapus");

    } catch (error) {
        return errorResponse(res, "Gagal menghapus lokasi", 500);
    }
};