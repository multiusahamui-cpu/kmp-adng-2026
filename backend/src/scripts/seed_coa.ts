
import { db } from '../db';
import { accounts } from '../db/schema';

const INITIAL_COA = [
    { code: '1101', name: 'Kas Besar', type: 'Aktiva' },
    { code: '1102', name: 'Kas Kecil', type: 'Aktiva' },
    { code: '1201', name: 'Bank BCA', type: 'Aktiva' },
    { code: '1202', name: 'Bank Mandiri', type: 'Aktiva' },
    { code: '1301', name: 'Piutang Anggota', type: 'Aktiva' },
    { code: '1401', name: 'Persediaan Barang Dagang', type: 'Aktiva' },
    { code: '1501', name: 'Perlengkapan Kantor', type: 'Aktiva' },
    { code: '1601', name: 'Aset Tetap - Peralatan', type: 'Aktiva' },
    { code: '2101', name: 'Utang Usaha', type: 'Kewajiban' },
    { code: '2102', name: 'Simpanan Sukarela', type: 'Kewajiban' },
    { code: '3101', name: 'Simpanan Pokok', type: 'Ekuitas' },
    { code: '3102', name: 'Simpanan Wajib', type: 'Ekuitas' },
    { code: '3103', name: 'Cadangan Modal', type: 'Ekuitas' },
    { code: '3104', name: 'SHU Tahun Berjalan', type: 'Ekuitas' },
    { code: '4101', name: 'Pendapatan Jasa', type: 'Pendapatan' },
    { code: '4102', name: 'Penjualan Barang', type: 'Pendapatan' },
    { code: '5101', name: 'Beban Gaji', type: 'Beban' },
    { code: '5102', name: 'Beban Listrik & Air', type: 'Beban' },
    { code: '5103', name: 'Beban Sewa', type: 'Beban' },
    { code: '5104', name: 'Beban Operasional Lainnya', type: 'Beban' }
];

async function seed() {
    console.log('Seeding Chart of Accounts...');
    try {
        for (const acc of INITIAL_COA) {
            // Check if exists first to avoid duplicate key error if code is unique
            const existing = await db.query.accounts.findFirst({
                where: (accounts, { eq }) => eq(accounts.code, acc.code)
            });

            if (!existing) {
                await db.insert(accounts).values({
                    code: acc.code,
                    name: acc.name,
                    type: acc.type as any
                });
                console.log(`Inserted: ${acc.code} - ${acc.name}`);
            } else {
                console.log(`Skipped (Exists): ${acc.code}`);
            }
        }
        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
