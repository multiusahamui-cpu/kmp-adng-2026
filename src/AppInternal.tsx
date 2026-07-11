
import React, { useState } from 'react';
import { SidebarInternal } from './components/SidebarInternal';
import { Navbar } from './components/Navbar'; // Reusing Navbar is fine, we can style it differently via CSS if needed or props
import { AdminDashboard } from './pages/AdminDashboard';
import { CashierDashboard } from './pages/CashierDashboard';
import { AccountantDashboard } from './pages/AccountantDashboard';
import { GMDashboard } from './pages/GMDashboard';
import { KnowledgeCenter } from './pages/KnowledgeCenter'; // IMPORTED
import { Settings } from './pages/Settings';
import { AppRoute, User, SystemConfig } from './types';
import { authService } from './services/auth.service';
import api from './services/api';
import { useToast } from './components/Toast';
import { STORAGE_KEYS, loadData } from './utils/storage';
import { MOCK_USERS_DB, MOCK_TICKETS, MOCK_NEWS, MOCK_CONTENT } from './constants';

interface AppInternalProps {
    user: User;
    systemConfig: SystemConfig;
    onLogout: () => void;
    onUpdateConfig: (newConfig: SystemConfig) => void;
    onUpdateUser: (updatedData: Partial<User>) => void;
}

