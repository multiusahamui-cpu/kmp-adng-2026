
import React, { useState, useEffect } from 'react';
import { SystemConfig, User, AppRoute } from '../types';
import { accountingService, Account, JournalEntry, JournalLine } from '../services/accounting.service';
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    FileText, 
    Download,
    PieChart,
    PlusCircle,
    Edit,
    Trash2,
    X,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Calculator,
    RefreshCw,
    Search
} from 'lucide-react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { useToast } from '../components/Toast';

interface AccountantDashboardProps {
  user: User;
  view: 'dashboard' | 'coa' | 'journal' | 'cashflow' | 'reports' | 'tax';
  systemConfig: SystemConfig;
  onNavigate: (route: AppRoute) => void;
}

// Remove local interfaces Account, JournalLine, JournalEntry since we import them

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ user, view, systemConfig, onNavigate }) => {
  const { showToast } = useToast();
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', route: AppRoute.ACCOUNTANT_DASHBOARD },
    { id: 'coa', label: 'Chart of Accounts', route: AppRoute.ACCOUNTANT_COA },
    { id: 'journal', label: 'Jurnal Umum', route: AppRoute.ACCOUNTANT_JOURNAL },
    { id: 'cashflow', label: 'Arus Kas', route: AppRoute.ACCOUNTANT_CASHFLOW },
    { id: 'reports', label: 'Laporan', route: AppRoute.ACCOUNTANT_REPORTS },
    { id: 'tax', label: 'Pajak', route: AppRoute.ACCOUNTANT_TAX },
  ];

  // STATE MANAGEMENT
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // FETCH DATA
  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          try {
              const [coaData, journalData] = await Promise.all([
                  accountingService.getCOA(),
                  accountingService.getJournals()
              ]);
              setAccounts(coaData);
              setJournals(journalData);
          } catch (error) {
              console.error("Failed to fetch accounting data", error);
              showToast("Gagal memuat data akuntansi", "error");
          } finally {
              setIsLoading(false);
          }
      };
      fetchData();
  }, []);

  // Modal States
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  
  // Form States
  const [coaForm, setCoaForm] = useState<Partial<Account>>({ code: '', name: '', type: 'Aktiva' });
  const [journalForm, setJournalForm] = useState({
      date: new Date().toISOString().split('T')[0],
      ref: '',
      description: '',
      lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }] 
  });

  // --- HELPERS ---
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown Account';
  
  const calculateBalance = () => {
      const totalDebit = journalForm.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = journalForm.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
      return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit && totalDebit > 0 };
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

  // --- HANDLERS ---
  const handleSaveAccount = async () => { 
      if(!coaForm.code || !coaForm.name) return showToast("Lengkapi data akun", "error"); 
      
      try {
          if (coaForm.id) { 
              const updatedAccount = await accountingService.updateAccount(coaForm.id, coaForm);
              setAccounts(prev => prev.map(a => a.id === coaForm.id ? updatedAccount : a)); 
              showToast("Akun berhasil diperbarui", "success"); 
          } else { 
              const newAccount = await accountingService.createAccount(coaForm);
              setAccounts(prev => [...prev, newAccount]); 
              showToast("Akun baru ditambahkan", "success"); 
          } 
          setIsCoaModalOpen(false); 
          setCoaForm({ code: '', name: '', type: 'Aktiva' }); 
      } catch (error) {
          console.error(error);
          showToast("Gagal menyimpan akun", "error");
      }
  };

  const handleDeleteAccount = async (id: string) => { 
      if(window.confirm("Hapus akun ini?")) { 
          try {
              await accountingService.deleteAccount(id);
              setAccounts(prev => prev.filter(a => a.id !== id)); 
              showToast("Akun dihapus", "info"); 
          } catch (error) {
              console.error(error);
              showToast("Gagal menghapus akun", "error");
          }
      } 
  };

  const handleEditAccount = (account: Account) => { setCoaForm(account); setIsCoaModalOpen(true); };
  
  const handleAddJournalLine = () => { setJournalForm(prev => ({ ...prev, lines: [...prev.lines, { accountId: '', debit: 0, credit: 0 }] })); };
  
  const handleRemoveJournalLine = (index: number) => { if(journalForm.lines.length <= 2) return showToast("Minimal 2 baris jurnal", "error"); setJournalForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) })); };
  
  const updateJournalLine = (index: number, field: keyof JournalLine, value: any) => { const newLines = [...journalForm.lines]; newLines[index] = { ...newLines[index], [field]: value }; if (field === 'debit' && value > 0) newLines[index].credit = 0; if (field === 'credit' && value > 0) newLines[index].debit = 0; setJournalForm(prev => ({ ...prev, lines: newLines })); };
  
  const handleSaveJournal = async () => { 
      const { isBalanced, totalDebit } = calculateBalance(); 
      if (!journalForm.ref || !journalForm.description) return showToast("Lengkapi referensi dan keterangan", "error"); 
      if (journalForm.lines.some(l => !l.accountId)) return showToast("Pilih akun untuk semua baris", "error"); 
      if (!isBalanced) return showToast("Jurnal tidak balance!", "error"); 
      
      try {
          const newEntry = await accountingService.createJournal({
              ...journalForm,
              total: totalDebit
          });
          setJournals([newEntry, ...journals]); 
          showToast("Jurnal berhasil diposting", "success"); 
          setIsJournalModalOpen(false); 
          setJournalForm({ date: new Date().toISOString().split('T')[0], ref: '', description: '', lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }] }); 
      } catch (error) {
          console.error(error);
          showToast("Gagal memposting jurnal", "error");
      }
  };

  // ... (Rest of renderers)

  // --- RENDERERS ---

  // ... (Keep renderDashboard, renderCOA, renderJournal, renderCashflow, renderReports)
  const renderDashboard = () => ( <div className="space-y-6 animate-fade-in"><div className="mb-8"><h1 className="text-2xl font-bold text-slate-800">Dashboard Keuangan</h1><p className="text-slate-500 text-sm">Ringkasan Kesehatan Finansial Koperasi • Staff: {user.name}</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500"><div className="flex justify-between items-start mb-2"><p className="text-gray-500 text-sm font-medium uppercase">Total Aset</p><DollarSign className="w-5 h-5 text-emerald-500" /></div><h3 className="text-2xl font-bold text-slate-800">Rp 150.000.000</h3></div><div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500"><div className="flex justify-between items-start mb-2"><p className="text-gray-500 text-sm font-medium uppercase">Kewajiban (Liabilitas)</p><TrendingDown className="w-5 h-5 text-red-500" /></div><h3 className="text-2xl font-bold text-slate-800">Rp 45.000.000</h3></div><div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500"><div className="flex justify-between items-start mb-2"><p className="text-gray-500 text-sm font-medium uppercase">Ekuitas (Modal)</p><PieChart className="w-5 h-5 text-blue-500" /></div><h3 className="text-2xl font-bold text-slate-800">Rp 105.000.000</h3></div></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-lg font-bold text-slate-800 mb-6">Trend Arus Kas (Oktober 2024)</h3><div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{ name: 'W1', income: 15, expense: 5 }, { name: 'W2', income: 18, expense: 12 }, { name: 'W3', income: 12, expense: 8 }, { name: 'W4', income: 22, expense: 6 },]}><defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" name="Masuk (Juta)" /><Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" name="Keluar (Juta)" /></AreaChart></ResponsiveContainer></div></div></div> );
  const handleSeedCOA = async () => {
      if(window.confirm("Reset & Populate Default COA? This will add missing default accounts.")) {
          try {
              await accountingService.seedCOA();
              const coaData = await accountingService.getCOA();
              setAccounts(coaData);
              showToast("Default COA Populated", "success");
          } catch (error) {
              console.error(error);
              showToast("Failed to seed COA", "error");
          }
      }
  };

  const renderCOA = () => {
      const filteredAccounts = accounts.filter(a => 
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.type.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a,b) => a.code.localeCompare(b.code));

      return (
          <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-800">Chart of Accounts (COA)</h1>
                      <p className="text-slate-500 text-sm">Pengaturan Kode Akun Perkiraan</p>
                  </div>
                  <div className="flex space-x-2">
                      <button onClick={handleSeedCOA} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center hover:bg-gray-50 transition">
                          <RefreshCw className="w-4 h-4 mr-2" /> Reset Default
                      </button>
                      <button onClick={() => { setCoaForm({code: '', name: '', type: 'Aktiva'}); setIsCoaModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-blue-700 shadow-lg transition">
                          <PlusCircle className="w-4 h-4 mr-2" /> Tambah Akun
                      </button>
                  </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Toolbar */}
                  <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center bg-gray-50">
                      <div className="relative w-full md:w-96 mb-4 md:mb-0">
                          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                          <input 
                              type="text" 
                              placeholder="Cari kode, nama, atau kategori akun..." 
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <div className="text-sm text-gray-500">
                          Total: <strong>{filteredAccounts.length}</strong> Akun
                      </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white text-gray-500 font-bold uppercase border-b border-gray-200">
                              <tr>
                                  <th className="p-4 w-32">Kode</th>
                                  <th className="p-4">Nama Akun</th>
                                  <th className="p-4">Kategori</th>
                                  <th className="p-4 text-right">Aksi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {isLoading ? (
                                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">Memuat data COA...</td></tr>
                              ) : filteredAccounts.length === 0 ? (
                                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">Tidak ada akun yang ditemukan.</td></tr>
                              ) : filteredAccounts.map((item) => (
                                  <tr key={item.id} className="hover:bg-gray-50 transition">
                                      <td className="p-4 font-mono font-bold text-blue-600">{item.code}</td>
                                      <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                              item.type === 'Aktiva' ? 'bg-green-50 text-green-700 border-green-100' : 
                                              item.type === 'Kewajiban' ? 'bg-red-50 text-red-700 border-red-100' : 
                                              item.type === 'Ekuitas' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                              item.type === 'Pendapatan' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                              'bg-orange-50 text-orange-700 border-orange-100'
                                          }`}>
                                              {item.type}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          <div className="flex justify-end space-x-2">
                                              <button onClick={() => handleEditAccount(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Akun">
                                                  <Edit size={16} />
                                              </button>
                                              <button onClick={() => handleDeleteAccount(item.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus Akun">
                                                  <Trash2 size={16} />
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
  };
  const renderJournal = () => ( <div className="animate-fade-in"><div className="flex justify-between items-center mb-8"><div><h1 className="text-2xl font-bold text-slate-800">Jurnal Umum</h1><p className="text-slate-500 text-sm">Pencatatan Transaksi Harian (Double Entry)</p></div><div className="flex space-x-2"><button className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50"><Download className="w-4 h-4 mr-2" /> Export</button><button onClick={() => setIsJournalModalOpen(true)} className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-lg"><PlusCircle className="w-4 h-4 mr-2" /> Buat Jurnal Baru</button></div></div><div className="space-y-4">{journals.map((entry) => (<div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center"><div><span className="font-bold text-slate-800 text-lg mr-3">{entry.date}</span><span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{entry.ref}</span></div><p className="font-medium text-gray-600">{entry.description}</p></div><table className="w-full text-sm"><thead className="bg-white text-gray-400 font-medium text-xs uppercase border-b border-gray-100"><tr><th className="p-3 text-left w-1/2">Akun / Keterangan</th><th className="p-3 text-right w-1/4">Debit</th><th className="p-3 text-right w-1/4">Kredit</th></tr></thead><tbody className="divide-y divide-gray-50">{entry.lines.map((line, idx) => (<tr key={idx}><td className="p-3 pl-4 text-slate-700">{getAccountName(line.accountId)}</td><td className="p-3 text-right font-mono text-slate-600">{line.debit > 0 ? `Rp ${line.debit.toLocaleString('id-ID')}` : '-'}</td><td className="p-3 text-right font-mono text-slate-600">{line.credit > 0 ? `Rp ${line.credit.toLocaleString('id-ID')}` : '-'}</td></tr>))}</tbody><tfoot className="bg-gray-50"><tr><td className="p-3 text-right font-bold text-gray-500">TOTAL</td><td className="p-3 text-right font-bold text-emerald-600">Rp {entry.total.toLocaleString('id-ID')}</td><td className="p-3 text-right font-bold text-emerald-600">Rp {entry.total.toLocaleString('id-ID')}</td></tr></tfoot></table></div>))}</div></div> );
  const renderCashflow = () => ( <div className="animate-fade-in"><div className="mb-8"><h1 className="text-2xl font-bold text-slate-800">Analisa Arus Kas</h1><p className="text-slate-500 text-sm">Monitoring Inflow & Outflow Detail</p></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="font-bold text-lg text-emerald-700 mb-4 flex items-center"><ArrowRight className="w-5 h-5 mr-2 rotate-45" /> Sumber Pemasukan (Inflow)</h3><div className="space-y-4"><div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg"><div><p className="font-bold text-emerald-900">Penjualan Tunai</p><p className="text-xs text-emerald-600">Operating Activity</p></div><span className="font-bold text-emerald-700">Rp 67.500.000</span></div><div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg"><div><p className="font-bold text-emerald-900">Setoran Modal Anggota</p><p className="text-xs text-emerald-600">Financing Activity</p></div><span className="font-bold text-emerald-700">Rp 50.000.000</span></div><div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg"><div><p className="font-bold text-emerald-900">Pendapatan Jasa</p><p className="text-xs text-emerald-600">Operating Activity</p></div><span className="font-bold text-emerald-700">Rp 7.500.000</span></div><div className="pt-4 border-t border-gray-100 flex justify-between"><span className="font-bold text-gray-500">Total Inflow</span><span className="font-bold text-emerald-600 text-xl">Rp 125.000.000</span></div></div></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="font-bold text-lg text-red-700 mb-4 flex items-center"><ArrowRight className="w-5 h-5 mr-2 -rotate-45" /> Objek Pengeluaran (Outflow)</h3><div className="space-y-4"><div className="flex justify-between items-center p-3 bg-red-50 rounded-lg"><div><p className="font-bold text-red-900">Pembelian Stok</p><p className="text-xs text-red-600">Variable Cost</p></div><span className="font-bold text-red-700">Rp 15.000.000</span></div><div className="flex justify-between items-center p-3 bg-red-50 rounded-lg"><div><p className="font-bold text-red-900">Gaji Karyawan</p><p className="text-xs text-red-600">Fixed Cost</p></div><span className="font-bold text-red-700">Rp 12.000.000</span></div><div className="flex justify-between items-center p-3 bg-red-50 rounded-lg"><div><p className="font-bold text-red-900">Listrik & Air</p><p className="text-xs text-red-600">Operational</p></div><span className="font-bold text-red-700">Rp 2.500.000</span></div><div className="pt-4 border-t border-gray-100 flex justify-between"><span className="font-bold text-gray-500">Total Outflow</span><span className="font-bold text-red-600 text-xl">Rp 29.500.000</span></div></div></div></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-slate-800">Net Cash Flow</h3><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Surplus</span></div><div className="flex items-end space-x-2"><span className="text-4xl font-bold text-blue-600">Rp 95.500.000</span><span className="text-gray-500 mb-1 text-sm">Posisi Kas Akhir</span></div><div className="w-full bg-gray-200 h-2 rounded-full mt-4 overflow-hidden"><div className="bg-blue-600 h-full rounded-full" style={{width: '76%'}}></div></div></div></div> );
  const renderReports = () => ( <div className="animate-fade-in">{renderHeader("Laporan Keuangan", "Neraca & Laba Rugi", <FileText className="w-8 h-8 text-blue-400" />)}<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition"><FileText className="w-6 h-6" /></div><h3 className="font-bold text-lg text-slate-800">Laporan Neraca (Balance Sheet)</h3><p className="text-gray-500 text-sm mt-2">Posisi keuangan koperasi per periode tertentu.</p><button className="mt-4 text-blue-600 text-sm font-bold">Lihat Detail</button></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition"><TrendingUp className="w-6 h-6" /></div><h3 className="font-bold text-lg text-slate-800">Laporan Laba Rugi (Profit & Loss)</h3><p className="text-gray-500 text-sm mt-2">Kinerja operasional dan profitabilitas koperasi.</p><button className="mt-4 text-emerald-600 text-sm font-bold">Lihat Detail</button></div></div></div> );

  // --- NEW: TAX RENDERER ---
  const renderTax = () => {
      // 1. Calculate PPN Output (Taxable Income * Rate)
      // Logic: Filter accounts of type 'Pendapatan' (Revenue)
      const taxableRevenue = journals.reduce((sum, j) => {
          return sum + j.lines.reduce((lSum, l) => {
              const acc = accounts.find(a => a.id === l.accountId);
              // Simplified: Only consider 'Pendapatan' type as taxable service
              return (acc?.type === 'Pendapatan' && l.credit > 0) ? lSum + l.credit : lSum;
          }, 0);
      }, 0);
      const ppnPayable = taxableRevenue * systemConfig.taxConfig.ppnRate;

      // 2. Calculate PPh 21 (Employee Salary Withholding)
      const salaryExpense = journals.reduce((sum, j) => {
          return sum + j.lines.reduce((lSum, l) => {
              const acc = accounts.find(a => a.id === l.accountId);
              // Find 'Beban Gaji' explicitly (id 5000 in INITIAL_COA) or generally
              return (acc?.name.includes('Gaji') && l.debit > 0) ? lSum + l.debit : lSum;
          }, 0);
      }, 0);
      const pph21Payable = salaryExpense * systemConfig.taxConfig.pph21Rate;

      // 3. Calculate Corporate Tax (Profit * Rate)
      // Simplified Profit = Revenue - Expense
      const totalRevenue = taxableRevenue; // Simplified
      const totalExpense = journals.reduce((sum, j) => {
          return sum + j.lines.reduce((lSum, l) => {
              const acc = accounts.find(a => a.id === l.accountId);
              return (acc?.type === 'Beban' && l.debit > 0) ? lSum + l.debit : lSum;
          }, 0);
      }, 0);
      const netProfit = totalRevenue - totalExpense;
      const corporateTax = netProfit > 0 ? netProfit * systemConfig.taxConfig.corporateTaxRate : 0;

      return (
          <div className="animate-fade-in space-y-8">
              {renderHeader("Manajemen Pajak (PKP)", "Kalkulasi Kewajiban Perpajakan & Pelaporan SPT", <Calculator className="w-8 h-8 text-orange-400" />)}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                      <p className="text-gray-500 text-xs font-bold uppercase mb-1">PPN Masa (11%)</p>
                      <h3 className="text-2xl font-bold text-slate-800">Rp {ppnPayable.toLocaleString('id-ID')}</h3>
                      <p className="text-xs text-orange-600 mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Belum setor</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                      <p className="text-gray-500 text-xs font-bold uppercase mb-1">PPh 21 (Karyawan)</p>
                      <h3 className="text-2xl font-bold text-slate-800">Rp {pph21Payable.toLocaleString('id-ID')}</h3>
                      <p className="text-xs text-blue-600 mt-1">Estimasi Potong Gaji</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                      <p className="text-gray-500 text-xs font-bold uppercase mb-1">PPh 23 (Jasa)</p>
                      <h3 className="text-2xl font-bold text-slate-800">Rp 0</h3>
                      <p className="text-xs text-purple-600 mt-1">Tidak ada transaksi</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
                      <p className="text-gray-500 text-xs font-bold uppercase mb-1">PPh Badan (Tahunan)</p>
                      <h3 className="text-2xl font-bold text-slate-800">Rp {corporateTax.toLocaleString('id-ID')}</h3>
                      <p className="text-xs text-emerald-600 mt-1">Estimasi Berjalan</p>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-slate-800">Rincian Objek Pajak Bulan Ini</h3>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center">
                          <FileText className="w-4 h-4 mr-2" /> Buat Laporan SPT
                      </button>
                  </div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-white text-gray-500 font-bold uppercase border-b border-gray-200">
                          <tr>
                              <th className="p-4">Jenis Pajak</th>
                              <th className="p-4">Dasar Pengenaan Pajak (DPP)</th>
                              <th className="p-4">Tarif</th>
                              <th className="p-4 text-right">Pajak Terutang</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          <tr>
                              <td className="p-4 font-medium text-slate-800">PPN Keluaran (Jasa Kena Pajak)</td>
                              <td className="p-4">Rp {taxableRevenue.toLocaleString('id-ID')}</td>
                              <td className="p-4">{(systemConfig.taxConfig.ppnRate * 100)}%</td>
                              <td className="p-4 text-right font-bold text-orange-600">Rp {ppnPayable.toLocaleString('id-ID')}</td>
                          </tr>
                          <tr>
                              <td className="p-4 font-medium text-slate-800">PPh Pasal 21 (Gaji Pegawai)</td>
                              <td className="p-4">Rp {salaryExpense.toLocaleString('id-ID')}</td>
                              <td className="p-4">~{(systemConfig.taxConfig.pph21Rate * 100)}% (Avg)</td>
                              <td className="p-4 text-right font-bold text-blue-600">Rp {pph21Payable.toLocaleString('id-ID')}</td>
                          </tr>
                          <tr>
                              <td className="p-4 font-medium text-slate-800">PPh Badan (Estimasi Laba)</td>
                              <td className="p-4">Rp {Math.max(0, netProfit).toLocaleString('id-ID')}</td>
                              <td className="p-4">{(systemConfig.taxConfig.corporateTaxRate * 100)}%</td>
                              <td className="p-4 text-right font-bold text-emerald-600">Rp {corporateTax.toLocaleString('id-ID')}</td>
                          </tr>
                      </tbody>
                  </table>
                  <div className="p-4 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-100">
                      *Perhitungan ini adalah simulasi berdasarkan Jurnal Umum. Pastikan rekapitulasi faktur pajak sesuai sebelum lapor SPT.
                  </div>
              </div>
          </div>
      );
  };

  // --- MODALS ---
  const CoaModal = () => ( <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800">{coaForm.id ? 'Edit Akun' : 'Tambah Akun Baru'}</h3><button onClick={() => setIsCoaModalOpen(false)}><X className="text-gray-400 hover:text-slate-800" /></button></div><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Kode Akun</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="1-1000" value={coaForm.code} onChange={e => setCoaForm({...coaForm, code: e.target.value})} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kas Kecil" value={coaForm.name} onChange={e => setCoaForm({...coaForm, name: e.target.value})} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white" value={coaForm.type} onChange={e => setCoaForm({...coaForm, type: e.target.value as any})}><option value="Aktiva">Aktiva (Harta)</option><option value="Kewajiban">Kewajiban (Utang)</option><option value="Ekuitas">Ekuitas (Modal)</option><option value="Pendapatan">Pendapatan</option><option value="Beban">Beban (Biaya)</option></select></div><button onClick={handleSaveAccount} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 mt-4">Simpan</button></div></div></div> );
  const JournalModal = () => { const { totalDebit, totalCredit, isBalanced } = calculateBalance(); return (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"><div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"><h3 className="font-bold text-xl text-slate-800">Entri Jurnal Baru</h3><button onClick={() => setIsJournalModalOpen(false)}><X className="text-gray-400 hover:text-slate-800" /></button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div><label className="block text-xs font-bold text-gray-500 mb-1">TANGGAL</label><input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={journalForm.date} onChange={e => setJournalForm({...journalForm, date: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">NO. REF</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" placeholder="JV-XXXX" value={journalForm.ref} onChange={e => setJournalForm({...journalForm, ref: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">KETERANGAN</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Deskripsi transaksi" value={journalForm.description} onChange={e => setJournalForm({...journalForm, description: e.target.value})} /></div></div><div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-6"><table className="w-full text-sm"><thead className="bg-gray-100 text-gray-600 font-bold"><tr><th className="p-3 text-left pl-4">Akun Perkiraan</th><th className="p-3 text-right w-32">Debit</th><th className="p-3 text-right w-32">Kredit</th><th className="p-3 w-10"></th></tr></thead><tbody className="divide-y divide-gray-200">{journalForm.lines.map((line, idx) => (<tr key={idx}><td className="p-2 pl-4"><select className="w-full bg-white border border-gray-300 rounded px-2 py-1 outline-none" value={line.accountId} onChange={e => updateJournalLine(idx, 'accountId', e.target.value)}><option value="">Pilih Akun...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></td><td className="p-2"><input type="number" className="w-full text-right bg-white border border-gray-300 rounded px-2 py-1 outline-none" value={line.debit || ''} onChange={e => updateJournalLine(idx, 'debit', parseFloat(e.target.value))} placeholder="0" /></td><td className="p-2"><input type="number" className="w-full text-right bg-white border border-gray-300 rounded px-2 py-1 outline-none" value={line.credit || ''} onChange={e => updateJournalLine(idx, 'credit', parseFloat(e.target.value))} placeholder="0" /></td><td className="p-2 text-center"><button onClick={() => handleRemoveJournalLine(idx)} className="text-gray-400 hover:text-red-500"><X size={16}/></button></td></tr>))}</tbody><tfoot className="bg-gray-100 font-bold"><tr><td className="p-3"><button onClick={handleAddJournalLine} className="text-blue-600 text-xs flex items-center hover:underline"><PlusCircle size={14} className="mr-1" /> Tambah Baris</button></td><td className="p-3 text-right text-slate-700">{totalDebit.toLocaleString()}</td><td className="p-3 text-right text-slate-700">{totalCredit.toLocaleString()}</td><td></td></tr></tfoot></table></div><div className="flex justify-between items-center"><div className={`flex items-center text-sm font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>{isBalanced ? <CheckCircle size={18} className="mr-2"/> : <AlertTriangle size={18} className="mr-2"/>}{isBalanced ? 'Balance (Seimbang)' : `Tidak Balance (Selisih: ${(totalDebit - totalCredit).toLocaleString()})`}</div><div className="flex space-x-3"><button onClick={() => setIsJournalModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Batal</button><button onClick={handleSaveJournal} disabled={!isBalanced} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed">Simpan Jurnal</button></div></div></div></div> )};

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onNavigate(tab.route)}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${view === tab.id ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                {tab.label}
            </button>
            ))}
        </div>

        {view === 'dashboard' && renderDashboard()}
        {view === 'coa' && renderCOA()}
        {view === 'journal' && renderJournal()}
        {view === 'cashflow' && renderCashflow()}
        {view === 'reports' && renderReports()}
        {view === 'tax' && renderTax()} {/* NEW VIEW */}
        
        {isCoaModalOpen && <CoaModal />}
        {isJournalModalOpen && <JournalModal />}
    </div>
  );
};
