
import React from 'react';
import { User, AppRoute } from '../types';
import { 
  ChevronLeft, 
  TrendingUp, 
  ShoppingBag, 
  Coins, 
  ArrowRight, 
  HelpCircle,
  Wallet,
  CreditCard,
  Zap,
  Landmark,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';

interface SHUProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
}

// --- MOCK DATA: PORTFOLIO ANGGOTA ---
const PORTFOLIO_DATA = {
    savings: [
        { name: 'Simpanan Pokok', value: 500000, color: '#059669' },     // Emerald-600
        { name: 'Simpanan Wajib', value: 1200000, color: '#10b981' },    // Emerald-500
        { name: 'Simpanan Sukarela', value: 3500000, color: '#34d399' }, // Emerald-400
    ],
    transactions: [
        { name: 'PPOB (Tagihan)', value: 450000, count: 12, color: '#f59e0b' },      // Amber-500
        { name: 'Belanja Marketplace', value: 2100000, count: 5, color: '#8b5cf6' }, // Violet-500
        { name: 'Belanja Lainnya', value: 850000, count: 8, color: '#ec4899' },      // Pink-500
        { name: 'Jasa Pinjaman', value: 150000, count: 2, color: '#6366f1' },        // Indigo-500
    ]
};

// Calculate Totals
const TOTAL_SAVINGS = PORTFOLIO_DATA.savings.reduce((acc, curr) => acc + curr.value, 0);
const TOTAL_TRANSACTIONS = PORTFOLIO_DATA.transactions.reduce((acc, curr) => acc + curr.value, 0);

const HISTORY_DATA = [
    { month: 'Jan', amount: 150000 },
    { month: 'Feb', amount: 180000 },
    { month: 'Mar', amount: 160000 },
    { month: 'Apr', amount: 250000 },
    { month: 'Mei', amount: 220000 },
    { month: 'Jun', amount: 300000 },
];

