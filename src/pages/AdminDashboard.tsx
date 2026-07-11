
import React, { useState, useEffect } from 'react';
import { User, HelpTicket, NewsItem, RidePricingConfig, ContentItem, SystemConfig, AppRoute } from '../types';
import { UserCheck, LayoutDashboard, Sliders, Save, Server, CheckCircle, XCircle, Send, Search, Users, ToggleLeft, ToggleRight, FileLock, Clock, Activity, AlertOctagon, Bike, Calculator, Lock, UserPlus } from 'lucide-react';
import { useToast } from '../components/Toast';
import { CreatorDashboard } from './CreatorDashboard';
import { AdminParameter } from './AdminParameter';
import api from '../services/api';

interface AdminDashboardProps {
  view: 'overview' | 'approvals' | 'members' | 'helpdesk' | 'content' | 'settings' | 'creator' | 'structure' | 'regions' | 'parameter' | 'eod'; 
  users: User[];
  tickets: HelpTicket[];
  news: NewsItem[]; 
  contents: ContentItem[]; 
  pricingConfig?: RidePricingConfig; // Legacy, used from SystemConfig now
  systemConfig: SystemConfig;
  onApproveRole: (userId: string, role: any) => void;
  onRejectRole: (userId: string) => void;
  onReplyTicket: (ticketId: string, response: string) => void;
  onApproveContent: (id: string) => void;
  onRejectContent: (id: string) => void;
  onUnpublishContent: (id: string) => void;
  onUpdatePricing?: (newConfig: RidePricingConfig) => void; // Legacy
  onUpdateSystemConfig: (newConfig: SystemConfig) => void;
  onAddContent: (content: ContentItem) => void; 
  onNavigate: (route: AppRoute) => void; 
  currentUser: User; 
  onUpdateUserStructure?: (userId: string, updatedUser: User) => void; 
}

// DEFINED KEYS for strict rendering
const CONFIG_KEYS: (keyof SystemConfig['features'])[] = [
    'marketplace', 'ride', 'wholesale', 'groupFinancing', 'evoting',
    'learning', 'shu', 'ppob', 'referral', 'community', 'chat', 'foodTracker'
];

