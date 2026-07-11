
import React, { useState } from 'react';
import { AppRoute } from '../types';
import { UserPlus, ChevronRight, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';
import { authService } from '../services/auth.service';
import { NetworkStatus } from '../components/NetworkStatus';

interface RegisterProps {
  onNavigate: (route: AppRoute) => void;
  onRegister?: (name: string, phone: string) => void; 
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast("Password tidak sama!", "error");
      return;
    }

    // Phone Validation
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showToast("Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
        await authService.register(formData.name, formData.phone, formData.password, formData.referralCode);
        showToast("Registrasi Berhasil! Silahkan Login.", "success");
        onNavigate(AppRoute.LOGIN);
    } catch (error: any) {
        console.error("Register fail", error);
        const msg = error.response?.data?.message || "Gagal Mendaftar. Coba lagi.";
        showToast(msg, "error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors relative">
      
      {/* Indikator System Online */}
      <NetworkStatus />

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 z-10">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <button onClick={() => onNavigate(AppRoute.LOGIN)} className="absolute top-4 left-4 text-white/50 hover:text-white transition">
             <ArrowLeft size={24} />
          </button>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <UserPlus className="w-12 h-12 text-emerald-500 mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-bold text-white tracking-wide relative z-10">Buat Akun Baru</h1>
          <p className="text-slate-400 text-sm mt-2 relative z-10">Bergabunglah dengan Koperasi Multi Pihak - Aset Digital Nusantara Garuda</p>
        </div>
        
        <div className="p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400" placeholder="Contoh: Budi Santoso" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isLoading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor WhatsApp</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400" placeholder="08123456789" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isLoading} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="••••••••" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ulangi Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="••••••••" required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Referral (Opsional)</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 uppercase" placeholder="REF-XXXX-123456" value={formData.referralCode} onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})} disabled={isLoading} />
            </div>
            
            <button type="submit" disabled={isLoading} className={`w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition transform hover:-translate-y-0.5 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Daftar Sekarang <ChevronRight className="ml-2 w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Sudah punya akun? <button onClick={() => onNavigate(AppRoute.LOGIN)} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:text-gray-400">Masuk disini</button>
          </div>
        </div>
      </div>
    </div>
  );
};
