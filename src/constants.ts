
import { User, Product, Transaction, ChatContact, NewsItem, HelpTicket, Order, ChatMessage, ContentItem, SystemConfig, Campaign, Partner, AppNotification, MasterRegion, DbRegion, DbProvince, DbCity, DbDistrict, DbVillage, DbCoordinator, DbCounter } from './types';

// GLOBAL ASSETS
// Logo resmi KMP-ADNG (emblem garuda putih di atas merah), disajikan dari
// public/ oleh Vite/Express — tidak lagi bergantung ke hosting eksternal.
export const APP_LOGO = "/logo.png";

// DEFAULT SYSTEM CONFIGURATION
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
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
    taxConfig: {
        isPKP: false, // Default NON-PKP
        ppnRate: 0.11, // Standard PPN
        pph21Rate: 0.05,
        pph23Rate: 0.02,
        corporateTaxRate: 0.11 // UMKM Final 0.5% or Corp 11% or 22%
    },
    rideConfig: { 
        baseFareMotor: 8000,
        pricePerKmMotor: 2500,
        baseFareMobil: 15000,
        pricePerKmMobil: 4500,
        appCommissionPercent: 15
    },
    generalConfig: { // NEW
        ktaValidityYears: 5,
        maxLoginAttempts: 3,
        supportEmail: 'support@kmp-adng.id'
    },
    maintenanceMode: false,
    demoMode: false,
    appVersion: '2.0.1-Beta'
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
    { id: 'notif1', title: 'Top Up Berhasil', message: 'Saldo KMP-ADNG Pay senilai Rp 1.000.000 telah masuk.', date: 'Baru saja', type: 'transaction', isRead: false },
    { id: 'notif2', title: 'Promo Belanja', message: 'Diskon 50% untuk produk kopi Gayo khusus hari ini!', date: '2 jam lalu', type: 'promo', isRead: false },
    { id: 'notif_role', title: 'Selamat! Role Disetujui', message: 'Anda resmi menjadi Kordinator Marketing Prov. Banten.', date: 'Baru saja', type: 'system', isRead: false },
];

export const MARKETING_REWARDS = {
    'Wilayah': 500,
    'Provinsi': 1000,
    'Kota/Kabupaten': 2000,
    'Kecamatan': 3000,
    'Desa/Kelurahan': 5000
};

// --- 7 DATABASE TABLES INITIAL SEED ---

export const MOCK_DB_REGIONS: DbRegion[] = [
    { id: 'reg-1', code: '1', name: 'Pulau Sumatera' },
    { id: 'reg-2', code: '2', name: 'DKI Jakarta' },
    { id: 'reg-3', code: '3', name: 'Banten' },
    { id: 'reg-4', code: '4', name: 'Jawa Barat' },
    { id: 'reg-5', code: '5', name: 'Jawa Tengah & DIY' },
    { id: 'reg-6', code: '6', name: 'Jawa Timur' },
];

export const MOCK_DB_PROVINCES: DbProvince[] = [
    { id: 'prov-11', regionId: 'reg-1', code: '11', name: 'Aceh' },
    { id: 'prov-12', regionId: 'reg-1', code: '12', name: 'Sumatera Utara' },
    { id: 'prov-31', regionId: 'reg-2', code: '31', name: 'DKI Jakarta' },
    { id: 'prov-32', regionId: 'reg-4', code: '32', name: 'Jawa Barat' },
    { id: 'prov-36', regionId: 'reg-3', code: '36', name: 'Banten' },
];

export const MOCK_DB_CITIES: DbCity[] = [
    { id: 'city-1171', provinceId: 'prov-11', code: '71', name: 'Kota Banda Aceh' },
    { id: 'city-3174', provinceId: 'prov-31', code: '74', name: 'Jakarta Selatan' },
    { id: 'city-3273', provinceId: 'prov-32', code: '73', name: 'Kota Bandung' },
    { id: 'city-3204', provinceId: 'prov-32', code: '04', name: 'Kab. Bandung' },
    { id: 'city-3603', provinceId: 'prov-36', code: '03', name: 'Kab. Tangerang' },
];

