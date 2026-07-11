
import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingBag, 
  Users, 
  Wallet, 
  Landmark, 
  UserCircle, 
  LogOut, 
  ChevronRight, 
  HelpCircle, 
  Briefcase, 
  Bike, 
  Store, 
  Car, 
  Banknote, 
  Package, 
  Settings, 
  Video, 
  GraduationCap, 
  Gift, 
  Container, 
  Vote, 
  PieChart, 
  Rocket, 
  Zap,
  Megaphone,
  Map,
  Lock,
  Calculator
} from 'lucide-react';
import { AppRoute, SystemConfig } from '../types';
import { APP_LOGO } from '../constants';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
  userRoles: string[]; 
  hasReferralCode?: boolean; 
  wholesaleAccess?: 'invited' | 'active' | 'none';
  systemConfig: SystemConfig; 
  onLogout: () => void;
  userStatus: 'active' | 'pending' | 'awaiting_payment'; 
  kycVerified?: boolean; 
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentRoute, onNavigate, isOpen, onClose, 
    userRoles, hasReferralCode, wholesaleAccess, 
    systemConfig, onLogout, userStatus, kycVerified
}) => {
  
  // ROLE CHECKS
  const isMerchant = userRoles.includes('merchant');
  const isDriver = userRoles.includes('driver');
  const isExchanger = userRoles.includes('exchanger');
  const isCreator = userRoles.includes('content_creator');
  const isMobileTrader = userRoles.includes('mobile_trader');
  const isDistributor = userRoles.includes('distributor');
  const isProducer = userRoles.includes('producer'); 
  const isMarketing = userRoles.includes('marketing_coordinator');
  const isAccountant = userRoles.includes('accountant');

  // Logic: Pasar Grosir accessible by BOTH Distributor and Producer
  const canAccessWholesale = isDistributor || isProducer || (wholesaleAccess === 'invited' || wholesaleAccess === 'active');

  // SYSTEM CONFIG FEATURE FLAGS
  const f = systemConfig.features;

  // --- ACCESS LOGIC ---
  // 1. Fully Active: All access
  // 2. Awaiting Payment OR KYC Verified: Access Dashboard & Wallet (for payment)
  // 3. Pending (No KYC): Only Dashboard & Profile (for KYC)
  const isFullyActive = userStatus === 'active';
  const canAccessWallet = isFullyActive || userStatus === 'awaiting_payment' || kycVerified;

  // 1. MENU UTAMA (CORE)
  const mainMenu = [
    { route: AppRoute.DASHBOARD, icon: LayoutDashboard, label: 'Beranda', visible: true },
    { route: AppRoute.WALLET, icon: Wallet, label: 'Dompet Digital', visible: canAccessWallet }, 
    { route: AppRoute.KOPERASI, icon: Landmark, label: 'Koperasi', visible: isFullyActive }, 
    { route: AppRoute.SHU, icon: PieChart, label: 'Cek SHU (Dividen)', visible: f.shu && isFullyActive }, 
    { route: AppRoute.FOOD_STREET_TRACKER, icon: Map, label: 'Tracker Pedagang', visible: f.foodTracker && isFullyActive }, 
  ];

  // 2. LAYANAN & TRANSAKSI (COMMERCE)
  const commerceMenu = [
    { route: AppRoute.MARKETPLACE, icon: ShoppingBag, label: 'Toko KMP-ADNG', visible: f.marketplace && isFullyActive },
    { route: AppRoute.RIDE, icon: Bike, label: 'Layanan Ride', visible: f.ride && isFullyActive },
    { route: AppRoute.PPOB, icon: Zap, label: 'Bayar & Tagihan', visible: f.ppob && isFullyActive },
    { route: AppRoute.ORDER_HISTORY, icon: Package, label: 'Riwayat Pesanan', visible: f.marketplace && isFullyActive },
  ];

  // 3. SOSIAL & EDUKASI (COMMUNITY)
  const socialMenu = [
    { route: AppRoute.LEARNING_SPACE, icon: GraduationCap, label: 'Ruang Belajar', visible: f.learning && isFullyActive },
    { route: AppRoute.EVOTING, icon: Vote, label: 'E-Voting & RAT', visible: f.evoting && isFullyActive },
    { route: AppRoute.COMMUNITY, icon: Users, label: 'Komunitas', visible: f.community }, // Community allowed for engagement? Let's restrict to fully active for now to force payment
    { route: AppRoute.CHAT, icon: MessageSquare, label: 'Chatting', visible: f.chat && isFullyActive }, 
  ];

  // 4. MITRA & REFERRAL
  const partnerMenu = [
    { route: AppRoute.PARTNER, icon: Briefcase, label: 'Jadi Mitra', visible: isFullyActive },
    { route: AppRoute.REFERRAL, icon: Gift, label: 'Panel Referal', visible: f.referral && Boolean(hasReferralCode) && isFullyActive }, 
    
    // --- DYNAMIC ROLES ---
    { route: AppRoute.STORE_MANAGER, icon: Store, label: 'Kelola Toko', visible: isMerchant && f.marketplace },
    { route: AppRoute.DRIVER_DASHBOARD, icon: Car, label: 'Panel Driver', visible: isDriver && f.ride },
    { route: AppRoute.EXCHANGER_DASHBOARD, icon: Banknote, label: 'Panel Exchanger', visible: isExchanger }, 
    { route: AppRoute.CREATOR_DASHBOARD, icon: Video, label: 'Creator Studio', visible: isCreator && f.community },
    { route: AppRoute.MOBILE_TRADER_DASHBOARD, icon: Megaphone, label: 'Panel Lapak Berjalan', visible: isMobileTrader && f.marketplace },
    { route: AppRoute.WHOLESALE_MARKET, icon: Container, label: 'Pasar Grosir', visible: canAccessWholesale && f.wholesale },
    { route: AppRoute.MARKETING_DASHBOARD, icon: Rocket, label: 'Panel Marketing', visible: isMarketing },
    { route: AppRoute.ACCOUNTANT_DASHBOARD, icon: Calculator, label: 'Akuntansi', visible: isAccountant },
  ];

  // 5. PENGATURAN (UTILS)
  const utilMenu = [
    { route: AppRoute.HELP, icon: HelpCircle, label: 'Pusat Bantuan', visible: true },
    { route: AppRoute.PROFILE, icon: UserCircle, label: 'Profil Saya', visible: true },
    { route: AppRoute.SETTINGS, icon: Settings, label: 'Pengaturan', visible: true },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:static md:inset-0 flex flex-col border-r border-slate-800
  `;

  const renderLink = (item: any, idx: number) => {
      const isActive = currentRoute === item.route;
      return (
        <button
            key={idx}
            onClick={() => {
                onNavigate(item.route);
                if (window.innerWidth < 768) onClose();
            }}
            className={`
                flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 mb-1
                ${isActive 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-slate-800 hover:text-white'}
            `}
        >
            <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="font-medium text-sm text-left">{item.label}</span>
        </button>
      );
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-6 shrink-0 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center">
            <img src={APP_LOGO} alt="Logo" className="w-8 h-8 object-contain mr-2" />
            <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider text-emerald-400">KMP-ADNG</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-tight">
                    {isFullyActive ? 'MEMBER APP' : (userStatus === 'awaiting_payment' ? 'BELUM LUNAS' : 'CALON ANGGOTA')}
                </span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400">
            <ChevronRight />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-6">
            
            {/* 1. UTAMA */}
            <div>
                <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Menu Utama</p>
                {mainMenu.filter(i => i.visible).map(renderLink)}
                {!isFullyActive && (
                    <div className="px-4 py-2 mt-2 bg-slate-800 rounded-lg border border-slate-700 opacity-70">
                        <p className="text-[10px] text-gray-400 flex items-center mb-1"><Lock className="w-3 h-3 mr-1"/> Menu Terkunci</p>
                        <p className="text-[9px] text-gray-500">Selesaikan pembayaran untuk akses penuh.</p>
                    </div>
                )}
            </div>

            {/* 2. LAYANAN DIGITAL */}
            {commerceMenu.some(i => i.visible) && (
                <div>
                    <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Layanan Digital</p>
                    {commerceMenu.filter(i => i.visible).map(renderLink)}
                </div>
            )}

            {/* 3. SOSIAL & EDUKASI */}
            {socialMenu.some(i => i.visible) && (
                <div>
                    <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sosial & Edukasi</p>
                    {socialMenu.filter(i => i.visible).map(renderLink)}
                </div>
            )}

            {/* 4. MITRA */}
            {partnerMenu.some(i => i.visible) && (
              <div>
                  <div className="flex items-center px-4 mb-2">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex-1">Panel Mitra</p>
                      <span className="bg-blue-900 text-blue-300 text-[9px] px-1.5 rounded">BISNIS</span>
                  </div>
                  {partnerMenu.filter(i => i.visible).map(renderLink)}
              </div>
            )}

            {/* 5. PENGATURAN */}
            <div>
                <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pengaturan</p>
                {utilMenu.filter(i => i.visible).map(renderLink)}
            </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Keluar Aplikasi</span>
          </button>
          <p className="text-[10px] text-center text-gray-600 mt-2">v{systemConfig.appVersion} • KMP-ADNG</p>
        </div>
      </aside>
    </>
  );
};
