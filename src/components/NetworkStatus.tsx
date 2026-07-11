
import React, { useState, useEffect } from 'react';
import { WifiOff, Server, RefreshCw } from 'lucide-react';
import { systemService } from '../services/system.service';

export const NetworkStatus: React.FC = () => {
  const [isSystemOnline, setIsSystemOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
        const healthy = await systemService.checkHealth();
        setIsSystemOnline(healthy);
    } catch (error) {
        setIsSystemOnline(false);
    } finally {
        setIsChecking(false);
    }
  };

  useEffect(() => {
    // Cek awal
    checkStatus();

    // Cek berkala setiap 30 detik
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center space-x-2">
      {/* Indikator Status System */}
      <div 
        className={`flex items-center px-3 py-1.5 rounded-full shadow-lg border transition-all duration-300 backdrop-blur-md ${
          isSystemOnline === null ? 'bg-gray-100/80 border-gray-200 text-gray-600' :
          isSystemOnline ? 'bg-emerald-100/90 border-emerald-200 text-emerald-700' : 
          'bg-red-100/90 border-red-200 text-red-700 animate-pulse'
        }`}
      >
        {isChecking ? (
            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
        ) : isSystemOnline ? (
            <Server className="w-3 h-3 mr-2" />
        ) : (
            <WifiOff className="w-3 h-3 mr-2" />
        )}
        
        <span className="text-xs font-bold uppercase tracking-wider">
            {isChecking && isSystemOnline === null ? "Connecting..." : 
             isSystemOnline ? "System Online" : "System Offline"}
        </span>
      </div>
    </div>
  );
};