export const MOCK_DB_DISTRICTS: DbDistrict[] = [
    { id: 'dist-320401', cityId: 'city-3204', code: '01', name: 'Kec. Ciparay' },
    { id: 'dist-320402', cityId: 'city-3204', code: '02', name: 'Kec. Majalaya' },
];

export const MOCK_DB_VILLAGES: DbVillage[] = [
    { id: 'vil-32040101', districtId: 'dist-320401', code: '2001', name: 'Desa Sumbersari' },
    { id: 'vil-32040102', districtId: 'dist-320401', code: '2002', name: 'Desa Pakutandang' },
];

export const MOCK_DB_COORDINATORS: DbCoordinator[] = [
    { id: 'co-1', level: 'Provinsi', areaId: 'prov-32', userId: 'u2', userName: 'Budi Santoso', appointedDate: '2024-01-01' },
    { id: 'co-2', level: 'Provinsi', areaId: 'prov-36', userId: 'u1', userName: 'Ulpermadi Ibrahim', appointedDate: '2024-10-15' },
];

export const MOCK_DB_COUNTERS: DbCounter[] = [
    { cityId: 'city-1171', lastNumber: 1540 },
    { cityId: 'city-3204', lastNumber: 4120 },
];

// --- LEGACY EXPANDED FOR ONBOARDING --- 
export const MASTER_REGION_DATA: MasterRegion[] = [
    {
        id: 'reg-4', code: '4', name: 'Jawa Barat',
        provinces: [
            {
                id: 'prov-32', code: '32', name: 'Jawa Barat',
                cities: [
                    { 
                        id: 'city-3204', code: '04', name: 'Kab. Bandung', memberCounter: 4120,
                        districts: [
                            { id: 'd1', name: 'Kec. Ciparay', villages: ['Desa Sumbersari', 'Desa Pakutandang', 'Desa Manggungharja'] },
                            { id: 'd2', name: 'Kec. Majalaya', villages: ['Desa Majalaya', 'Desa Majasetra', 'Desa Biru'] }
                        ]
                    },
                    { 
                        id: 'city-3273', code: '73', name: 'Kota Bandung', memberCounter: 2200,
                        districts: [
                            { id: 'd3', name: 'Kec. Buahbatu', villages: ['Kel. Sekejati', 'Kel. Margasari'] },
                            { id: 'd4', name: 'Kec. Coblong', villages: ['Kel. Dago', 'Kel. Lebakgede'] }
                        ]
                    }
                ]
            },
        ]
    },
    {
        id: 'reg-3', code: '3', name: 'Banten',
        provinces: [
            {
                id: 'prov-36', code: '36', name: 'Banten',
                cities: [
                    { 
                        id: 'city-3603', code: '03', name: 'Kab. Tangerang', memberCounter: 1500,
                        districts: [
                            { id: 'd5', name: 'Kec. Cikupa', villages: ['Desa Cikupa', 'Desa Talaga'] }
                        ]
                    }
                ]
            }
        ]
    }
];

export const OCCUPIED_TERRITORIES = [
    { level: 'Provinsi', code: '32', name: 'Jawa Barat', coordinatorName: 'H. Asep' },
];

