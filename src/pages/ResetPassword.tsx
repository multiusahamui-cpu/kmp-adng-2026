
import React, { useState } from 'react';
import { Key, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { APP_LOGO } from '../constants';
import { useToast } from '../components/Toast';
import { authService } from '../services/auth.service';
import { NetworkStatus } from '../components/NetworkStatus';

interface ResetPasswordProps {
  uid: string;
  token: string;
  onDone: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ uid, token, onDone }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return showToast("Password minimal 6 karakter", "error");
    if (newPassword !== confirmPassword) return showToast("Password tidak sama!", "error");

    setIsLoading(true);
    try {
      await authService.resetPassword(uid, token, newPassword);
      setSuccess(true);
      showToast("Password berhasil diubah!", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "Gagal reset password. Link mungkin sudah kedaluwarsa.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center space-y-4">
          <XCircle className="w-14 h-14 text-red-500 mx-auto" />
          <p className="font-bold text-slate-700 dark:text-slate-200">Link Reset Tidak Valid</p>
          <button onClick={onDone} className="text-emerald-600 font-bold hover:underline text-sm">Kembali ke Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors relative">
      <NetworkStatus />
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 z-10">
        <div className="p-8 text-center bg-slate-900">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center p-2">
            <img src={APP_LOGO} alt="KMP-ADNG" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="text-xl font-bold text-white">Atur Password Baru</h1>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4 animate-fade-in">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <p className="text-slate-700 dark:text-slate-200 font-bold">Password berhasil diubah</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sesi lama di semua perangkat sudah otomatis keluar. Silahkan login dengan password baru.</p>
              <button onClick={onDone} className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg">
                Ke Halaman Login
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Password Baru</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Ulangi Password Baru</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg flex items-center justify-center disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Simpan Password Baru"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
