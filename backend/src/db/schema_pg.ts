
import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb, decimal, pgEnum, date, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- ENUMS (Standardisasi Nilai) ---
export const roleEnum = pgEnum('role', ['member', 'admin', 'super_admin', 'merchant', 'driver', 'exchanger', 'content_creator', 'distributor', 'producer', 'marketing_coordinator', 'mobile_trader', 'cashier', 'accountant', 'general_manager']);
export const statusEnum = pgEnum('status', ['active', 'pending', 'suspended', 'rejected', 'awaiting_payment', 'inactive']); 
export const appStatusEnum = pgEnum('app_status', ['pending', 'approved', 'rejected']);

// =========================================
// 1. CORE IDENTITY & WALLET
// =========================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }).unique().notNull(),
  password: text('password').notNull(),
  roles: jsonb('roles').$type<string[]>().default(['member']), 
  status: varchar('status', { length: 20 }).default('pending'),
  referralCode: varchar('referral_code', { length: 50 }).unique(),
  ktaId: varchar('kta_id', { length: 50 }),
  pin: text('pin'), 
  
  // --- KYC & PROFILE FIELDS (LENGKAP) ---
  nik: varchar('nik', { length: 20 }), 
  gender: varchar('gender', { length: 10 }), // Laki-laki / Perempuan
  occupation: varchar('occupation', { length: 100 }), 
  
  // Dokumen Foto (Path / URL)
  ktpPhoto: text('ktp_photo'),
  selfiePhoto: text('selfie_photo'),

  // Alamat & Kode Lokasi (Relasi ke tabel locations via Logic, bukan FK constraint ketat demi performa)
  address: text('address'), 
  regional: varchar('regional', { length: 20 }), // New field
  provinceId: varchar('province_id', { length: 20 }),
  cityId: varchar('city_id', { length: 20 }), // Digunakan untuk generate KTA
  districtId: varchar('district_id', { length: 20 }),
  villageId: varchar('village_id', { length: 20 }),
  postalCode: varchar('postal_code', { length: 10 }),
  
  heir: varchar('heir', { length: 255 }), // Ahli Waris
  joinDate: timestamp('join_date'), 
  
  // KYC STATUS FLAGS
  kycVerified: boolean('kyc_verified').default(false), 
  kycDataSubmitted: boolean('kyc_data_submitted').default(false), 
  
  // Security & OTP Tracking
  otpAttempts: integer('otp_attempts').default(0), 
  
  // KYC OTP Tracking
  kycOtpAttempts: integer('kyc_otp_attempts').default(0),
  kycLastAttemptDate: timestamp('kyc_last_attempt_date'),

  preferences: jsonb('preferences').$type<{
      theme: 'light' | 'dark',
      notifications: {
          all: boolean,
          transaction: boolean,
          promo: boolean,
          chat: boolean
      },
      isPhoneVerified?: boolean
  }>().default({
      theme: 'light',
      notifications: { all: true, transaction: true, promo: true, chat: true },
      isPhoneVerified: false
  }),

  // Specific Role Details (JSONB for flexibility)
  shopDetails: jsonb('shop_details'), 
  driverDetails: jsonb('driver_details'), 
  exchangerDetails: jsonb('exchanger_details'), 
  contentCreatorDetails: jsonb('creator_details'), 
  distributorDetails: jsonb('distributor_details'), 
  mobileTraderDetails: jsonb('mobile_trader_details'), 
  marketingRoleDetails: jsonb('marketing_details'), 
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW TABLE: RESIGNATION REQUESTS (Permohonan Berhenti)
export const resignationRequests = pgTable('resignation_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by').references(() => users.id),
});

// NEW TABLE: BLACKLIST REGISTRATIONS (Audit Trail)
export const blacklistRegistrations = pgTable('blacklist_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }),
  nik: varchar('nik', { length: 20 }), 
  reason: text('reason').notNull(), 
  blockedAt: timestamp('blocked_at').defaultNow(),
  deviceInfo: text('device_info'),
});

// NEW TABLE: LOCATIONS (Hierarchical Data Wilayah Indonesia)
// Digunakan untuk Dropdown Wilayah & Generator KTA
export const locations = pgTable('locations', {
  code: varchar('code', { length: 20 }).primaryKey(), // PK: Kode Kemendagri (misal: 32.04)
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // Province, City, District, Village
  parentCode: varchar('parent_code', { length: 20 }), // Relasi ke parent
  coordinatorId: uuid('coordinator_id').references(() => users.id), // Kordinator wilayah ini
  memberCounter: integer('member_counter').default(0), // COUNTER PENTING UNTUK KTA
}, (table) => {
  return {
    parentIdx: index('parent_idx').on(table.parentCode),
    typeIdx: index('type_idx').on(table.type)
  };
});

