
import { db } from './index';
import { users, wallets, systemConfig, ppobProducts, products } from './schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { seedCOA } from './seed_coa'; // Import COA Seeder

const seed = async () => {
    console.log("🌱 Starting Seeding Process...");

    // 0. Seed COA (Chart of Accounts)
    await seedCOA();

    // 1. Seed System Config (Fixed 10 Features Only)
    console.log("⚙️  Seeding System Config...");
    const defaultConfig = {
        id: 'default',
        taxConfig: { ppnRate: 0.11, pph21Rate: 0.05, pph23Rate: 0.02, corporateTaxRate: 0.11, isPKP: false },
        features: {
            marketplace: true,
            ride: true,
            wholesale: true,
            groupFinancing: true,
            evoting: true,
            learning: true,
            shu: true,
            ppob: true,
            referral: true,
            community: true,
            chat: true,
            foodTracker: true
        },
        rideConfig: {
            baseFareMotor: 8000,
            pricePerKmMotor: 2500,
            baseFareMobil: 15000,
            pricePerKmMobil: 4500,
            appCommissionPercent: 15
        },
        generalConfig: {
            ktaValidityYears: 5,
            maxLoginAttempts: 3,
            supportEmail: 'support@kmp-adng.id'
        }
    };

    await db.insert(systemConfig)
        .values(defaultConfig)
        .onConflictDoUpdate({
            target: systemConfig.id,
            set: defaultConfig
        });

    // 2. Define Internal Users (Including KMP-ADNG Mart Admin)
    const passwordHash = await bcrypt.hash('Admin123@!', 10);
    const pinHash = await bcrypt.hash('123456', 10);

    const internalUsers = [
        { email: 'Super.Admin@kmp-adng.id', name: 'Super Administrator', roles: ['super_admin', 'admin'], ktaId: 'SA-001' },
        { email: 'gm@kmp-adng.id', name: 'General Manager', roles: ['general_manager', 'management'], ktaId: 'GM-001' },
        { email: 'cashier@kmp-adng.id', name: 'Staff Finance (Cashier)', roles: ['cashier', 'management'], ktaId: 'FIN-001' },
        { email: 'mart@kmp-adng.id', name: 'KMP-ADNG Mart Admin', roles: ['admin', 'merchant'], ktaId: 'MART-001', shopDetails: { name: 'KMP-ADNG Mart Official', description: 'Toko Resmi Koperasi' } }
    ];

    let martUserId = '';

    for (const u of internalUsers) {
        let [existing] = await db.select().from(users).where(eq(users.email, u.email));
        
        if (!existing) {
            console.log(`Creating user: ${u.name}...`);
            [existing] = await db.insert(users).values({
                ...u,
                phone: `00000000${Math.floor(Math.random() * 900) + 100}`, // Mock phone
                password: passwordHash,
                pin: pinHash,
                status: 'active'
            }).returning();
            
            await db.insert(wallets).values({ userId: existing.id, balance: '1000000000', savings: '0' });
        }
        
        if (u.email === 'mart@kmp-adng.id') martUserId = existing.id;
    }

    // 3. Seed PPOB Products (Real Data)
    console.log("📱 Seeding PPOB Products...");
    const ppobData = [
        // Pulsa
        { code: 'PULSA5', name: 'Pulsa 5.000', category: 'pulsa', price: 6500 },
        { code: 'PULSA10', name: 'Pulsa 10.000', category: 'pulsa', price: 11500 },
        { code: 'PULSA25', name: 'Pulsa 25.000', category: 'pulsa', price: 26500 },
        { code: 'PULSA50', name: 'Pulsa 50.000', category: 'pulsa', price: 51500 },
        { code: 'PULSA100', name: 'Pulsa 100.000', category: 'pulsa', price: 101500 },
        // Data
        { code: 'DATA1GB', name: 'Internet 1GB (3 Hari)', category: 'data', price: 10000 },
        { code: 'DATA3GB', name: 'Internet 3GB (7 Hari)', category: 'data', price: 25000 },
        { code: 'DATA10GB', name: 'Internet 10GB (30 Hari)', category: 'data', price: 65000 },
        { code: 'DATA25GB', name: 'Internet 25GB (30 Hari)', category: 'data', price: 110000 },
        // PLN
        { code: 'PLN20', name: 'Token Listrik 20.000', category: 'pln', price: 21500 },
        { code: 'PLN50', name: 'Token Listrik 50.000', category: 'pln', price: 51500 },
        { code: 'PLN100', name: 'Token Listrik 100.000', category: 'pln', price: 101500 },
        { code: 'PLN200', name: 'Token Listrik 200.000', category: 'pln', price: 201500 },
        // PDAM
        { code: 'PDAM_CHK', name: 'Cek Tagihan PDAM', category: 'pdam', price: 2500 }, // Admin fee only
    ];

    for (const p of ppobData) {
        await db.insert(ppobProducts)
            .values({ ...p, price: p.price.toString() })
            .onConflictDoNothing();
    }

    // 4. Seed Marketplace Products (KMP-ADNG Mart)
    if (martUserId) {
        console.log("🛒 Seeding Marketplace Products...");
        const marketData = [
            { name: 'Beras Premium KMP-ADNG (5kg)', price: 75000, category: 'Makanan', image: 'https://picsum.photos/id/1/300/300', stock: 100, isOfficial: true },
            { name: 'Minyak Goreng Kelapa (2L)', price: 38000, category: 'Makanan', image: 'https://picsum.photos/id/2/300/300', stock: 50, isOfficial: true },
            { name: 'Gula Pasir Lokal (1kg)', price: 16500, category: 'Makanan', image: 'https://picsum.photos/id/3/300/300', stock: 200, isOfficial: true },
            { name: 'Kopi Bubuk Asli (250g)', price: 25000, category: 'Minuman', image: 'https://picsum.photos/id/4/300/300', stock: 50, isOfficial: true },
        ];

        for (const m of marketData) {
            // Check if exists to avoid dupes on re-seed
            const exists = await db.select().from(products).where(eq(products.name, m.name));
            if (exists.length === 0) {
                await db.insert(products).values({
                    sellerId: martUserId,
                    name: m.name,
                    description: 'Produk resmi Koperasi, kualitas terjamin.',
                    price: m.price.toString(),
                    category: m.category,
                    image: m.image,
                    stock: m.stock,
                    isOfficial: m.isOfficial,
                    location: 'Gudang Pusat'
                });
            }
        }
    }

    console.log("✅ Seeding Completed!");
    (process as any).exit(0);
};

seed().catch((err) => {
    console.error("❌ Seeding Failed:", err);
    (process as any).exit(1);
});
