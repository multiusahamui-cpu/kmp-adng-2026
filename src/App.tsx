
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { useToast } from './components/Toast'; 
import { NetworkStatus } from './components/NetworkStatus'; 
import { Dashboard } from './pages/Dashboard';
import { Koperasi } from './pages/Koperasi';
import { Marketplace } from './pages/Marketplace';
import { Chat } from './pages/Chat';
import { Community } from './pages/Community';
import { Wallet } from './pages/Wallet';
import { Onboarding } from './pages/Onboarding';
import { RoleApplication } from './pages/RoleApplication';
import { HelpCenter } from './pages/HelpCenter';
import { KnowledgeCenter } from './pages/KnowledgeCenter'; 
import { Ride } from './pages/Ride';
import { GroupFinancing } from './pages/GroupFinancing';
import { GroupProjectDashboard } from './pages/GroupProjectDashboard';
import { WholesaleMarket } from './pages/WholesaleMarket'; 
import { StoreManager } from './pages/StoreManager';
import { DriverDashboard } from './pages/DriverDashboard';
import { ExchangerDashboard } from './pages/ExchangerDashboard';
import { CreatorDashboard } from './pages/CreatorDashboard'; 
import { MarketingDashboard } from './pages/MarketingDashboard';
// import { AccountantDashboard } from './pages/AccountantDashboard';
import { SolidAccountingDashboard } from './pages/SolidAccountingDashboard';
import { MobileTraderDashboard } from './pages/MobileTraderDashboard'; 
import { FoodStreetTracker } from './pages/FoodStreetTracker';
import { LearningSpace } from './pages/LearningSpace'; 
import { CoursePlayer } from './pages/CoursePlayer';
import { ReferralDashboard } from './pages/ReferralDashboard';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderHistory } from './pages/OrderHistory';
import { PPOB } from './pages/PPOB'; 
import { ScanQR } from './pages/ScanQR'; 
import { EVoting } from './pages/EVoting'; 
import { SHU } from './pages/SHU'; 
import { Settings } from './pages/Settings'; 
import { Profile } from './pages/Profile'; 
import { AppRoute, User, HelpTicket, Transaction, Product, CartItem, Order, ContentItem, SystemConfig } from './types';
import { MOCK_PRODUCTS, MOCK_CHATS, MOCK_USERS_DB, MOCK_ORDERS, MOCK_CONTENT, MOCK_TICKETS } from './constants';
import { loadData, saveData, STORAGE_KEYS } from './utils/storage';
import { authService } from './services/auth.service';
import { walletService } from './services/wallet.service';
import api from './services/api';

interface AppProps {
    user: User;
    systemConfig: SystemConfig;
    onLogout: () => void;
    onUpdateUser: (updatedData: Partial<User>) => void;
}

