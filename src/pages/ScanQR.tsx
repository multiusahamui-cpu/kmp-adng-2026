
import React, { useState, useEffect, useRef } from 'react';
import { AppRoute, User } from '../types';
import { X, Camera, Zap, Image, ChevronRight, Store } from 'lucide-react';
import { useToast } from '../components/Toast';
import { ReceiptModal } from '../components/ReceiptModal';
import { PinModal } from '../components/PinModal';

interface ScanQRProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
  onTransaction: (type: 'payment', amount: number, description: string) => void;
}

export const ScanQR: React.FC<ScanQRProps> = ({ user, onNavigate, onTransaction }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [merchantFound, setMerchantFound] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [showPin, setShowPin] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Try to access camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                setHasPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Camera error", err);
                setHasPermission(false);
            });
    }

    return () => {
        // Cleanup stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  const handleSimulateScan = () => {
      // Simulate finding "Warung Budi"
      setIsScanning(false);
      setMerchantFound({
          id: 'm-budi',
          name: 'Warung Budi Santoso',
          location: 'Pasar Baru, Blok A1',
          avatar: 'https://picsum.photos/id/1060/200/200'
      });
  };

  const handleInitiatePay = () => {
      const val = parseInt(amount);
      if (!val || val <= 0) {
          showToast("Masukkan nominal pembayaran", "error");
          return;
      }
      if (user.balance < val) {
          showToast("Saldo tidak mencukupi", "error");
          return;
      }

      if (!user.transactionPin) {
          showToast("PIN belum diatur. Harap atur PIN di Pengaturan.", "error");
          setTimeout(() => onNavigate(AppRoute.SETTINGS), 1500);
          return;
      }

      setShowPin(true);
  };

  const handlePinSuccess = () => {
      setShowPin(false);
      const val = parseInt(amount);
      
      setIsProcessing(true);
      setTimeout(() => {
          const desc = `Pembayaran ke ${merchantFound.name}`;
          onTransaction('payment', val, desc);
          
          setLastTransaction({
              id: `QR-${Date.now()}`,
              type: 'payment',
              amount: val,
              date: new Date().toLocaleDateString('id-ID'),
              status: 'success',
              description: desc,
              refId: `QRIS-${Date.now().toString().slice(-6)}`
          });
          setIsProcessing(false);
          showToast("Pembayaran Berhasil", "success");
      }, 1500);
  };

  const handleCloseReceipt = () => {
      setLastTransaction(null);
      setMerchantFound(null);
      setAmount('');
      setIsScanning(true); // Restart scan
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <button onClick={() => onNavigate(AppRoute.DASHBOARD)} className="text-white p-2 rounded-full bg-white/20 backdrop-blur-md">
                <X size={24} />
            </button>
            <h3 className="text-white font-bold text-lg tracking-wide">Scan QRIS KMP-ADNG</h3>
            <div className="flex space-x-4">
                <button className="text-white"><Zap size={24} /></button>
                <button className="text-white"><Image size={24} /></button>
            </div>
        </div>

        {/* Camera View / Scanner Area */}
        <div className="flex-1 relative flex items-center justify-center bg-gray-900">
            {hasPermission ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
            ) : (
                <div className="text-center text-gray-500 p-8">
                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Kamera tidak tersedia atau izin ditolak.</p>
                    <p className="text-xs mt-2">Gunakan tombol simulasi di bawah.</p>
                </div>
            )}

            {/* Scanning Frame Animation */}
            {isScanning && !merchantFound && (
                <div className="relative w-64 h-64 border-2 border-white/30 rounded-3xl z-10 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 border-[3px] border-emerald-500 rounded-3xl animate-pulse"></div>
                    <div className="w-full h-1 bg-emerald-500/50 absolute top-0 animate-scan"></div>
                    <p className="text-white/70 text-xs mt-32 font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        Arahkan ke Kode QR
                    </p>
                </div>
            )}

            {/* Merchant Payment Form (Overlay) */}
            {merchantFound && !lastTransaction && (
                <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 z-30 animate-slide-up">
                    <div className="flex items-center mb-6">
                        <img src={merchantFound.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-gray-100 mr-4" />
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{merchantFound.name}</h4>
                            <p className="text-sm text-gray-500 flex items-center"><Store className="w-3 h-3 mr-1" /> {merchantFound.location}</p>
                        </div>
                        <div className="ml-auto">
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">VERIFIED</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Nominal Pembayaran</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 font-bold text-lg text-slate-400">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-right mt-2 text-gray-500">Saldo Anda: Rp {user.balance.toLocaleString('id-ID')}</p>
                    </div>

                    <button 
                        onClick={handleInitiatePay}
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center disabled:bg-gray-400"
                    >
                        {isProcessing ? 'Memproses...' : (
                            <>Bayar Sekarang <ChevronRight className="ml-2 w-5 h-5" /></>
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Simulation Button (Dev Only) */}
        {isScanning && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
                <button 
                    onClick={handleSimulateScan}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-white/30 transition"
                >
                    🔍 Simulasi Scan QR (Demo)
                </button>
            </div>
        )}

        {/* PIN MODAL */}
        <PinModal 
            isOpen={showPin} 
            onClose={() => setShowPin(false)} 
            onSuccess={handlePinSuccess}
            onForgotPin={() => {
                setShowPin(false);
                if(onNavigate) onNavigate(AppRoute.SETTINGS);
                showToast("Silahkan request reset PIN di menu Pengaturan", "info");
            }}
        />

        {/* Receipt Modal */}
        {lastTransaction && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                 <ReceiptModal transaction={lastTransaction} onClose={handleCloseReceipt} />
            </div>
        )}

        <style>{`
            @keyframes scan {
                0% { top: 0; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .animate-scan {
                animation: scan 2s infinite linear;
            }
        `}</style>
    </div>
  );
};
