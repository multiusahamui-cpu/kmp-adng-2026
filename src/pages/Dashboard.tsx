
import React, { useState, useEffect } from 'react';
import { User, ContentItem, Transaction, AppRoute } from '../types';
import { APP_LOGO } from '../constants';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Newspaper,
  ChevronRight,
  TrendingUp,
  Activity,
  Info,
  Wifi,
  QrCode,
  Eye,      
  EyeOff,
  UserCheck,
  Clock,
  CheckCircle,
  Wallet,
  Coins,
  PieChart as PieIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { NewsSkeleton } from '../components/Skeleton'; 

interface DashboardProps {
  user: User;
  contents: ContentItem[]; 
  recentTransactions: Transaction[];
  onNavigate: (route: AppRoute, params?: any) => void;
}

const data = [
  { name: 'Sen', amt: 4000 },
  { name: 'Sel', amt: 3000 },
  { name: 'Rab', amt: 2000 },
  { name: 'Kam', amt: 2780 },
  { name: 'Jum', amt: 1890 },
  { name: 'Sab', amt: 2390 },
  { name: 'Min', amt: 3490 },
];

const formatKTA = (id: string) => {
  if (id && id.length >= 12 && /^\d+$/.test(id)) {
    const w = id.substring(0, 1);
    const pp = id.substring(1, 3);
    const kk = id.substring(3, 5);
    const s = id.substring(5);
    return `${w}.${pp}.${kk}.${s}`; 
  }
  return id || "0.00.00.0000000";
};