// ... (Rest of tables remain unchanged)
export const roleApplications = pgTable('role_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 50 }).notNull(), 
  data: jsonb('data').notNull(), 
  status: varchar('status', { length: 20 }).default('pending'), 
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  savings: decimal('savings', { precision: 15, scale: 2 }).default('0').notNull(), // Total Savings
  
  // Savings Breakdown (Refactoring for SHU & Equity Portfolio)
  savingsPokok: decimal('savings_pokok', { precision: 15, scale: 2 }).default('0').notNull(),
  savingsWajib: decimal('savings_wajib', { precision: 15, scale: 2 }).default('0').notNull(),
  savingsSukarela: decimal('savings_sukarela', { precision: 15, scale: 2 }).default('0').notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW TABLE: COOPERATIVE STATISTICS (Aggregated Data for Dashboard/SHU)
export const coopStats = pgTable('coop_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  totalSimpananPokok: decimal('total_simpanan_pokok', { precision: 15, scale: 2 }).default('0'),
  totalSimpananWajib: decimal('total_simpanan_wajib', { precision: 15, scale: 2 }).default('0'),
  totalSimpananSukarela: decimal('total_simpanan_sukarela', { precision: 15, scale: 2 }).default('0'),
  cadanganModal: decimal('cadangan_modal', { precision: 15, scale: 2 }).default('0'),
  hibah: decimal('hibah', { precision: 15, scale: 2 }).default('0'),
  shuDitahan: decimal('shu_ditahan', { precision: 15, scale: 2 }).default('0'),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').references(() => wallets.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  referenceId: varchar('reference_id', { length: 100 }), 
  status: varchar('status', { length: 20 }).default('success'),
  date: timestamp('date'), // Added explicit date col if needed, or use createdAt
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  stock: integer('stock').default(0),
  category: varchar('category', { length: 50 }),
  image: text('image'),
  isOfficial: boolean('is_official').default(false),
  location: varchar('location', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').default(1),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING'), 
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(), 
});

export const ppobProducts = pgTable('ppob_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).unique().notNull(), 
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  adminFee: decimal('admin_fee', { precision: 15, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).default('active'),
});

