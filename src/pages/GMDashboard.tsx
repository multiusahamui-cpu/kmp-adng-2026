
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
    LayoutDashboard,
    ShieldCheck,
    TrendingUp,
    Activity,
    Users,
    CheckCircle,
    Clock,
    FileText,
    Banknote,
    MapPin,
    Briefcase,
    X,
    Eye,
    AlertCircle,
    Info,
    UserX
} from 'lucide-react';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

interface GMDashboardProps {
  user: User;
  view: 'dashboard' | 'approvals' | 'strategy';
}

// MOCK DATA FOR GM
const MOCK_APPROVALS = [
    { id: 'pay-003', type: 'payment', requester: 'Anggota Budi', amount: 1000000, description: 'Withdrawal Tunai (Exchanger)', date: '2024-10-09', status: 'pending', notes: 'Saldo digital sudah dikunci' },
    { id: 'loan-001', type: 'loan', requester: 'Pokja Tani Makmur', amount: 25000000, description: 'Modal Tanam Jagung Hibrida', date: '2024-10-08', status: 'pending', notes: 'Lahan 2 Hektar, Estimasi Panen 3 bulan' },
    { id: 'pay-004', type: 'payment', requester: 'Vendor Logistik JNE', amount: 3500000, description: 'Invoice Tagihan September', date: '2024-10-10', status: 'pending', notes: 'Tagihan pengiriman bulan lalu, Invoice #INV-2409' },
];

const PERFORMANCE_DATA = [
    { name: 'Minggu 1', revenue: 45000000, activeUsers: 1200 },
    { name: 'Minggu 2', revenue: 52000000, activeUsers: 1350 },
    { name: 'Minggu 3', revenue: 48000000, activeUsers: 1400 },
    { name: 'Minggu 4', revenue: 61000000, activeUsers: 1550 },
];

