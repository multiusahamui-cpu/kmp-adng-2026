
export type ContentCategory = 
  | 'Edukasi' | 'Workshop' | 'Sertifikasi'
  | 'Olah Raga' 
  | 'Hiburan' | 'Seni Budaya' | 'VLOG'
  | 'Bisnis' | 'Berita' | 'Pengumuman' | 'Undangan';

export interface RidePricingConfig {
  baseFareMotor: number;
  pricePerKmMotor: number;
  baseFareMobil: number;
  pricePerKmMobil: number;
  appCommissionPercent: number; 
}

export interface SystemConfig {
    features: {
        marketplace: boolean;
        ride: boolean;
        wholesale: boolean;
        groupFinancing: boolean;
        evoting: boolean;
        learning: boolean;
        shu: boolean;
        ppob: boolean;
        referral: boolean;
        community: boolean;
        chat: boolean;
        foodTracker: boolean;
    };
    taxConfig: {
        isPKP: boolean;
        ppnRate: number;
        pph21Rate: number;
        pph23Rate: number;
        corporateTaxRate: number;
    };
    rideConfig: RidePricingConfig;
    generalConfig: { // NEW: General Policy Settings
        ktaValidityYears: number; // 5 Tahun
        maxLoginAttempts: number;
        supportEmail: string;
    };
    maintenanceMode: boolean;
    demoMode: boolean;
    appVersion: string;
}

// --- DATABASE TABLES STRUCTURE (RELATIONAL DB MODEL) ---

export interface DbRegion {
    id: string;
    code: string; 
    name: string;
}

export interface DbProvince {
    id: string;
    regionId: string; 
    code: string; 
    name: string;
}

export interface DbCity {
    id: string;
    provinceId: string; 
    code: string; 
    name: string;
}

export interface DbDistrict {
    id: string;
    cityId: string; 
    code: string; 
    name: string;
}

export interface DbVillage {
    id: string;
    districtId: string; 
    code: string; 
    name: string;
}

export interface DbCoordinator {
    id: string;
    level: 'Wilayah' | 'Provinsi' | 'Kota/Kabupaten' | 'Kecamatan' | 'Desa/Kelurahan';
    areaId: string; 
    userId: string; 
    userName: string;
    appointedDate: string;
}

export interface DbCounter {
    cityId: string; 
    lastNumber: number; 
}

// --- LEGACY ---
export interface MasterRegion {
    id: string;
    code: string; 
    name: string; 
    provinces: MasterProvince[];
}

export interface MasterProvince {
    id: string;
    code: string; 
    name: string;
    cities: MasterCity[];
}

export interface MasterCity {
    id: string;
    code: string; 
    name: string;
    memberCounter: number; 
    districts: MasterDistrict[]; 
}

export interface MasterDistrict {
    id: string;
    name: string;
    villages: string[]; 
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    date: string;
    type: 'transaction' | 'promo' | 'system' | 'info';
    isRead: boolean;
}

export type MarketingLevel = 'Nasional' | 'Wilayah' | 'Provinsi' | 'Kota/Kabupaten' | 'Kecamatan' | 'Desa/Kelurahan';

export interface MarketingTerritory {
    level: MarketingLevel;
    areaName: string;
    areaCode: string;
    totalPopulation: number;
    activeMerchants: number;
    monthlyGmv: number;
}

// NEW: Role Application
export interface RoleApplication {
    id: string;
    userId: string;
    role: string;
    data: any;
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;
    createdAt: string;
}

export interface MemberSavings {
  pokok: number;
  wajib: number;
  sukarela: number;
  total: number;
}

export interface CoopStats {
  totalSimpananPokok: number;
  totalSimpananWajib: number;
  totalSimpananSukarela: number;
  cadanganModal: number;
  hibah: number;
  shuDitahan: number;
  lastUpdated: string;
}

export interface TransactionStat {
    name: string;
    value: number;
    count: number;
    color: string;
}

export interface KordinatorDetail {
    id: string;
    userId: string;
    locationCode: string; // locations.code
    memberCounter: number; // member_counter
    level: MarketingLevel;
    status: 'active' | 'history';
    createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  roles: (
    | 'member' | 'content_creator' | 'driver' | 'merchant' | 'exchanger' | 'distributor' | 'producer' 
    | 'marketing_coordinator' 
    | 'mobile_trader' // NEW ROLE
    | 'super_admin' | 'admin' | 'management' | 'pengurus'
    | 'cashier' | 'accountant' | 'general_manager' | 'internal_audit' | 'warehouse_head' | 'expedition' | 'account_officer'
  )[];
  status: 'active' | 'pending' | 'awaiting_payment' | 'suspended' | 'rejected' | 'inactive' | 'closed';
  joinDate?: string;
  avatarUrl: string;
  balance: number;
  savings: number;
  savingsDetail?: MemberSavings; // NEW: Detailed Savings Breakdown
  transactionStats?: TransactionStat[];
  loanBalance: number;
  ktaId: string;
  
