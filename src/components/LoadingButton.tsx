
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  isLoading, 
  children, 
  icon, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  
  const baseStyles = "py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center shadow-lg active:scale-[0.98]";
  
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30 disabled:bg-emerald-400",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-800/30 disabled:bg-slate-600",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-red-600/30 disabled:bg-red-400",
    outline: "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm disabled:bg-slate-50"
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${(isLoading || disabled) ? 'cursor-not-allowed opacity-80 shadow-none' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {children}
          {icon && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
};
