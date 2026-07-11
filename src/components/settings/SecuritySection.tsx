import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, AlertTriangle, ChevronRight, Eye, EyeOff, Save } from 'lucide-react';
import { useToast } from '../Toast';
import { PinModal } from '../PinModal';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface SecuritySectionProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({ user, onUpdateUser }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // PIN MODAL STATE
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState(''); 
  
  // PASSWORD STATE
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

  const handleOpenPinSetup = () => {
      setPinError('');
      setShowPinModal(true);
  };

  const handlePinSuccess = async (newPin?: string, oldPin?: string) => {
      if (newPin) {
          try {
              setPinError('');
              await userService.setPin(newPin, oldPin); 
              onUpdateUser({ transactionPin: 'SET', pinResetStatus: undefined }); 
              setShowPinModal(false);
              showToast("PIN Transaksi Berhasil Disimpan!", "success");
          } catch (error: any) {
              const errMsg = error.response?.data?.message || "Gagal menyimpan PIN.";
              setPinError(errMsg);
          }
      }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.new) return showToast("Masukkan password baru.", "error");
    if (passData.new !== passData.confirm) return showToast("Konfirmasi password tidak cocok!", "error");
    if (!passData.current) return showToast("Masukkan password lama untuk verifikasi.", "error");

    setIsLoading(true);
    try {
        await userService.changePassword(passData.current, passData.new);
        showToast("Password berhasil diubah!", "success");
        setPassData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
        showToast(error.response?.data?.message || "Gagal ubah password", "error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-lg">
       
       {/* PIN CONFIGURATION */}
       <div>
           <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center">
               <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" /> PIN Transaksi
           </h3>
           
           {user.transactionPin ? (
               <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center mb-4">
                   <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                   <div>
                       <p className="font-bold text-green-800">PIN Aktif</p>
                       <p className="text-sm text-green-700">Akun Anda terlindungi.</p>
                   </div>
               </div>
           ) : (
               <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center mb-4">
                   <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                   <div>
                       <p className="font-bold text-red-800">PIN Belum Diatur</p>
                       <p className="text-sm text-red-700">Buat PIN untuk keamanan transaksi.</p>
                   </div>
               </div>
           )}

           <button 
            onClick={handleOpenPinSetup}
            className="w-full bg-slate-800 dark:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-emerald-700 flex items-center justify-between"
           >
               <span>{user.transactionPin ? 'Ganti PIN Transaksi' : 'Buat PIN Baru'}</span>
               <ChevronRight className="w-5 h-5" />
           </button>
       </div>

       {/* PASSWORD CHANGE */}
       <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">Ubah Kata Sandi</h3>
           <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Lama</label>
                 <div className="relative">
                    <input 
                        type={showCurrentPass ? "text" : "password"} required
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={passData.current}
                        onChange={e => setPassData({...passData, current: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
                 <div className="relative">
                    <input 
                        type={showNewPass ? "text" : "password"} required
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={passData.new}
                        onChange={e => setPassData({...passData, new: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konfirmasi Password Baru</label>
                 <div className="relative">
                    <input 
                        type={showConfirmPass ? "text" : "password"} required
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={passData.confirm}
                        onChange={e => setPassData({...passData, confirm: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
              </div>
              <button type="submit" disabled={isLoading} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-300 flex items-center disabled:opacity-50">
                 <Save className="w-4 h-4 mr-2" /> {isLoading ? 'Menyimpan...' : 'Simpan Password'}
              </button>
           </form>
       </div>

       {showPinModal && (
           <PinModal 
               isOpen={showPinModal} 
               onClose={() => setShowPinModal(false)}
               onSuccess={handlePinSuccess}
               isSettingUp={true}
               requireOldPin={!!user.transactionPin}
               externalError={pinError}
               title={user.transactionPin ? 'Ganti PIN Transaksi' : 'Buat PIN Baru'}
           />
       )}
    </div>
  );
};
