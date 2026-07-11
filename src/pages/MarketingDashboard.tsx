
import React, { useState, useEffect } from 'react';
import { User, KordinatorDetail } from '../types';
import { MARKETING_REWARDS } from '../constants';
import { 
    Rocket, 
    TrendingUp, 
    Activity,
    DollarSign,
    MapPin,
    Network,
    Calculator,
    ChevronDown,
    UserPlus,
    Copy,
    CheckCircle,
    Star,
    Database,
    Zap,
    Handshake,
    Megaphone,
    Smartphone,
    Award,
    BarChart2,
    Globe,
    ArrowUpCircle
} from 'lucide-react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart as RePieChart, 
    Pie as RePie, 
    Cell
} from 'recharts';
import { useToast } from '../components/Toast';
import api from '../services/api';

interface MarketingDashboardProps {
  user: User;
}

// --- MOCK DATA STRATEGIC ---

// 1. Market Trends (Big Data / Growth Hacker)
const MARKET_TRENDS = [
    { category: 'Sembako', growth: 120, volume: 85000000 },
    { category: 'Fashion', growth: 45, volume: 32000000 },
    { category: 'PPOB', growth: 80, volume: 55000000 },
    { category: 'Pertanian', growth: 15, volume: 12000000 },
    { category: 'Jasa', growth: 30, volume: 22000000 },
];

// 2. Social Scoring (Creditworthiness Profile)
const SOCIAL_SCORE_DIST = [
    { name: 'Platinum (Sangat Layak)', value: 15, color: '#10b981' }, // Emerald
    { name: 'Gold (Layak)', value: 45, color: '#3b82f6' }, // Blue
    { name: 'Silver (Cukup)', value: 30, color: '#f59e0b' }, // Amber
    { name: 'Bronze (Perlu Edukasi)', value: 10, color: '#ef4444' }, // Red
];

// 3. Campaigns (Content & Gamification)
const ACTIVE_CAMPAIGNS = [
    { id: 'cmp1', name: 'Kejar Rejeki Sembako', type: 'Gamification', target: 'Pedagang Pasar', status: 'Running', conversion: '12%' },
    { id: 'cmp2', name: 'Webinar Literasi Keuangan', type: 'Education', target: 'Ibu Rumah Tangga', status: 'Scheduled', conversion: '-' },
    { id: 'cmp3', name: 'Double Point Weekend', type: 'Loyalty', target: 'Semua Anggota', status: 'Ended', conversion: '25%' },
];

// 4. Strategic Partners (Interoperability)
const PARTNERS = [
    { id: 'p1', name: 'Indofood Distributor', type: 'Supplier', status: 'Connected', apiLatency: '45ms' },
    { id: 'p2', name: 'JNE Logistics', type: 'Logistics', status: 'Connected', apiLatency: '120ms' },
    { id: 'p3', name: 'Bank BRI (BRIVA)', type: 'Payment', status: 'Connected', apiLatency: '30ms' },
];

// --- MOCK DATA TACTICAL (Existing) ---
const TERRITORY_PERFORMANCE = [
    { name: 'Kec. Ciparay', members: 450, gmv: 85000000 },
    { name: 'Kec. Baleendah', members: 620, gmv: 120000000 },
    { name: 'Kec. Majalaya', members: 380, gmv: 65000000 },
    { name: 'Kec. Soreang', members: 890, gmv: 150000000 },
    { name: 'Kec. Banjaran', members: 210, gmv: 40000000 },
];

