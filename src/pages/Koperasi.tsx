
import React, { useEffect, useState } from 'react';
import { User, AppRoute, CoopStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { coopService } from '../services/coop.service';
import { 
  Users, 
  TrendingUp, 
  Handshake, 
  Sprout, 
  ArrowRight, 
  Hammer, 
  Truck, 
  ShoppingBag, 
  ShieldCheck,
  Briefcase,
  Landmark,
  Scale,
  Info
} from 'lucide-react';

interface KoperasiProps {
    user: User; 
    onNavigate?: (route: AppRoute) => void;
}

// --- MOCK DATA: GENERAL LEDGER (BUKU BESAR) EQUITY ---
// In the future, this will be fetched from the Accounting Service
const TOTAL_COOP_EQUITY_MOCK: CoopStats = {
    totalSimpananPokok: 15000000000, // 15 Milyar
    totalSimpananWajib: 25000000000, // 25 Milyar
    totalSimpananSukarela: 10000000000, // 10 Milyar
    cadanganModal: 5000000000, // 5 Milyar
    hibah: 2000000000, // 2 Milyar
    shuDitahan: 3000000000, // 3 Milyar
    lastUpdated: new Date().toISOString()
};

// --- MEMBER EQUITY BREAKDOWN ---
// Fallback if savingsDetail is not yet populated from backend
const getMemberEquityFallback = (totalSavings: number) => {
    return {
        pokok: totalSavings * 0.2,
        wajib: totalSavings * 0.5,
        sukarela: totalSavings * 0.3,
        total: totalSavings
    };
};

export const Koperasi: React.FC<KoperasiProps> = ({ user, onNavigate }) => {
  
  const [coopStats, setCoopStats] = useState<CoopStats>(TOTAL_COOP_EQUITY_MOCK);

  useEffect(() => {
      const fetchStats = async () => {
          const stats = await coopService.getCoopStats();
          if (stats) {
              // Ensure numbers are parsed correctly if they come as strings
              setCoopStats({
                  totalSimpananPokok: Number(stats.totalSimpananPokok),
                  totalSimpananWajib: Number(stats.totalSimpananWajib),
                  totalSimpananSukarela: Number(stats.totalSimpananSukarela),
                  cadanganModal: Number(stats.cadanganModal),
                  hibah: Number(stats.hibah),
                  shuDitahan: Number(stats.shuDitahan),
                  lastUpdated: stats.lastUpdated
              });
          }
      };
      fetchStats();
  }, []);

  const TOTAL_EQUITY_VALUE = 
    coopStats.totalSimpananPokok + 
    coopStats.totalSimpananWajib + 
    coopStats.cadanganModal + 
    coopStats.hibah + 
    coopStats.shuDitahan;

  const hasActiveProject = true; 
  const memberEquity = user.savingsDetail || getMemberEquityFallback(user.savings || 0);
  
  // Equity only includes Pokok and Wajib
  const totalMemberEquity = memberEquity.pokok + memberEquity.wajib;
  const memberVoluntarySavings = memberEquity.sukarela;

  // Data for Member's Portfolio Pie Chart (Equity Only)
  const memberPortfolioData = [
      { name: 'Simpanan Pokok', value: memberEquity.pokok, color: '#059669' }, // Emerald-600
      { name: 'Simpanan Wajib', value: memberEquity.wajib, color: '#10b981' }, // Emerald-500
  ];

  // Data for Comparison Chart (Member vs Total)
  const ownershipPercentage = TOTAL_EQUITY_VALUE > 0 ? (totalMemberEquity / TOTAL_EQUITY_VALUE) * 100 : 0;

  // Data for Total Equity Composition (Cooperative Level) - Exclude Sukarela
  const coopEquityData = [
      { name: 'Simpanan Pokok', value: coopStats.totalSimpananPokok, color: '#059669' },
      { name: 'Simpanan Wajib', value: coopStats.totalSimpananWajib, color: '#10b981' },
      { name: 'Cadangan Modal', value: coopStats.cadanganModal, color: '#f59e0b' }, // Amber
      { name: 'SHU Ditahan', value: coopStats.shuDitahan, color: '#8b5cf6' }, // Violet
      { name: 'Hibah', value: coopStats.hibah, color: '#ec4899' }, // Pink
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      
      {/* HEADER HERO */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Koperasi Multi-Usaha</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ekosistem Ekonomi Berdaulat</h2>
            <p className="text-slate-300 max-w-xl leading-relaxed">
              KMP-ADNG fokus 100% pada sektor riil. Kami meniadakan fungsi "Simpan Pinjam Bunga" (Bank) 
              untuk menghindari risiko dan memastikan uang Anda berputar menjadi aset produktif, bukan sekadar angka.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => onNavigate && onNavigate(AppRoute.GROUP_FINANCING)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/50 hover:bg-emerald-700 transition flex items-center justify-center"
            >
              <Users className="w-5 h-5 mr-2" />
              Ajukan Usaha Produksi
            </button>
            <button 
                onClick={() => onNavigate && onNavigate(AppRoute.MARKETPLACE)}
                className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Belanja di Koperasi
            </button>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MEMBER EQUITY PORTFOLIO */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Member's Equity Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-800">Portofolio Ekuitas Anda</h3>
                    <ShieldCheck className="text-emerald-600 w-6 h-6" />
                </div>
                <p className="text-xs text-gray-500 mb-6 text-justify leading-relaxed">
                    Kepemilikan murni Anda di KMP-ADNG. Dana ini digunakan untuk modal kerja produktif.
                </p>

                <div className="h-48 relative mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={memberPortfolioData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {memberPortfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-xs text-gray-400">Total Ekuitas</span>
                        <span className="font-bold text-lg text-slate-800">Rp {(totalMemberEquity / 1000000).toFixed(1)} Jt</span>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {memberPortfolioData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 text-sm">Rp {item.value.toLocaleString('id-ID')}</span>
                    </div>
                    ))}
                </div>
            </div>

            {/* VOLUNTARY SAVINGS CARD (Non-Equity) */}
            <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-emerald-900">Tabungan Sukarela</h3>
                    <Briefcase className="text-emerald-600 w-6 h-6" />
                </div>
                <p className="text-xs text-emerald-700 mb-4 text-justify">
                    Dana likuid yang dapat ditarik kapan saja. Tidak termasuk dalam perhitungan Ekuitas (Modal Sendiri), namun tetap produktif.
                </p>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs text-emerald-600 uppercase font-bold">Saldo Tersedia</p>
                        <p className="text-2xl font-bold text-emerald-900">Rp {(memberVoluntarySavings || 0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                <h4 className="font-bold text-amber-800 mb-2 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" /> Mengapa Tanpa Deposito?
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed mb-3">
                    KMP-ADNG menghapus simpanan sukarela/berjangka untuk <strong>menghilangkan beban bunga</strong>. 
                    Kami mendorong anggota menjadi <em>Produktif</em> (menghasilkan barang) daripada pasif (menunggu bunga). 
                    Uang Anda aman karena langsung berwujud aset riil.
                </p>
            </div>
        </div>

        {/* RIGHT COLUMN: COOPERATIVE EQUITY & SERVICES */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* COOPERATIVE EQUITY OVERVIEW (NEW SECTION) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 flex items-center">
                        <Landmark className="w-6 h-6 mr-2 text-blue-600" /> Ekuitas Koperasi (Buku Besar)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Posisi Modal Sendiri KMP-ADNG secara keseluruhan (Real-time Data).
                    </p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Total Ekuitas Koperasi</p>
                      <p className="text-2xl font-bold text-slate-800">Rp {(TOTAL_EQUITY_VALUE / 1000000000).toFixed(2)} Milyar</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Chart */}
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={coopEquityData} 
                            layout="vertical" 
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                              <Tooltip 
                                  cursor={{fill: 'transparent'}}
                                  formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`}
                                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                              />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {coopEquityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>

                  {/* Comparison / Ratio */}
                  <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-center">
                      <h4 className="font-bold text-slate-700 mb-4 flex items-center">
                          <Scale className="w-5 h-5 mr-2 text-emerald-600" /> Rasio Kepemilikan Anda
                      </h4>
                      
                      <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Ekuitas Anda</span>
                              <span className="font-bold text-slate-800">Rp {totalMemberEquity.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Total Ekuitas Koperasi</span>
                              <span className="font-bold text-slate-800">Rp {TOTAL_EQUITY_VALUE.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4 mt-3 overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-4 rounded-full transition-all duration-1000" 
                                style={{ width: `${Math.max(ownershipPercentage, 1)}%` }} // Min 1% for visibility in demo
                              ></div>
                          </div>
                          <p className="text-xs text-emerald-600 mt-2 font-bold text-right">
                              {ownershipPercentage.toFixed(7)}% Kepemilikan Saham
                          </p>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-800 leading-relaxed">
                              <Info className="w-3 h-3 inline mr-1" />
                              Angka ini menunjukkan porsi kepemilikan Anda terhadap seluruh aset bersih koperasi. Semakin besar rasio ini, semakin besar hak suara dan pembagian SHU Anda.
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* 4 PILAR LAYANAN */}
          <div>
              <h3 className="font-bold text-xl text-slate-800 mb-4">4 Pilar Layanan Koperasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                          <Hammer className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">1. Koperasi Produksi (Hulu)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                          Wadah Kelompok Kerja (Pokja) untuk standardisasi produksi. Modal dari ekuitas diputar untuk alat & bahan baku.
                      </p>
                      <button onClick={() => onNavigate && onNavigate(AppRoute.GROUP_FINANCING)} className="text-xs font-bold text-orange-600 flex items-center hover:underline">
                          Buat Pokja Produksi <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                          <Handshake className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">2. Pemasaran & Lelang (Hilir)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                          <strong>Suplier Konsolidator</strong>. Barang anggota dititipkan untuk dijual B2B ke pengusaha menengah via Lelang Nasional.
                      </p>
                      <span className="text-xs font-bold text-blue-600 flex items-center cursor-default">
                          Sistem Terintegrasi
                      </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                          <Truck className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">3. Koperasi Jasa (Pendukung)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                          Layanan Logistik, Angkutan, hingga pengurusan Sertifikasi (Halal/Indikasi Geografis) bagi produk adat.
                      </p>
                      <button onClick={() => onNavigate && onNavigate(AppRoute.RIDE)} className="text-xs font-bold text-purple-600 flex items-center hover:underline">
                          Layanan Logistik <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                          <ShoppingBag className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">4. Koperasi Konsumsi (Internal)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                          Menjamin ketersediaan kebutuhan pokok anggota dengan harga grosir. Perputaran uang tetap di ekosistem.
                      </p>
                      <button onClick={() => onNavigate && onNavigate(AppRoute.MARKETPLACE)} className="text-xs font-bold text-emerald-600 flex items-center hover:underline">
                          Belanja Hemat <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                  </div>

              </div>
          </div>

          {hasActiveProject && (
              <div>
                  <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center">
                      <Sprout className="w-6 h-6 mr-2 text-emerald-600" /> Portofolio Produksi Saya
                  </h3>
                  <div 
                    onClick={() => onNavigate && onNavigate(AppRoute.GROUP_PROJECT_DASHBOARD)}
                    className="bg-white border-l-4 border-emerald-500 rounded-2xl p-6 shadow-md cursor-pointer hover:shadow-lg transition group"
                  >
                      <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                  <TrendingUp className="w-8 h-8" />
                              </div>
                              <div>
                                  <div className="flex items-center space-x-2">
                                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition">Kopi Tani Maju Bersama</h3>
                                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">POKJA PRODUKSI</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">Ketua: Ulpermadi Ibrahim • Periode: Okt 24 - Mar 25</p>
                                  
                                  <div className="mt-4 flex items-center space-x-6 text-sm">
                                      <div>
                                          <p className="text-gray-400 text-xs">Modal Kerja (Dari Ekuitas)</p>
                                          <p className="font-bold text-slate-800">Rp 25.000.000</p>
                                      </div>
                                      <div>
                                          <p className="text-gray-400 text-xs">Progress Tanam</p>
                                          <p className="font-bold text-slate-800">35%</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
                          </div>
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
