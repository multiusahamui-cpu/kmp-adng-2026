
import { db } from './index';
import { accounts } from './schema';

const INITIAL_COA = [
    // 1. AKTIVA (ASSETS)
    // 1.1 Aktiva Lancar
    { code: '1-1100', name: 'Kas Besar', type: 'Aktiva' },
    { code: '1-1110', name: 'Kas Kecil', type: 'Aktiva' },
    { code: '1-1200', name: 'Bank BCA', type: 'Aktiva' },
    { code: '1-1210', name: 'Bank Mandiri', type: 'Aktiva' },
    { code: '1-1300', name: 'Piutang Anggota (Pinjaman)', type: 'Aktiva' },
    { code: '1-1310', name: 'Piutang Usaha (Non-Anggota)', type: 'Aktiva' },
    { code: '1-1400', name: 'Persediaan Barang Dagang', type: 'Aktiva' },
    { code: '1-1500', name: 'Perlengkapan Kantor (ATK)', type: 'Aktiva' },
    { code: '1-1600', name: 'Sewa Dibayar Dimuka', type: 'Aktiva' },
    // 1.2 Aktiva Tetap
    { code: '1-1700', name: 'Tanah', type: 'Aktiva' },
    { code: '1-1710', name: 'Bangunan', type: 'Aktiva' },
    { code: '1-1715', name: 'Akum. Penyusutan Bangunan', type: 'Aktiva' },
    { code: '1-1720', name: 'Kendaraan Operasional', type: 'Aktiva' },
    { code: '1-1725', name: 'Akum. Penyusutan Kendaraan', type: 'Aktiva' },
    { code: '1-1730', name: 'Inventaris Kantor', type: 'Aktiva' },
    { code: '1-1735', name: 'Akum. Penyusutan Inventaris', type: 'Aktiva' },

    // 2. KEWAJIBAN (LIABILITIES)
    // 2.1 Kewajiban Lancar
    { code: '2-1100', name: 'Utang Usaha', type: 'Kewajiban' },
    { code: '2-1200', name: 'Simpanan Sukarela', type: 'Kewajiban' },
    { code: '2-1300', name: 'Simpanan Berjangka (Deposito)', type: 'Kewajiban' },
    { code: '2-1400', name: 'Dana Bagian SHU (Ymh Dibayar)', type: 'Kewajiban' },
    { code: '2-1500', name: 'Utang Pajak (PPh/PPN)', type: 'Kewajiban' },
    { code: '2-1600', name: 'Biaya Ymh Dibayar', type: 'Kewajiban' },
    // 2.2 Kewajiban Jangka Panjang
    { code: '2-2100', name: 'Utang Bank Jangka Panjang', type: 'Kewajiban' },

    // 3. EKUITAS (EQUITY)
    { code: '3-1100', name: 'Simpanan Pokok', type: 'Ekuitas' },
    { code: '3-1200', name: 'Simpanan Wajib', type: 'Ekuitas' },
    { code: '3-1300', name: 'Simpanan Khusus / Hibah', type: 'Ekuitas' },
    { code: '3-1400', name: 'Cadangan Umum', type: 'Ekuitas' },
    { code: '3-1500', name: 'Cadangan Resiko', type: 'Ekuitas' },
    { code: '3-1600', name: 'SHU Tahun Lalu (Belum dibagi)', type: 'Ekuitas' },
    { code: '3-1700', name: 'SHU Tahun Berjalan', type: 'Ekuitas' },

    // 4. PENDAPATAN (REVENUE)
    { code: '4-1100', name: 'Pendapatan Penjualan (Toko)', type: 'Pendapatan' },
    { code: '4-1200', name: 'Pendapatan Jasa Pinjaman', type: 'Pendapatan' },
    { code: '4-1300', name: 'Pendapatan Administrasi & Provisi', type: 'Pendapatan' },
    { code: '4-1400', name: 'Pendapatan Lain-lain', type: 'Pendapatan' },

    // 5. BEBAN (EXPENSES)
    // 5.1 Beban Operasional
    { code: '5-1100', name: 'Harga Pokok Penjualan (HPP)', type: 'Beban' },
    { code: '5-1200', name: 'Beban Gaji & Tunjangan', type: 'Beban' },
    { code: '5-1300', name: 'Beban Listrik, Air, Telepon', type: 'Beban' },
    { code: '5-1400', name: 'Beban Sewa Kantor', type: 'Beban' },
    { code: '5-1500', name: 'Beban ATK & Cetakan', type: 'Beban' },
    { code: '5-1600', name: 'Beban Transportasi & Dinas', type: 'Beban' },
    { code: '5-1700', name: 'Beban Pemasaran & Promosi', type: 'Beban' },
    { code: '5-1800', name: 'Beban Pemeliharaan & Perbaikan', type: 'Beban' },
    { code: '5-1900', name: 'Beban Penyusutan Aset Tetap', type: 'Beban' },
    // 5.2 Beban Perkoperasian
    { code: '5-2100', name: 'Beban Rapat Anggota (RAT)', type: 'Beban' },
    { code: '5-2200', name: 'Beban Pendidikan & Pelatihan', type: 'Beban' },
    { code: '5-2300', name: 'Beban Bunga Simpanan', type: 'Beban' },
    // 5.3 Beban Lain-lain
    { code: '5-9100', name: 'Beban Administrasi Bank', type: 'Beban' },
    { code: '5-9200', name: 'Beban Pajak', type: 'Beban' },
];

export async function seedCOA() {
    console.log('Seeding Chart of Accounts...');
    
    for (const account of INITIAL_COA) {
        await db.insert(accounts).values(account).onConflictDoNothing();
    }
    
    console.log('COA Seeding Completed.');
}
