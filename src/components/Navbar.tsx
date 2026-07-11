
import React, { useState } from 'react';
import { Menu, Bell, Search, ShoppingCart, Siren, AlertTriangle, HelpCircle, CheckCircle, Info, Ticket, Moon, Sun } from 'lucide-react';
import { User as UserType, AppRoute } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';

interface NavbarProps {
  user: UserType;
  onMenuClick: () => void;
  title: string;
  cartCount?: number;
  onCartClick?: () => void;
  onNavigate?: (route: AppRoute) => void;
  onToggleTheme?: () => void; // New prop
}

export const Navbar: React.FC<NavbarProps> = ({ user, onMenuClick, title, cartCount = 0, onCartClick, onNavigate, onToggleTheme }) => {
  const isAdmin = user.roles.includes('admin');
  const [showSOS, setShowSOS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // NEW: Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Detect current theme for icon (simple check)
  const isDark = document.documentElement.classList.contains('dark');

  const handleSOSClick = () => {
      setShowSOS(true);
  };

  const handleSendSOS = () => {
      alert("SINYAL DARURAT DIKIRIM! Lokasi Anda telah disebar ke 50 anggota terdekat & Posko Koperasi.");
      setShowSOS(false);
  };

  // Content for the contextual guide based on the title/page
  const getGuideContent = () => {
      if (title.includes('Dashboard')) return "Ini adalah pusat kendali Anda. Cek saldo, transaksi terakhir, dan menu cepat di sini.";
      if (title.includes('Koperasi')) return "Menu Koperasi untuk melihat Simpanan Wajib/Pokok dan status Usaha Kelompok Anda.";
      if (title.includes('Toko')) return "Belanja kebutuhan sehari-hari di sini. Produk resmi KMP-ADNG dijamin murah, produk anggota mendukung ekonomi lokal.";
      if (title.includes('Ride')) return "Pesan ojek atau mobil untuk bepergian. Pilih lokasi jemput dan tujuan.";
      return "Jelajahi menu di sidebar untuk fitur lainnya. Hubungi Helpdesk jika mengalami kendala.";
  };

  const markAllRead = () => {
      setNotifications(prev => prev.map(n => ({...n, isRead: true})));
  };

  const handleKnowledgeClick = () => {
      if (onNavigate) {
          onNavigate(AppRoute.KNOWLEDGE_CENTER);
      } else {
          window.location.hash = '#/knowledge';
          console.warn("Navigation prop missing in Navbar");
      }
  };

  return (
    <>
    <header className="bg-white dark:bg-slate-900 shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors duration-300 border-b border-gray-100 dark:border-slate-800">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 mr-4 md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-[150px] md:max-w-none">{title}</h1>
        
        {/* Help Button (Contextual) */}
        <button 
            onClick={() => setShowGuide(true)}
            className="ml-2 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            title="Panduan Halaman Ini"
        >
            <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        
        {/* THEME TOGGLE (NEW) */}
        {onToggleTheme && (
            <button 
                onClick={onToggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
                title="Ganti Mode Tampilan"
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        )}

        {/* KNOWLEDGE CENTER BUTTON */}
        <button 
            onClick={handleKnowledgeClick}
            className="hidden md:flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shadow-sm border border-blue-100 dark:border-blue-800/50"
            title="Pusat Informasi & Pengetahuan"
        >
            <Info className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold">Info & Aturan</span>
        </button>
        {/* Mobile version icon only */}
        <button 
            onClick={handleKnowledgeClick}
            className="md:hidden p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full"
        >
            <Info className="w-5 h-5" />
        </button>

        {/* SOS BUTTON */}
        {!isAdmin && (
            <button 
                onClick={handleSOSClick}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center shadow-lg shadow-red-600/30 animate-pulse"
            >
                <Siren className="w-4 h-4 mr-1 md:mr-2" /> 
                <span className="text-xs font-bold md:inline">SOS</span>
            </button>
        )}

        {/* Hide Search Bar for Admin */}
        {!isAdmin && (
          <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-transparent dark:border-slate-700 transition-colors">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Cari layanan..." 
              className="bg-transparent border-none focus:outline-none text-sm w-48 text-slate-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        )}

        {/* Cart Icon - Only for Non-Admin */}
        {!isAdmin && (
          <button 
            onClick={onCartClick}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce-in">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* NOTIFICATION BELL */}
        <div className="relative">
            <button 
                onClick={() => {
                    setShowNotifications(!showNotifications);
                    if(!showNotifications) markAllRead();
                }}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-slide-up">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                        <h3 className="font-bold text-slate-800 dark:text-white">Notifikasi</h3>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={markAllRead}>Tandai dibaca</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto bg-white dark:bg-slate-800">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Belum ada notifikasi.</div>
                        ) : (
                            notifications.map(item => (
                                <div key={item.id} className="p-4 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition flex items-start">
                                    <div className={`p-2 rounded-full mr-3 shrink-0 ${
                                        item.type === 'transaction' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                        item.type === 'promo' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                        item.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {item.type === 'transaction' ? <CheckCircle size={16} /> : 
                                         item.type === 'promo' ? <Ticket size={16} /> :
                                         item.type === 'info' ? <Info size={16} /> : <AlertTriangle size={16} />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{item.message}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">{item.date}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-slate-700/50 text-center border-t border-gray-100 dark:border-slate-700">
                        <button className="text-xs font-bold text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">Lihat Semua</button>
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center pl-2 border-l border-gray-200 dark:border-slate-700 ml-2">
          <div className="text-right hidden sm:block mr-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
            <p className={`text-xs font-bold ${isAdmin ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isAdmin ? 'ADMINISTRATOR' : 'Anggota KMP-ADNG'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm ${isAdmin ? 'border-red-200 dark:border-red-900' : 'border-white dark:border-slate-600'}`}>
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>

    {/* SOS MODAL */}
    {showSOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative text-center border border-red-500/50">
                <div className="bg-red-600 p-6 text-white">
                    <Siren className="w-16 h-16 mx-auto mb-2 animate-bounce" />
                    <h3 className="text-2xl font-bold">SINYAL DARURAT</h3>
                    <p className="text-red-100">Hanya gunakan dalam keadaan bahaya!</p>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                        Menekan tombol di bawah akan mengirimkan <strong>Lokasi GPS & Data Diri Anda</strong> ke seluruh anggota di radius 5km dan Posko Keamanan Desa.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleSendSOS}
                            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-600/30 flex items-center justify-center"
                        >
                            <AlertTriangle className="w-6 h-6 mr-2" /> KIRIM BANTUAN SEKARANG
                        </button>
                        <button 
                            onClick={() => setShowSOS(false)}
                            className="w-full py-3 border border-gray-300 dark:border-slate-600 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* GUIDE MODAL */}
    {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl relative border border-gray-100 dark:border-slate-700">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3 text-blue-600 dark:text-blue-400">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Panduan: {title}</h3>
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                        {getGuideContent()}
                    </p>
                    <button 
                        onClick={() => setShowGuide(false)}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