// Card Configuration Component
const KTACard: React.FC<{ 
    user: User, 
    variant: string
}> = ({ user, variant }) => {
    
    let bgClass = '';
    let title = '';
    let textColor = 'text-white';
    let labelColor = 'text-gray-200';
    
    const isInternalRole = ['pengurus', 'management'].includes(variant);
    const specificJobTitle = isInternalRole 
        ? (user.roleTitles?.[variant] || user.officialTitle || '') 
        : ''; 

    // Determine if card is active or pending/locked
    const isPending = user.status === 'pending' || user.status === 'awaiting_payment';

    switch(variant) {
        case 'member':
            bgClass = 'bg-gradient-to-br from-emerald-600 to-teal-900';
            title = 'KMP-ADNG MEMBERSHIP';
            textColor = 'text-white';
            labelColor = 'text-emerald-100';
            break;
        default:
            bgClass = 'bg-gradient-to-br from-emerald-600 to-teal-900';
            title = 'KMP-ADNG MEMBERSHIP';
            textColor = 'text-white';
            labelColor = 'text-emerald-100';
            break;
    }

    const isLightCard = ['driver', 'exchanger', 'producer', 'market_coordinator'].includes(variant);

    return (
        <div className={`
            relative w-full aspect-[1.586/1] rounded-2xl p-6 shadow-2xl overflow-hidden transition-all group shrink-0 snap-center flex flex-col justify-between
            ${isPending ? 'bg-slate-700 grayscale-[0.8]' : bgClass}
        `}>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            
            {/* Glossy Effect */}
            <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-transparent via-white/10 to-transparent rotate-45 pointer-events-none"></div>

            {/* --- TOP ROW: Logo & Title (Left) - Photo (Right) --- */}
            <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-start space-x-3">
                     <img 
                       src={APP_LOGO}
                       alt="KMP-ADNG" 
                       className={`h-12 w-auto object-contain ${!isLightCard ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'drop-shadow-md'}`}
                     />
                     <div className="flex flex-col pt-1">
                         <span className={`text-[10px] uppercase font-bold tracking-widest ${labelColor}`}>KTA DIGITAL</span>
                         <span className={`font-bold text-sm md:text-lg tracking-wide uppercase leading-tight ${textColor}`} style={{textShadow: "0px 1px 2px rgba(0,0,0,0.1)"}}>
                             {title}
                         </span>
                     </div>
                </div>
                
                <div className={`w-14 h-14 rounded-full p-0.5 shadow-inner ${isLightCard ? 'bg-slate-800/10 border-slate-400/50' : 'bg-white/20 border-white/50'} border`}>
                    <img src={user.selfiePhoto || user.avatarUrl} alt="User" className="w-full h-full rounded-full object-cover" />
                </div>
            </div>

            {/* --- MIDDLE ROW: Chip & Contactless (Vertically Centered & Offset) --- */}
            <div className="relative z-10 flex-1 flex items-center justify-between">
                <div className="ml-8 w-12 h-10 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-md border border-yellow-700/50 shadow-sm flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-800/40"></div>
                    <div className="absolute left-1/2 top-0 w-[1px] h-full bg-yellow-800/40"></div>
                    <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 border border-yellow-800/40 rounded-[2px]"></div>
                </div>
                <Wifi className={`rotate-90 w-8 h-8 mr-8 ${labelColor}`} strokeWidth={2} />
            </div>
            
            {/* --- BOTTOM SECTION: Number, Name, QR --- */}
            <div className="relative z-10 mt-auto">
                <div className="flex justify-between items-end">
                    <div className="flex-1 pr-4">
                        {isPending ? (
                            <div className="mb-4">
                                <span className={`font-mono text-lg tracking-widest opacity-60`}>XX.XX.XX.XXXXXXX</span>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className={`font-mono text-xl md:text-2xl tracking-widest drop-shadow-sm ${textColor}`} style={{ letterSpacing: '2px' }}>
                                    {formatKTA(user.ktaId)}
                                </p>
                            </div>
                        )}

                        <div className="flex items-start">
                            <div>
                                <p className={`text-[8px] uppercase tracking-wider mb-0.5 ${labelColor}`}>MEMBER NAME</p>
                                <p className={`font-bold tracking-wide uppercase text-sm md:text-base leading-tight break-words ${textColor}`}>
                                    {user.name}
                                </p>
                            </div>
                            
                            {specificJobTitle && (
                                <div className={`ml-8 pl-4 border-l ${isLightCard ? 'border-slate-800/20' : 'border-white/20'}`}>
                                    <p className={`text-[8px] uppercase tracking-wider mb-0.5 ${labelColor}`}>JABATAN</p>
                                    <p className={`font-bold tracking-wide uppercase text-sm md:text-base leading-tight break-words ${textColor}`}>
                                        {specificJobTitle}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-end shrink-0">
                         <div className={`text-[8px] text-right mb-1 ${labelColor} font-mono tracking-wider`}>
                             MEMBER SINCE<br/>
                             <span className={`text-xs font-bold ${textColor}`}>{user.joinDate || 'XX/XX'}</span>
                         </div>
                         <div className="bg-white p-1 rounded-lg shadow-sm">
                            <QrCode className="w-10 h-10 text-slate-900" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, contents, recentTransactions, onNavigate }) => {
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);

  // Filter content for Dashboard
  const dashboardNews = contents.filter(c => 
    c.status === 'published' && 
    ['Berita', 'Pengumuman', 'Undangan', 'Bisnis'].includes(c.category)
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsFeedLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRestrictedAction = (actionRoute: AppRoute) => {
    if (user.status !== 'active') {
      const confirm = window.confirm("Fitur ini khusus untuk Anggota Terverifikasi. Lanjutkan ke Pengaturan Profil untuk melengkapi pendaftaran?");
      if (confirm) {
        onNavigate(AppRoute.ONBOARDING);
      }
    } else {
      onNavigate(actionRoute);
    }
  };

  const activeCards = ['member'];

  // RENDER PENDING STATE DASHBOARD (KYC not done)
  if (user.status === 'pending') {
      return (
          <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
              {/* HEADER WELCOME */}
              <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                      <div className="flex items-center mb-4">
                          <UserCheck className="w-8 h-8 text-emerald-400 mr-3" />
                          <h1 className="text-3xl font-bold">Selamat Datang, {user.name}</h1>
                      </div>
                      <p className="text-slate-300 text-lg mb-6 max-w-2xl leading-relaxed">
                          Anda saat ini terdaftar sebagai <strong className="text-orange-400">Calon Anggota KMP-ADNG</strong>. 
                          Untuk mengaktifkan seluruh fitur dan mendapatkan KTA Digital, silakan ikuti langkah-langkah di bawah ini.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={() => onNavigate(AppRoute.KNOWLEDGE_CENTER)}
                            className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center"
                          >
                              <Info className="w-5 h-5 mr-2" /> Baca Kebijakan Privasi
                          </button>
                          <button 
                            onClick={() => onNavigate(AppRoute.ONBOARDING)}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition flex items-center justify-center"
                          >
                              Lengkapi Profil (KYC) <ChevronRight className="ml-2 w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  {/* Background Deco */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
                  <div className="absolute -bottom-10 -right-10 opacity-10">
                      <ShieldCheck size={200} />
                  </div>
              </div>

              {/* 7 STEPS CARD */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Clock className="w-6 h-6 mr-2 text-orange-500" /> Tahapan Menjadi Anggota Tetap
                  </h2>
                  <div className="space-y-6 relative">
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                      {[
                          { title: "Registrasi Awal", desc: "Anda telah terdaftar sementara di sistem KMP-ADNG." },
                          { title: "Verifikasi Identitas (KYC)", desc: "Isi NIK, Alamat, dan Upload Foto KTP & Selfie." },
                          { title: "Tagihan Keanggotaan", desc: "Sistem otomatis membuat tagihan Pendaftaran & Simpanan Pokok." },
                          { title: "Pembayaran", desc: "Selesaikan pembayaran melalui Transfer Bank atau E-Wallet." }
                      ].map((step, idx) => {
                          const isCompleted = idx === 0; 
                          const isCurrent = idx === 1;
                          return (
                            <div key={idx} className="flex items-start relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-4 border-2 shrink-0 
                                    ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : isCurrent ? 'bg-orange-500 border-orange-500 text-white animate-pulse' : 'bg-white border-gray-300 text-gray-500'}
                                `}>
                                    {isCompleted ? <CheckCircle size={14} /> : idx + 1}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-orange-700' : 'text-slate-700'}`}>{step.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // --- ACTIVE MEMBER DASHBOARD (OR AWAITING PAYMENT) ---
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      
      {/* Reminder Banner for Awaiting Payment */}
      {user.status === 'awaiting_payment' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-lg animate-bounce-in">
              <div className="flex items-start mb-4 md:mb-0">
                  <div className="bg-orange-100 p-3 rounded-full mr-4 text-orange-600">
                      <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-orange-800">Selesaikan Pembayaran Anggota</h3>
                      <p className="text-orange-700 text-sm mt-1">
                          KTA Digital Anda belum aktif. Segera lunasi Tagihan Pendaftaran & Simpanan Pokok di menu Dompet Digital.
                      </p>
                  </div>
              </div>
              <button 
                onClick={() => onNavigate(AppRoute.WALLET)}
                className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-md whitespace-nowrap"
              >
                  Bayar Sekarang <ChevronRight className="inline ml-1 w-4 h-4" />
              </button>
          </div>
      )}

      {/* Welcome & KTA Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KTA Digital Card Carousel */}
        <div className="lg:col-span-1">
          <div className="w-full overflow-x-auto snap-x snap-mandatory flex space-x-4 pb-4 scrollbar-hide">
              {activeCards.map((variant, idx) => (
                  <div key={idx} className="w-full shrink-0 snap-center">
                     <KTACard user={user} variant={variant} />
                  </div>
              ))}
          </div>
        </div>

        {/* Balance & Actions */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WALLET CARD */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
            <div>
              <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Saldo Dompet Utama</p>
                  <button 
                    onClick={() => setShowBalance(!showBalance)} 
                    className="text-gray-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                      {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1 tracking-tight">
                  {showBalance 
                    ? `Rp ${user.balance.toLocaleString('id-ID')}` 
                    : 'Rp ••••••••'}
              </h3>
            </div>
            <div className="flex space-x-3 mt-6 relative z-20">
              <button 
                onClick={() => onNavigate(AppRoute.WALLET)} // Changed to direct navigate, always accessible after KYC
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <ArrowDownLeft className="w-4 h-4 mr-2" /> 
                Top Up
              </button>
              <button 
                onClick={() => handleRestrictedAction(AppRoute.WALLET)}
                className="flex-1 border py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                 <ArrowUpRight className="w-4 h-4 mr-2" /> 
                Transfer
              </button>
            </div>
          </div>

          {/* SAVINGS CARD */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between relative transition-colors duration-300">
             <div>
              <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Simpanan Koperasi</p>
                  <button 
                    onClick={() => setShowBalance(!showBalance)} 
                    className="text-gray-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                      {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1 tracking-tight">
                  {showBalance 
                    ? `Rp ${user.savings.toLocaleString('id-ID')}` 
                    : 'Rp ••••••••'}
              </h3>
            </div>
             <div className="flex space-x-3 mt-6 relative z-20">
               <button 
                 onClick={() => handleRestrictedAction(AppRoute.KOPERASI)}
                 className="w-full py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600"
               >
                 <CreditCard className="w-4 h-4 mr-2" /> 
                 Kelola Simpanan
               </button>
             </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                Aktivitas Transaksi
              </h3>
              <select className="text-sm border-gray-200 dark:border-slate-600 rounded-md text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 p-1 outline-none">
                <option>Minggu Ini</option>
                <option>Bulan Ini</option>
              </select>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', opacity: 0.1}} 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                    />
                    <Bar dataKey="amt" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* News Feed */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
             <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                <Newspaper className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                Berita & Informasi
              </h3>
              <button 
                onClick={() => onNavigate(AppRoute.COMMUNITY)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              >
                Lihat Komunitas
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {isFeedLoading ? (
                  <>
                    <NewsSkeleton />
                    <NewsSkeleton />
                    <NewsSkeleton />
                  </>
              ) : dashboardNews.length === 0 ? (
                  <p className="p-6 text-gray-400 text-center">Belum ada berita atau pengumuman.</p>
              ) : (
                  dashboardNews.map(item => (
                    <div 
                        key={item.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-start space-x-4 cursor-pointer"
                        onClick={() => onNavigate(AppRoute.COURSE_PLAYER, item)}
                    >
                      <img src={item.thumbnailUrl} alt={item.title} className="w-24 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block
                            ${item.category === 'Pengumuman' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                              item.category === 'Undangan' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              item.category === 'Bisnis' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}
                        `}>
                          {item.category}
                        </span>
                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transactions & Shortcuts */}
        <div className="space-y-8">
           
           {/* SHU Summary Card (NEW) */}
           <div 
              onClick={() => handleRestrictedAction(AppRoute.SHU)}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
           >
              <div className="relative z-10 flex justify-between items-center">
                  <div>
                      <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Estimasi SHU Anda</p>
                      <h3 className="text-3xl font-bold tracking-tight">Rp 1.700.000</h3>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">YTD 2024</span>
                        <p className="text-[10px] text-emerald-100 italic">*Klik untuk detail portofolio</p>
                      </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition shadow-inner border border-white/10">
                      <PieIcon className="w-6 h-6 text-white" />
                  </div>
              </div>
              {/* Deco */}
              <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <Coins size={100} />
              </div>
           </div>

           {/* Recent Transactions */}
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 relative transition-colors duration-300">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Transaksi Terakhir
            </h3>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${tx.type === 'topup' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {tx.type === 'topup' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-gray-200">{tx.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'topup' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                    {tx.type === 'topup' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada transaksi.</p>
              )}
            </div>
            <button 
              onClick={() => onNavigate(AppRoute.WALLET)} // Always accessible for payments
              className="w-full mt-6 py-2 text-sm text-center text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white border-t border-gray-100 dark:border-slate-700 pt-4"
            >
              Lihat Riwayat Lengkap
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl shadow-lg p-6 text-white transition-colors duration-300">
            <h3 className="font-bold text-lg mb-4">Akses Cepat</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleRestrictedAction(AppRoute.MARKETPLACE)}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl flex flex-col items-center justify-center transition"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-lg">🛒</span>
                </div>
                <span className="text-sm font-medium">Belanja</span>
              </button>
              <button 
                onClick={() => handleRestrictedAction(AppRoute.PPOB)}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl flex flex-col items-center justify-center transition"
              >
                <div className={`w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg`}>
                  <span className="text-lg">⚡</span>
                </div>
                <span className="text-sm font-medium">Bayar/Topup</span>
              </button>
              <button 
                 onClick={() => onNavigate(AppRoute.COMMUNITY)} // Community allowed? Restrict to active for consistent logic
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl flex flex-col items-center justify-center transition"
              >
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-lg">⚽</span>
                </div>
                <span className="text-sm font-medium">Bola</span>
              </button>
               <button 
                onClick={() => handleRestrictedAction(AppRoute.CHAT)}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl flex flex-col items-center justify-center transition"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-lg">💬</span>
                </div>
                <span className="text-sm font-medium">Chat</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
