
import React, { useState } from 'react';
import { User, AppRoute, VoteSession } from '../types';
import { 
    Vote, 
    ChevronLeft, 
    Calendar, 
    Users, 
    CheckCircle, 
    Award, 
    FileText,
    Info,
    Lock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useToast } from '../components/Toast';

interface EVotingProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
}

// Mock Data for Voting Sessions
const MOCK_SESSIONS: VoteSession[] = [
    {
        id: 'v1',
        title: 'Pemilihan Ketua Koperasi 2025-2030',
        type: 'election',
        description: 'Tentukan masa depan KMP-ADNG dengan memilih pemimpin yang amanah dan visioner.',
        startDate: '01 Okt 2024',
        endDate: '30 Okt 2024',
        status: 'active',
        hasVoted: false,
        totalVoters: 1250,
        candidates: [
            {
                id: 'c1',
                name: 'H. Ruslan Effendi',
                photo: 'https://randomuser.me/api/portraits/men/32.jpg',
                vision: 'Koperasi Mandiri, Anggota Sejahtera.',
                mission: ['Digitalisasi penuh layanan koperasi', 'Peningkatan modal usaha tanpa bunga', 'Ekspansi pasar ekspor komoditas'],
                votes: 450
            },
            {
                id: 'c2',
                name: 'Dr. Sarah Amalia',
                photo: 'https://randomuser.me/api/portraits/women/44.jpg',
                vision: 'Inovasi Teknologi untuk Ekonomi UMKM.',
                mission: ['Pemberdayaan wirausaha muda anggota', 'Beasiswa pendidikan untuk anak anggota', 'Pembangunan gudang logistik terpadu'],
                votes: 620
            }
        ]
    },
    {
        id: 'v2',
        title: 'RAT Online: Persetujuan RAB 2025',
        type: 'policy',
        description: 'Voting persetujuan Rencana Anggaran Belanja (RAB) tahun buku 2025.',
        startDate: '15 Okt 2024',
        endDate: '20 Okt 2024',
        status: 'active',
        hasVoted: true, // Already voted
        totalVoters: 900,
        candidates: [
            { id: 'opt1', name: 'SETUJU', photo: '', vision: '', mission: [], votes: 800 },
            { id: 'opt2', name: 'TIDAK SETUJU', photo: '', vision: '', mission: [], votes: 100 }
        ]
    }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const EVoting: React.FC<EVotingProps> = ({ onNavigate }) => {
  const [activeSessionId, setActiveSessionId] = useState<string>(MOCK_SESSIONS[0].id);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const { showToast } = useToast();

  const currentSession = sessions.find(s => s.id === activeSessionId);

  const handleVote = (candidateId: string) => {
      const confirm = window.confirm("Apakah Anda yakin dengan pilihan ini? Pilihan tidak dapat diubah setelah dikirim.");
      if (confirm) {
          setSessions(prev => prev.map(s => {
              if (s.id === activeSessionId) {
                  return {
                      ...s,
                      hasVoted: true,
                      totalVoters: s.totalVoters + 1,
                      candidates: s.candidates.map(c => 
                          c.id === candidateId ? { ...c, votes: c.votes + 1 } : c
                      )
                  };
              }
              return s;
          }));
          showToast("Suara Anda berhasil direkam! Terima kasih atas partisipasi Anda.", "success");
      }
  };

  const renderChart = () => {
      if (!currentSession) return null;
      const data = currentSession.candidates.map(c => ({
          name: c.name,
          value: c.votes
      }));

      return (
          <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                      >
                          {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `${val} Suara`} />
                      <Legend />
                  </PieChart>
              </ResponsiveContainer>
          </div>
      );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
       
       <button 
        onClick={() => onNavigate(AppRoute.DASHBOARD)}
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6 transition"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Dashboard
      </button>

      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Demokrasi Digital</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">E-Voting & RAT Online</h1>
                  <p className="text-slate-300 max-w-xl">
                      Suara Anda adalah masa depan Koperasi. Gunakan hak pilih Anda secara transparan, jujur, dan rahasia melalui sistem blockchain KMP-ADNG.
                  </p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-center">
                  <Vote className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'active').length}</p>
                  <p className="text-xs text-slate-300 uppercase">Sesi Aktif</p>
              </div>
          </div>
          <div className="absolute -right-20 -bottom-40 w-96 h-96 bg-emerald-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar: Session List */}
          <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Daftar Voting</h3>
              {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition relative overflow-hidden group
                        ${activeSessionId === session.id 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-100 bg-white hover:border-emerald-200'}
                    `}
                  >
                      <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                              ${session.type === 'election' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                          `}>
                              {session.type === 'election' ? 'Pemilihan' : 'Kebijakan'}
                          </span>
                          {session.hasVoted && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${activeSessionId === session.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                          {session.title}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" /> Berakhir: {session.endDate}
                      </p>
                  </button>
              ))}
          </div>

          {/* Main Content: Session Detail */}
          <div className="lg:col-span-3">
              {currentSession && (
                  <div className="space-y-8 animate-fade-in">
                      
                      {/* Session Info */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                          <div className="flex flex-col md:flex-row justify-between items-start mb-4 border-b border-gray-100 pb-4">
                              <div>
                                  <h2 className="text-2xl font-bold text-slate-800">{currentSession.title}</h2>
                                  <p className="text-gray-500 mt-1">{currentSession.description}</p>
                              </div>
                              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                                  <div className="text-right">
                                      <p className="text-xs text-gray-400 uppercase">Partisipasi</p>
                                      <p className="font-bold text-slate-800 flex items-center justify-end">
                                          <Users className="w-4 h-4 mr-2 text-emerald-600" /> 
                                          {currentSession.totalVoters} Suara
                                      </p>
                                  </div>
                              </div>
                          </div>

                          {currentSession.hasVoted ? (
                              /* --- RESULTS VIEW (QUICK COUNT) --- */
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                  <div>
                                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4 flex items-start space-x-3">
                                          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                          <div>
                                              <h4 className="font-bold text-emerald-800">Suara Anda Telah Direkam</h4>
                                              <p className="text-sm text-emerald-700">Terima kasih telah berpartisipasi. Berikut adalah hasil perhitungan sementara (Quick Count).</p>
                                          </div>
                                      </div>
                                      
                                      <div className="space-y-3">
                                          {currentSession.candidates.map((c, idx) => {
                                              const percentage = Math.round((c.votes / currentSession.totalVoters) * 100);
                                              return (
                                                  <div key={c.id} className="relative">
                                                      <div className="flex justify-between text-sm mb-1 font-bold text-slate-700">
                                                          <span>{c.name}</span>
                                                          <span>{percentage}%</span>
                                                      </div>
                                                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                          <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                      </div>
                                                      <p className="text-xs text-gray-400 mt-1">{c.votes} Suara</p>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                                  <div className="flex justify-center">
                                      {renderChart()}
                                  </div>
                              </div>
                          ) : (
                              /* --- VOTING VIEW --- */
                              <div>
                                  {currentSession.type === 'election' ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {currentSession.candidates.map(candidate => (
                                              <div key={candidate.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition group bg-white">
                                                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                                                      <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                                          <h3 className="text-white font-bold text-xl">{candidate.name}</h3>
                                                      </div>
                                                  </div>
                                                  <div className="p-6">
                                                      <div className="mb-4">
                                                          <h4 className="font-bold text-emerald-700 text-sm uppercase mb-1 flex items-center"><Award className="w-4 h-4 mr-1"/> Visi</h4>
                                                          <p className="text-slate-600 text-sm italic">"{candidate.vision}"</p>
                                                      </div>
                                                      <div className="mb-6">
                                                          <h4 className="font-bold text-slate-700 text-sm uppercase mb-2 flex items-center"><FileText className="w-4 h-4 mr-1"/> Misi Utama</h4>
                                                          <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                                                              {candidate.mission?.map((m, i) => (
                                                                  <li key={i}>{m}</li>
                                                              ))}
                                                          </ul>
                                                      </div>
                                                      <button 
                                                        onClick={() => handleVote(candidate.id)}
                                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg flex items-center justify-center"
                                                      >
                                                          <Vote className="w-5 h-5 mr-2" /> Pilih Kandidat Ini
                                                      </button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  ) : (
                                      /* --- POLICY VOTE UI --- */
                                      <div className="max-w-2xl mx-auto text-center py-8">
                                          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                          <h3 className="text-xl font-bold text-slate-800 mb-6">Tentukan Pilihan Anda</h3>
                                          <div className="grid grid-cols-2 gap-6">
                                              <button 
                                                onClick={() => handleVote('opt1')}
                                                className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition text-emerald-700"
                                              >
                                                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                                                  <span className="font-bold text-lg">SETUJU</span>
                                              </button>
                                              <button 
                                                onClick={() => handleVote('opt2')}
                                                className="p-6 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-300 transition text-red-700"
                                              >
                                                  <Lock className="w-12 h-12 mx-auto mb-2" />
                                                  <span className="font-bold text-lg">TIDAK SETUJU</span>
                                              </button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>

                      {/* Info Banner */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-sm text-blue-800">
                          <Info className="w-5 h-5 shrink-0 mt-0.5" />
                          <p>
                              Setiap anggota hanya memiliki <strong>1 Hak Suara</strong> (One Man One Vote). 
                              Sistem mencatat pilihan Anda secara anonim namun terverifikasi menggunakan ID Anggota (KTA) Anda.
                          </p>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
