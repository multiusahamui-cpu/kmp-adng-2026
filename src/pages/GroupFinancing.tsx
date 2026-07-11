
import React, { useState } from 'react';
import { AppRoute } from '../types';
import { 
  Users, 
  ChevronLeft, 
  CheckCircle, 
  Store, 
  Sprout, 
  Droplets, 
  Award, 
  AlertTriangle, 
  ChevronRight,
  UserPlus,
  Search,
  Trash2,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '../components/Toast';

interface GroupFinancingProps {
  onNavigate: (route: AppRoute) => void;
}

interface GroupMember {
  id: string;
  name: string;
  joinDate: string;
  monthsActive: number;
  savingsStatus: 'Lancar' | 'Macet';
  socialScore: 'Baik' | 'Kurang';
  isEligible: boolean;
  role: 'Ketua' | 'Wakil' | 'Anggota'; 
}

export const GroupFinancing: React.FC<GroupFinancingProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();
  
  const [groupName, setGroupName] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [workingCapital, setWorkingCapital] = useState(10000000);
  const [assetsDescription, setAssetsDescription] = useState('');
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [agreedToWorkshop, setAgreedToWorkshop] = useState(false);
  const [agreedToControl, setAgreedToControl] = useState(false);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [isCheckingMember, setIsCheckingMember] = useState(false);

  const businessTypes = [
      { id: 'cafe', label: 'Cafe / Kopi Shop', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
      { id: 'water', label: 'Depo Air Isi Ulang', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      { id: 'corn', label: 'Pertanian Jagung', icon: Sprout, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      { id: 'rice', label: 'Pertanian Padi', icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      { id: 'sorghum', label: 'Pertanian Sorgum', icon: Sprout, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  const handleAddMember = () => {
      if (!memberInput) return;
      setIsCheckingMember(true);

      setTimeout(() => {
          const randomMonths = Math.floor(Math.random() * 24) + 1; 
          const isEligible = randomMonths >= 6; 

          let defaultRole: 'Ketua' | 'Wakil' | 'Anggota' = 'Anggota';
          if (members.length === 0) defaultRole = 'Ketua';
          else if (members.length === 1) defaultRole = 'Wakil';

          const newMember: GroupMember = {
              id: `m-${Date.now()}`,
              name: memberInput, 
              joinDate: '01/23',
              monthsActive: randomMonths,
              savingsStatus: 'Lancar', 
              socialScore: 'Baik',
              isEligible: isEligible,
              role: defaultRole
          };

          setMembers([...members, newMember]);
          setMemberInput('');
          setIsCheckingMember(false);
          showToast(`Anggota ${memberInput} ditambahkan`, "success");
      }, 800);
  };

  const removeMember = (id: string) => {
      setMembers(members.filter(m => m.id !== id));
  };

  const handleRoleChange = (id: string, newRole: 'Ketua' | 'Wakil' | 'Anggota') => {
      if (newRole === 'Ketua' && members.some(m => m.role === 'Ketua')) {
          showToast("Hanya boleh ada 1 Ketua. Silahkan ubah peran Ketua saat ini terlebih dahulu.", "error");
          return;
      }
      if (newRole === 'Wakil' && members.some(m => m.role === 'Wakil')) {
          showToast("Hanya boleh ada 1 Wakil Ketua.", "error");
          return;
      }

      setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  const isStep1Valid = () => {
      if (!groupName || !location) return false;
      if (members.length < 5) return false; 
      if (members.some(m => !m.isEligible)) return false; 
      
      const hasKetua = members.some(m => m.role === 'Ketua');
      const hasWakil = members.some(m => m.role === 'Wakil');
      
      if (!hasKetua || !hasWakil) return false;

      return true;
  };

  const handleNext = () => {
      if (step < 4) setStep(step + 1);
      else handleSubmit();
  };

  const handleBackStep = () => {
      if (step > 1) setStep(step - 1);
      else onNavigate(AppRoute.KOPERASI);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setProposalFile(e.target.files[0]);
      }
  };

  if (isSubmitted) {
    return (
      <div className="p-8 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
          <Award className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Proposal Tahap 1 Diterima!</h2>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Proposal usaha <strong>{groupName}</strong> beserta lampiran PDF telah masuk ke database verifikasi Pokja.
          <br/><br/>
          <strong>Langkah Selanjutnya:</strong><br/>
          Tim Verifikasi akan mengecek proposal. Jika disetujui, menu <strong>Proyek Saya</strong> akan muncul di halaman Koperasi Anda.
        </p>
        <div className="flex flex-col w-full space-y-3">
            <button 
            onClick={() => onNavigate(AppRoute.KOPERASI)}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg"
            >
            Kembali ke Koperasi
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      
      <div className="flex items-center justify-between mb-8">
        <button 
            onClick={handleBackStep}
            className="flex items-center text-gray-500 hover:text-emerald-600 transition"
        >
            <ChevronLeft className="w-5 h-5 mr-1" /> {step === 1 ? 'Batal' : 'Sebelumnya'}
        </button>
        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Langkah {step} dari 4
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Pembiayaan Bagi Hasil</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        KMP-ADNG menyediakan <strong>100% Modal Kerja</strong>. Risiko finansial ditanggung KMP-ADNG, namun kegagalan akibat kelalaian ditanggung renteng.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="bg-emerald-500/20 p-2 rounded-lg mr-3">
                                <Users className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Struktur Jelas</p>
                                <p className="text-xs text-slate-400">Wajib ada Ketua & Wakil Ketua yang bertanggung jawab input laporan.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-600 rounded-full blur-3xl opacity-20"></div>
            </div>
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                
                {step === 1 && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-xl font-bold text-slate-800 border-b border-gray-100 pb-4">Validasi Kelompok Usaha</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelompok</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="Contoh: Kopi Tani Maju"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Domisili Usaha</label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="Desa / Kecamatan"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Daftar Anggota & Peran (Min. 5 Orang)</label>
                            
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Cari ID Anggota / Nama..."
                                        value={memberInput}
                                        onChange={e => setMemberInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddMember}
                                    disabled={!memberInput || isCheckingMember}
                                    className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 flex items-center disabled:bg-gray-300"
                                >
                                    {isCheckingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Tambah</>}
                                </button>
                            </div>

                            {members.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 font-bold">
                                            <tr>
                                                <th className="p-3">Nama Anggota</th>
                                                <th className="p-3">Peran (Role)</th>
                                                <th className="p-3 text-center">Status</th>
                                                <th className="p-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {members.map((member) => (
                                                <tr key={member.id} className={member.isEligible ? 'bg-white' : 'bg-red-50'}>
                                                    <td className="p-3 font-medium text-slate-800">
                                                        {member.name}
                                                    </td>
                                                    <td className="p-3">
                                                        <select 
                                                            className={`text-xs font-bold border rounded px-2 py-1 outline-none cursor-pointer
                                                                ${member.role === 'Ketua' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                                                  member.role === 'Wakil' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                                  'bg-gray-100 text-gray-600 border-gray-200'}
                                                            `}
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                                                        >
                                                            <option value="Anggota">Anggota</option>
                                                            <option value="Ketua">Ketua</option>
                                                            <option value="Wakil">Wakil Ketua</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {member.isEligible ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> OK
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                                <XCircle className="w-3 h-3 mr-1" /> Ditolak
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => removeMember(member.id)} className="text-gray-400 hover:text-red-500">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-gray-500">Total Anggota: <strong>{members.length}</strong> (Min. 5)</span>
                                {isStep1Valid() ? (
                                    <span className="text-emerald-600 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Kelompok Valid</span>
                                ) : (
                                    <span className="text-red-500 font-bold flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> Belum Lengkap (Cek Ketua/Wakil)</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-xl font-bold text-slate-800 border-b border-gray-100 pb-4">Pilih Bidang Usaha</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {businessTypes.map((biz) => (
                                <button
                                    key={biz.id}
                                    onClick={() => setBusinessType(biz.id)}
                                    className={`p-4 rounded-xl border-2 flex items-center text-left transition relative overflow-hidden
                                        ${businessType === biz.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-100 hover:border-gray-300 bg-white'}
                                    `}
                                >
                                    <div className={`p-3 rounded-full mr-4 ${biz.bg} ${biz.color}`}><biz.icon className="w-6 h-6" /></div>
                                    <div><span className={`font-bold block ${businessType === biz.id ? 'text-slate-800' : 'text-gray-600'}`}>{biz.label}</span></div>
                                    {businessType === biz.id && <div className="absolute top-2 right-2 text-emerald-600"><CheckCircle size={20} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-xl font-bold text-slate-800 border-b border-gray-100 pb-4">Rencana Kerja & Dokumen</h2>
                        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                            <label className="block text-sm font-bold text-emerald-900 mb-1">Pengajuan Modal Kerja</label>
                            <input type="number" className="flex-1 outline-none font-bold text-xl text-slate-800 w-full p-2 bg-white rounded border border-emerald-300" value={workingCapital} onChange={e => setWorkingCapital(parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Aset & Infrastruktur</label>
                            <textarea rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={assetsDescription} onChange={e => setAssetsDescription(e.target.value)} />
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Upload Proposal (PDF)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center relative">
                                <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {proposalFile ? <span className="text-emerald-600 font-bold">{proposalFile.name}</span> : <span className="text-gray-500">Klik untuk upload PDF</span>}
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-xl font-bold text-slate-800 border-b border-gray-100 pb-4">Validasi Kompetensi</h2>
                        <div className="space-y-4 pt-4">
                            <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition">
                                <input type="checkbox" className="mt-1 w-5 h-5 text-emerald-600 rounded" checked={agreedToWorkshop} onChange={e => setAgreedToWorkshop(e.target.checked)} />
                                <span className="text-sm text-slate-700">Saya menyatakan bersedia mengikuti Workshop.</span>
                            </label>
                            <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition">
                                <input type="checkbox" className="mt-1 w-5 h-5 text-emerald-600 rounded" checked={agreedToControl} onChange={e => setAgreedToControl(e.target.checked)} />
                                <span className="text-sm text-slate-700">Kami memahami sistem Tanggung Renteng.</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={handleNext}
                        disabled={
                            (step === 1 && !isStep1Valid()) ||
                            (step === 2 && !businessType) ||
                            (step === 3 && (!assetsDescription || !proposalFile)) ||
                            (step === 4 && (!agreedToWorkshop || !agreedToControl))
                        }
                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                    >
                        {step === 4 ? 'Kirim Proposal' : 'Lanjut'} <ChevronRight className="ml-2 w-5 h-5" />
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