interface ApprovalData {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    data: any;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  view, 
  users: initialUsers, // Rename to avoid confusion with local state
  contents, 
  systemConfig, 
  onUpdateSystemConfig, 
  onAddContent, 
  onNavigate, 
  currentUser, 
}) => {
  const { showToast } = useToast();
  
  // --- LOCAL STATE FOR DATA FETCHING ---
  const [liveUsers, setLiveUsers] = useState<User[]>([]);
  const [approvalsList, setApprovalsList] = useState<ApprovalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- CONFIG STATE ---
  const [localSysConfig, setLocalSysConfig] = useState<SystemConfig>(systemConfig);

  // --- FETCH DATA ON VIEW CHANGE ---
  useEffect(() => {
      if (view === 'members') fetchMembers();
      if (view === 'approvals') fetchApprovals();
  }, [view]);

  const fetchMembers = async () => {
      setIsLoading(true);
      try {
          const res = await api.get(`/admin/users?search=${searchTerm}`);
          setLiveUsers(res.data.data);
      } catch (error) {
          console.error("Failed fetch users", error);
      } finally { setIsLoading(false); }
  };

  const fetchApprovals = async () => {
      setIsLoading(true);
      try {
          const res = await api.get('/admin/approvals/users');
          setApprovalsList(res.data.data);
      } catch (error) {
          console.error("Failed fetch approvals", error);
      } finally { setIsLoading(false); }
  };

  // --- HANDLERS ---

  const handleProcessApproval = async (id: string, action: 'approve' | 'reject') => {
      if(!window.confirm(`Yakin ingin ${action === 'approve' ? 'MENYETUJUI' : 'MENOLAK'} pengajuan ini?`)) return;
      
      try {
          await api.put(`/admin/approvals/applications/${id}`, { 
              action, 
              adminNotes: action === 'approve' ? 'Disetujui Admin Pusat' : 'Data tidak valid/lengkap' 
          });
          
          showToast(`Pengajuan berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`, "success");
          fetchApprovals(); // Refresh list
      } catch (error: any) {
          showToast(error.response?.data?.message || "Gagal memproses", "error");
      }
  };

  const handleSearchMembers = (e: React.FormEvent) => {
      e.preventDefault();
      fetchMembers();
  };

  const handleSaveSystemConfig = () => { 
      onUpdateSystemConfig(localSysConfig); 
      showToast("Konfigurasi Sistem Berhasil Diupdate!", "success"); 
  };

  const handleToggleFeature = (feature: keyof SystemConfig['features']) => { 
      setLocalSysConfig(prev => ({ ...prev, features: { ...prev.features, [feature]: !prev.features[feature] } })); 
  };

  const updateRideConfig = (key: keyof RidePricingConfig, val: number) => {
      setLocalSysConfig(prev => ({ ...prev, rideConfig: { ...prev.rideConfig, [key]: val } }));
  };

  const updateTaxConfig = (key: keyof SystemConfig['taxConfig'], val: any) => {
      setLocalSysConfig(prev => ({ ...prev, taxConfig: { ...prev.taxConfig, [key]: val } }));
  };

  const updateGeneralConfig = (key: keyof SystemConfig['generalConfig'], val: any) => {
      setLocalSysConfig(prev => ({ ...prev, generalConfig: { ...prev.generalConfig, [key]: val } }));
  };

  // --- RENDERERS ---

  const renderHeader = (title: string, subtitle: string, icon: React.ReactNode, bgColor = 'bg-slate-900') => (
    <div className={`${bgColor} text-white p-6 rounded-2xl mb-8 flex items-center shadow-lg`}>
        <div className="bg-white/10 p-3 rounded-xl mr-4">
            {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-white/70">{subtitle}</p>
        </div>
    </div>
  );

  // 1. APPROVALS VIEW
  const renderApprovals = () => (
      <div className="animate-fade-in">
          {renderHeader("Persetujuan Role & Mitra", "Verifikasi pengajuan Driver, Merchant, dan Mitra lainnya", <UserCheck className="w-8 h-8 text-orange-400" />)}
          
          {isLoading ? (
              <div className="p-12 text-center text-gray-500">Memuat data...</div>
          ) : approvalsList.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-gray-100 shadow-sm">
                  <CheckCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Semua Beres!</h3>
                  <p className="text-gray-500">Tidak ada pengajuan role yang menunggu persetujuan saat ini.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-6">
                  {approvalsList.map((app) => (
                      <div key={app.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
                          <div className="flex flex-col md:flex-row justify-between">
                              <div className="flex-1 mb-4 md:mb-0">
                                  <div className="flex items-center mb-2">
                                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mr-3">
                                          {app.role.replace('_', ' ')}
                                      </span>
                                      <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <h3 className="text-xl font-bold text-slate-800">{app.userName}</h3>
                                  <p className="text-sm text-gray-500 mb-4">{app.userEmail}</p>
                                  
                                  {/* Dynamic Data Display based on JSON content */}
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-2">
                                      <p className="font-bold text-slate-700 border-b border-gray-200 pb-1 mb-2">Data Pengajuan:</p>
                                      {Object.entries(app.data).map(([key, value]) => (
                                          <div key={key} className="flex flex-col sm:flex-row sm:justify-between">
                                              <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                              <span className="font-medium text-slate-800">{String(value)}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              
                              <div className="flex flex-col justify-center space-y-3 md:ml-6 md:w-48 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                  <button 
                                    onClick={() => handleProcessApproval(app.id, 'approve')}
                                    className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20"
                                  >
                                      <CheckCircle className="w-4 h-4 mr-2" /> Setujui
                                  </button>
                                  <button 
                                    onClick={() => handleProcessApproval(app.id, 'reject')}
                                    className="w-full bg-white text-red-600 border border-red-200 py-2 rounded-lg font-bold hover:bg-red-50 flex items-center justify-center"
                                  >
                                      <XCircle className="w-4 h-4 mr-2" /> Tolak
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );

  // 2. MEMBER MANAGEMENT VIEW
  const renderMembers = () => (
      <div className="animate-fade-in">
          {renderHeader("Data Anggota", "Manajemen User, Reset PIN, dan Pemblokiran", <Users className="w-8 h-8 text-blue-400" />)}
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center bg-gray-50">
                  <form onSubmit={handleSearchMembers} className="relative w-full md:w-96 mb-4 md:mb-0">
                      <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                      <input 
                          type="text" 
                          placeholder="Cari nama, email, atau HP..." 
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </form>
                  <div className="text-sm text-gray-500">
                      Total: <strong>{liveUsers.length}</strong> Anggota Terdaftar
                  </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-white text-gray-500 font-bold uppercase border-b border-gray-200">
                          <tr>
                              <th className="p-4">Anggota</th>
                              <th className="p-4">Kontak</th>
                              <th className="p-4">Role & Status</th>
                              <th className="p-4">Saldo</th>
                              <th className="p-4 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {isLoading ? (
                              <tr><td colSpan={5} className="p-8 text-center">Memuat data...</td></tr>
                          ) : liveUsers.map(user => (
                              <tr key={user.id} className="hover:bg-gray-50 transition">
                                  <td className="p-4">
                                      <div className="flex items-center">
                                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 overflow-hidden">
                                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-800">{user.name}</p>
                                              <p className="text-xs text-gray-500 font-mono">{user.ktaId || 'NO KTA'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <p>{user.phone}</p>
                                      <p className="text-xs text-gray-400">{user.email}</p>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex flex-wrap gap-1">
                                          {user.roles.map(r => (
                                              <span key={r} className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-bold uppercase border border-blue-100">
                                                  {r}
                                              </span>
                                          ))}
                                      </div>
                                      <span className={`text-xs mt-1 block font-bold ${user.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                                          ● {user.status.toUpperCase()}
                                      </span>
                                  </td>
                                  <td className="p-4 font-mono text-slate-700">
                                      Rp {user.balance?.toLocaleString('id-ID') || 0}
                                  </td>
                                  <td className="p-4 text-right">
                                      <div className="flex justify-end space-x-2">
                                          <button 
                                            title="Reset PIN"
                                            onClick={() => { if(window.confirm('Reset PIN user ini ke default 123456?')) showToast("PIN Direset", "success"); }}
                                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                                          >
                                              <Lock className="w-4 h-4" />
                                          </button>
                                          <button 
                                            title="Blokir User"
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                          >
                                              <UserPlus className="w-4 h-4 rotate-45" /> {/* Use generic icon for block/ban */}
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  // 3. SETTINGS VIEW (Reused)
  const renderSettings = () => ( 
    <div className="animate-fade-in space-y-8">
        {renderHeader("Konfigurasi Sistem", "Kontrol fitur aktif, ekonomi, dan pajak KMP-ADNG (Super Admin Only)", <Sliders className="w-8 h-8 text-yellow-400" />, 'bg-indigo-900')}
        
        {/* --- 1. FEATURE TOGGLES --- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Server className="w-5 h-5 mr-2 text-blue-600" /> Kontrol Fitur (Feature Flags)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {CONFIG_KEYS.map((key) => { 
                    const isActive = localSysConfig.features[key]; 
                    return (
                        <div key={key} className={`p-4 rounded-xl border flex items-center justify-between transition ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                            <span className={`font-bold capitalize ${isActive ? 'text-emerald-800' : 'text-gray-500'}`}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <button onClick={() => handleToggleFeature(key)} className={`${isActive ? 'text-emerald-600' : 'text-gray-400'} transition-transform hover:scale-110`}>{isActive ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}</button>
                        </div>
                    ); 
                })}
            </div>
        </div>

        {/* --- 2. GENERAL POLICY & KTA --- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><FileLock className="w-5 h-5 mr-2 text-purple-600" /> Kebijakan Umum (Policy)</h3>
            <div className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Masa Berlaku KTA (Tahun)</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            className="w-full border rounded p-2 text-slate-800 font-bold" 
                            value={localSysConfig.generalConfig?.ktaValidityYears || 5} 
                            onChange={e => updateGeneralConfig('ktaValidityYears', parseInt(e.target.value))} 
                        />
                        <span className="ml-3 text-sm text-gray-500">Tahun</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Anggota wajib update data setelah masa ini berakhir.</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Max Login Attempts</label>
                    <input 
                        type="number" 
                        className="w-full border rounded p-2 text-slate-800" 
                        value={localSysConfig.generalConfig?.maxLoginAttempts || 3} 
                        onChange={e => updateGeneralConfig('maxLoginAttempts', parseInt(e.target.value))} 
                    />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* --- 3. RIDE PRICING CONFIG --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Bike className="w-5 h-5 mr-2 text-emerald-600" /> Tarif Transportasi</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif Dasar Motor (Base Fare)</label>
                        <input type="number" className="w-full border rounded p-2" value={localSysConfig.rideConfig.baseFareMotor} onChange={e => updateRideConfig('baseFareMotor', parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif per KM Motor</label>
                        <input type="number" className="w-full border rounded p-2" value={localSysConfig.rideConfig.pricePerKmMotor} onChange={e => updateRideConfig('pricePerKmMotor', parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif Dasar Mobil</label>
                        <input type="number" className="w-full border rounded p-2" value={localSysConfig.rideConfig.baseFareMobil} onChange={e => updateRideConfig('baseFareMobil', parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif per KM Mobil</label>
                        <input type="number" className="w-full border rounded p-2" value={localSysConfig.rideConfig.pricePerKmMobil} onChange={e => updateRideConfig('pricePerKmMobil', parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Komisi Aplikasi (%)</label>
                        <input type="number" className="w-full border rounded p-2" value={localSysConfig.rideConfig.appCommissionPercent} onChange={e => updateRideConfig('appCommissionPercent', parseFloat(e.target.value))} />
                    </div>
                </div>
            </div>

            {/* --- 4. TAX CONFIGURATION --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Calculator className="w-5 h-5 mr-2 text-orange-600" /> Parameter Pajak</h3>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6 border border-gray-200">
                    <div>
                        <span className="font-bold text-slate-700 block">Status PKP</span>
                        <span className="text-xs text-gray-500">Pengusaha Kena Pajak</span>
                    </div>
                    <button onClick={() => updateTaxConfig('isPKP', !localSysConfig.taxConfig.isPKP)} className={`${localSysConfig.taxConfig.isPKP ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {localSysConfig.taxConfig.isPKP ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                    </button>
                </div>

                <div className={`space-y-4 ${!localSysConfig.taxConfig.isPKP ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif PPN (%)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={localSysConfig.taxConfig.ppnRate * 100} onChange={e => updateTaxConfig('ppnRate', parseFloat(e.target.value)/100)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif PPh 21 Karyawan (%)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={localSysConfig.taxConfig.pph21Rate * 100} onChange={e => updateTaxConfig('pph21Rate', parseFloat(e.target.value)/100)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tarif PPh 23 Jasa (%)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={localSysConfig.taxConfig.pph23Rate * 100} onChange={e => updateTaxConfig('pph23Rate', parseFloat(e.target.value)/100)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">PPh Badan / Final UMKM (%)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={localSysConfig.taxConfig.corporateTaxRate * 100} onChange={e => updateTaxConfig('corporateTaxRate', parseFloat(e.target.value)/100)} />
                    </div>
                </div>
                {!localSysConfig.taxConfig.isPKP && (
                    <p className="text-xs text-orange-600 mt-4 text-center italic">*Mode Non-PKP aktif. Pajak diset ke 0% pada transaksi.</p>
                )}
            </div>
        </div>
        
        <div className="fixed bottom-8 right-8">
            <button onClick={handleSaveSystemConfig} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 shadow-2xl flex items-center transform hover:scale-105 transition">
                <Save className="w-6 h-6 mr-2" /> SIMPAN SEMUA KONFIGURASI
            </button>
        </div>
    </div> 
  );

  // 4. EOD PROCESS DOCUMENTATION VIEW
  const renderEOD = () => (
      <div className="animate-fade-in space-y-8">
          {renderHeader("Proses Akhir Hari (EOD)", "Housekeeping, Validasi Otomatis & Pembersihan Data", <Clock className="w-8 h-8 text-cyan-400" />)}

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start mb-6">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-800">Definisi Proses EOD</h3>
                      <p className="text-slate-600 mt-1 max-w-3xl">
                          Proses ini dijalankan secara otomatis oleh sistem setiap tengah malam (00:00 WIB) atau dapat dipicu manual oleh Super Admin.
                          Tujuannya adalah menjaga kebersihan database dan menegakkan aturan batas waktu pembayaran/KYC.
                      </p>
                  </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-bold text-slate-700 mb-4 uppercase tracking-wider text-sm">Daftar Tugas EOD (To-Do List System)</h4>
                  
                  <div className="space-y-4">
                      {/* TASK 1: KYC TIMEOUT */}
                      <div className="flex items-start p-4 bg-red-50 border border-red-100 rounded-xl">
                          <div className="mr-4 mt-1">
                              <AlertOctagon className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                              <h5 className="font-bold text-red-800">1. Hapus Calon Anggota Kedaluwarsa (30 Hari)</h5>
                              <p className="text-sm text-red-700 mt-1 mb-2">
                                  Menghapus data user yang mendaftar tapi tidak melengkapi KYC atau tidak membayar simpanan pokok dalam waktu 30 hari.
                              </p>
                              <div className="bg-white p-3 rounded border border-red-200 font-mono text-xs text-slate-600">
                                  <strong>Logic:</strong><br/>
                                  SELECT * FROM users WHERE status = 'pending' AND created_at &lt; (NOW() - INTERVAL '30 days')<br/>
                                  ACTION: DELETE USER
                              </div>
                          </div>
                          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">Pending Implementation</span>
                      </div>

                      {/* TASK 2: PAYMENT TIMEOUT */}
                      <div className="flex items-start p-4 bg-orange-50 border border-orange-100 rounded-xl">
                          <div className="mr-4 mt-1">
                              <Clock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                              <h5 className="font-bold text-orange-800">2. Batalkan Transaksi Pending (2x24 Jam)</h5>
                              <p className="text-sm text-orange-700 mt-1 mb-2">
                                  Membatalkan tagihan pendaftaran atau top-up yang tidak dibayar dalam waktu 48 jam.
                              </p>
                              <div className="bg-white p-3 rounded border border-orange-200 font-mono text-xs text-slate-600">
                                  <strong>Logic:</strong><br/>
                                  SELECT * FROM transactions WHERE status = 'pending' AND type = 'registration' AND created_at &lt; (NOW() - INTERVAL '48 hours')<br/>
                                  ACTION: UPDATE transactions SET status = 'failed'
                              </div>
                          </div>
                          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">Pending Implementation</span>
                      </div>

                      {/* TASK 3: NOTIFICATIONS */}
                      <div className="flex items-start p-4 bg-blue-50 border border-blue-100 rounded-xl">
                          <div className="mr-4 mt-1">
                              <Send className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                              <h5 className="font-bold text-blue-800">3. Kirim Pengingat (Reminder)</h5>
                              <p className="text-sm text-blue-700 mt-1 mb-2">
                                  Mengirim notifikasi WA/Email kepada calon anggota yang mendekati batas waktu penghapusan (H-7, H-3, H-1).
                              </p>
                              <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs text-slate-600">
                                  <strong>Logic:</strong><br/>
                                  Check users nearing deadline &rarr; Trigger Notification Service.
                              </div>
                          </div>
                          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">Pending Implementation</span>
                      </div>

                      {/* TASK 4: REFERRAL SETTLEMENT */}
                      <div className="flex items-start p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="mr-4 mt-1">
                              <Calculator className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                              <h5 className="font-bold text-emerald-800">4. Settlement Bonus Referral</h5>
                              <p className="text-sm text-emerald-700 mt-1 mb-2">
                                  Menghitung agregat anggota baru yang berhasil mendaftar (bayar lunas) hari ini dan membagikan bonus referral (Rp 30.000/orang) ke dompet pengundang.
                              </p>
                              <div className="bg-white p-3 rounded border border-emerald-200 font-mono text-xs text-slate-600">
                                  <strong>Logic:</strong><br/>
                                  SELECT users WHERE status='active' AND referral_settled=false<br/>
                                  ACTION: UPDATE wallets SET balance = balance + (count * 30000)
                              </div>
                          </div>
                          <button 
                            onClick={async () => {
                                if(!window.confirm('Jalankan proses Settlement Referral sekarang?')) return;
                                try {
                                    const res = await api.post('/admin/eod-settlement');
                                    showToast(res.data.message, "success");
                                } catch (err: any) {
                                    showToast(err.response?.data?.message || "Gagal menjalankan settlement", "error");
                                }
                            }}
                            className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm"
                          >
                              Jalankan Sekarang
                          </button>
                      </div>
                  </div>
              </div>

              <div className="mt-8 flex justify-end">
                  <button disabled className="bg-gray-300 text-gray-500 px-6 py-3 rounded-xl font-bold cursor-not-allowed flex items-center">
                      <Server className="w-5 h-5 mr-2" /> Jalankan EOD Keseluruhan (Segera Hadir)
                  </button>
              </div>
          </div>
      </div>
  );

  // --- MAIN RENDER SWITCH ---
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
       {/* 
          OVERVIEW DASHBOARD (Keep original, simplified here for brevity) 
       */}
       {view === 'overview' && (
           <div className="animate-fade-in">
               {renderHeader("Admin Overview", "Ringkasan data ekosistem KMP-ADNG", <LayoutDashboard className="w-8 h-8 text-emerald-400" />)}
               {/* Add stats cards here if needed, or redirect to specific tabs */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <button onClick={() => onNavigate(AppRoute.ADMIN_APPROVALS)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-left border border-gray-200">
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Persetujuan Pending</h3>
                       <p className="text-gray-500 text-sm">Cek pengajuan role driver, merchant, dll.</p>
                   </button>
                   <button onClick={() => onNavigate(AppRoute.ADMIN_MEMBERS)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-left border border-gray-200">
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Data Anggota</h3>
                       <p className="text-gray-500 text-sm">Kelola {liveUsers.length || '...'} anggota terdaftar.</p>
                   </button>
                   <button onClick={() => onNavigate(AppRoute.ADMIN_EOD)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition text-left border border-gray-200">
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Proses EOD</h3>
                       <p className="text-gray-500 text-sm">Monitor housekeeping & validasi sistem.</p>
                   </button>
               </div>
           </div>
       )}

       {view === 'approvals' && renderApprovals()}
       {view === 'members' && renderMembers()}
       {view === 'settings' && renderSettings()}
       {view === 'eod' && renderEOD()} {/* NEW VIEW RENDER */}
       
       {/* REUSE ADMIN PARAMETER FOR REGIONS & PARAMETER VIEWS */}
       {(view === 'regions' || view === 'parameter') && (
           <AdminParameter /> 
       )}
       
       {/* Keep other views placeholder or imported */}
       {view === 'helpdesk' && <div>Helpdesk View (Coming Soon)</div>}
       {view === 'content' && <div>Content Management (Use Creator Studio)</div>}
       {view === 'creator' && <CreatorDashboard user={currentUser} contents={contents} onAddContent={onAddContent} onNavigate={onNavigate} />}
       {view === 'structure' && <div>Structure View (Coming Soon)</div>}
    </div>
  );
};
