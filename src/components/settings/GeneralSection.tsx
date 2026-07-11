import React from 'react';
import { Moon, Sun, ToggleLeft, ToggleRight } from 'lucide-react';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface GeneralSectionProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
  isDarkMode: boolean;
  onToggleTheme?: () => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ user, onUpdateUser, isDarkMode, onToggleTheme }) => {
  const handleThemeToggle = async () => {
      const newTheme = isDarkMode ? 'light' : 'dark';
      if(onToggleTheme) onToggleTheme(); 
      try {
          await userService.updatePreferences({ theme: newTheme });
          onUpdateUser({ preferences: { ...user.preferences, theme: newTheme } });
      } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Tampilan Aplikasi</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600">
             <div className="flex items-center">
                {isDarkMode ? <Moon className="w-6 h-6 text-indigo-400 mr-4" /> : <Sun className="w-6 h-6 text-orange-500 mr-4" />}
                <div>
                   <p className="font-bold text-slate-800 dark:text-white">Mode Gelap</p>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Simpan preferensi tampilan di database.</p>
                </div>
             </div>
             <button onClick={handleThemeToggle} className="text-emerald-600 dark:text-emerald-400 transition-transform duration-200 hover:scale-110">
                {isDarkMode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
             </button>
          </div>
       </div>
    </div>
  );
};
