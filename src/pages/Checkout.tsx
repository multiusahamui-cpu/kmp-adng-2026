
import React, { useState } from 'react';
import { CartItem, User, AppRoute } from '../types';
import { MapPin, Truck, CreditCard, Wallet, CheckCircle, Loader2, Info } from 'lucide-react';
import { useToast } from '../components/Toast';
import { PinModal } from '../components/PinModal';
import { LoadingButton } from '../components/LoadingButton'; // IMPORTED
import api from '../services/api';
import { walletService } from '../services/wallet.service';

interface CheckoutProps {
  user: User;
  cartItems: CartItem[];
  onCheckout: (address: string, paymentMethod: string) => void;
  onNavigate: (route: AppRoute) => void;
}

const COURIERS = [
    { code: 'jne', name: 'JNE', logo: 'bg-blue-600' },
    { code: 'tiki', name: 'TIKI', logo: 'bg-indigo-600' },
    { code: 'pos', name: 'POS Indonesia', logo: 'bg-orange-500' },
];

export const Checkout: React.FC<CheckoutProps> = ({ user, cartItems, onCheckout, onNavigate }) => {
  const [address, setAddress] = useState(user.address || 'Alamat Utama (Sesuai KTP)');
  const [paymentMethod, setPaymentMethod] = useState('kmp_adng_pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [shippingServices, setShippingServices] = useState<{service: string, cost: number, etd: string}[]>([]);
  const [selectedService, setSelectedService] = useState<{service: string, cost: number} | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const totalPrice = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const shippingFee = selectedService ? selectedService.cost : 0;
  const adminFee = 2500; 
  
  const officialProductTotal = cartItems
    .filter(item => item.isOfficial)
    .reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  
  const taxableBase = adminFee + officialProductTotal;
  const ppnAmount = Math.ceil(taxableBase * 0.11); 
  const grandTotal = totalPrice + shippingFee + adminFee + ppnAmount;

  const handleInitiateCheckout = () => {
    if (!selectedService) return showToast("Mohon pilih layanan pengiriman terlebih dahulu.", "error");
    
    if (paymentMethod === 'kmp_adng_pay') {
        if (user.balance < grandTotal) return showToast("Saldo KMP-ADNG Pay tidak mencukupi!", "error");
        // Open Modal - NO Frontend Validation
        setShowPin(true);
    } else {
        handleProcess(); 
    }
  };

  const handleProcess = async (pin?: string) => {
    setShowPin(false);
    setIsProcessing(true);
    
    try {
        const payload = {
            address,
            items: cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            pin: pin // Send PIN to server
        };

        await api.post('/marketplace/checkout', payload);
        await walletService.getWalletInfo(); 

        showToast("Checkout berhasil! Pesanan sedang diproses.", "success");
        onCheckout(address, paymentMethod); 
        setTimeout(() => {
            onNavigate(AppRoute.ORDER_HISTORY);
        }, 1000);

    } catch (error: any) {
        console.error(error);
        showToast(error.response?.data?.message || "Gagal Checkout", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCheckOngkir = (courierCode: string) => {
      setSelectedCourier(courierCode);
      setSelectedService(null);
      setIsLoadingShipping(true);

      setTimeout(() => {
          let mockServices = [];
          const baseCost = 15000 + Math.floor(Math.random() * 5000); 

          if (courierCode === 'jne') {
              mockServices = [
                  { service: 'JNE OKE', cost: baseCost, etd: '3-5 Hari' },
                  { service: 'JNE REG', cost: baseCost + 5000, etd: '2-3 Hari' },
                  { service: 'JNE YES', cost: baseCost + 15000, etd: '1 Hari' },
              ];
          } else if (courierCode === 'tiki') {
              mockServices = [
                  { service: 'ECO', cost: baseCost, etd: '4 Hari' },
                  { service: 'REG', cost: baseCost + 4000, etd: '2 Hari' },
                  { service: 'ONS', cost: baseCost + 12000, etd: '1 Hari' },
              ];
          } else {
              mockServices = [
                  { service: 'Pos Kilat', cost: baseCost + 2000, etd: '2-4 Hari' },
                  { service: 'Pos Express', cost: baseCost + 10000, etd: '1 Hari' },
              ];
          }
          setShippingServices(mockServices);
          setIsLoadingShipping(false);
      }, 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Pengiriman & Pembayaran</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-600" /> Alamat Pengiriman
               </h3>
               <textarea 
                 className="w-full p-3 border border-gray-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                 rows={3}
                 value={address}
                 onChange={(e) => setAddress(e.target.value)}
                 placeholder="Masukkan alamat lengkap..."
               />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-emerald-600" /> Pilih Jasa Pengiriman
               </h3>
               <div className="flex space-x-3 mb-4">
                   {COURIERS.map(c => (
                       <button
                         key={c.code}
                         onClick={() => handleCheckOngkir(c.code)}
                         className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition
                            ${selectedCourier === c.code ? `border-${c.logo.replace('bg-', '')} bg-gray-50 text-slate-800` : 'border-gray-100 hover:border-gray-200 text-gray-500'}
                         `}
                       >
                           {c.name}
                       </button>
                   ))}
               </div>
               {isLoadingShipping ? (
                   <div className="text-center py-4 text-emerald-600 flex justify-center items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Cek Ongkir...</div>
               ) : shippingServices.length > 0 ? (
                   <div className="space-y-2">
                       {shippingServices.map((srv, idx) => (
                           <div key={idx} onClick={() => setSelectedService({service: srv.service, cost: srv.cost})}
                             className={`flex justify-between items-center p-3 rounded-lg cursor-pointer border transition ${selectedService?.service === srv.service ? 'border-emerald-500 bg-emerald-50 ring-1' : 'border-gray-200 hover:bg-gray-50'}`}>
                               <div><p className="font-bold text-slate-800">{srv.service}</p><p className="text-xs text-gray-500">Estimasi: {srv.etd}</p></div>
                               <p className="font-bold text-emerald-600">Rp {srv.cost.toLocaleString('id-ID')}</p>
                           </div>
                       ))}
                   </div>
               ) : <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg">Pilih kurir diatas untuk melihat ongkos kirim.</div>}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-emerald-600" /> Metode Pembayaran</h3>
               <div className="space-y-3">
                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'kmp_adng_pay' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                     <div className="flex items-center">
                        <input type="radio" name="payment" className="mr-3 text-emerald-600 focus:ring-emerald-500" checked={paymentMethod === 'kmp_adng_pay'} onChange={() => setPaymentMethod('kmp_adng_pay')} />
                        <div className="flex items-center">
                           <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg mr-3"><Wallet className="w-5 h-5" /></div>
                           <div><p className="font-bold text-slate-800">Saldo KMP-ADNG Pay</p><p className="text-xs text-gray-500">Saldo: Rp {user.balance.toLocaleString('id-ID')}</p></div>
                        </div>
                     </div>
                     {user.balance < grandTotal && <span className="text-xs text-red-500 font-bold bg-white px-2 py-1 rounded border border-red-200">Saldo Kurang</span>}
                  </label>
               </div>
            </div>
         </div>

         <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
               <h3 className="font-bold text-slate-800 mb-4">Ringkasan</h3>
               <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex justify-between"><span>Harga Barang</span><span>Rp {totalPrice.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span>Pengiriman</span><span className={shippingFee === 0 ? 'text-orange-500 italic' : ''}>{shippingFee === 0 ? 'Pilih Kurir' : `Rp ${shippingFee.toLocaleString('id-ID')}`}</span></div>
                  <div className="flex justify-between"><span>Biaya Layanan</span><span>Rp {adminFee.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-orange-600 bg-orange-50 p-2 rounded"><span className="flex items-center"><Info className="w-3 h-3 mr-1"/> PPN 11%</span><span>Rp {ppnAmount.toLocaleString('id-ID')}</span></div>
                  <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center text-slate-800 font-bold text-lg"><span>Total Bayar</span><span className="text-emerald-600">Rp {grandTotal.toLocaleString('id-ID')}</span></div>
               </div>
               
               {/* REPLACED WITH LOADING BUTTON */}
               <LoadingButton 
                 isLoading={isProcessing} 
                 onClick={handleInitiateCheckout}
                 disabled={shippingFee === 0}
                 fullWidth
                 icon={<CheckCircle className="ml-2 w-5 h-5" />}
               >
                  Bayar Sekarang
               </LoadingButton>

               <p className="text-xs text-gray-400 text-center mt-4">Transaksi aman & terenkripsi</p>
            </div>
         </div>
      </div>

      <PinModal 
        isOpen={showPin} 
        onClose={() => setShowPin(false)} 
        onSuccess={handleProcess} 
        // NOTE: removed storedPin
      />
    </div>
  );
};
