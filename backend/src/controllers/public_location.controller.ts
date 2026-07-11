
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { locations } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

// GET ALL REGIONS (Type = 'Region')
export const getRegions = async (req: AuthRequest, res: Response) => {
    try {
        const result = await db.select()
            .from(locations)
            .where(eq(locations.type, 'Region'))
            .orderBy(asc(locations.name));
            
        return successResponse(res, result, "Data Wilayah (Regions)");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data wilayah", 500);
    }
};

// GET PROVINCES BY REGION CODE (Type = 'Province', parentCode = regionCode)
export const getProvincesByRegion = async (req: AuthRequest, res: Response) => {
    try {
        const { regionId } = req.params; // This is actually regionCode now
        if (!regionId) return errorResponse(res, "Region Code diperlukan", 400);

        const result = await db.select()
            .from(locations)
            .where(and(
                eq(locations.type, 'Province'),
                eq(locations.parentCode, regionId)
            ))
            .orderBy(asc(locations.name));
            
        return successResponse(res, result, "Data Provinsi berdasarkan Region");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data provinsi", 500);
    }
};

// GET LOCATIONS BY PARENT CODE (City, District, Village)
export const getLocationsByParent = async (req: AuthRequest, res: Response) => {
    try {
        const { parentCode } = req.query;
        const { type } = req.query; // Optional filter by type

        if (!parentCode) return errorResponse(res, "Parent Code diperlukan", 400);

        const conditions = [eq(locations.parentCode, parentCode as string)];
        
        if (type) {
            conditions.push(eq(locations.type, type as string));
        }

        const result = await db.select()
            .from(locations)
            .where(and(...conditions))
            .orderBy(asc(locations.name));
            
        return successResponse(res, result, "Data Lokasi (Child)");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data lokasi", 500);
    }
};

// GET LOCATION BY CODE
export const getLocationByCode = async (req: AuthRequest, res: Response) => {
    try {
        const { code } = req.query;
        if (!code) return errorResponse(res, "Code diperlukan", 400);

        const [result] = await db.select()
            .from(locations)
            .where(eq(locations.code, code as string));
            
        if (!result) return errorResponse(res, "Lokasi tidak ditemukan", 404);
            
        return successResponse(res, result, "Data Lokasi");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data lokasi", 500);
    }
};
