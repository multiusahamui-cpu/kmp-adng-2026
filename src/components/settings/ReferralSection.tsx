import React, { useState } from 'react';
import { useToast } from '../Toast';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface ReferralSectionProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ user, onUpdateUser }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReferral = async () => {
      setIsLoading(true);
      try {
          const res = await userService.generateReferral();
          onUpdateUser({ 
              referralCode: res.referralCode,
              referralStats: { totalInvited: 0, totalEarnings: 0, history: [] }
          });
          showToast(`Kode Referral Dibuat: ${res.referralCode}`, "success");
      } catch (error: any) {
          showToast("Gagal membuat referral code", "error");
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">Program Referral</h3>
          
          {user.referralCode ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 text-center">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">Kode Referral Anda</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-widest mb-4">{user.referralCode}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bagikan kode ini untuk mendapatkan bonus!</p>
              </div>
          ) : (
              <div className="text-center py-8">
                  <p className="mb-4 text-gray-600 dark:text-gray-300">Anda belum memiliki kode referral.</p>
                  <button 
                      onClick={handleGenerateReferral}
                      disabled={isLoading}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 shadow-lg"
                  >
                      {isLoading ? 'Memproses...' : 'Buat Kode Referral Sekarang'}
                  </button>
              </div>
          )}
      </div>
  );
};