  // KYC FIELDS
  kycVerified?: boolean; // NEW FLAG
  nik?: string; 
  address?: string; 
  heir?: string;
  gender?: string;
  occupation?: string;
  regional?: string;
  provinceId?: string;
  cityId?: string;
  districtId?: string;
  villageId?: string;
  postalCode?: string;
  ktpPhoto?: string;
  selfiePhoto?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;

  officialTitle?: string; 
  roleTitles?: Partial<Record<string, string>>;
  transactionPin?: string; 
  pinResetStatus?: 'none' | 'requested' | 'approved'; 
  marketingRoleDetails?: {
      level: MarketingLevel;
      territory: MarketingTerritory;
      downlines: number;
      performanceScore: number;
  };
  wholesaleAccess?: 'invited' | 'active' | 'none'; 
  referralCode?: string; 
  referralStats?: {
      totalInvited: number;
      totalEarnings: number;
      history: { name: string; date: string; amount: number }[];
  };
  shopDetails?: { name: string; description: string; imageUrl: string; };
  driverDetails?: { vehicleType: 'motor' | 'mobil' | 'box'; plateNumber: string; color: string; vehiclePhoto: string; };
  exchangerDetails?: { address: string; facilities: string; mapsLocation: string; depositCapacity: string; };
  contentCreatorDetails?: { platform: string; channelName: string; category: string; followersCount: string; };
  distributorDetails?: { companyName: string; npwp: string; warehouseAddress: string; distributionArea: string; };
  mobileTraderDetails?: { 
      tradeName: string; 
      category: 'Pedagang Sayur' | 'Gerobak Street Food' | 'Asongan Makanan Siap Saji'; 
      vehicleType: string; 
  };
  additionalDetails?: any;
  enrolledCourses?: { courseId: string; completedModuleIds: string[]; lastAccessedModuleId?: string; }[];
  preferences?: {
      theme?: 'light' | 'dark';
      notifications?: {
          all: boolean,
          transaction: boolean;
          promo: boolean;
          chat: boolean;
      };
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  location: string;
  isOfficial: boolean; 
  sellerName?: string;
  sellerId?: string; 
}

export interface VoteCandidate {
    id: string;
    name: string;
    photo: string;
    vision: string;
    mission: string[];
    votes: number;
}

export interface VoteSession {
    id: string;
    title: string;
    type: 'election' | 'policy';
    description: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'closed' | 'upcoming';
    candidates: VoteCandidate[];
    hasVoted: boolean;
    totalVoters: number;
}

export interface WholesaleItem {
    id: string;
    commodityName: string;
    grade: string;
    totalQty: number;
    unit: 'Kg' | 'Ton' | 'Kuintal';
    minOrder: number;
    openPrice: number;
    harvestDate: string;
    description: string;
    images: string[];
    sellerGroupId: string;
    sellerGroupName: string;
    location: string;
    status: 'open' | 'negotiation' | 'sold';
    bids: WholesaleBid[];
}

export interface WholesaleBid {
    id: string;
    distributorId: string;
    distributorName: string;
    bidPrice: number;
    notes: string;
    date: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface WholesaleTransaction {
    id: string;
    itemId: string;
    itemName: string;
    sellerName: string;
    buyerName: string;
    totalAmount: number;
    status: 'escrow_pending' | 'escrow_paid' | 'goods_shipped' | 'goods_received' | 'completed' | 'dispute';
    date: string;
}

export interface CartItem extends Product {
  cartId: string; 
  quantity: number;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerName: string;
  amount: number;
  quantity: number;
  status: 'pending' | 'process' | 'shipped' | 'completed' | 'cancelled';
  date: string;
  address: string;
  trackingNumber?: string; 
  timeline?: { status: string; date: string; note?: string }[];
}

export interface Transaction {
  id: string;
  type: 'transfer' | 'payment' | 'topup' | 'purchase' | 'commission' | 'ride' | 'ppob' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'TOPUP' | 'PPOB' | 'PURCHASE' | 'SAVING_DEPOSIT' | 'SAVING_WITHDRAW' | string; 
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  description: string;
  refId?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string; 
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface ChatContact {
  id: string;
  type: 'personal' | 'group';
  status: 'connected' | 'pending_incoming' | 'pending_outgoing'; 
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isAdminOnly?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  category: ContentCategory; 
  image: string;
  date: string;
  summary: string;
  status: 'published' | 'pending' | 'rejected' | 'unpublished'; 
  author?: string;
}

export interface HelpTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category?: string; 
  message: string;
  status: 'open' | 'closed';
  response?: string;
  date: string;
}

export interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'article';
  duration: string; 
  contentUrl?: string; 
  textContent?: string; 
  imageContent?: string; 
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: ContentCategory; 
  thumbnailUrl: string;
  authorName: string;
  authorId: string;
  authorAvatar: string;
  location?: string; 
  date: string;
  views: number;
  likes: number;
  status?: 'published' | 'pending' | 'rejected' | 'unpublished'; 
  isPremium?: boolean; 
  modules: CourseModule[]; 
}

export interface Campaign {
    id: string;
    title: string;
    targetSector: string;
    status: 'Active' | 'Paused' | 'Ended';
    conversionRate: number; 
    budgetUsed: number;
    reach: number;
}

export interface Partner {
    id: string;
    name: string;
    type: 'Distributor' | 'Logistics' | 'Payment';
    status: 'Connected' | 'Pending';
    integrationLevel: number; 
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  MARKETPLACE = 'marketplace',
  CART = 'cart',
  CHECKOUT = 'checkout',
  ORDER_HISTORY = 'order_history',
  COMMUNITY = 'community',
  WALLET = 'wallet',
  KOPERASI = 'koperasi',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  LOGIN = 'login',
  REGISTER = 'register',
  ONBOARDING = 'onboarding',
  HELP = 'help',
  KNOWLEDGE_CENTER = 'knowledge_center', 
  PARTNER = 'partner',
  RIDE = 'ride',
  GROUP_FINANCING = 'group_financing',
  GROUP_PROJECT_DASHBOARD = 'group_project_dashboard', 
  WHOLESALE_MARKET = 'wholesale_market', 
  STORE_MANAGER = 'store_manager',
  DRIVER_DASHBOARD = 'driver_dashboard',
  EXCHANGER_DASHBOARD = 'exchanger_dashboard',
  CREATOR_DASHBOARD = 'creator_dashboard', 
  MARKETING_DASHBOARD = 'marketing_dashboard', 
  MOBILE_TRADER_DASHBOARD = 'mobile_trader_dashboard', 
  FOOD_STREET_TRACKER = 'food_street_tracker', 
  LEARNING_SPACE = 'learning_space', 
  COURSE_PLAYER = 'course_player', 
  REFERRAL = 'referral', 
  PPOB = 'ppob',
  SCAN_QR = 'scan_qr', 
  EVOTING = 'evoting',
  SHU = 'shu', 
  