const MOCK_SUB_TERRITORIES = [
    { id: 't1', name: 'Kecamatan Ciparay', code: '32.04.01', coordinator: 'Bpk. Asep Sunandar', status: 'filled', performance: 85, potentialCandidates: [] },
    { id: 't2', name: 'Kecamatan Baleendah', code: '32.04.02', coordinator: 'Ibu Susi Susanti', status: 'filled', performance: 92, potentialCandidates: [] },
    { id: 't3', name: 'Kecamatan Majalaya', code: '32.04.03', coordinator: null, status: 'vacant', performance: 0, 
      potentialCandidates: [
          { id: 'u101', name: 'Dedi Mulyadi', score: 98, reason: 'Top Spender & Punya 50 Downline' },
          { id: 'u102', name: 'Rina Nose', score: 85, reason: 'Influencer Lokal' }
      ] 
    },
    { id: 't4', name: 'Kecamatan Soreang', code: '32.04.04', coordinator: 'Bpk. Ridwan', status: 'filled', performance: 78, potentialCandidates: [] },
    { id: 't5', name: 'Kecamatan Banjaran', code: '32.04.05', coordinator: null, status: 'vacant', performance: 0,
      potentialCandidates: [
          { id: 'u103', name: 'Mang Oleh', score: 90, reason: 'Pemilik Toko Grosir Besar' }
      ]
    },
];

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'engagement' | 'partnership' | 'structure' | 'calculator'>('overview');
  const { showToast } = useToast();
  
  // Data from User context with Fallback for robustness
  const roleData = user.marketingRoleDetails || {
      level: 'Kecamatan',
      territory: {
          level: 'Kecamatan',
          areaName: 'Wilayah Binaan (Default)',
          areaCode: '00.00',
          totalPopulation: 0,
          activeMerchants: 0,
          monthlyGmv: 0
      },
      downlines: 0,
      performanceScore: 0
  };
  
  // Calculator State
  const [simNewMembers, setSimNewMembers] = useState(10);
  const [simTxVolume, setSimTxVolume] = useState(100000000); 
  
  // Structure Management State
  const [selectedVacantTerritory, setSelectedVacantTerritory] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState('');

  // Promotion State
  const [kordinatorDetails, setKordinatorDetails] = useState<KordinatorDetail[]>([]);
  const [eligiblePromotion, setEligiblePromotion] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
      const fetchKordinatorDetails = async () => {
          try {
              const res = await api.get('/users/kordinator-details');
              const details = res.data.data || [];
              setKordinatorDetails(details);

              // Check Promotion Eligibility
              const referrals = user.referralStats?.totalInvited || 0;
              const activeCoord = details.find((d: KordinatorDetail) => d.userId === user.id && d.status === 'active');
              const currentLevel = activeCoord?.level || roleData.level;
              const memberCounter = activeCoord?.memberCounter || roleData.territory.totalPopulation;

              let nextLevel = null;
              if (currentLevel === 'Desa/Kelurahan' && (referrals >= 10 || memberCounter >= 30)) nextLevel = 'Kecamatan';
              else if (currentLevel === 'Kecamatan' && (referrals >= 50 || memberCounter >= 300)) nextLevel = 'Kota/Kabupaten';
              else if (currentLevel === 'Kota/Kabupaten' && (referrals >= 100 || memberCounter >= 600)) nextLevel = 'Provinsi';
              else if (currentLevel === 'Provinsi' && (referrals >= 200 || memberCounter >= 1200)) nextLevel = 'Regional';

              setEligiblePromotion(nextLevel);
          } catch (error) {
              console.error("Failed to fetch kordinator details", error);
          }
      };
      fetchKordinatorDetails();
  }, [user, roleData]);

  const handleAcceptPromotion = async () => {
      if (!eligiblePromotion) return;
      setIsPromoting(true);

      try {
          await api.post('/users/promote-kordinator', { newLevel: eligiblePromotion });
          
          showToast(`Selamat! Anda telah dipromosikan menjadi Kordinator ${eligiblePromotion}`, "success");
          setEligiblePromotion(null);
          
          // Optionally refetch details
          const res = await api.get('/users/kordinator-details');
          setKordinatorDetails(res.data.data || []);
      } catch (error: any) {
          showToast(error.response?.data?.message || "Gagal memproses promosi", "error");
      } finally {
          setIsPromoting(false);
      }
  };

  // Logic: Commission Calculation
  // FIX: Cast MARKETING_REWARDS as any to avoid TS7053 index error if 'Nasional' is missing in constant but present in type
  const acquisitionRate = (MARKETING_REWARDS as any)[roleData.level] || MARKETING_REWARDS['Kota/Kabupaten'];
  
  const potentialAcquisition = simNewMembers * acquisitionRate;
  const estAdminFee = simTxVolume * 0.02; // 2% Admin Fee from GMV
  const royaltyRate = 0.02; // 2% Share for City Level
  const potentialRoyalty = estAdminFee * royaltyRate;

  const handleOpenRecruit = (territory: any) => {
      setSelectedVacantTerritory(territory);
      setInviteLink(`https://kmp-adng.id/daftar-kordinator?ref=${user.referralCode}&area=${territory.code}`);
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(inviteLink);
      showToast("Link undangan khusus wilayah ini berhasil disalin!", "success");
  };

  const handlePromoteCandidate = (candidateName: string) => {
      if(window.confirm(`Promosikan ${candidateName} menjadi Kordinator wilayah ini?`)) {
          showToast(`Undangan Promosi Jabatan dikirim ke ${candidateName}`, "success");
          setSelectedVacantTerritory(null);
      }
  };

  // Helper: Get Vision Text based on Level
  const getVisionText = (level?: string) => {
      switch(level) {
          case 'Nasional': return "Membangun Interoperabilitas Sistem & Kemitraan Strategis Nasional.";
          case 'Provinsi': return "Analisa Big Data Regional & Ekspansi Wilayah.";
          case 'Kota/Kabupaten': return "Optimasi Growth Engine & Manajemen Kordinator Kecamatan.";
          case 'Kecamatan': return "Aktivasi Komunitas & Edukasi Finansial Digital.";
          case 'Desa/Kelurahan': return "Akuisisi Personal & Social Scoring Akar Rumput.";
          default: return "Menjadi Mesin Pertumbuhan Ekonomi Koperasi.";
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
       
       {/* PROMOTION BANNER */}
       {eligiblePromotion && (
           <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 shadow-lg text-white flex flex-col md:flex-row items-center justify-between animate-fade-in">
               <div className="flex items-center mb-4 md:mb-0">
                   <div className="bg-white/20 p-3 rounded-full mr-4">
                       <ArrowUpCircle className="w-8 h-8 text-white" />
                   </div>
                   <div>
                       <h3 className="text-xl font-bold">Promosi Jabatan Tersedia!</h3>
                       <p className="text-white/90 text-sm">
                           Selamat! Target Anda telah tercapai. Anda memenuhi syarat untuk naik kelas menjadi <strong>Kordinator {eligiblePromotion}</strong>.
                       </p>
                   </div>
               </div>
               <button 
                   onClick={handleAcceptPromotion}
                   disabled={isPromoting}
                   className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition shadow-md whitespace-nowrap disabled:opacity-70"
               >
                   {isPromoting ? 'Memproses...' : 'Terima Promosi'}
               </button>
           </div>
       )}

       {/* COMMAND CENTER HEADER */}
       <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
               <div className="mb-6 md:mb-0">
                   <div className="flex items-center space-x-2 mb-2">
                       <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center">
                           <MapPin className="w-3 h-3 mr-1" /> {roleData.level}
                       </span>
                       <span className="bg-white/20 text-indigo-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                           {roleData.territory.areaCode}
                       </span>
                   </div>
                   <h1 className="text-3xl font-bold mb-2">Growth Engine: {roleData.territory.areaName}</h1>
                   <p className="text-indigo-200 font-medium italic mb-2">"{getVisionText(roleData.level)}"</p>
                   <p className="text-slate-400 text-sm max-w-lg">
                       Manfaatkan Big Data, Gamifikasi, dan Kemitraan Strategis untuk pertumbuhan eksponensial di wilayah Anda.
                   </p>
               </div>
               <div className="flex space-x-4">
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center min-w-[120px]">
                       <p className="text-xs text-indigo-300 uppercase font-bold">Populasi Member</p>
                       <p className="text-3xl font-bold">{roleData.territory.totalPopulation.toLocaleString('id-ID')}</p>
                       <p className="text-[10px] text-green-400 flex justify-center items-center"><TrendingUp className="w-3 h-3 mr-1" /> Active</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center min-w-[120px]">
                       <p className="text-xs text-indigo-300 uppercase font-bold">GMV Bulan Ini</p>
                       <p className="text-xl font-bold">Rp {(roleData.territory.monthlyGmv / 1000000000)?.toFixed(1)} M</p>
                       <p className="text-[10px] text-green-400 flex justify-center items-center"><Activity className="w-3 h-3 mr-1" /> Live</p>
                   </div>
               </div>
           </div>
           {/* Background Deco */}
           <div className="absolute -right-20 -bottom-40 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
               <Database size={200} />
           </div>
       </div>

       {/* TABS NAVIGATION */}
       <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-1">
           <button onClick={() => setActiveTab('overview')} className={`px-5 py-3 font-bold border-b-2 transition whitespace-nowrap flex items-center ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>
             <BarChart2 className="w-4 h-4 mr-2" /> Overview
           </button>
           <button onClick={() => setActiveTab('intelligence')} className={`px-5 py-3 font-bold border-b-2 transition whitespace-nowrap flex items-center ${activeTab === 'intelligence' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>
             <Database className="w-4 h-4 mr-2" /> Market Intelligence
           </button>
           <button onClick={() => setActiveTab('engagement')} className={`px-5 py-3 font-bold border-b-2 transition whitespace-nowrap flex items-center ${activeTab === 'engagement' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>
             <Zap className="w-4 h-4 mr-2" /> Loyalty & Gamification
           </button>
           <button onClick={() => setActiveTab('partnership')} className={`px-5 py-3 font-bold border-b-2 transition whitespace-nowrap flex items-center ${activeTab === 'partnership' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>
             <Handshake className="w-4 h-4 mr-2" /> Partnership
           </button>
           <button onClick={() => setActiveTab('structure')} className={`px-5 py-3 font-bold border-b-2 transition whitespace-nowrap flex items-center ${activeTab === 'structure' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>
             <Network className="w-4 h-4 mr-2" /> Struktur
           </button>
           <button onClick={() => setActiveTab('calculator')} className={`px-5 py-3 font-bold border-b-2 transition whitespace-nowrap flex items-center ${activeTab === 'calculator' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>
             <Calculator className="w-4 h-4 mr-2" /> Simulasi
           </button>
       </div>

       {/* === TAB: OVERVIEW (Tactical View) === */}
       {activeTab === 'overview' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
               <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                       <MapPin className="w-5 h-5 mr-2 text-indigo-600" /> Performa Sub-Wilayah (Tactical)
                   </h3>
                   <div className="h-80">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={TERRITORY_PERFORMANCE} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                               <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} cursor={{fill: 'transparent'}}/>
                               <Bar dataKey="gmv" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} name="Transaksi (Rp)" />
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               </div>
               <div className="space-y-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                           <DollarSign className="w-5 h-5 mr-2 text-green-600" /> Pendapatan Saya
                       </h3>
                       <div className="text-center py-6 border-b border-gray-100">
                           <p className="text-3xl font-bold text-slate-800">Rp 4.250.000</p>
                           <p className="text-xs text-gray-500">Total Akumulasi Bulan Ini</p>
                       </div>
                       <div className="pt-4 space-y-3">
                           <div className="flex justify-between items-center text-sm">
                               <span className="text-gray-600">Reward Akuisisi</span>
                               <span className="font-bold text-slate-800">Rp 1.500.000</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                               <span className="text-gray-600">Royalti Transaksi</span>
                               <span className="font-bold text-green-600">Rp 2.750.000</span>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* === TAB: INTELLIGENCE (Pilar 1: Growth Hacker & Pilar 5: Social Scoring) === */}
       {activeTab === 'intelligence' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
               
               {/* Growth Hacking: Market Trends */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <div className="mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center">
                            <Rocket className="w-5 h-5 mr-2 text-purple-600" /> Market Intelligence (Growth Hacker)
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Analisa Big Data tren transaksi wilayah untuk menentukan fokus kampanye marketing.
                        </p>
                   </div>
                   <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={MARKET_TRENDS}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                               <XAxis dataKey="category" tick={{fontSize: 12}} />
                               <YAxis />
                               <Tooltip />
                               <Bar dataKey="growth" fill="#8b5cf6" name="Pertumbuhan (%)" radius={[4, 4, 0, 0]} />
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
                   <div className="mt-4 bg-purple-50 p-4 rounded-xl text-sm text-purple-900">
                       <strong>Insight:</strong> Sektor <strong>Sembako</strong> tumbuh 120%. 
                       Disarankan memfokuskan rekrutmen Merchant Warung dan kampanye "Belanja Harian Hemat" di aplikasi.
                   </div>
               </div>

               {/* Social Scoring Profile */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <div className="mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-500" /> Social Scoring Coordinator
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Profil kualitas anggota berdasarkan aktivitas digital & loyalitas (Alternative Credit Scoring).
                        </p>
                   </div>
                   <div className="flex items-center justify-center h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <RePie
                                    data={SOCIAL_SCORE_DIST}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {SOCIAL_SCORE_DIST.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </RePie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mt-4">
                       {SOCIAL_SCORE_DIST.map((item, idx) => (
                           <div key={idx} className="flex items-center">
                               <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></div>
                               <span className="text-xs font-medium text-slate-600">{item.name}: {item.value}%</span>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* === TAB: ENGAGEMENT (Pilar 2: Loyalty & Pilar 4: Content) === */}
       {activeTab === 'engagement' && (
           <div className="space-y-8 animate-fade-in">
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Gamification Config */}
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                           <Award className="w-5 h-5 mr-2 text-orange-500" /> Program Loyalitas & Gamifikasi
                       </h3>
                       <div className="space-y-4">
                           <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:bg-gray-50 transition">
                               <div>
                                   <p className="font-bold text-slate-800">Poin Transaksi</p>
                                   <p className="text-xs text-gray-500">1 Poin setiap Rp 10.000 belanja</p>
                               </div>
                               <div className="flex items-center text-green-600 font-bold text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Aktif</div>
                           </div>
                           <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:bg-gray-50 transition">
                               <div>
                                   <p className="font-bold text-slate-800">Bonus Referral Berjenjang</p>
                                   <p className="text-xs text-gray-500">Bonus untuk 3 level kedalaman</p>
                               </div>
                               <div className="flex items-center text-green-600 font-bold text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Aktif</div>
                           </div>
                           <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-400">
                               + Buat Program Baru
                           </button>
                       </div>
                   </div>

                   {/* Content Manager */}
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                           <Megaphone className="w-5 h-5 mr-2 text-blue-500" /> Kampanye & Edukasi
                        </h3>
                        <div className="space-y-2">
                            {ACTIVE_CAMPAIGNS.map(cmp => (
                                <div key={cmp.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{cmp.name}</p>
                                        <p className="text-xs text-gray-500">{cmp.type} • Target: {cmp.target}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase
                                            ${cmp.status === 'Running' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                                        `}>{cmp.status}</span>
                                        <p className="text-xs font-bold text-slate-700 mt-1">Conv: {cmp.conversion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </div>
               </div>

               {/* Push Notification Manager */}
               <div className="bg-slate-800 text-white p-6 rounded-2xl flex justify-between items-center">
                   <div>
                       <h3 className="font-bold text-lg mb-1 flex items-center"><Smartphone className="w-5 h-5 mr-2" /> Push Notification Center</h3>
                       <p className="text-slate-400 text-sm">Kirim pesan edukasi atau promo langsung ke layar HP anggota di wilayah Anda.</p>
                   </div>
                   <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">
                       Buat Broadcast
                   </button>
               </div>
           </div>
       )}

       {/* === TAB: PARTNERSHIP (Pilar 3: Interoperability) === */}
       {activeTab === 'partnership' && (
           <div className="animate-fade-in bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                   <div>
                       <h3 className="font-bold text-lg text-slate-800 flex items-center">
                           <Handshake className="w-5 h-5 mr-2 text-emerald-600" /> Jembatan Kemitraan Strategis
                       </h3>
                       <p className="text-sm text-gray-500 mt-1">
                           Kelola integrasi API dengan distributor dan penyedia layanan eksternal agar saldo KMP-ADNG bisa digunakan di mana saja.
                       </p>
                   </div>
                   <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700">
                       + Tambah Mitra
                   </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {PARTNERS.map(p => (
                       <div key={p.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gray-50">
                           <div className="flex justify-between items-start mb-4">
                               <div className="p-3 bg-white rounded-lg shadow-sm">
                                   <Globe className="w-6 h-6 text-blue-600" />
                               </div>
                               <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                   {p.status}
                               </span>
                           </div>
                           <h4 className="font-bold text-slate-800">{p.name}</h4>
                           <p className="text-xs text-gray-500 mb-4">{p.type}</p>
                           <div className="flex items-center text-xs text-gray-400 border-t border-gray-200 pt-3">
                               <Activity className="w-3 h-3 mr-1" /> Latency: {p.apiLatency}
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* === TAB: STRUCTURE (Original Logic - Preserved) === */}
       {activeTab === 'structure' && (
           <div className="space-y-6 animate-fade-in">
               <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center">
                   <div className="mb-4 md:mb-0">
                       <h3 className="font-bold text-lg text-indigo-900 mb-1">Kelengkapan Struktur Wilayah</h3>
                       <p className="text-sm text-indigo-700">Pastikan setiap sub-wilayah memiliki Kordinator aktif.</p>
                   </div>
                   <div className="flex items-center space-x-4">
                       <div className="text-center">
                           <p className="text-2xl font-bold text-indigo-900">{MOCK_SUB_TERRITORIES.filter(t => t.status === 'filled').length} / {MOCK_SUB_TERRITORIES.length}</p>
                           <p className="text-xs text-indigo-600 uppercase font-bold">Terisi</p>
                       </div>
                       <div className="w-px h-10 bg-indigo-200"></div>
                       <div className="text-center">
                           <p className="text-2xl font-bold text-orange-600">{MOCK_SUB_TERRITORIES.filter(t => t.status === 'vacant').length}</p>
                           <p className="text-xs text-orange-600 uppercase font-bold">Kosong</p>
                       </div>
                   </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {MOCK_SUB_TERRITORIES.map((territory) => (
                           <div key={territory.id} className={`border rounded-xl p-5 transition relative overflow-hidden group
                               ${territory.status === 'filled' ? 'border-gray-200 bg-white hover:border-indigo-300' : 'border-orange-200 bg-orange-50 hover:border-orange-400'}
                           `}>
                               <div className="flex justify-between items-start mb-4">
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm
                                       ${territory.status === 'filled' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-orange-500 border border-orange-200'}
                                   `}>
                                       {territory.status === 'filled' ? territory.coordinator?.charAt(0) : '?'}
                                   </div>
                                   <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider
                                       ${territory.status === 'filled' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600 animate-pulse'}
                                   `}>
                                       {territory.status === 'filled' ? 'Aktif' : 'Kosong (Vacant)'}
                                   </span>
                               </div>
                               
                               <h4 className="font-bold text-slate-800 text-lg mb-1">{territory.name}</h4>
                               <p className="text-xs text-gray-500 font-mono mb-4">Kode: {territory.code}</p>

                               {territory.status === 'filled' ? (
                                   <div className="space-y-2">
                                       <p className="text-sm text-gray-600">Kordinator: <strong>{territory.coordinator}</strong></p>
                                       <div className="w-full bg-gray-100 rounded-full h-2">
                                           <div className="bg-green-500 h-2 rounded-full" style={{ width: `${territory.performance}%` }}></div>
                                       </div>
                                       <p className="text-xs text-gray-400 text-right">Performa: {territory.performance}%</p>
                                   </div>
                               ) : (
                                   <div className="mt-4">
                                       <p className="text-xs text-orange-700 mb-3">Wilayah ini belum memiliki kordinator.</p>
                                       <button 
                                        onClick={() => handleOpenRecruit(territory)}
                                        className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-orange-700 shadow-md flex items-center justify-center"
                                       >
                                           <UserPlus className="w-4 h-4 mr-2" /> Rekrut
                                       </button>
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* --- TAB: CALCULATOR (Original Logic - Preserved) --- */}
       {activeTab === 'calculator' && (
           <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                   <h3 className="font-bold text-xl text-slate-800 mb-2">Simulasi Pendapatan</h3>
                   <p className="text-sm text-gray-500">Hitung potensi pendapatan Anda berdasarkan target akuisisi dan aktivitas transaksi wilayah.</p>
                   <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Target Member Baru</label>
                       <div className="flex items-center">
                           <input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" value={simNewMembers} onChange={(e) => setSimNewMembers(parseInt(e.target.value) || 0)} />
                           <span className="ml-3 text-gray-500 font-medium">Orang</span>
                       </div>
                       <p className="text-xs text-indigo-600 mt-1">Rate: Rp {acquisitionRate.toLocaleString('id-ID')} / member</p>
                   </div>
                   <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Target GMV Wilayah</label>
                       <div className="flex items-center">
                           <span className="mr-3 text-slate-500 font-bold">Rp</span>
                           <input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" value={simTxVolume} onChange={(e) => setSimTxVolume(parseInt(e.target.value) || 0)} />
                       </div>
                   </div>
               </div>
               <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-center">
                   <h3 className="text-lg font-bold text-indigo-200 mb-6">Potensi Pendapatan Bulanan</h3>
                   <div className="space-y-6">
                       <div className="flex justify-between items-end border-b border-indigo-800 pb-4">
                           <div><p className="text-sm text-indigo-300 mb-1">Reward Akuisisi</p><p className="text-xs text-indigo-400">{simNewMembers} x Rp {acquisitionRate}</p></div>
                           <p className="text-2xl font-bold">Rp {potentialAcquisition.toLocaleString('id-ID')}</p>
                       </div>
                       <div className="flex justify-between items-end border-b border-indigo-800 pb-4">
                           <div><p className="text-sm text-indigo-300 mb-1">Royalti Transaksi</p><p className="text-xs text-indigo-400">~{royaltyRate*100}% dari Admin Fee</p></div>
                           <p className="text-2xl font-bold text-green-400">Rp {potentialRoyalty.toLocaleString('id-ID')}</p>
                       </div>
                       <div className="pt-4">
                           <p className="text-sm text-indigo-300 mb-2 uppercase font-bold tracking-wider">Total Estimasi</p>
                           <p className="text-5xl font-bold text-white">Rp {(potentialAcquisition + potentialRoyalty).toLocaleString('id-ID')}</p>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* --- MODAL RECRUITMENT (Preserved) --- */}
       {selectedVacantTerritory && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                   <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
                       <div><h3 className="text-xl font-bold">Rekrutmen Kordinator</h3><p className="text-indigo-300 text-sm mt-1">{selectedVacantTerritory.name}</p></div>
                       <button onClick={() => setSelectedVacantTerritory(null)} className="text-white/50 hover:text-white"><ChevronDown size={24} className="rotate-180" /></button>
                   </div>
                   <div className="p-6 space-y-6">
                       <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                           <h4 className="font-bold text-blue-900 mb-3 flex items-center"><Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" /> Rekomendasi Sistem</h4>
                           {selectedVacantTerritory.potentialCandidates.length > 0 ? (
                               <div className="space-y-3">{selectedVacantTerritory.potentialCandidates.map((cand: any) => (<div key={cand.id} className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm"><div><p className="font-bold text-slate-800">{cand.name}</p><p className="text-xs text-gray-500">{cand.reason}</p></div><button onClick={() => handlePromoteCandidate(cand.name)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">Promosikan</button></div>))}</div>
                           ) : (<p className="text-sm text-blue-700 italic">Belum ada kandidat potensial.</p>)}
                       </div>
                       <div>
                           <h4 className="font-bold text-slate-800 mb-2 text-sm">Bagikan Link Pendaftaran Khusus</h4>
                           <div className="flex gap-2"><input type="text" readOnly value={inviteLink} className="flex-1 bg-gray-50 border border-gray-300 text-gray-500 text-xs p-3 rounded-lg font-mono" /><button onClick={handleCopyLink} className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700"><Copy size={18} /></button></div>
                       </div>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
