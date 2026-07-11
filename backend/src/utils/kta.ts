
import { db } from '../db';
import { locations } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Generate KTA Number based on Location Code
 * Format: [RegionCode].[ProvinceCode].[CityCode].[RunningNumber]
 * X.XX.XX.9999999
 */
export const generateKtaNumber = async (userId: string, cityId: string): Promise<string> => {
    return await db.transaction(async (tx) => {
        // 1. Ambil Data Lokasi (Kota/Kabupaten)
        const [location] = await tx.select().from(locations).where(eq(locations.code, cityId));

        if (!location) {
            throw new Error("Kode Lokasi Kabupaten/Kota tidak valid.");
        }

        // 2. Get Province Code (first 2 chars of cityId)
        const provinceCode = cityId.substring(0, 2);

        // 3. Get Region Code from Province's parentCode in locations table
        let regionCode = '0';
        const [provinceLocation] = await tx.select().from(locations).where(eq(locations.code, provinceCode));
        
        if (provinceLocation && provinceLocation.parentCode) {
            // The parent of a Province is the Region
            // We assume parentCode IS the region code (or we might need to lookup the parent to get its code if parentCode is an ID, but schema says varchar code)
            // In locations table, parentCode refers to the 'code' of the parent.
            regionCode = provinceLocation.parentCode;
        }

        // 4. Atomic Increment Member Counter
        const [updatedLoc] = await tx
            .update(locations)
            .set({ 
                memberCounter: sql`${locations.memberCounter} + 1` 
            })
            .where(eq(locations.code, cityId))
            .returning({ newCounter: locations.memberCounter });

        const runningNumber = updatedLoc.newCounter || 0;

        // 5. Format KTA
        // X.XX.XX.9999999
        const paddedCounter = runningNumber.toString().padStart(7, '0');
        
        // cityId already contains Province.City (e.g. 32.04)
        const ktaString = `${regionCode}.${cityId}.${paddedCounter}`;

        return ktaString;
    });
};