const AppInternal: React.FC<AppInternalProps> = ({ user, systemConfig, onLogout, onUpdateConfig, onUpdateUser }) => {
    const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.ADMIN);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { showToast } = useToast();

    // Mock Data State for Admin features
    // In a real app, these would come from the parent or context, but for refactoring purpose we keep them here or use what's passed
    // For simplicity, we re-initialize some mocks here if needed or use props. 
    // Ideally these should be in a global context store (Zustand/Redux), but for now sticking to the existing pattern.
    const [allUsers] = useState<User[]>(() => loadData(STORAGE_KEYS.ALL_USERS, MOCK_USERS_DB));
    const [tickets] = useState(() => loadData(STORAGE_KEYS.TICKETS, MOCK_TICKETS));
    const [contents] = useState(() => loadData(STORAGE_KEYS.CONTENTS, MOCK_CONTENT));

    const navigate = (route: AppRoute) => {
        setCurrentRoute(route);
        setIsSidebarOpen(false);
        window.scrollTo(0, 0);
    };

    const handleUpdateSystemConfig = async (newConfig: SystemConfig) => { 
        try { 
            await api.put('/admin/config', newConfig); 
            onUpdateConfig(newConfig); // Update parent state
            showToast("Konfigurasi Sistem Berhasil Disimpan", "success"); 
        } catch (error) { 
            console.error("Failed to update config", error); 
            showToast("Gagal menyimpan konfigurasi", "error"); 
        } 
    };

    const handleLogout = () => {
        authService.logout();
        onLogout();
        showToast("Logout Berhasil", "success");
    };

    // --- VIEW ROUTING ---
    const getAdminView = (): any => {
        switch (currentRoute) {
          case AppRoute.ADMIN_APPROVALS: return 'approvals';
          case AppRoute.ADMIN_MEMBERS: return 'members';
          case AppRoute.ADMIN_HELPDESK: return 'helpdesk';
          case AppRoute.ADMIN_CONTENT: return 'content';
          case AppRoute.ADMIN_SETTINGS: return 'settings';
          case AppRoute.ADMIN_CREATOR: return 'creator'; 
          case AppRoute.SUPER_ADMIN_STRUCTURE: return 'structure'; 
          case AppRoute.ADMIN_REGIONS: return 'regions'; 
          case AppRoute.ADMIN_PARAMETER: return 'parameter';
          case AppRoute.ADMIN_EOD: return 'eod'; // NEW VIEW
          default: return 'overview';
        }
    };
    
    const getCashierView = (): any => {
        switch (currentRoute) {
            case AppRoute.CASHIER_MANAGEMENT: return 'management';
            case AppRoute.CASHIER_POS: return 'pos';
            default: return 'treasury';
        }
    };
  
    const getAccountantView = (): any => {
        switch (currentRoute) {
            case AppRoute.ACCOUNTANT_COA: return 'coa';
            case AppRoute.ACCOUNTANT_JOURNAL: return 'journal';
            case AppRoute.ACCOUNTANT_CASHFLOW: return 'cashflow';
            case AppRoute.ACCOUNTANT_REPORTS: return 'reports';
            case AppRoute.ACCOUNTANT_TAX: return 'tax';
            default: return 'dashboard';
        }
    };
  
    const getGMView = (): any => {
        switch (currentRoute) {
            case AppRoute.GM_APPROVALS: return 'approvals';
            case AppRoute.GM_STRATEGY: return 'strategy';
            default: return 'dashboard';
        }
    };

    const isCashierRoute = [AppRoute.CASHIER_TREASURY, AppRoute.CASHIER_MANAGEMENT, AppRoute.CASHIER_POS].includes(currentRoute);
    const isAccountantRoute = [AppRoute.ACCOUNTANT_DASHBOARD, AppRoute.ACCOUNTANT_COA, AppRoute.ACCOUNTANT_JOURNAL, AppRoute.ACCOUNTANT_CASHFLOW, AppRoute.ACCOUNTANT_REPORTS, AppRoute.ACCOUNTANT_TAX].includes(currentRoute);
    const isGMRoute = [AppRoute.GM_DASHBOARD, AppRoute.GM_APPROVALS, AppRoute.GM_STRATEGY].includes(currentRoute);
    const isSettingsRoute = currentRoute === AppRoute.SETTINGS;
    const isAdminRoute = !isCashierRoute && !isAccountantRoute && !isGMRoute && !isSettingsRoute && currentRoute !== AppRoute.KNOWLEDGE_CENTER; // Fallback to admin logic

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SidebarInternal
                currentRoute={currentRoute}
                onNavigate={navigate}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userRoles={user.roles}
                officialTitle={user.officialTitle}
                systemConfig={systemConfig}
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar 
                    user={user} 
                    onMenuClick={() => setIsSidebarOpen(true)} 
                    title="KMP-ADNG INTERNAL"
                    onNavigate={navigate} // ADDED for Knowledge Center
                />

                <main className="flex-1 overflow-x-hidden p-4">
                    {/* Render Knowledge Center if selected */}
                    {currentRoute === AppRoute.KNOWLEDGE_CENTER && (
                        <KnowledgeCenter onNavigate={navigate} />
                    )}

                    {isSettingsRoute && (
                        <Settings 
                            user={user} 
                            onUpdateUser={onUpdateUser} 
                            isInternalUser={true}
                        />
                    )}

                    {isAdminRoute && (
                        <AdminDashboard 
                            view={getAdminView()} 
                            users={allUsers}
                            tickets={tickets}
                            news={MOCK_NEWS} 
                            contents={contents} 
                            systemConfig={systemConfig} 
                            onApproveRole={()=>{}} 
                            onRejectRole={()=>{}}
                            onReplyTicket={()=>{}}
                            onApproveContent={()=>{}} 
                            onRejectContent={()=>{}}   
                            onUnpublishContent={()=>{}} 
                            onUpdateSystemConfig={handleUpdateSystemConfig}
                            onAddContent={()=>{}}
                            onNavigate={navigate}
                            currentUser={user}
                        />
                    )}

                    {isCashierRoute && (
                        <CashierDashboard user={user} view={getCashierView()} />
                    )}

                    {isAccountantRoute && (
                        <AccountantDashboard user={user} view={getAccountantView()} systemConfig={systemConfig} onNavigate={navigate} />
                    )}

                    {isGMRoute && (
                        <GMDashboard user={user} view={getGMView()} />
                    )}
                </main>
            </div>
        </div>
    );
};

export default AppInternal;
