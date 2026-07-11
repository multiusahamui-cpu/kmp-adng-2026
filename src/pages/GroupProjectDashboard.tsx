
import React, { useState, useEffect } from 'react';
import { User, AppRoute } from '../types';
import { 
    ChevronLeft, 
    Sprout, 
    Users, 
    FileText, 
    TrendingUp, 
    Calendar,
    Plus,
    Camera,
    UploadCloud,
    CheckCircle,
    Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import { useToast } from '../components/Toast';

interface GroupProjectDashboardProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
}

const INITIAL_PROJECT = {
    id: 'proj-001',
    name: 'Kopi Tani Maju Bersama',
    type: 'Pertanian Kopi',
    location: 'Desa Sukamaju, Blok C',
    startDate: '01 Okt 2024',
    endDate: '01 Apr 2025 (Estimasi)',
    capitalTotal: 25000000,
    capitalUsed: 8500000,
    progress: 35,
    status: 'Berjalan',
    leaderId: 'u1', 
    viceLeaderId: 'u2',
    members: [
        { name: 'Ulpermadi (Anda)', role: 'Ketua' },
        { name: 'Budi Santoso', role: 'Wakil' },
        { name: 'Sari', role: 'Anggota' },
        { name: 'Andi', role: 'Anggota' },
        { name: 'Rina', role: 'Anggota' },
    ],
    timeline: [
        { date: '01 Okt', event: 'Pencairan Modal Tahap 1', amount: 10000000 },
        { date: '05 Okt', event: 'Belanja Bibit & Pupuk', amount: -4500000 },
        { date: '10 Okt', event: 'Upah Tenaga Kerja Tanam', amount: -2000000 },
        { date: '15 Okt', event: 'Sewa Alat', amount: -2000000 },
    ]
};

const CHART_DATA = [
    { name: 'Okt W1', keluar: 4500000 },
    { name: 'Okt W2', keluar: 2000000 },
    { name: 'Okt W3', keluar: 2000000 },
    { name: 'Okt W4', keluar: 0 },
];