export const rideBookings = pgTable('ride_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => users.id).notNull(),
  driverId: uuid('driver_id').references(() => users.id),
  pickupAddr: text('pickup_addr').notNull(),
  dropoffAddr: text('dropoff_addr').notNull(),
  distance: decimal('distance', { precision: 8, scale: 2 }),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('SEARCHING'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const loans = pgTable('loans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  duration: integer('duration').notNull(), 
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).default('1.5'),
  status: varchar('status', { length: 20 }).default('pending'), 
  reason: text('reason'),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const groupProjects = pgTable('group_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  leaderId: uuid('leader_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  businessType: varchar('business_type', { length: 100 }),
  location: text('location'),
  capitalTotal: decimal('capital_total', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 20 }).default('proposed'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projectExpenses = pgTable('project_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => groupProjects.id).notNull(),
  item: varchar('item', { length: 255 }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  date: timestamp('date').defaultNow(),
  proofImage: text('proof_image'),
});

export const wholesaleItems = pgTable('wholesale_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(), 
  commodityName: varchar('commodity_name', { length: 255 }).notNull(),
  grade: varchar('grade', { length: 50 }),
  totalQty: decimal('total_qty', { precision: 10, scale: 2 }),
  unit: varchar('unit', { length: 20 }).default('Ton'),
  minOrder: decimal('min_order', { precision: 10, scale: 2 }),
  openPrice: decimal('open_price', { precision: 15, scale: 2 }),
  harvestDate: varchar('harvest_date', { length: 50 }),
  location: text('location'),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('open'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const wholesaleBids = pgTable('wholesale_bids', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => wholesaleItems.id).notNull(),
  distributorId: uuid('distributor_id').references(() => users.id).notNull(),
  bidPrice: decimal('bid_price', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('pending'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const content = pgTable('content', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  contentUrl: text('content_url'), 
  body: text('body'), 
  views: integer('views').default(0),
  status: varchar('status', { length: 20 }).default('pending'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const helpTickets = pgTable('help_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subject: varchar('subject', { length: 255 }),
  category: varchar('category', { length: 50 }),
  message: text('message'),
  response: text('response'),
  status: varchar('status', { length: 20 }).default('open'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const voteSessions = pgTable('vote_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }),
  type: varchar('type', { length: 50 }), 
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 20 }).default('active'),
});

export const voteCandidates = pgTable('vote_candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => voteSessions.id).notNull(),
  name: varchar('name', { length: 255 }),
  vision: text('vision'),
  votes: integer('votes').default(0),
});

export const voteRecords = pgTable('vote_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => voteSessions.id).notNull(),
  voterId: uuid('voter_id').references(() => users.id).notNull(),
  candidateId: uuid('candidate_id').references(() => voteCandidates.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mobileTraders = pgTable('mobile_traders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).unique().notNull(),
  tradeName: varchar('trade_name', { length: 100 }),
  category: varchar('category', { length: 50 }),
  vehicleType: varchar('vehicle_type', { length: 50 }),
  isOnline: boolean('is_online').default(false),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  lastUpdate: timestamp('last_update'),
});

export const traderMenus = pgTable('trader_menus', {
  id: uuid('id').defaultRandom().primaryKey(),
  traderId: uuid('trader_id').references(() => mobileTraders.id).notNull(),
  name: varchar('name', { length: 100 }),
  price: decimal('price', { precision: 15, scale: 2 }),
  category: varchar('category', { length: 50 }),
});

export const regions = pgTable('regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 10 }).unique(),
  name: varchar('name', { length: 100 }),
});

export const provinces = pgTable('provinces', {
  id: uuid('id').defaultRandom().primaryKey(),
  regionId: uuid('region_id').references(() => regions.id),
  code: varchar('code', { length: 10 }),
  name: varchar('name', { length: 100 }),
});

export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  provinceId: uuid('province_id').references(() => provinces.id),
  code: varchar('code', { length: 10 }),
  name: varchar('name', { length: 100 }),
  memberCounter: integer('member_counter').default(0),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }).unique(),
  name: varchar('name', { length: 100 }),
  type: varchar('type', { length: 50 }), 
});

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date'),
  ref: varchar('ref', { length: 50 }),
  description: text('description'),
  total: decimal('total', { precision: 15, scale: 2 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalLines = pgTable('journal_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  journalId: uuid('journal_id').references(() => journalEntries.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  debit: decimal('debit', { precision: 15, scale: 2 }).default('0'),
  credit: decimal('credit', { precision: 15, scale: 2 }).default('0'),
});

export const paymentRequests = pgTable('payment_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  requesterId: uuid('requester_id').references(() => users.id),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  type: varchar('type', { length: 50 }), 
  description: text('description'),
  status: varchar('status', { length: 20 }).default('PENDING'), 
  proofImage: text('proof_image'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  taxConfig: jsonb('tax_config'), 
  features: jsonb('features'), 
  rideConfig: jsonb('ride_config'), 
  generalConfig: jsonb('general_config'), 
});

// RELATION EXPORTS
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  roleApplications: many(roleApplications), 
  products: many(products),
  orders: many(orders),
  contents: many(content),
  loans: many(loans),
  wholesaleItems: many(wholesaleItems),
  mobileTrader: one(mobileTraders, { fields: [users.id], references: [mobileTraders.userId] }),
  coordinatedLocation: one(locations, { fields: [users.id], references: [locations.coordinatorId] })
}));

export const roleApplicationsRelations = relations(roleApplications, ({ one }) => ({
  user: one(users, { fields: [roleApplications.userId], references: [users.id] }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const productsRelations = relations(products, ({ one }) => ({
  seller: one(users, { fields: [products.sellerId], references: [users.id] }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const wholesaleItemsRelations = relations(wholesaleItems, ({ one, many }) => ({
  seller: one(users, { fields: [wholesaleItems.sellerId], references: [users.id] }),
  bids: many(wholesaleBids),
}));

export const wholesaleBidsRelations = relations(wholesaleBids, ({ one }) => ({
  item: one(wholesaleItems, { fields: [wholesaleBids.itemId], references: [wholesaleItems.id] }),
  distributor: one(users, { fields: [wholesaleBids.distributorId], references: [users.id] }),
}));

export const contentRelations = relations(content, ({ one }) => ({
  author: one(users, { fields: [content.authorId], references: [users.id] }),
}));

export const groupProjectsRelations = relations(groupProjects, ({ one, many }) => ({
  leader: one(users, { fields: [groupProjects.leaderId], references: [users.id] }),
  expenses: many(projectExpenses),
}));

export const projectExpensesRelations = relations(projectExpenses, ({ one }) => ({
  project: one(groupProjects, { fields: [projectExpenses.projectId], references: [groupProjects.id] }),
}));

export const voteSessionsRelations = relations(voteSessions, ({ many }) => ({
  candidates: many(voteCandidates),
  votes: many(voteRecords),
}));

export const voteCandidatesRelations = relations(voteCandidates, ({ one }) => ({
  session: one(voteSessions, { fields: [voteCandidates.sessionId], references: [voteSessions.id] }),
}));

export const mobileTradersRelations = relations(mobileTraders, ({ one, many }) => ({
  user: one(users, { fields: [mobileTraders.userId], references: [users.id] }),
  menus: many(traderMenus),
}));

export const traderMenusRelations = relations(traderMenus, ({ one }) => ({
  trader: one(mobileTraders, { fields: [traderMenus.traderId], references: [mobileTraders.id] }),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  provinces: many(provinces),
}));

export const provincesRelations = relations(provinces, ({ one, many }) => ({
  region: one(regions, { fields: [provinces.regionId], references: [regions.id] }),
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one }) => ({
  province: one(provinces, { fields: [cities.provinceId], references: [provinces.id] }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journal: one(journalEntries, { fields: [journalLines.journalId], references: [journalEntries.id] }),
  account: one(accounts, { fields: [journalLines.accountId], references: [accounts.id] }),
}));

export const paymentRequestsRelations = relations(paymentRequests, ({ one }) => ({
  requester: one(users, { fields: [paymentRequests.requesterId], references: [users.id] }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  coordinator: one(users, { fields: [locations.coordinatorId], references: [users.id] }),
}));
