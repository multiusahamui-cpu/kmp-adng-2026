import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface NotificationSectionProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({ user, onUpdateUser }) => {
  const [notifState, setNotifState] = useState(user.preferences?.notifications || {
    all: true,
    transaction: true,
    promo: true,
    chat: true
  });

  const toggleNotif = async (key: keyof typeof notifState) => {
    const newState = { ...notifState, [key]: !notifState[key] };
    setNotifState(newState);
    try {
        await userService.updatePreferences({ notifications: newState });
        onUpdateUser({ preferences: { ...user.preferences, notifications: newState } });
    } catch (error) { console.error(error); }
  };

  return (
      <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Pengaturan Notifikasi</h3>
          <div className="space-y-4">
              {Object.keys(notifState).map((key) => (
                  <div key={key} className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-slate-700 last:border-0">
                      <span className="capitalize text-slate-700 dark:text-gray-300 font-medium">
                          {key === 'all' ? 'Semua Notifikasi' : key === 'promo' ? 'Info Promo & Diskon' : key}
                      </span>
                      <button onClick={() => toggleNotif(key as any)} className={`transition-colors ${notifState[key as keyof typeof notifState] ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {notifState[key as keyof typeof notifState] ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                  </div>
              ))}
          </div>
      </div>
  );
};