export const GroupProjectDashboard: React.FC<GroupProjectDashboardProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'report'>('overview');
  const { showToast } = useToast();
  
  const [projectData, setProjectData] = useState(() => loadData(STORAGE_KEYS.GROUP_PROJECT, INITIAL_PROJECT));

  useEffect(() => saveData(STORAGE_KEYS.GROUP_PROJECT, projectData), [projectData]);

  const isLeader = user.id === projectData.leaderId;
  const isViceLeader = user.id === projectData.viceLeaderId;
  const canEdit = isLeader || isViceLeader;

  const [expenseForm, setExpenseForm] = useState({ item: '', amount: '', date: new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'short'}) });

  const handleAddExpense = () => {
      if (!expenseForm.item || !expenseForm.amount) return;
      const amountVal = parseInt(expenseForm.amount);
      
      const newTimelineItem = {
          date: expenseForm.date,
          event: expenseForm.item,
          amount: -amountVal
      };

      setProjectData(prev => ({
          ...prev,
          capitalUsed: prev.capitalUsed + amountVal,
          timeline: [newTimelineItem, ...prev.timeline] 
      }));

      setExpenseForm({ item: '', amount: '', date: new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'short'}) });
      showToast("Laporan belanja berhasil disimpan!", "success");
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
       
       <button 
        onClick={() => onNavigate(AppRoute.KOPERASI)}
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6 transition"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Koperasi
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center space-x-4">
                  <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
                      <Sprout className="w-10 h-10" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-bold text-slate-800">{projectData.name}</h1>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="flex items-center mr-4"><TrendingUp className="w-4 h-4 mr-1" /> {projectData.type}</span>
                          <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Sejak {projectData.startDate}</span>
                      </div>
                  </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                  <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                      Status: {projectData.status}
                  </span>
                  <div className="mt-2 text-sm text-slate-600 font-medium">
                      Peran Anda: <span className="text-emerald-600 font-bold">{isLeader ? 'Ketua (Admin)' : isViceLeader ? 'Wakil (Admin)' : 'Anggota'}</span>
                  </div>
              </div>
          </div>

          <div>
              <div className="flex justify-between text-sm mb-2 font-bold text-slate-700">
                  <span>Progress Fase Tanam</span>
                  <span>{projectData.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${projectData.progress}%` }}></div>
              </div>
          </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
          >
            Ringkasan
          </button>
          <button 
            onClick={() => setActiveTab('financial')}
            className={`px-6 py-3 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'financial' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
          >
            Keuangan & Belanja
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`px-6 py-3 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'report' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
          >
            Laporan Lapangan
          </button>
      </div>

      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                          <p className="text-sm text-blue-600 font-bold mb-1">Total Modal Disetujui</p>
                          <p className="text-2xl font-bold text-slate-800">Rp {projectData.capitalTotal.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                          <p className="text-sm text-orange-600 font-bold mb-1">Modal Terpakai</p>
                          <p className="text-2xl font-bold text-slate-800">Rp {projectData.capitalUsed.toLocaleString('id-ID')}</p>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-lg text-slate-800 mb-4">Aktivitas Pengeluaran (Bulan Ini)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="keluar" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pengeluaran" />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-emerald-600" /> Anggota Tim</h3>
                  <div className="space-y-4">
                      {projectData.members.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                              <span className="text-sm font-medium text-slate-700">{m.name}</span>
                              <span className={`text-xs px-2 py-1 rounded font-bold 
                                  ${m.role === 'Ketua' ? 'bg-blue-100 text-blue-700' : 
                                    m.role === 'Wakil' ? 'bg-purple-100 text-purple-700' : 
                                    'bg-gray-100 text-gray-500'}
                              `}>{m.role}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'financial' && (
          <div className="animate-fade-in space-y-6">
              
              {!canEdit && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-start space-x-3">
                      <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600">Anda sedang dalam mode <strong>Lihat Saja</strong>. Hanya Ketua dan Wakil Ketua yang dapat menginput pengeluaran modal.</p>
                  </div>
              )}

              {canEdit && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center"><UploadCloud className="w-5 h-5 mr-2 text-emerald-600" /> Input Laporan Belanja</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Item Belanja</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                placeholder="Contoh: Pupuk Urea 50kg" 
                                value={expenseForm.item}
                                onChange={e => setExpenseForm({...expenseForm, item: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                              <input 
                                type="number" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                placeholder="0" 
                                value={expenseForm.amount}
                                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Foto Struk/Nota</label>
                              <button className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center">
                                  <Camera className="w-4 h-4 mr-2" /> Upload Nota
                              </button>
                          </div>
                      </div>
                      <div className="mt-4 text-right">
                          <button 
                            onClick={handleAddExpense}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-md"
                          >
                              Simpan Laporan
                          </button>
                      </div>
                  </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-bold text-slate-800">Riwayat Mutasi Modal</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-white text-gray-500 font-bold border-b border-gray-100">
                          <tr>
                              <th className="p-4">Tanggal</th>
                              <th className="p-4">Keterangan</th>
                              <th className="p-4 text-right">Jumlah</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {projectData.timeline.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                  <td className="p-4 text-gray-600">{item.date}</td>
                                  <td className="p-4 font-medium text-slate-800">{item.event}</td>
                                  <td className={`p-4 text-right font-bold ${item.amount < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                      {item.amount < 0 ? '- ' : '+ '} Rp {Math.abs(item.amount).toLocaleString('id-ID')}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'report' && (
          <div className="animate-fade-in space-y-6">
              {canEdit && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center py-12">
                      <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Buat Laporan Berkala</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">Laporan kemajuan fisik (foto tanaman, kondisi lahan) wajib diupload setiap 2 minggu sekali.</p>
                      <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                          <Plus className="w-4 h-4 inline mr-2" /> Buat Laporan Baru
                      </button>
                  </div>
              )}

              <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-800">Laporan Sebelumnya</h3>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                          <img src="https://picsum.photos/id/112/200/200" alt="Lahan" className="w-full h-full object-cover" />
                      </div>
                      <div>
                          <div className="flex justify-between items-start w-full">
                              <h4 className="font-bold text-slate-800">Laporan Minggu ke-2 Oktober</h4>
                              <span className="text-xs text-gray-400">14 Okt 2024</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">Kondisi bibit mulai tumbuh tunas. Pemupukan tahap pertama selesai dilakukan sesuai jadwal. Cuaca cukup mendukung.</p>
                          <div className="mt-2 flex items-center text-xs text-emerald-600 font-bold">
                              <CheckCircle className="w-3 h-3 mr-1" /> Diverifikasi Admin Pusat
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