// FORCE ALL ROLES ON MAIN USER
export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Ulpermadi Ibrahim',
  email: 'ulpermadi@kmp-adng.id',
  phone: '08123456789',
  roles: ['member', 'management', 'pengurus', 'producer', 'content_creator', 'marketing_coordinator', 'admin'], 
  roleTitles: {
      management: 'MANAGER DIVISI IT & SISTEM',
      pengurus: 'SEKRETARIS',
      producer: 'KETUA POKJA',
      marketing_coordinator: 'KORWIL PROVINSI BANTEN' 
  },
  officialTitle: 'MANAGER DIVISI IT & SISTEM', 
  transactionPin: '123456', 
  pinResetStatus: 'none',
  marketingRoleDetails: {
      level: 'Provinsi',
      territory: {
          level: 'Provinsi',
          areaName: 'Provinsi Banten',
          areaCode: '36',
          totalPopulation: 1250000, 
          activeMerchants: 5200,
          monthlyGmv: 15000000000 
      },
      downlines: 8, 
      performanceScore: 92
  },
  wholesaleAccess: 'active',
  status: 'active',
  joinDate: '09/24',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  balance: 5450000,
  savings: 12500000,
  loanBalance: 0,
  ktaId: '211050001234',
  shopDetails: {
    name: "Ulpermadi Craft",
    description: "Menjual kerajinan tangan khas daerah",
    imageUrl: "https://picsum.photos/id/20/300/300"
  },
  contentCreatorDetails: {
    platform: 'YouTube',
    channelName: 'Ulpermadi Edu',
    category: 'Edukasi',
    followersCount: '15K'
  },
  enrolledCourses: [] 
};

export const MOCK_KORDINATOR_DETAILS: any[] = [];

export const MOCK_USERS_DB: User[] = [
  CURRENT_USER,
  {
    ...CURRENT_USER,
    id: 'u2',
    name: 'Budi Santoso (Merchant)',
    email: 'budi@kmp-adng.id',
    phone: '08111111111',
    roles: ['member', 'merchant'], 
    officialTitle: undefined, 
    roleTitles: {},
    wholesaleAccess: 'none',
    joinDate: '01/24',
    transactionPin: '123456',
    shopDetails: {
      name: 'Warung Budi',
      description: 'Sembako dan Kebutuhan Harian',
      imageUrl: 'https://picsum.photos/id/1060/300/300'
    }
  },
  // --- INTERNAL ACCOUNTS ---
  {
    ...CURRENT_USER,
    id: 'super-admin',
    name: 'Super Administrator',
    email: 'Super.Admin@kmp-adng.id',
    phone: '0000000001',
    roles: ['super_admin', 'admin', 'management'],
    status: 'active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Super+Admin&background=000&color=fff',
    officialTitle: 'SUPER ADMIN',
    ktaId: 'SA-001'
  },
  {
    ...CURRENT_USER,
    id: 'gm-01',
    name: 'Bapak General Manager',
    email: 'gm@kmp-adng.id',
    phone: '0000000002',
    roles: ['general_manager', 'management', 'member'],
    status: 'active',
    avatarUrl: 'https://ui-avatars.com/api/?name=General+Manager&background=6366f1&color=fff',
    officialTitle: 'GENERAL MANAGER',
    ktaId: 'GM-001'
  },
  {
    ...CURRENT_USER,
    id: 'fin-01',
    name: 'Staff Finance (Cashier)',
    email: 'cashier@kmp-adng.id',
    phone: '0000000003',
    roles: ['cashier', 'management'],
    status: 'active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Cashier&background=10b981&color=fff',
    officialTitle: 'HEAD OF TREASURY',
    ktaId: 'FIN-001'
  },
  {
    ...CURRENT_USER,
    id: 'acc-01',
    name: 'Staff Accounting',
    email: 'accountant@kmp-adng.id',
    phone: '0000000004',
    roles: ['accountant', 'management'],
    status: 'active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Accounting&background=3b82f6&color=fff',
    officialTitle: 'CHIEF ACCOUNTANT',
    ktaId: 'ACC-001'
  },
  {
    ...CURRENT_USER,
    id: 'admin-01',
    name: 'ADMINISTRATOR UTAMA',
    email: 'admin@kmp-adng.id',
    phone: '0000000005',
    roles: ['admin', 'management', 'member', 'marketing_coordinator'], 
    officialTitle: 'ADMINISTRATOR',
    roleTitles: {},
    status: 'active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Administrator&background=dc2626&color=fff',
    ktaId: 'ADM-001'
  },
  {
    ...CURRENT_USER,
    id: 'ao-01',
    name: 'Account Officer (AO)',
    email: 'ao@kmp-adng.id',
    phone: '0000000006',
    roles: ['account_officer', 'management', 'member'],
    status: 'active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Account+Officer&background=f97316&color=fff',
    officialTitle: 'ACCOUNT OFFICER',
    ktaId: 'AO-001'
  }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Kain Tenun Tradisional', price: 750000, category: 'Kerajinan', image: 'https://picsum.photos/id/20/300/300', rating: 4.8, location: 'Toko Adat Jaya', isOfficial: false, sellerName: 'Ibu Ratna' },
  { id: 'p2', name: 'Kopi Arabika Gayo', price: 85000, category: 'Makanan', image: 'https://picsum.photos/id/1060/300/300', rating: 4.9, location: 'KMP-ADNG Mart Aceh', isOfficial: true },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'payment', amount: 150000, date: '2024-09-28', status: 'success', description: 'Pembayaran Listrik PLN' },
];

