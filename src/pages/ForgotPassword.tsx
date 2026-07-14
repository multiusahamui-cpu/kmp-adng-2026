
import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { APP_LOGO } from '../constants';
import { useToast } from '../components/Toast';
import { authService } from '../services/auth.service';
import { NetworkStatus } from '../components/NetworkStatus';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword(identifier);
      setSent(true);
    } catch (error: any) {
      showToast(error.response?.data?.message || "Gagal mengirim permintaan", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors relative">
      <NetworkStatus />
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 z-10">
        <div className="p-8 text-center bg-slate-900 relative">
          <button onClick={onBackToLogin} className="absolute left-4 top-4 text-white/50 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center p-2">
            <img src={APP_LOGO} alt="KMP-ADNG" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white">Lupa Password</h1>
          <p className="text-slate-400 text-xs mt-1">Kami akan kirim link reset ke email terdaftar Anda</p>
        </div>

        <div className="p-8">
          {sent ? (
            <div className="text-center space-y-4 animate-fade-in">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <p className="text-slate-700 dark:text-slate-200 font-bold">Silahkan cek email Anda</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kalau akun dengan identitas <strong>{identifier}</strong> terdaftar dan punya email, link reset password sudah dikirim. Link berlaku 30 menit.
              </p>
              <button onClick={onBackToLogin} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-sm">
                Kembali ke Login
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Nomor WhatsApp / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    placeholder="0812xxxxxxx atau email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg flex items-center justify-center disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Kirim Link Reset"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