  // Admin Routes
  ADMIN = 'admin', 
  ADMIN_APPROVALS = 'admin_approvals', 
  ADMIN_MEMBERS = 'admin_members', 
  ADMIN_HELPDESK = 'admin_helpdesk', 
  ADMIN_CONTENT = 'admin_content',
  ADMIN_CREATOR = 'admin_creator', 
  ADMIN_SETTINGS = 'admin_settings', 
  
  ADMIN_REGIONS = 'admin_regions', 
  ADMIN_PARAMETER = 'admin_parameter', 
  ADMIN_EOD = 'admin_eod', 
  
  SUPER_ADMIN_STRUCTURE = 'super_admin_structure', 
  
  CASHIER_TREASURY = 'cashier_treasury',
  CASHIER_MANAGEMENT = 'cashier_management',
  CASHIER_POS = 'cashier_pos', 
  
  ACCOUNTANT_DASHBOARD = 'accountant_dashboard',
  ACCOUNTANT_COA = 'accountant_coa',
  ACCOUNTANT_JOURNAL = 'accountant_journal',
  ACCOUNTANT_CASHFLOW = 'accountant_cashflow',
  ACCOUNTANT_REPORTS = 'accountant_reports',
  ACCOUNTANT_TAX = 'accountant_tax', 

  GM_DASHBOARD = 'gm_dashboard',
  GM_APPROVALS = 'gm_approvals',
  GM_STRATEGY = 'gm_strategy'
}