export const MOCK_CHATS: ChatContact[] = [
  { id: 'c1', type: 'personal', status: 'connected', name: 'Admin Koperasi', avatar: 'https://picsum.photos/id/1/200/200', lastMessage: 'Pengajuan pinjaman Anda telah disetujui.', time: '10:30', unread: 2 },
];

export const MOCK_CHAT_HISTORY: Record<string, ChatMessage[]> = {
  'c1': [
    { id: 'm1', senderId: 'c1', text: 'Selamat pagi pak, ada yang bisa dibantu?', timestamp: '08:00', isMe: false },
  ]
};

export const MOCK_NEWS: NewsItem[] = [
  { id: 'n1', title: 'Turnamen Sepakbola Antar Desa Dimulai', category: 'Berita', image: 'https://picsum.photos/id/1055/400/200', date: '30 Sep 2024', summary: 'Saksikan keseruan pertandingan pembuka di stadion utama.', status: 'published', author: 'Admin' },
];

export const MOCK_TICKETS: HelpTicket[] = [
  { id: 'tk1', userId: 'u2', userName: 'Siti Aminah', subject: 'Gagal Top Up OVO', message: 'Saya sudah transfer tapi saldo belum masuk.', status: 'open', date: '2024-10-01' },
];

export const MOCK_ORDERS: Order[] = [
  { id: 'ord-1', productId: 'p1', productName: 'Kain Tenun Tradisional', productImage: 'https://picsum.photos/id/20/100/100', buyerName: 'Siti Aminah', amount: 750000, quantity: 1, status: 'pending', date: '02 Okt 2024', address: 'Jl. Merdeka No 10, Jakarta' },
];

export const FAQ_ITEMS = [
  { q: "Bagaimana cara menjadi Merchant?", a: "Masuk ke menu 'Jadi Mitra' di sidebar, pilih Merchant, dan lengkapi data toko Anda." },
];

export const MOCK_CONTENT: ContentItem[] = [
  { 
    id: 'c1', 
    title: 'Dasar-Dasar Akuntansi UMKM', 
    description: 'Pelajari cara mencatat keuangan usaha kecil agar rapi dan auditable.', 
    category: 'Edukasi', 
    thumbnailUrl: 'https://picsum.photos/id/20/400/225', 
    authorName: 'Anisa Cendekia', 
    authorId: 'u7',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    date: '10 Okt 2024', 
    views: 120, 
    likes: 45,
    status: 'published',
    modules: [
        { id: 'm1', title: 'Pengenalan Akuntansi', type: 'video', duration: '15 Min', contentUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4' },
    ]
  }
];

export const MOCK_CAMPAIGNS: Campaign[] = [
    { id: 'cmp1', title: 'Promo Sembako Murah', targetSector: 'Konsumsi', status: 'Active', conversionRate: 15.4, budgetUsed: 5000000, reach: 2500 },
];

export const MOCK_PARTNERS: Partner[] = [
    { id: 'prt1', name: 'Indofood Sukses Makmur', type: 'Distributor', status: 'Connected', integrationLevel: 90 },
];
