
import React, { useState } from 'react';
import { User, AppRoute } from '../types';
import { Gift, Copy, Users, Wallet, ChevronLeft, CheckCircle, Smartphone } from 'lucide-react';

interface ReferralDashboardProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
}

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ user, onNavigate }) => {
  const [copied, setCopied] = useState(false);

  // Fallback data if user has no stats yet
  const totalEarnings = user.referralStats?.totalEarnings || 0;
  const totalInvited = user.referralStats?.totalInvited || 0;
  const history = user.referralStats?.history || [];

  const referralLink = `${window.location.origin}/?ref=${user.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWA = () => {
      const text = `Halo! Ayo gabung Koperasi Digital KMP-ADNG pakai kode referral saya: *${user.referralCode}*. Klik link ini untuk daftar: ${referralLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
       
       <button 
        onClick={() => onNavigate(AppRoute.DASHBOARD)}
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-2 transition"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Dashboard
      </button>

       {/* Hero Banner */}
       <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
             <div className="flex items-center space-x-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full">
                <Gift className="w-4 h-4 text-white" />
                <span className="font-bold text-xs uppercase tracking-wider">Member Get Member</span>
             </div>
             <h1 className="text-3xl font-bold mb-2">Ajak Teman, Dapat Cuan!</h1>
             <p className="text-yellow-100 max-w-lg mb-6">
                Bagikan kode unikmu. Dapatkan komisi <strong>Rp 30.000</strong> langsung ke saldo KMP-ADNG PAY setiap kali temanmu berhasil mendaftar dan menjadi anggota.
             </p>
             
             <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex-1">
                   <p className="text-xs text-yellow-100 mb-1">Total Pendapatan Referral</p>
                   <p className="text-2xl font-bold">Rp {totalEarnings.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex-1">
                   <p className="text-xs text-yellow-100 mb-1">Teman Diajak</p>
                   <p className="text-2xl font-bold">{totalInvited} Orang</p>
                </div>
             </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20">
             <Wallet size={200} />
          </div>
       </div>

       {/* Share Section */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Kode Referral Anda</h3>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
             <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-between">
                <div>
                   <p className="text-xs text-gray-500 mb-1">Kode Unik</p>
                   <p className="text-xl font-mono font-bold text-slate-800 tracking-wider">{user.referralCode}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                  title="Copy Link"
                >
                   {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
             </div>
             
             <button 
               onClick={handleShareWA}
               className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 flex items-center justify-center font-bold transition shadow-lg shadow-green-500/30"
             >
                <Smartphone className="w-5 h-5 mr-2" /> Share ke WhatsApp
             </button>
          </div>

          <div className="text-center text-sm text-gray-500">
             <p>Link: <span className="text-emerald-600 underline">{referralLink}</span></p>
          </div>
       </div>

       {/* History List */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <h3 className="font-bold text-lg text-slate-800">Riwayat Pendapatan</h3>
          </div>
          
          {history.length === 0 ? (
             <div className="p-12 text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Belum ada teman yang bergabung menggunakan kode Anda.</p>
                <p className="text-xs mt-2">Ayo bagikan kodemu sekarang!</p>
             </div>
          ) : (
             <div className="divide-y divide-gray-100">
                {history.map((item, idx) => (
                   <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center">
                         <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-3 font-bold">
                            {item.name.charAt(0)}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-xs text-gray-500">Bergabung: {item.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-emerald-600">+ Rp {item.amount.toLocaleString('id-ID')}</p>
                         <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">SUKSES</span>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};