export const GMDashboard: React.FC<GMDashboardProps> = ({ view }) => {
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);

  // NEW: State for Modal Review
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const handleApprove = (id: string) => {
      setApprovals(prev => prev.filter(item => item.id !== id));
      showToast("Permintaan Disetujui. Diteruskan ke Kasir/Finance.", "success");
      setSelectedRequest(null);
  };

  const handleReject = (id: string) => {
      setApprovals(prev => prev.filter(item => item.id !== id));
      showToast("Permintaan Ditolak.", "info");
      setSelectedRequest(null);
  };

  // --- RESIGNATION APPROVALS (real API, terpisah dari mock payment/loan di atas) ---
  const [resignations, setResignations] = useState<any[]>([]);
  const [isLoadingResignations, setIsLoadingResignations] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState<any>(null);
  const [resignDecisionNotes, setResignDecisionNotes] = useState('');

  const fetchResignations = async () => {
      setIsLoadingResignations(true);
      try {
          const res = await api.get('/admin/resignations');
          setResignations(res.data.data);
      } catch (error) {
          console.error("Failed fetch resignations", error);
      } finally {
          setIsLoadingResignations(false);
      }
  };

  useEffect(() => {
      if (view === 'approvals') fetchResignations();
  }, [view]);

  const handleDecideResignation = async (decision: 'approve' | 'reject') => {
      if (!selectedResignation) return;
      if (!window.confirm(`Yakin ${decision === 'approve' ? 'MENYETUJUI' : 'MENOLAK'} permohonan berhenti ${selectedResignation.userName}?`)) return;

      try {
          const res = await api.put(`/admin/resignations/${selectedResignation.id}/decide`, {
              decision,
              notes: resignDecisionNotes,
          });
          showToast(res.data.message, "success");
          setSelectedResignation(null);
          setResignDecisionNotes('');
          fetchResignations();
      } catch (error: any) {
          showToast(error.response?.data?.message || "Gagal memproses keputusan", "error");
      }
  };

  const handlePostpone = () => {
      // Just simulate postponement logic (keep in list but maybe change status or just toast)
      showToast("Permintaan ditunda. Akan ditinjau kembali nanti.", "info");
      setSelectedRequest(null);
  };

  const renderHeader = (title: string, subtitle: string, icon: React.ReactNode) => (
    <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 flex items-center shadow-lg">
        <div className="bg-white/10 p-3 rounded-xl mr-4">
            {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-white/70">{subtitle}</p>
        </div>
    </div>
  );

  const renderDashboard = () => (
      <div className="animate-fade-in">
          {renderHeader("Executive Summary", "Ringkasan Eksekutif Kinerja Koperasi", <LayoutDashboard className="w-8 h-8 text-emerald-400" />)}
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Aset</p>
                  <h3 className="text-2xl font-bold text-slate-800">Rp 1.5 M</h3>
                  <span className="text-xs text-emerald-600 font-bold flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +12% MoM</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Profit (YTD)</p>
                  <h3 className="text-2xl font-bold text-slate-800">Rp 250 Jt</h3>
                  <span className="text-xs text-emerald-600 font-bold flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> On Track</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Anggota Aktif</p>
                  <h3 className="text-2xl font-bold text-slate-800">1,550</h3>
                  <span className="text-xs text-blue-600 font-bold flex items-center mt-1"><Users className="w-3 h-3 mr-1" /> +50 Minggu Ini</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Pending Approval</p>
                  <h3 className="text-2xl font-bold text-orange-600">{approvals.length}</h3>
                  <span className="text-xs text-orange-600 font-bold flex items-center mt-1"><Clock className="w-3 h-3 mr-1" /> Butuh Aksi</span>
              </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-6">Pertumbuhan Pendapatan</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={PERFORMANCE_DATA}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Pendapatan (Rp)" />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-6">Pertumbuhan Anggota</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={PERFORMANCE_DATA}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={3} name="Anggota Aktif" />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderApprovals = () => (
      <div className="animate-fade-in">
          {renderHeader("Pusat Persetujuan", "Verifikasi Pembayaran & Pembiayaan", <ShieldCheck className="w-8 h-8 text-blue-400" />)}

          {/* --- RESIGNATION APPROVALS (Permohonan Berhenti / Ahli Waris) --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center">
                      <UserX className="w-5 h-5 mr-2 text-red-500" /> Permohonan Berhenti Anggota ({resignations.length})
                  </h3>
              </div>
              <div className="divide-y divide-gray-100">
                  {isLoadingResignations ? (
                      <div className="p-8 text-center text-gray-400">Memuat...</div>
                  ) : resignations.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                          <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada permohonan berhenti yang menunggu.</p>
                      </div>
                  ) : (
                      resignations.map((r) => (
                          <div key={r.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 transition">
                              <div className="mb-4 md:mb-0">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-slate-800">{r.userName}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${r.caseType === 'heir_death' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {r.caseType === 'heir_death' ? 'Ahli Waris' : 'Self Resign'}
                                      </span>
                                      <span className="text-xs px-2 py-0.5 rounded uppercase font-bold bg-gray-100 text-gray-600">
                                          {r.disbursementMethod === 'cash_pickup' ? 'Tunai (Kasir)' : 'Transfer Bank'}
                                      </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{r.reason}</p>
                                  <p className="text-xs text-gray-400 mt-1">{r.userPhone} -- {new Date(r.createdAt).toLocaleDateString('id-ID')}</p>
                              </div>
                              <button
                                onClick={() => setSelectedResignation(r)}
                                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-md flex items-center"
                              >
                                  <Eye className="w-4 h-4 mr-2" /> Review
                              </button>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* --- RESIGNATION REVIEW MODAL --- */}
          {selectedResignation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                          <div>
                              <h3 className="text-xl font-bold">Permohonan Berhenti</h3>
                              <p className="text-slate-400 text-sm">{selectedResignation.userName} -- {selectedResignation.userPhone}</p>
                          </div>
                          <button onClick={() => setSelectedResignation(null)} className="hover:text-red-400 transition"><X size={24} /></button>
                      </div>
                      <div className="p-6 space-y-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                              <p><span className="text-gray-500">Tipe:</span> <strong>{selectedResignation.caseType === 'heir_death' ? 'Ahli Waris (Anggota Meninggal)' : 'Self Resign'}</strong></p>
                              <p><span className="text-gray-500">Metode Pencairan:</span> <strong>{selectedResignation.disbursementMethod === 'cash_pickup' ? 'Tunai di Kasir' : 'Transfer Bank'}</strong></p>
                              <p><span className="text-gray-500">Alasan:</span> {selectedResignation.reason}</p>
                              {selectedResignation.description && <p><span className="text-gray-500">Catatan:</span> {selectedResignation.description}</p>}
                              {selectedResignation.disbursementMethod === 'bank_transfer' && (
                                  <div className="pt-2 border-t border-gray-200">
                                      <p className="text-gray-500 mb-1">Rekening Tujuan:</p>
                                      {selectedResignation.bankAccountNumber ? (
                                          <p className="font-mono">{selectedResignation.bankName} -- {selectedResignation.bankAccountNumber} a/n {selectedResignation.bankAccountHolder}</p>
                                      ) : (
                                          <p className="text-red-600 font-bold">Anggota belum mengisi rekening bank!</p>
                                      )}
                                  </div>
                              )}
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Keputusan (opsional)</label>
                              <textarea
                                  className="w-full p-3 border border-gray-300 rounded-xl"
                                  rows={2}
                                  value={resignDecisionNotes}
                                  onChange={(e) => setResignDecisionNotes(e.target.value)}
                              />
                          </div>
                          {selectedResignation.disbursementMethod === 'cash_pickup' && (
                              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  Kalau disetujui, permohonan ini masuk antrian "PENCAIRAN TUTUP AHLI WARIS" di menu Kasir untuk dieksekusi setelah ahli waris datang membawa KTP &amp; KK almarhum/almarhumah.
                              </p>
                          )}
                          {selectedResignation.disbursementMethod === 'bank_transfer' && (
                              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  Kalau disetujui, transfer dana &amp; penutupan akun dilakukan manual di luar sistem untuk saat ini (belum ada integrasi bank).
                              </p>
                          )}
                          <div className="pt-2 flex gap-3">
                              <button
                                onClick={() => handleDecideResignation('reject')}
                                className="flex-1 py-3 border border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50"
                              >
                                  Tolak
                              </button>
                              <button
                                onClick={() => handleDecideResignation('approve')}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg"
                              >
                                  Setujui
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Daftar Permintaan Pending ({approvals.length})</h3>
                  <div className="flex space-x-2">
                      <span className="flex items-center text-xs text-gray-500"><div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div> Payment</span>
                      <span className="flex items-center text-xs text-gray-500"><div className="w-3 h-3 bg-purple-100 rounded-full mr-1"></div> Loan</span>
                  </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                  {approvals.length === 0 ? (
                      <div className="p-12 text-center text-gray-400">
                          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Semua permintaan telah diproses.</p>
                      </div>
                  ) : (
                      approvals.map(item => (
                          <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 transition">
                              <div className="flex items-start mb-4 md:mb-0 w-full md:w-auto">
                                  <div className={`p-3 rounded-xl mr-4 ${item.type === 'payment' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                      {item.type === 'payment' ? <Banknote size={24} /> : <Briefcase size={24} />}
                                  </div>
                                  <div>
                                      <div className="flex items-center mb-1">
                                          <span className="font-bold text-slate-800 text-lg mr-3">{item.requester}</span>
                                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase font-bold">{item.type}</span>
                                      </div>
                                      <p className="text-sm text-gray-600">{item.description}</p>
                                      <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                                  </div>
                              </div>

                              <div className="flex flex-col items-end w-full md:w-auto">
                                  <p className="font-bold text-2xl text-slate-800 mb-4">Rp {item.amount.toLocaleString('id-ID')}</p>
                                  <button 
                                    onClick={() => setSelectedRequest(item)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center"
                                  >
                                      <Eye className="w-4 h-4 mr-2" /> Review & Action
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* REVIEW MODAL */}
          {selectedRequest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                      <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                          <div>
                              <h3 className="text-xl font-bold">Detail Permintaan</h3>
                              <p className="text-slate-400 text-sm">Harap periksa kelengkapan data sebelum menyetujui pencairan dana.</p>
                          </div>
                          <button onClick={() => setSelectedRequest(null)} className="hover:text-red-400 transition"><X size={24} /></button>
                      </div>

                      <div className="p-6 overflow-y-auto">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 text-center">
                              <p className="text-sm text-gray-500 uppercase font-bold mb-2">Total Pengajuan Dana</p>
                              <p className="text-4xl font-bold text-slate-800">Rp {selectedRequest.amount.toLocaleString('id-ID')}</p>
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between border-b border-gray-100 pb-3">
                                  <span className="text-gray-500 font-medium">Pemohon</span>
                                  <span className="font-bold text-slate-800">{selectedRequest.requester}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-100 pb-3">
                                  <span className="text-gray-500 font-medium">Tipe Transaksi</span>
                                  <span className="font-bold text-slate-800 uppercase">{selectedRequest.type}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-100 pb-3">
                                  <span className="text-gray-500 font-medium">Tanggal Pengajuan</span>
                                  <span className="font-bold text-slate-800">{selectedRequest.date}</span>
                              </div>
                              
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                  <h4 className="font-bold text-blue-800 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2" /> Keterangan / Notes</h4>
                                  <p className="text-sm text-blue-900 leading-relaxed">
                                      {selectedRequest.notes}
                                  </p>
                              </div>

                              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start space-x-3">
                                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                  <div className="text-sm text-yellow-800">
                                      <p className="font-bold">Analisa Risiko</p>
                                      <p>Pastikan saldo likuiditas mencukupi. Persetujuan ini bersifat final dan akan meneruskan perintah bayar ke Kasir.</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 shrink-0">
                          <button 
                            onClick={() => handleReject(selectedRequest.id)}
                            className="px-4 py-3 border border-red-200 text-red-600 bg-white rounded-xl font-bold hover:bg-red-50 transition"
                          >
                              Tolak
                          </button>
                          <button 
                            onClick={() => handlePostpone()}
                            className="px-4 py-3 border border-gray-300 text-gray-600 bg-white rounded-xl font-bold hover:bg-gray-100 transition"
                          >
                              Tunda
                          </button>
                          <button 
                            onClick={() => handleApprove(selectedRequest.id)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition flex items-center"
                          >
                              <CheckCircle className="w-5 h-5 mr-2" /> Setujui Pencairan
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  const renderStrategy = () => (
      <div className="animate-fade-in">
          {renderHeader("Monitoring Strategis", "Analisis Wilayah & Performa Organisasi", <TrendingUp className="w-8 h-8 text-purple-400" />)}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-indigo-600" /> Top Wilayah (GMV)
                      </h3>
                      <div className="group relative">
                          <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-indigo-600" />
                          <div className="absolute right-0 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              <strong>GMV (Gross Merchandise Value)</strong> adalah total nilai transaksi kotor (Belanja + Ride + PPOB + Grosir). Bukan keuntungan bersih.
                          </div>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {['Jawa Barat', 'Jawa Timur', 'Jawa Tengah', 'Sumatera Utara', 'Sulawesi Selatan'].map((area, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                              <div className="flex items-center">
                                  <span className="font-bold text-gray-400 mr-4">#{idx+1}</span>
                                  <span className="font-bold text-slate-700">{area}</span>
                              </div>
                              <span className="font-bold text-indigo-600">Rp {(150 - idx*20)} Jt</span>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-red-600" /> Isu Operasional (Eskalasi)
                  </h3>
                  <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                          <h4 className="font-bold text-red-800 text-sm">Gangguan Koneksi Server Wilayah Timur</h4>
                          <p className="text-xs text-red-600 mt-1">Status: Sedang ditangani IT (ETA: 2 Jam)</p>
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                          <h4 className="font-bold text-orange-800 text-sm">Keterlambatan Logistik (JNE)</h4>
                          <p className="text-xs text-orange-600 mt-1">Status: Menunggu konfirmasi vendor</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        {view === 'dashboard' && renderDashboard()}
        {view === 'approvals' && renderApprovals()}
        {view === 'strategy' && renderStrategy()}
    </div>
  );
};
