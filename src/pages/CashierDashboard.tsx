
import React, { useState, useEffect } from 'react';
import { User, Product } from '../types';
import {
    Search,
    ShoppingCart,
    Trash2,
    Printer,
    Plus,
    Minus,
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Activity,
    CheckCircle,
    Clock,
    AlertCircle,
    UserX,
    X
} from 'lucide-react';
import { MOCK_PRODUCTS } from '../constants';
import { useToast } from '../components/Toast';
import api from '../services/api';

interface CashierDashboardProps {
  user: User;
  view?: 'treasury' | 'management' | 'pos'; // Optional, defaults to 'treasury' if logic dictates
}

// Mock Payment Requests for Cash Management
const MOCK_PAYMENT_REQUESTS = [
    { id: 'pay-001', requester: 'Exchanger Ahmad', amount: 5000000, type: 'Re-stock Saldo', status: 'approved_gm', date: '2024-10-08', notes: 'Topup saldo agen wilayah Timur' },
    { id: 'pay-002', requester: 'Vendor Logistik JNE', amount: 2500000, type: 'Invoice Tagihan', status: 'approved_gm', date: '2024-10-09', notes: 'Pembayaran invoice #INV-JNE-004' },
    { id: 'pay-003', requester: 'Anggota Budi', amount: 1000000, type: 'Withdrawal', status: 'pending', date: '2024-10-09', notes: 'Tarik tunai via kantor pusat' },
];

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ user, view = 'pos' }) => {
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'kmp_adng_pay'>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  // --- PENCAIRAN TUTUP AHLI WARIS (real API) ---
  const [heirQueue, setHeirQueue] = useState<any[]>([]);
  const [isLoadingHeirQueue, setIsLoadingHeirQueue] = useState(false);
  const [heirToExecute, setHeirToExecute] = useState<any>(null);
  const [isExecutingHeir, setIsExecutingHeir] = useState(false);

  const fetchHeirQueue = async () => {
      setIsLoadingHeirQueue(true);
      try {
          const res = await api.get('/admin/resignations/cashier-queue');
          setHeirQueue(res.data.data);
      } catch (error) {
          console.error("Failed fetch heir closure queue", error);
      } finally {
          setIsLoadingHeirQueue(false);
      }
  };

  useEffect(() => { fetchHeirQueue(); }, []);

  const handleExecuteHeirClosure = async () => {
      if (!heirToExecute) return;
      setIsExecutingHeir(true);
      try {
          const res = await api.post(`/admin/resignations/${heirToExecute.id}/execute-cash`);
          showToast(res.data.message, "success");
          setHeirToExecute(null);
          fetchHeirQueue();
      } catch (error: any) {
          showToast(error.response?.data?.message || "Gagal eksekusi pencairan", "error");
      } finally {
          setIsExecutingHeir(false);
      }
  };

  // Cash Management State
  const [requests, setRequests] = useState(MOCK_PAYMENT_REQUESTS);

  // --- RENDER FUNCTIONS ---

  // 1. DASHBOARD TREASURY (Overview)
  const renderTreasury = () => (
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 animate-fade-in">
          <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Dashboard Treasury</h1>
              <p className="text-slate-500 text-sm">Situasional Sistem Pembayaran & Likuiditas • Juru Bayar: {user.name}</p>
          </div>

          {/* Liquidty Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Likuiditas Tunai</p>
                      <h3 className="text-3xl font-bold">Rp 1.250.000.000</h3>
                      <p className="text-emerald-400 text-xs mt-2 flex items-center"><Activity className="w-3 h-3 mr-1" /> Safe Level</p>
                  </div>
                  <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Inflow Hari Ini (Masuk)</p>
                  <h3 className="text-2xl font-bold text-emerald-600">+ Rp 45.000.000</h3>
                  <div className="mt-4 flex items-center text-xs text-gray-400">
                      <ArrowDownLeft className="w-4 h-4 mr-1 text-emerald-500" /> Dari 120 Transaksi
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Outflow Hari Ini (Keluar)</p>
                  <h3 className="text-2xl font-bold text-orange-600">- Rp 12.500.000</h3>
                  <div className="mt-4 flex items-center text-xs text-gray-400">
                      <ArrowUpRight className="w-4 h-4 mr-1 text-orange-500" /> Ke 15 Vendor/Agen
                  </div>
              </div>
          </div>

          {/* Pending Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Peringatan & Tugas</h3>
              <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start">
                      <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                      <div>
                          <p className="text-sm font-bold text-orange-800">Menunggu Eksekusi Pembayaran (2)</p>
                          <p className="text-xs text-orange-700">Terdapat 2 permintaan pembayaran yang telah disetujui GM. Segera proses di menu Cash Management.</p>
                      </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start">
                      <Activity className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                          <p className="text-sm font-bold text-blue-800">Rekonsiliasi Bank Harian</p>
                          <p className="text-xs text-blue-700">Jadwal rekonsiliasi pukul 16:00 WIB. Siapkan dokumen mutasi bank.</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* --- PENCAIRAN TUTUP AHLI WARIS --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
              <h3 className="font-bold text-lg text-slate-800 mb-1 flex items-center">
                  <UserX className="w-5 h-5 mr-2 text-red-500" /> PENCAIRAN TUTUP AHLI WARIS
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                  Permohonan penutupan akun (ahli waris) yang sudah disetujui GM, metode tunai. Pastikan ahli waris membawa KTP &amp; KK almarhum/almarhumah sebelum eksekusi.
              </p>
              {isLoadingHeirQueue ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Memuat...</div>
              ) : heirQueue.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Tidak ada antrian pencairan tunai ahli waris.
                  </div>
              ) : (
                  <div className="space-y-3">
                      {heirQueue.map((r) => (
                          <div key={r.id} className="flex flex-col md:flex-row justify-between items-center bg-red-50 border border-red-100 rounded-xl p-4">
                              <div>
                                  <p className="font-bold text-slate-800">{r.userName}</p>
                                  <p className="text-xs text-gray-500">{r.userPhone} -- {r.reason}</p>
                                  <p className="text-xs text-gray-400">Disetujui GM: {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('id-ID') : '-'}</p>
                              </div>
                              <button
                                onClick={() => setHeirToExecute(r)}
                                className="mt-3 md:mt-0 px-5 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md"
                              >
                                  Eksekusi Pencairan
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* --- CONFIRM EXECUTE MODAL --- */}
          {heirToExecute && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                      <div className="bg-red-600 p-4 text-white flex justify-between items-center">
                          <h3 className="font-bold">Konfirmasi Pencairan Tunai</h3>
                          <button onClick={() => setHeirToExecute(null)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="p-6 space-y-4">
                          <p className="text-sm text-gray-700">
                              Pastikan ahli waris <strong>{heirToExecute.userName}</strong> sudah menunjukkan KTP &amp; KK almarhum/almarhumah secara fisik.
                              Setelah dikonfirmasi, seluruh ekuitas + saldo dompet anggota akan dijurnal nol dan akun ditutup permanen -- tindakan ini tidak bisa dibatalkan.
                          </p>
                          <div className="flex gap-3">
                              <button
                                onClick={() => setHeirToExecute(null)}
                                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                              >
                                  Batal
                              </button>
                              <button
                                onClick={handleExecuteHeirClosure}
                                disabled={isExecutingHeir}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg disabled:opacity-70"
                              >
                                  {isExecutingHeir ? "Memproses..." : "Ya, Cairkan & Tutup Akun"}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  // 2. CASH MANAGEMENT (Payment Execution)
  const renderCashManagement = () => (
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 animate-fade-in">
          <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Cash Management</h1>
              <p className="text-slate-500 text-sm">Eksekusi Pembayaran & Pemantauan Request Dana</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Daftar Permintaan Pembayaran</h3>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                      {requests.filter(r => r.status === 'approved_gm').length} Siap Bayar
                  </span>
              </div>
              
              <div className="divide-y divide-gray-100">
                  {requests.map(req => (
                      <div key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 transition">
                          <div className="flex items-start mb-4 md:mb-0 w-full md:w-auto">
                              <div className={`p-3 rounded-full mr-4 ${req.status === 'approved_gm' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                  {req.status === 'approved_gm' ? <CheckCircle size={24} /> : <Clock size={24} />}
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-800">{req.requester}</h4>
                                  <p className="text-sm text-gray-500">{req.type} • {req.date}</p>
                                  <p className="text-xs text-gray-400 mt-1 italic">"{req.notes}"</p>
                              </div>
                          </div>

                          <div className="flex flex-col items-end w-full md:w-auto">
                              <p className="font-bold text-xl text-slate-800 mb-2">Rp {req.amount.toLocaleString('id-ID')}</p>
                              
                              {req.status === 'approved_gm' ? (
                                  <div className="flex items-center space-x-3">
                                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center">
                                          <CheckCircle className="w-3 h-3 mr-1" /> Disetujui GM
                                      </span>
                                      <button 
                                        onClick={() => {
                                            if(window.confirm(`Eksekusi pembayaran Rp ${req.amount.toLocaleString('id-ID')} kepada ${req.requester}?`)) {
                                                setRequests(prev => prev.filter(r => r.id !== req.id));
                                                showToast("Pembayaran Berhasil Dieksekusi. Dana dikirim.", "success");
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md"
                                      >
                                          Eksekusi Bayar
                                      </button>
                                  </div>
                              ) : (
                                  <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded border border-orange-100">
                                      Menunggu Persetujuan GM
                                  </span>
                              )}
                          </div>
                      </div>
                  ))}
                  {requests.length === 0 && (
                      <div className="p-10 text-center text-gray-400">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada permintaan pembayaran pending.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  // 3. POS VIEW (Existing Logic)
  const filteredProducts = MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);
  const changeAmount = (parseInt(receivedAmount) || 0) - totalAmount;

  const renderPOS = () => (
    <div className="flex h-screen bg-gray-100 overflow-hidden animate-fade-in">
        
        {/* LEFT: Product Catalog */}
        <div className="flex-1 flex flex-col p-6 pr-3 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Point of Sale (POS)</h1>
                    <p className="text-sm text-gray-500">Kasir: {user.name} • {new Date().toLocaleDateString()}</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Cari produk..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        onClick={() => addToCart(product)}
                        className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col h-full"
                    >
                        <div className="h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1">{product.name}</h4>
                        <p className="text-blue-600 font-bold mt-auto">Rp {product.price.toLocaleString('id-ID')}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: Cart & Checkout */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
            <div className="p-4 border-b border-gray-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" /> Keranjang Belanja
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Belum ada item.</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div className="flex-1">
                                <p className="font-bold text-sm text-slate-800 line-clamp-1">{item.product.name}</p>
                                <p className="text-xs text-gray-500">Rp {item.product.price.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => updateQty(item.product.id, -1)} className="p-1 bg-white rounded border hover:bg-gray-100"><Minus size={14}/></button>
                                <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.product.id, 1)} className="p-1 bg-white rounded border hover:bg-gray-100"><Plus size={14}/></button>
                                <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 ml-1"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-gray-200">
                <div className="flex justify-between mb-4 text-lg">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="font-bold text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button 
                        onClick={() => setPaymentMethod('cash')} 
                        className={`py-2 rounded-lg text-xs font-bold border transition ${paymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        TUNAI
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('qris')} 
                        className={`py-2 rounded-lg text-xs font-bold border transition ${paymentMethod === 'qris' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        QRIS
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('kmp_adng_pay')} 
                        className={`py-2 rounded-lg text-xs font-bold border transition ${paymentMethod === 'kmp_adng_pay' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        K-PAY
                    </button>
                </div>

                {paymentMethod === 'cash' && (
                    <div className="mb-4 space-y-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Bayar (Rp)</label>
                            <input 
                                type="number" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-lg"
                                value={receivedAmount}
                                onChange={e => setReceivedAmount(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Kembali</span>
                            <span className={changeAmount < 0 ? 'text-red-500' : 'text-green-600 font-bold'}>
                                Rp {Math.max(0, changeAmount).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:bg-gray-400 flex items-center justify-center"
                >
                    {isProcessing ? 'Memproses...' : (
                        <><Printer className="w-4 h-4 mr-2" /> Cetak Struk & Selesai</>
                    )}
                </button>
            </div>
        </div>
    </div>
  );

  const addToCart = (product: Product) => {
      setCart(prev => {
          const existing = prev.find(i => i.product.id === product.id);
          if (existing) {
              return prev.map(i => i.product.id === product.id ? {...i, qty: i.qty + 1} : i);
          }
          return [...prev, { product, qty: 1 }];
      });
  };

  const updateQty = (prodId: string, delta: number) => {
      setCart(prev => prev.map(i => {
          if (i.product.id === prodId) {
              return { ...i, qty: Math.max(1, i.qty + delta) };
          }
          return i;
      }));
  };

  const removeFromCart = (prodId: string) => {
      setCart(prev => prev.filter(i => i.product.id !== prodId));
  };

  const handleCheckout = () => {
      if (cart.length === 0) return showToast("Keranjang kosong!", "error");
      if (paymentMethod === 'cash' && changeAmount < 0) return showToast("Uang tunai kurang!", "error");

      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          showToast("Transaksi Berhasil!", "success");
          setCart([]);
          setReceivedAmount('');
      }, 1500);
  };

  // --- MAIN RENDER SWITCH ---
  if (view === 'treasury') return renderTreasury();
  if (view === 'management') return renderCashManagement();
  return renderPOS();
};
