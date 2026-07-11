
import React, { useState, useEffect } from 'react';
import { User, AppRoute, Transaction } from '../types';
import { 
    Smartphone, Zap, Droplet, ChevronLeft, CheckCircle, Wallet, Globe, Loader2
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { ReceiptModal } from '../components/ReceiptModal';
import { PinModal } from '../components/PinModal';
import { LoadingButton } from '../components/LoadingButton'; // IMPORTED
import api from '../services/api';

interface PPOBProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
  onTransaction: (type: 'ppob', amount: number, description: string) => void;
}

export const PPOB: React.FC<PPOBProps> = ({ user, onNavigate, onTransaction }) => {
  const [activeTab, setActiveTab] = useState<'pulsa' | 'data' | 'pln' | 'pdam'>('pulsa');
  const [customerNumber, setCustomerNumber] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [services, setServices] = useState<any>({ pulsa: [], data: [], pln: [], pdam: [] });
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
      const fetchServices = async () => {
          try {
              const res = await api.get('/ppob/services');
              setServices(res.data.data);
          } catch (error) {
              showToast("Gagal memuat layanan PPOB", "error");
          } finally {
              setIsLoadingServices(false);
          }
      };
      fetchServices();
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomerNumber(e.target.value.replace(/\D/g, ''));
  };

  const handleInitiatePay = () => {
      if (!customerNumber || customerNumber.length < 8) return showToast("Nomor pelanggan tidak valid", "error");
      if (!selectedItem) return showToast("Pilih nominal terlebih dahulu", "error");
      if (user.balance < selectedItem.price) return showToast("Saldo KMP-ADNG Pay tidak mencukupi", "error");
      
      // Open Modal - Frontend DOES NOT validate pin here anymore
      setShowPin(true);
  };

  const handlePinSuccess = (pin?: string) => {
      setShowPin(false); // Close modal first
      setIsProcessing(true);
      
      const payload = {
          productCode: selectedItem.code,
          customerNumber: customerNumber,
          pin: pin // Send typed PIN to server for verification
      };

      api.post('/ppob/purchase', payload)
        .then(res => {
            const data = res.data.data;
            onTransaction('ppob', Number(data.amount), data.description);
            setLastTransaction(data);
            showToast("Transaksi Berhasil!", "success");
        })
        .catch(err => {
            console.error(err);
            // Server responds with 401 if PIN is wrong
            showToast(err.response?.data?.message || "Transaksi Gagal", "error");
        })
        .finally(() => setIsProcessing(false));
  };

  const reset = () => {
      setLastTransaction(null);
      setSelectedItem(null);
      setCustomerNumber('');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
       <button onClick={() => onNavigate(AppRoute.DASHBOARD)} className="flex items-center text-gray-500 hover:text-emerald-600 mb-6 transition">
        <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Dashboard
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-slate-900 p-8 text-white relative">
              <h1 className="text-2xl font-bold mb-1">Tagihan & Isi Ulang</h1>
              <p className="text-slate-400 text-sm">Penuhi kebutuhan digital harianmu dalam satu aplikasi.</p>
              <div className="absolute top-8 right-8 text-right hidden md:block">
                  <p className="text-xs text-slate-400 mb-1">Saldo KMP-ADNG Pay</p>
                  <p className="text-xl font-bold text-emerald-400">Rp {user.balance.toLocaleString('id-ID')}</p>
              </div>
          </div>

          <div className="flex border-b border-gray-100 overflow-x-auto">
              {['pulsa', 'data', 'pln', 'pdam'].map(t => (
                  <button 
                    key={t}
                    onClick={() => { setActiveTab(t as any); setSelectedItem(null); }}
                    className={`flex-1 min-w-[100px] py-4 font-bold text-sm flex flex-col items-center gap-2 transition uppercase
                        ${activeTab === t ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}
                    `}
                  >
                      {t === 'pulsa' && <Smartphone className="w-5 h-5" />}
                      {t === 'data' && <Globe className="w-5 h-5" />}
                      {t === 'pln' && <Zap className="w-5 h-5" />}
                      {t === 'pdam' && <Droplet className="w-5 h-5" />}
                      {t}
                  </button>
              ))}
          </div>

          <div className="p-6 md:p-8">
              <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                      {activeTab === 'pulsa' || activeTab === 'data' ? 'Nomor Handphone' : 'ID Pelanggan / No. Meter'}
                  </label>
                  <div className="relative">
                      <input 
                        type="text" 
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono tracking-wide"
                        placeholder={activeTab === 'pulsa' ? "08123456789" : "1234567890"}
                        value={customerNumber}
                        onChange={handleNumberChange}
                      />
                  </div>
              </div>

              {isLoadingServices ? (
                  <div className="py-12 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {services[activeTab]?.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`p-4 rounded-xl border-2 text-center transition hover:shadow-md ${selectedItem?.id === item.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                          >
                              <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                              {item.desc && <p className="text-xs text-gray-500 mb-1">{item.desc}</p>}
                              <p className="text-emerald-600 text-sm font-medium">Rp {item.price.toLocaleString('id-ID')}</p>
                          </button>
                      ))}
                  </div>
              )}

              {selectedItem && (
                  <div className="mt-8 pt-6 border-t border-gray-100 animate-slide-up">
                      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl mb-4">
                          <div className="flex items-center mb-4 md:mb-0">
                              <div className="bg-white p-3 rounded-lg mr-4 border border-gray-200">
                                  <Wallet className="w-6 h-6 text-emerald-600" />
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase font-bold">Total Pembayaran</p>
                                  <p className="text-2xl font-bold text-slate-800">Rp {selectedItem.price.toLocaleString('id-ID')}</p>
                              </div>
                          </div>
                          
                          {/* REPLACED WITH LOADING BUTTON */}
                          <LoadingButton 
                            isLoading={isProcessing} 
                            onClick={handleInitiatePay}
                            icon={<CheckCircle className="ml-2 w-5 h-5" />}
                            className="w-full md:w-auto px-8"
                          >
                              Bayar Sekarang
                          </LoadingButton>
                      </div>
                  </div>
              )}
          </div>
      </div>

      <PinModal 
        isOpen={showPin} 
        onClose={() => setShowPin(false)} 
        onSuccess={handlePinSuccess}
        // NOTE: removed storedPin prop to stop frontend validation
      />
      {lastTransaction && <ReceiptModal transaction={lastTransaction} onClose={reset} />}
    </div>
  );
};
