
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldAlert, Key, Briefcase, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { authService } from '../services/auth.service';

interface LoginInternalProps {
  onLogin: (user: User) => void;
  onBackToMember: () => void;
}

export const LoginInternal: React.FC<LoginInternalProps> = ({ onLogin, onBackToMember }) => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    try {
        const data = await authService.login(identifier, password);

        // FIX: Check if user exists (Handle OTP scenario or Missing Data)
        if (!data.user) {
            if (data.status === 'otp_required') {
                throw new Error("Akun ini memerlukan verifikasi OTP. Silahkan login melalui halaman utama.");
            }
            throw new Error("Gagal mengambil data pengguna.");
        }

        const userRole = data.user.roles || [];

        // STRICT ROLE CHECKING FOR INTERNAL LOGIN
        const allowedInternalRoles = ['super_admin', 'admin', 'management', 'cashier', 'accountant', 'general_manager', 'pengurus'];
        const hasAccess = userRole.some((r: string) => allowedInternalRoles.includes(r));
        
        if (!hasAccess) {
            throw new Error("Akun ini tidak memiliki hak akses Internal Portal.");
        }

        showToast(`Welcome Staff: ${data.user.name}`, "success");
        onLogin(data.user);
    } catch (err: any) {
        console.error(err);
        const msg = err.message || "Akses Ditolak. Periksa kredensial Staff Anda.";
        setLocalError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative">
      
      {/* Internal Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-900/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>

      <div className="max-w-md w-full rounded-3xl shadow-2xl overflow-hidden relative z-10 bg-slate-800 border border-slate-700">
        
        {/* Header Section */}
        <div className="p-8 text-center flex flex-col items-center bg-gradient-to-b from-red-950 to-slate-900">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 p-2 bg-red-500/10 ring-4 ring-red-500/20">
             <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-wider mb-1 text-red-500">INTERNAL ACCESS</h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-red-200">Authorized Personnel Only</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Login Staff</h2>
            <button 
                onClick={onBackToMember}
                className="text-xs font-bold px-3 py-1 rounded-full transition border text-slate-300 border-slate-600 hover:bg-slate-700"
            >
                Kembali ke Member
            </button>
          </div>

          {localError && (
            <div className="px-4 py-3 rounded-lg flex items-start text-sm bg-red-900/30 border border-red-800 text-red-400">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <span>{localError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center text-slate-300">
                  <Briefcase className="w-4 h-4 mr-2" /> Email Korporat
              </label>
              <div className="relative">
                  <input 
                    type="text"
                    className="w-full pl-4 pr-4 py-3 border rounded-xl outline-none transition font-medium bg-slate-900 border-slate-600 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
                    placeholder="staff@kmp-adng.id"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center text-slate-300">
                  <Key className="w-4 h-4 mr-2" /> Kata Sandi
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-4 pr-12 py-3 border rounded-xl outline-none transition font-medium bg-slate-900 border-slate-600 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center
                  bg-red-600 hover:bg-red-700 shadow-red-600/20
                  ${isLoading ? 'opacity-70 cursor-not-allowed shadow-none' : ''}
              `}
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>Akses Sistem <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <p className="text-[10px] text-slate-500 font-mono">
                  SECURE CONNECTION • IP LOGGED
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};
