
import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Lock } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin?: string, oldPin?: string) => void; 
  onForgotPin?: () => void;
  title?: string;
  isSettingUp?: boolean; 
  requireOldPin?: boolean;
  externalError?: string; 
}

export const PinModal: React.FC<PinModalProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    onForgotPin, 
    title = "Masukkan PIN Transaksi",
    isSettingUp = false,
    requireOldPin = false,
    externalError = ''
}) => {
  const [pin, setPin] = useState('');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [oldPinTemp, setOldPinTemp] = useState(''); 
  const [step, setStep] = useState<'verify' | 'input_old' | 'setup_new' | 'setup_confirm'>('verify');
  const [error, setError] = useState('');

  // LOCK: Mencegah request ganda (Race Condition)
  const isProcessing = useRef(false);

  useEffect(() => {
      if (externalError) {
          setError(externalError);
          setPin('');
          isProcessing.current = false; // Unlock if server returns error
      }
  }, [externalError]);

  useEffect(() => {
      if (isOpen) {
          resetState();
          if (isSettingUp) {
              setStep(requireOldPin ? 'input_old' : 'setup_new');
          } else {
              setStep('verify');
          }
      }
  }, [isOpen, isSettingUp, requireOldPin]);

  const resetState = () => {
      setPin('');
      setNewPinTemp('');
      setOldPinTemp('');
      setError('');
      isProcessing.current = false;
  };

  const handleNumberClick = (num: number) => {
      if (pin.length < 6 && !isProcessing.current) {
          setPin(prev => prev + num);
          setError('');
      }
  };

  const handleDelete = () => {
      if (!isProcessing.current) {
          setPin(prev => prev.slice(0, -1));
          setError('');
      }
  };

  // Logic Engine
  useEffect(() => {
      if (pin.length === 6) {
          // LOCK IMMEDIATELY
          if (isProcessing.current) return;
          isProcessing.current = true;

          // 1. Transaction Verification (Pass-through to Server)
          if (step === 'verify') {
              // CHANGE: Do NOT compare with storedPin locally.
              // Always send to parent/server to verify.
              onSuccess(pin);
              // Note: We don't clear PIN here immediately to prevent UI flicker before parent closes modal
          }

          // 2. Change PIN Flow (Input Old PIN)
          else if (step === 'input_old') {
              // For changing PIN, we keep it in memory to send later
              setOldPinTemp(pin); 
              setTimeout(() => {
                  setPin('');
                  setStep('setup_new'); 
                  setError('');
                  isProcessing.current = false; // Unlock for next step
              }, 300);
          }

          // 3. Setup New PIN
          else if (step === 'setup_new') {
              setNewPinTemp(pin);
              setTimeout(() => {
                  setPin('');
                  setStep('setup_confirm');
                  setError('');
                  isProcessing.current = false; // Unlock for next step
              }, 300);
          }

          // 4. Confirm New PIN
          else if (step === 'setup_confirm') {
              if (pin === newPinTemp) {
                  onSuccess(pin, oldPinTemp); // Send New + Old to Server
              } else {
                  setError('PIN tidak cocok. Ulangi.');
                  setTimeout(() => {
                      setPin('');
                      setStep('setup_new'); 
                      isProcessing.current = false; // Unlock to retry
                  }, 1000);
              }
          }
      }
  }, [pin, step, newPinTemp, oldPinTemp, onSuccess]);

  if (!isOpen) return null;

  const getStepTitle = () => {
      switch (step) {
          case 'input_old': return "Masukkan PIN Lama";
          case 'setup_new': return "Buat PIN Baru";
          case 'setup_confirm': return "Konfirmasi PIN Baru";
          default: return title;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full md:w-[360px] md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 text-center relative border-b border-gray-100">
                <button onClick={onClose} className="absolute left-4 top-6 text-gray-400 hover:text-slate-800">
                    <X size={24} />
                </button>
                <h3 className="text-lg font-bold text-slate-800">{getStepTitle()}</h3>
                <p className="text-xs text-gray-500 mt-1">Demi keamanan transaksi Anda</p>
            </div>

            <div className="py-8 bg-slate-50 flex flex-col items-center justify-center">
                <div className="flex space-x-4 mb-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border transition-all duration-200 
                                ${pin.length > i ? 'bg-emerald-500 border-emerald-500 scale-110' : 'bg-white border-gray-300'}
                                ${error ? 'border-red-500 bg-red-50' : ''}`}
                        />
                    ))}
                </div>
                {error && <p className="text-xs text-red-500 font-bold animate-pulse px-4 text-center">{error}</p>}
                {!isSettingUp && onForgotPin && (
                    <button onClick={onForgotPin} className="text-xs text-emerald-600 font-bold mt-4 hover:underline">Lupa PIN?</button>
                )}
            </div>

            <div className="p-6 bg-white grid grid-cols-3 gap-4 pb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => handleNumberClick(num)} className="h-16 rounded-2xl text-2xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition flex items-center justify-center">
                        {num}
                    </button>
                ))}
                <div className="h-16"></div>
                <button onClick={() => handleNumberClick(0)} className="h-16 rounded-2xl text-2xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition flex items-center justify-center">0</button>
                <button onClick={handleDelete} className="h-16 rounded-2xl text-slate-700 hover:bg-slate-100 active:scale-95 transition flex items-center justify-center"><Delete size={28} /></button>
            </div>
            
            <div className="bg-gray-50 py-3 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 flex items-center justify-center"><Lock size={10} className="mr-1" /> Secured by KMP-ADNG Shield</p>
            </div>
        </div>
    </div>
  );
};
