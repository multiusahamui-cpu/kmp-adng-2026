
import React, { useState } from 'react';
import { User, Transaction, AppRoute } from '../types';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, History, Plus, QrCode, X, ChevronRight, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { useToast } from '../components/Toast';
import { ReceiptModal } from '../components/ReceiptModal';
import { PinModal } from '../components/PinModal';
import { walletService } from '../services/wallet.service';
import { LoadingButton } from '../components/LoadingButton'; 
import api from '../services/api';

interface WalletProps {
  user: User;
  transactions: Transaction[];
  onTransaction: (type: 'topup' | 'transfer' | 'payment', amount: number, description: string) => void;
  onNavigate?: (route: AppRoute) => void;
}

export const Wallet: React.FC<WalletProps> = ({ user, transactions, onTransaction, onNavigate }) => {
  const [modalType, setModalType] = useState<'topup' | 'transfer' | 'withdraw_voluntary' | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const [showPin, setShowPin] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');

  // Filter pending bills
  const pendingBills = transactions.filter(t => t.status === 'pending' && (t.type === 'BILL_REGISTRATION' || t.type === 'BILL_PRINCIPAL'));

  // --- RESTRICT FOR PENDING USER ONLY IF NOT KYC VERIFIED ---
  if (user.status === 'pending' && !user.kycVerified) {
      return (
          <div className="p-8 max-w-lg mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
              <div className="bg-orange-100 p-6 rounded-full mb-6">
                  <AlertTriangle className="w-16 h-16 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Dompet Belum Aktif</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                  Halo calon anggota! Tagihan Pendaftaran & Simpanan Pokok akan muncul di sini setelah Anda melengkapi data diri (KYC) di menu Profil.
              </p>
              <button 
                onClick={() => onNavigate && onNavigate(AppRoute.PROFILE)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30"
              >
                  Lengkapi KYC Sekarang
              </button>
          </div>
      );
  }

  const closeModal = () => {
    setModalType(null);
    setStep(1);
    setAmount('');
    setTransferTarget('');
    setIsLoading(false);
    setShowPin(false);
  };

  const handleInitiateTransaction = () => {
    const val = parseInt(amount);
    if (!val || val <= 0) return showToast("Mohon masukkan nominal yang valid", "error");
    
    if (modalType === 'transfer') {
        if (!transferTarget) return showToast("Mohon isi tujuan transfer", "error");
        if (user.balance < val) return showToast("Saldo tidak mencukupi untuk transfer", "error");
        setShowPin(true);
    } else if (modalType === 'withdraw_voluntary') {
        if ((user.savingsDetail?.sukarela || 0) < val) return showToast("Saldo Simpanan Sukarela tidak mencukupi", "error");
        setShowPin(true);
    } else {
        executeTransaction();
    }
  };

  const handlePinSuccess = (enteredPin?: string) => {
      setShowPin(false); 
      executeTransaction(enteredPin);
  };

  const executeTransaction = async (pin?: string) => {
      setIsLoading(true);
      const val = parseInt(amount);
      let description = '';
      
      if (modalType === 'topup') description = 'Top Up via Bank Transfer';
      else if (modalType === 'transfer') description = `Transfer ke ${transferTarget}`;
      else if (modalType === 'withdraw_voluntary') description = 'Penarikan Simpanan Sukarela';

      try {
          if (modalType === 'topup') {
              await walletService.topup(val);
          } else if (modalType === 'transfer') {
              await walletService.transfer(val, transferTarget, pin!, description);
          } else if (modalType === 'withdraw_voluntary') {
              await walletService.withdrawVoluntary(val, pin!);
          }

          onTransaction(modalType as any, val, description);
          setStep(2); 
          showToast("Transaksi Berhasil Disimpan!", "success");
      } catch (error: any) {
          console.error(error);
          showToast(error.response?.data?.message || "Transaksi Gagal", "error");
      } finally {
          setIsLoading(false);
      }
  };

  const handlePayBill = async (bill: Transaction) => {
      if (user.balance < bill.amount) {
          showToast("Saldo tidak cukup. Silahkan Top Up dulu.", "error");
          setModalType('topup'); // Auto open topup modal
          return;
      }

      if (!window.confirm(`Bayar tagihan ${bill.description} sebesar Rp ${Number(bill.amount).toLocaleString('id-ID')}?`)) return;

      setIsLoading(true);
      try {
          const res = await api.post('/wallet/bill/pay', { transactionId: bill.id });
          showToast(res.data.message, "success");
          
          // Trigger refresh data in parent
          // We assume onTransaction triggers a reload
          onTransaction('payment', bill.amount, bill.description);
          
          if (res.data.data.activated) {
              // Jika aktif, mungkin butuh refresh halaman penuh atau redirect dashboard
              setTimeout(() => window.location.reload(), 2000);
          }

      } catch (error: any) {
          showToast(error.response?.data?.message || "Gagal bayar tagihan", "error");
      } finally {
          setIsLoading(false);
      }
  };

  const handleScanClick = () => {
      if (onNavigate) {
          onNavigate(AppRoute.SCAN_QR);
      } else {
          showToast("Fitur Scan QR belum tersedia di halaman ini.", "info");
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 relative">
      
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full opacity-20 blur-3xl"></div>
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
               <div className="flex items-center space-x-2">
                 <div className="p-2 bg-white/10 rounded-lg"><WalletIcon className="w-6 h-6 text-emerald-400" /></div>
                 <span className="font-bold tracking-wide">KMP-ADNG PAY</span>
               </div>
               <img src={user.avatarUrl || "https://picsum.photos/id/64/50/50"} className="w-12 h-12 rounded-full border-2 border-slate-700" alt="Profile" />
            </div>

            <div className="mb-8">
              <p className="text-gray-400 text-sm mb-1">Total Saldo Aktif</p>
              <h2 className="text-4xl font-bold tracking-tight">Rp {user.balance.toLocaleString('id-ID')}</h2>
            </div>

            <div className="grid grid-cols-4 gap-4">
               <button onClick={() => setModalType('topup')} className="flex flex-col items-center group">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/50"><Plus className="w-6 h-6" /></div>
                  <span className="text-xs font-medium text-gray-300">Top Up</span>
               </button>
               <button onClick={() => setModalType('transfer')} className="flex flex-col items-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/20 transition"><ArrowUpRight className="w-6 h-6" /></div>
                  <span className="text-xs font-medium text-gray-300">Transfer</span>
               </button>
               <button onClick={() => setModalType('withdraw_voluntary')} className="flex flex-col items-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/20 transition"><Download className="w-6 h-6" /></div>
                  <span className="text-xs font-medium text-gray-300">Tarik Sukarela</span>
               </button>
               <button onClick={handleScanClick} className="flex flex-col items-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/20 transition"><QrCode className="w-6 h-6" /></div>
                  <span className="text-xs font-medium text-gray-300">Scan</span>
               </button>
               <button className="flex flex-col items-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/20 transition"><History className="w-6 h-6" /></div>
                  <span className="text-xs font-medium text-gray-300">Riwayat</span>
               </button>
            </div>
         </div>
      </div>

      {/* --- NEW: PENDING BILLS SECTION --- */}
      {pendingBills.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 animate-slide-up">
              <h3 className="font-bold text-orange-800 text-lg mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" /> Tagihan Aktivasi Anggota
              </h3>
              <div className="space-y-3">
                  {pendingBills.map(bill => (
                      <div key={bill.id} className="bg-white p-4 rounded-xl border border-orange-100 flex justify-between items-center shadow-sm">
                          <div className="flex items-center">
                              <div className="bg-orange-100 p-2 rounded-lg mr-4 text-orange-600">
                                  <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                  <p className="font-bold text-slate-800">{bill.description}</p>
                                  <p className="text-xs text-slate-500">Wajib dibayar untuk aktivasi KTA</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-slate-800 mb-1">Rp {Number(bill.amount).toLocaleString('id-ID')}</p>
                              <button 
                                onClick={() => handlePayBill(bill)}
                                disabled={isLoading}
                                className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition"
                              >
                                  {isLoading ? '...' : 'Bayar Sekarang'}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Transaksi Terakhir</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Klik untuk lihat struk</span>
         </div>
         <div className="divide-y divide-gray-100">
            {transactions.filter(t => t.status === 'success').length === 0 ? (
                <div className="p-8 text-center text-gray-400">Belum ada transaksi berhasil</div>
            ) : transactions.filter(t => t.status === 'success').map(tx => {
               const isTopup = tx.type.toUpperCase() === 'TOPUP';
               const isIncoming = isTopup || tx.type === 'TRANSFER_IN';
               return (
               <div key={tx.id} onClick={() => setSelectedTransaction(tx)} className="p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group">
                  <div className="flex items-center space-x-4">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isTopup ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {isTopup ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                     </div>
                     <div>
                        <p className="font-medium text-slate-800 line-clamp-1">{tx.description}</p>
                        <p className="text-xs text-gray-500 capitalize">{tx.type} • {new Date(tx.createdAt || tx.date || Date.now()).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <span className={`font-bold ${isIncoming ? 'text-emerald-600' : 'text-slate-800'}`}>{isIncoming ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}</span>
               </div>
            )})}
         </div>
      </div>

      {selectedTransaction && <ReceiptModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                 <h3 className="font-bold">{
                    modalType === 'topup' ? 'Isi Saldo (Top Up)' : 
                    modalType === 'transfer' ? 'Transfer Saldo' : 
                    'Tarik Simpanan Sukarela'
                 }</h3>
                 <button onClick={closeModal} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                 {step === 1 ? (
                    <div className="space-y-4">
                       {modalType === 'withdraw_voluntary' && (
                           <div className="bg-emerald-50 p-4 rounded-xl mb-4 text-sm text-emerald-800">
                               <p className="font-bold mb-1">Saldo Sukarela Tersedia:</p>
                               <p className="text-xl font-bold">Rp {(user.savingsDetail?.sukarela || 0).toLocaleString('id-ID')}</p>
                           </div>
                       )}
                       {modalType === 'transfer' && (
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Transfer</label><input type="text" placeholder="Nomor HP / ID Anggota" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} /></div>
                       )}
                       <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label><input type="number" placeholder="0" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                       
                       <LoadingButton 
                         isLoading={isLoading} 
                         onClick={handleInitiateTransaction} 
                         fullWidth 
                         icon={<ChevronRight className="w-4 h-4" />}
                       >
                          {modalType === 'topup' ? 'Top Up Sekarang' : modalType === 'transfer' ? 'Lanjut Transfer' : 'Tarik Sekarang'}
                       </LoadingButton>
                    </div>
                 ) : (
                    <div className="text-center py-6">
                       <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><CheckCircle className="w-8 h-8" /></div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Transaksi Berhasil!</h3>
                       <button onClick={closeModal} className="w-full bg-gray-100 text-slate-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Tutup</button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      <PinModal 
        isOpen={showPin} 
        onClose={() => setShowPin(false)} 
        onSuccess={handlePinSuccess}
        onForgotPin={() => { setShowPin(false); if(onNavigate) onNavigate(AppRoute.SETTINGS); showToast("Silahkan request reset PIN di menu Pengaturan", "info"); }}
      />
    </div>
  );
};
