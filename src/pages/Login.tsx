
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AlertCircle, Smartphone, Key, ArrowRight, Loader2, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { APP_LOGO } from '../constants';
import { useToast } from '../components/Toast';
import { authService } from '../services/auth.service';
import { NetworkStatus } from '../components/NetworkStatus';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegisterClick: () => void;
  onSwitchToInternal: () => void;
  onForgotPasswordClick: () => void;
  error?: string | null;
  logoutReason?: 'idle' | 'offline' | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegisterClick, onSwitchToInternal, onForgotPasswordClick, error }) => {
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { showToast } = useToast();

  // Shortcut for Internal Login
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'K' || event.key === 'k')) {
        event.preventDefault();
        onSwitchToInternal(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToInternal]);

  // 1. HANDLE LOGIN (Username/Pass)
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    try {
        const result = await authService.login(identifier, password);
        
        // JIKA BUTUH OTP (User Pending & Phone Not Verified)
        if (result.status === 'otp_required') {
            setTempUserId(result.userId!);
            setStep('OTP');
            showToast("Kode OTP dikirim ke email Anda.", "info");
        } 
        // JIKA LOGIN SUKSES (User Active OR Verified Phone)
        else if (result.status === 'success' && result.user) {
            showToast(`Selamat datang kembali, ${result.user.name}`, "success");
            onLogin(result.user);
        }
    } catch (err: any) {
        setLocalError(err.message || "Gagal Login.");
    } finally {
        setIsLoading(false);
    }
  };

  // 2. HANDLE OTP VERIFICATION
  const handleOtpSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tempUserId) return;
      
      setLocalError(null);
      setIsLoading(true);

      try {
          const result = await authService.verifyLoginOtp(tempUserId, otpCode);
          if (result.status === 'success' && result.user) {
              showToast("Verifikasi Berhasil!", "success");
              onLogin(result.user);
          }
      } catch (err: any) {
          setLocalError(err.message || "OTP Salah.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors relative">
      
      {/* Indikator System Online di Pojok Kanan Atas */}
      <NetworkStatus />

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 z-10">
        
        {/* Header */}
        <div className="p-8 text-center bg-slate-900 relative">
          {step === 'OTP' && (
              <button 
                onClick={() => { setStep('CREDENTIALS'); setLocalError(null); }} 
                className="absolute left-4 top-4 text-white/50 hover:text-white"
              >
                  <ChevronLeft />
              </button>
          )}
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center p-2">
             <img src={APP_LOGO} alt="KMP-ADNG" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="text-xl font-bold text-emerald-500 tracking-wider">KMP-ADNG</h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Koperasi Multi Pihak - Aset Digital Nusantara Garuda</p>
        </div>
        
        <div className="p-8 space-y-6">
          {(localError || error) && (
            <div className="px-4 py-3 rounded-lg flex items-start text-sm bg-red-50 text-red-600 border border-red-200">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <span className="font-bold">{localError || error}</span>
            </div>
          )}

          {/* === FORM 1: CREDENTIALS === */}
          {step === 'CREDENTIALS' && (
              <form className="space-y-5" onSubmit={handleCredentialSubmit}>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Nomor WhatsApp / Email</label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="text"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                            placeholder="0812xxxxxxx"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Kata Sandi</label>
                      <button type="button" onClick={onForgotPasswordClick} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                        Lupa Password?
                      </button>
                    </div>
                    <div className="relative">
                        <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                  </div>

                  <button
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Masuk <ArrowRight className="ml-2 w-5 h-5" /></>}
                  </button>

                  <div className="text-center text-sm text-gray-500 mt-4">
                    Belum punya akun? <button type="button" onClick={onRegisterClick} className="text-emerald-600 font-bold hover:underline disabled:text-gray-400">Daftar Anggota</button>
                  </div>
              </form>
          )}

          {/* === FORM 2: OTP === */}
          {step === 'OTP' && (
              <form onSubmit={handleOtpSubmit} className="space-y-6 animate-slide-up">
                  <div className="text-center">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Verifikasi OTP</h2>
                      <p className="text-sm text-gray-500">Masukkan kode 6 digit yang dikirim ke email Anda.</p>
                  </div>

                  <input 
                      type="text"
                      maxLength={6}
                      className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 border-b-2 border-slate-300 focus:border-emerald-500 outline-none bg-transparent dark:text-white"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      disabled={isLoading}
                  />

                  <button 
                    type="submit" 
                    disabled={isLoading || otpCode.length < 6}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg flex items-center justify-center disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verifikasi"}
                  </button>
              </form>
          )}

        </div>
      </div>
    </div>
  );
};
