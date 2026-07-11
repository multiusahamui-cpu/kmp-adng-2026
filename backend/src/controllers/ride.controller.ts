
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { rideBookings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const bookRideSchema = z.object({
  pickupAddr: z.string(),
  dropoffAddr: z.string(),
  distance: z.number(), 
  vehicleType: z.enum(['motor', 'mobil', 'box']),
});

export const calculatePrice = async (req: AuthRequest, res: Response) => {
  const { distance, type } = req.body;
  const basePrice = type === 'motor' ? 8000 : 15000;
  const pricePerKm = type === 'motor' ? 2500 : 4500;
  const total = basePrice + (pricePerKm * distance);
  
  return successResponse(res, { price: Math.ceil(total / 100) * 100 }, "Estimasi Harga");
};

export const bookRide = async (req: AuthRequest, res: Response) => {
  try {
    const data = bookRideSchema.parse(req.body);
    const userId = req.user.id;

    const basePrice = data.vehicleType === 'motor' ? 8000 : 15000;
    const pricePerKm = data.vehicleType === 'motor' ? 2500 : 4500;
    const estimatedPrice = basePrice + (pricePerKm * data.distance);

    const [booking] = await db.insert(rideBookings).values({
        customerId: userId,
        pickupAddr: data.pickupAddr,
        dropoffAddr: data.dropoffAddr,
        distance: data.distance.toString(),
        price: estimatedPrice.toString(),
        status: 'SEARCHING'
    }).returning();

    return successResponse(res, booking, "Mencari Driver...");
  } catch (error) {
    return errorResponse(res, "Gagal booking ride", 500);
  }
};

export const updateRideStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = (req as any).params;
    const { status } = req.body; 

    const [booking] = await db.update(rideBookings)
        .set({ status })
        .where(eq(rideBookings.id, id))
        .returning();

    return successResponse(res, booking, "Status diupdate");
  } catch (error) {
    return errorResponse(res, "Gagal update status", 500);
  }
};