const App: React.FC<AppProps> = ({ user: initialUser, systemConfig, onLogout, onUpdateUser }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { showToast } = useToast();
  
  const [user, setUser] = useState<User>(initialUser);

  // MOCK DATA STATES (Keep for Member features not fully backed yet)
  const [allUsers] = useState<User[]>(() => loadData(STORAGE_KEYS.ALL_USERS, MOCK_USERS_DB));
  const [tickets, setTickets] = useState<HelpTicket[]>(() => loadData(STORAGE_KEYS.TICKETS, MOCK_TICKETS));
  const [transactions, setTransactions] = useState<Transaction[]>([]); 
  const [products] = useState<Product[]>(() => loadData(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS));
  const [contents, setContents] = useState<ContentItem[]>(() => loadData(STORAGE_KEYS.CONTENTS, MOCK_CONTENT)); 
  const [cart, setCart] = useState<CartItem[]>(() => loadData(STORAGE_KEYS.CART, []));
  const [orders] = useState<Order[]>(() => loadData(STORAGE_KEYS.ORDERS, MOCK_ORDERS)); 
  
  const [activeCourse, setActiveCourse] = useState<ContentItem | null>(null);
  
  // Use Global Config for Ride Pricing now
  const ridePricing = systemConfig.rideConfig;

  // --- STRICT DATA SYNC ENGINE ---
  const loadMemberData = async () => {
      try {
          const profileData = await authService.getProfile();
          if (profileData) {
              setUser(currentUser => {
                  const { balance, savings, loanBalance, ...safeProfileData } = profileData;
                  return { ...currentUser, ...safeProfileData };
              });
          }

          try {
              const walletData = await walletService.getWalletInfo();
              if (walletData) {
                  setUser(currentUser => ({
                      ...currentUser,
                      balance: Number(walletData.balance),
                      savings: Number(walletData.savings),
                      savingsDetail: walletData.savingsDetail
                  }));
                  
                  if (walletData.transactions) {
                      setTransactions(walletData.transactions);
                  }
              }
          } catch (walletError) {
              console.error("Wallet Sync Error (Offline?):", walletError);
          }

      } catch (e) { 
          console.error("Data sync critical failure:", e); 
      }
  };

  useEffect(() => {
      loadMemberData();
  }, []);

  // APPLY THEME FROM PREFERENCES
  const toggleTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
          document.documentElement.classList.remove('dark');
          handleUpdateUser({ preferences: { ...user.preferences, theme: 'light' } });
      } else {
          document.documentElement.classList.add('dark');
          handleUpdateUser({ preferences: { ...user.preferences, theme: 'dark' } });
      }
  };

  useEffect(() => {
      if (user.preferences?.theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [user.preferences?.theme]);

  // --- PERSISTENCE ---
  useEffect(() => saveData(STORAGE_KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveData(STORAGE_KEYS.CONTENTS, contents), [contents]);
  useEffect(() => saveData(STORAGE_KEYS.CART, cart), [cart]);
  useEffect(() => saveData(STORAGE_KEYS.ORDERS, orders), [orders]);

  const navigate = (route: AppRoute, params?: any) => {
    console.log("Navigating to:", route);
    if (route === AppRoute.COURSE_PLAYER && params) {
        setActiveCourse(params);
    }
    setCurrentRoute(route);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
      authService.logout();
      onLogout();
      showToast("Berhasil Keluar", "success");
  };

  // --- HANDLERS ---
  const handleSubmitRole = (role: string, details: any) => { console.log("Submitting Role:", role, details); showToast("Pengajuan Role Berhasil Dikirim", "success"); };
  const handleSubmitTicket = async (subject: string, message: string, category: string) => { try { const res = await api.post('/community/tickets', { subject, message, category }); const newTicket = { ...res.data.data, userName: user?.name, date: new Date().toLocaleDateString() }; setTickets(prev => [newTicket, ...prev]); showToast("Tiket Bantuan Berhasil Dikirim", "success"); } catch (error) { console.error("Failed to submit ticket", error); showToast("Gagal mengirim tiket", "error"); } };
  const handleAddToCart = (product: Product) => { setCart(prev => { const existing = prev.find(item => item.id === product.id); if (existing) { return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item); } else { return [...prev, { ...product, quantity: 1, cartId: `c-${Date.now()}` }]; } }); showToast("Masuk Keranjang", "success"); };
  const handleUpdateCartQty = (cartId: string, newQty: number) => { setCart(prev => prev.map(item => item.cartId === cartId ? {...item, quantity: newQty} : item)); };
  const handleRemoveFromCart = (cartId: string) => { setCart(prev => prev.filter(item => item.cartId !== cartId)); };
  
  const handleWalletTransaction = async () => { 
      await loadMemberData();
  };
  
  const handleCheckoutSuccess = async () => {
      setCart([]); 
      await loadMemberData(); 
  };

  const handleAddContent = (newContent: ContentItem) => { setContents(prev => [newContent, ...prev]); };

  const handleUpdateUser = (updatedData: Partial<User>) => {
      setUser(prev => ({ 
          ...prev, 
          ...updatedData,
          balance: (updatedData.balance !== undefined && updatedData.balance !== 0) ? updatedData.balance : prev.balance,
          savings: (updatedData.savings !== undefined && updatedData.savings !== 0) ? updatedData.savings : prev.savings
      }));
  };

  const hasReferral = Boolean(user.referralCode && user.referralCode.trim().length > 0);

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] dark:bg-slate-950 transition-colors duration-300">
      <NetworkStatus />

      <div className={`flex w-full ${systemConfig.demoMode ? 'mt-10' : ''}`}>
          <Sidebar 
            currentRoute={currentRoute} 
            onNavigate={navigate} 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            userRoles={user.roles}
            hasReferralCode={hasReferral}
            wholesaleAccess={user.wholesaleAccess} 
            systemConfig={systemConfig} 
            onLogout={handleLogout} 
            userStatus={user.status}
            kycVerified={user.kycVerified} 
          />

          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <Navbar 
              user={user} 
              onMenuClick={() => setIsSidebarOpen(true)} 
              title="KMP-ADNG"
              cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
              onCartClick={() => navigate(AppRoute.CART)}
              onNavigate={navigate} 
              onToggleTheme={toggleTheme} // PASSED HERE
            />

            <main className="flex-1 overflow-x-hidden">
                {currentRoute === AppRoute.DASHBOARD && (
                    <Dashboard 
                        user={user} 
                        contents={contents} 
                        recentTransactions={transactions.slice(0, 5)} 
                        onNavigate={navigate} 
                    />
                )}
                
                {currentRoute === AppRoute.ONBOARDING && (
                    <Onboarding 
                        user={user} 
                        onNavigate={navigate} 
                        onComplete={() => navigate(AppRoute.DASHBOARD)} 
                        onRefreshProfile={loadMemberData}
                    />
                )}

                {currentRoute === AppRoute.STORE_MANAGER && <StoreManager user={user} products={products} onAddProduct={()=>{}} />}
                {currentRoute === AppRoute.DRIVER_DASHBOARD && <DriverDashboard user={user} />}
                {currentRoute === AppRoute.EXCHANGER_DASHBOARD && <ExchangerDashboard user={user} />}
                {currentRoute === AppRoute.MOBILE_TRADER_DASHBOARD && <MobileTraderDashboard user={user} />}
                {currentRoute === AppRoute.CREATOR_DASHBOARD && <CreatorDashboard user={user} contents={contents} onAddContent={handleAddContent} onNavigate={navigate} />}
                {currentRoute === AppRoute.MARKETING_DASHBOARD && <MarketingDashboard user={user} />}
                {currentRoute === AppRoute.ACCOUNTANT_DASHBOARD && <SolidAccountingDashboard />}
                {currentRoute === AppRoute.ACCOUNTANT_COA && <SolidAccountingDashboard />}
                {currentRoute === AppRoute.ACCOUNTANT_JOURNAL && <SolidAccountingDashboard />}
                {currentRoute === AppRoute.ACCOUNTANT_CASHFLOW && <SolidAccountingDashboard />}
                {currentRoute === AppRoute.ACCOUNTANT_REPORTS && <SolidAccountingDashboard />}
                {currentRoute === AppRoute.ACCOUNTANT_TAX && <SolidAccountingDashboard />}
                {currentRoute === AppRoute.WHOLESALE_MARKET && <WholesaleMarket user={user} onNavigate={navigate} onUpdateUser={handleUpdateUser} />}
                {currentRoute === AppRoute.FOOD_STREET_TRACKER && <FoodStreetTracker user={user} allUsers={allUsers} onNavigate={navigate} />}

                {currentRoute === AppRoute.MARKETPLACE && <Marketplace onAddToCart={handleAddToCart} onNavigate={navigate} />}
                {currentRoute === AppRoute.CART && <Cart items={cart} onUpdateQuantity={handleUpdateCartQty} onRemoveItem={handleRemoveFromCart} onNavigate={navigate} />}
                {currentRoute === AppRoute.CHECKOUT && <Checkout user={user} cartItems={cart} onCheckout={handleCheckoutSuccess} onNavigate={navigate} />}
                {currentRoute === AppRoute.RIDE && <Ride pricingConfig={ridePricing} onTransaction={handleWalletTransaction} />}
                {currentRoute === AppRoute.PPOB && <PPOB user={user} onNavigate={navigate} onTransaction={handleWalletTransaction} />}
                {currentRoute === AppRoute.SCAN_QR && <ScanQR user={user} onNavigate={navigate} onTransaction={handleWalletTransaction} />}
                {currentRoute === AppRoute.ORDER_HISTORY && <OrderHistory orders={orders} onNavigate={navigate} />}
                
                {currentRoute === AppRoute.WALLET && <Wallet user={user} transactions={transactions} onTransaction={handleWalletTransaction} onNavigate={navigate} />}
                {currentRoute === AppRoute.KOPERASI && <Koperasi user={user} onNavigate={navigate} />}
                {currentRoute === AppRoute.SHU && <SHU user={user} onNavigate={navigate} />}
                {currentRoute === AppRoute.GROUP_FINANCING && <GroupFinancing onNavigate={navigate} />}
                {currentRoute === AppRoute.GROUP_PROJECT_DASHBOARD && <GroupProjectDashboard user={user} onNavigate={navigate} />}
                {currentRoute === AppRoute.LEARNING_SPACE && <LearningSpace contents={contents} onNavigate={navigate} />}
                {currentRoute === AppRoute.COURSE_PLAYER && activeCourse && <CoursePlayer course={activeCourse} user={user} onNavigate={navigate} onUpdateProgress={()=>{}} />}
                {currentRoute === AppRoute.EVOTING && <EVoting user={user} onNavigate={navigate} />}
                {currentRoute === AppRoute.REFERRAL && <ReferralDashboard user={user} onNavigate={navigate} />}
                {currentRoute === AppRoute.COMMUNITY && <Community contents={contents} onNavigate={navigate} />}
                {currentRoute === AppRoute.CHAT && <Chat contacts={MOCK_CHATS} />}
                {currentRoute === AppRoute.HELP && <HelpCenter tickets={tickets} onSubmitTicket={handleSubmitTicket} />}
                {currentRoute === AppRoute.KNOWLEDGE_CENTER && <KnowledgeCenter onNavigate={navigate} />} 
                {currentRoute === AppRoute.PARTNER && <RoleApplication user={user} onSubmit={handleSubmitRole} onNavigate={navigate} />}
                
                {currentRoute === AppRoute.PROFILE && (
                    <Profile user={user} onUpdateUser={handleUpdateUser} onNavigate={navigate} />
                )}

                {currentRoute === AppRoute.SETTINGS && <Settings user={user} onUpdateUser={handleUpdateUser} onToggleTheme={toggleTheme} isDarkMode={user.preferences?.theme === 'dark'} />}
            </main>
          </div>
      </div>
    </div>
  );
};

export default App;
