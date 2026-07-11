import React, { useState } from 'react';
import { useToast } from '../Toast';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface ProfileSectionProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onUpdateUser }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    heir: user.heir || '' 
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const updated = await userService.updateProfile(profileData);
        onUpdateUser({ ...updated, balance: user.balance, savings: user.savings });
        showToast("Data profil berhasil disimpan!", "success");
    } catch (error: any) {
        showToast(error.response?.data?.message || "Gagal update profil", "error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
      <div className="animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Edit Data Pribadi</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Lengkap</label><input type="text" className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">No. Handphone</label><input type="text" className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label><input type="email" className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} /></div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Alamat Lengkap</label>
                  <textarea rows={2} className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} placeholder="Jl..." />
              </div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Ahli Waris</label><input type="text" className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={profileData.heir} onChange={e => setProfileData({...profileData, heir: e.target.value})} placeholder="Nama Ahli Waris" /></div>

              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 mt-4 shadow-lg disabled:opacity-70">
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
          </form>
      </div>
  );
};