export const SHU: React.FC<SHUProps> = ({ user, onNavigate }) => {
  
  // Dynamic Savings Data (Use user.savingsDetail if available, else fallback to mock PORTFOLIO_DATA)
  // ONLY INCLUDE EQUITY (Pokok + Wajib) for SHU Calculation Visualization
  const savingsData = user.savingsDetail ? [
      { name: 'Simpanan Pokok', value: user.savingsDetail.pokok, color: '#059669' },
      { name: 'Simpanan Wajib', value: user.savingsDetail.wajib, color: '#10b981' },
  ] : [
      { name: 'Simpanan Pokok', value: 500000, color: '#059669' },
      { name: 'Simpanan Wajib', value: 1200000, color: '#10b981' },
  ];

  const currentEquitySavings = user.savingsDetail 
      ? (user.savingsDetail.pokok + user.savingsDetail.wajib) 
      : (500000 + 1200000); // Fallback sum

  // Dynamic Transaction Data
  const transactionData = user.transactionStats || PORTFOLIO_DATA.transactions;
  const currentTotalTransactions = user.transactionStats 
      ? user.transactionStats.reduce((acc, curr) => acc + curr.value, 0)
      : TOTAL_TRANSACTIONS;
  
  // Recalculate SHU based on dynamic data
  const currentShuModal = currentEquitySavings * 0.05; // 5% of Equity
  const currentShuTransaksi = currentTotalTransactions * 0.02;
  const currentTotalEstimatedShu = currentShuModal + currentShuTransaksi;

  const currentShuComposition = [
      { name: 'Jasa Modal', value: currentShuModal, color: '#10b981' },
      { name: 'Jasa Transaksi', value: currentShuTransaksi, color: '#f59e0b' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen space-y-8 animate-fade-in">
       
       <button 
        onClick={() => onNavigate(AppRoute.DASHBOARD)}
        className="flex items-center text-gray-500 hover:text-emerald-600 transition group"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-emerald-500/20 text-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-emerald-500/30">
                        Portofolio Anggota
                      </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Analisa Partisipasi & <br/>Estimasi SHU</h1>
                  <p className="text-emerald-100/80 max-w-xl text-sm md:text-base leading-relaxed">
                      Transparansi penuh atas kontribusi Anda. Semakin aktif Anda bertransaksi dan menabung, semakin besar SHU yang Anda dapatkan di akhir tahun buku.
                  </p>
              </div>
              
              <div className="flex flex-col gap-4 min-w-[280px]">
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10 text-center relative overflow-hidden group hover:bg-white/15 transition">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                      <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider mb-1">Total Estimasi SHU (YTD)</p>
                      <p className="text-4xl font-bold text-white tracking-tight">Rp {currentTotalEstimatedShu.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-emerald-300 mt-2 italic opacity-70 group-hover:opacity-100 transition">*Update Real-time berdasarkan aktivitas</p>
                  </div>
              </div>
          </div>
          
          {/* Background Decorations */}
          <div className="absolute -right-10 -bottom-20 opacity-10 rotate-12">
              <Coins size={300} />
          </div>
          <div className="absolute top-10 right-1/3 opacity-5">
              <BarChart3 size={200} />
          </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: PORTFOLIO BREAKDOWN */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* 1. SAVINGS PORTFOLIO */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center">
                          <Wallet className="w-5 h-5 mr-2 text-emerald-600" /> Portofolio Ekuitas (Modal)
                      </h3>
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                        Total: Rp {currentEquitySavings.toLocaleString('id-ID')}
                      </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={savingsData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={70}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {savingsData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
                                  <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                          {savingsData.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                                  <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                                      <span className="text-sm text-gray-600">{item.name}</span>
                                  </div>
                                  <span className="font-bold text-slate-800">Rp {item.value.toLocaleString('id-ID')}</span>
                              </div>
                          ))}
                          <div className="mt-4 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-400 italic">
                                  *Simpanan Pokok & Wajib menjadi basis perhitungan Jasa Modal.
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* 2. TRANSACTION PORTFOLIO */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-blue-600" /> Portofolio Transaksi
                      </h3>
                      <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                        Total Vol: Rp {currentTotalTransactions.toLocaleString('id-ID')}
                      </span>
                  </div>

                  <div className="space-y-6">
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={transactionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                                  <Tooltip 
                                      cursor={{fill: 'transparent'}}
                                      formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`}
                                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                  />
                                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                      {transactionData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {transactionData.map((item, idx) => (
                              <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-white shadow-sm text-gray-500">
                                          {idx === 0 && <Zap size={18} className="text-amber-500" />}
                                          {idx === 1 && <ShoppingBag size={18} className="text-violet-500" />}
                                          {idx === 2 && <CreditCard size={18} className="text-pink-500" />}
                                          {idx === 3 && <Landmark size={18} className="text-indigo-500" />}
                                      </div>
                                      <div>
                                          <p className="text-xs text-gray-500 font-medium uppercase">{item.name}</p>
                                          <p className="font-bold text-slate-800">Rp {item.value.toLocaleString('id-ID')}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs text-gray-400">Frekuensi</p>
                                      <p className="font-bold text-slate-600">{item.count}x</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* 3. TREND CHART */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" /> Tren Akumulasi SHU
                  </h3>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={HISTORY_DATA}>
                              <defs>
                                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <Tooltip 
                                  formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`}
                                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                              />
                              <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

          </div>

          {/* RIGHT COLUMN: SUMMARY & ACTIONS */}
          <div className="space-y-6">
              
              {/* SHU Composition Summary */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Komposisi SHU</h3>
                  <div className="h-48 w-full mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={currentShuComposition}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={60}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {currentShuComposition.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                              Jasa Modal (25%)
                          </span>
                          <span className="font-bold">Rp {currentShuModal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                              Jasa Transaksi (75%)
                          </span>
                          <span className="font-bold">Rp {currentShuTransaksi.toLocaleString('id-ID')}</span>
                      </div>
                  </div>
              </div>

              {/* Koperasi Performance Info */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                      <Landmark className="w-5 h-5 mr-2 text-emerald-400" /> Kinerja Koperasi
                  </h3>
                  <div className="space-y-4 text-sm">
                      <div className="flex justify-between border-b border-white/10 pb-2">
                          <span className="text-slate-400">Total Profit KMP-ADNG</span>
                          <span className="font-mono font-bold text-emerald-400">Rp 2.5 Milyar</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                          <span className="text-slate-400">Alokasi SHU Anggota</span>
                          <span className="font-mono font-bold">40%</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                          <span className="text-slate-400">Cadangan Modal</span>
                          <span className="font-mono font-bold">30%</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-slate-400">Dana Sosial & Pendidikan</span>
                          <span className="font-mono font-bold">30%</span>
                      </div>
                  </div>
              </div>

              {/* Action: Increase Participation */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-2 flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2" /> Tingkatkan SHU!
                  </h3>
                  <p className="text-purple-100 text-sm mb-6">
                      Setiap transaksi belanja dan pembayaran tagihan menambah poin partisipasi Anda.
                  </p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => onNavigate(AppRoute.MARKETPLACE)}
                        className="w-full bg-white text-purple-700 py-3 rounded-xl font-bold hover:bg-purple-50 transition flex justify-between items-center px-4"
                      >
                          <span>Belanja Sekarang</span>
                          <ArrowRight size={16} />
                      </button>
                      <button 
                        onClick={() => onNavigate(AppRoute.PPOB)}
                        className="w-full bg-purple-800/50 text-white py-3 rounded-xl font-bold hover:bg-purple-800 transition flex justify-between items-center px-4"
                      >
                          <span>Bayar Tagihan</span>
                          <ArrowRight size={16} />
                      </button>
                  </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3 text-sm text-blue-800">
                  <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                      SHU final ditetapkan pada Rapat Anggota Tahunan (RAT). Angka ini adalah estimasi berjalan.
                  </p>
              </div>

          </div>
      </div>
    </div>
  );
};
