
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType; id: number } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000); // Auto dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000] animate-slide-up w-full max-w-sm px-4">
           <div className={`
              flex items-center p-4 rounded-2xl shadow-2xl border backdrop-blur-sm
              ${toast.type === 'success' ? 'bg-white/95 border-emerald-100 text-slate-800' : 
                toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-900' : 
                'bg-slate-800 text-white border-slate-700'}
           `}>
              <div className={`p-2 rounded-full mr-3 shrink-0
                  ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                    toast.type === 'error' ? 'bg-red-100 text-red-600' : 
                    'bg-slate-700 text-blue-400'}
              `}>
                  {toast.type === 'success' && <CheckCircle size={20} />}
                  {toast.type === 'error' && <AlertCircle size={20} />}
                  {toast.type === 'info' && <Info size={20} />}
              </div>
              <div className="flex-1 text-sm font-medium pr-2">
                  {toast.message}
              </div>
              <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition">
                  <X size={18} />
              </button>
           </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
