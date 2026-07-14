
import React from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Map, 
  Database, 
  Sliders, 
  Activity, 
  ArrowRightLeft, 
  CreditCard, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  LogOut,
  ChevronRight,
  Clock,
  Calculator,
  List,
  Settings
} from 'lucide-react';
import { AppRoute, SystemConfig } from '../types';
import { APP_LOGO } from '../constants';

interface SidebarInternalProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
  userRoles: string[]; 
  officialTitle?: string;
  systemConfig: SystemConfig; 
  onLogout: () => void;
}

export const SidebarInternal: React.FC<SidebarInternalProps> = ({ currentRoute, onNavigate, isOpen, onClose, userRoles, officialTitle, onLogout }) => {
  
  const isSuperAdmin = userRoles.includes('super_admin');
  const isAdmin = userRoles.includes('admin') || isSuperAdmin;
  const isManagement = userRoles.includes('management');
  const isCashier = userRoles.includes('cashier');
  const isAccountant = userRoles.includes('accountant');
  const isGM = userRoles.includes('general_manager');

  const internalMenu = [
    // GM
    { route: AppRoute.GM_DASHBOARD, icon: LayoutDashboard, label: 'GM Dashboard', visible: isGM },
    { route: AppRoute.GM_APPROVALS, icon: ShieldCheck, label: 'Approval Pusat', visible: isGM },
    { route: AppRoute.GM_STRATEGY, icon: TrendingUp, label: 'Monitor Strategis', visible: isGM },

    // Cashier (Treasury)
    { route: AppRoute.CASHIER_TREASURY, icon: Activity, label: 'Treasury Dashboard', visible: isCashier },
    { route: AppRoute.CASHIER_MANAGEMENT, icon: ArrowRightLeft, label: 'Cash Management', visible: isCashier },
    { route: AppRoute.CASHIER_POS, icon: CreditCard, label: 'KASIR (POS)', visible: isCashier },

    // Accountant
    { route: AppRoute.ACCOUNTANT_DASHBOARD, icon: LayoutDashboard, label: 'Accounting Dash', visible: isAccountant },
    { route: AppRoute.ACCOUNTANT_COA, icon: List, label: 'Chart of Accounts', visible: isAccountant },
    { route: AppRoute.ACCOUNTANT_JOURNAL, icon: BookOpen, label: 'Jurnal Umum', visible: isAccountant },
    { route: AppRoute.ACCOUNTANT_CASHFLOW, icon: TrendingUp, label: 'Arus Kas', visible: isAccountant },
    { route: AppRoute.ACCOUNTANT_REPORTS, icon: FileText, label: 'Laporan Keuangan', visible: isAccountant },
    { route: AppRoute.ACCOUNTANT_TAX, icon: Calculator, label: 'Pajak (Tax)', visible: isAccountant },

    // Admin / Super Admin
    { route: AppRoute.ADMIN, icon: LayoutDashboard, label: 'Admin Overview', visible: isAdmin || isManagement },
    { route: AppRoute.ADMIN_APPROVALS, icon: UserCheck, label: 'Approval Anggota', visible: isAdmin || isManagement },
    { route: AppRoute.ADMIN_MEMBERS, icon: Users, label: 'Data Anggota', visible: isAdmin || isManagement },
    { route: AppRoute.ADMIN_EOD, icon: Clock, label: 'Proses EOD (Harian)', visible: isAdmin || isManagement }, // NEW
    { route: AppRoute.ADMIN_REGIONS, icon: Map, label: 'Kode Wilayah', visible: isAdmin },
    { route: AppRoute.ADMIN_PARAMETER, icon: Database, label: 'Parameter Sistem', visible: isAdmin },
    { route: AppRoute.ADMIN_SETTINGS, icon: Sliders, label: 'Konfigurasi Sistem', visible: isSuperAdmin }, 
    
    // Global Internal Settings
    { route: AppRoute.SETTINGS, icon: Settings, label: 'Pengaturan Akun', visible: true },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-red-950 text-white transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:static md:inset-0 flex flex-col border-r border-red-900
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
                flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 mb-1
                ${isActive 
                    ? 'bg-red-800 text-white shadow-lg border-l-4 border-red-400' 
                    : 'text-red-200 hover:bg-red-900 hover:text-white'}
            `}
        >
            <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-red-300'}`} />
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
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 shrink-0 bg-red-950 border-b border-red-900 shadow-sm">
          <div className="flex items-center">
            <img src={APP_LOGO} alt="KMP-ADNG" className="w-9 h-9 object-cover rounded-lg mr-3" />
            <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider text-red-100">INTERNAL</span>
                <span className="text-[9px] text-red-400 uppercase tracking-tight">{officialTitle || 'STAFF PORTAL'}</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-red-300">
            <ChevronRight />
          </button>
        </div>
        
        {/* Menu */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-hide space-y-2">
            <p className="px-4 text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Menu Kerja</p>
            {internalMenu.filter(i => i.visible).map(renderLink)}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-red-900 bg-red-950 shrink-0">
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-red-300 hover:bg-red-900 rounded-lg transition-colors border border-transparent hover:border-red-800"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Logout Portal</span>
          </button>
          <p className="text-[10px] text-center text-red-500 mt-2">SECURE CONNECTION • IP LOGGED</p>
        </div>
      </aside>
    </>
  );
};
