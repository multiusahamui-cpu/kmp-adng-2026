
import React, { useState } from 'react';
import { ContentItem, AppRoute } from '../types';
import { GraduationCap, BookOpen, Award, PlayCircle, Search, Lock } from 'lucide-react';

interface LearningSpaceProps {
  contents: ContentItem[];
  onNavigate: (route: AppRoute, params?: any) => void;
}

export const LearningSpace: React.FC<LearningSpaceProps> = ({ contents, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'edukasi' | 'workshop' | 'sertifikasi'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter content for Learning Space (Education related only)
  const learningContents = contents.filter(c => 
    ['Edukasi', 'Workshop', 'Sertifikasi'].includes(c.category)
  );

  const filteredContents = learningContents.filter(c => {
     const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
     if (activeTab === 'all') return matchesSearch;
     if (activeTab === 'edukasi') return matchesSearch && c.category === 'Edukasi';
     if (activeTab === 'workshop') return matchesSearch && c.category === 'Workshop';
     if (activeTab === 'sertifikasi') return matchesSearch && c.category === 'Sertifikasi';
     return matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
       
       {/* Hero Banner */}
       <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl">
             <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-8 h-8 text-emerald-400" />
                <span className="font-bold tracking-widest uppercase text-emerald-200 text-sm">KMP-ADNG Academy</span>
             </div>
             <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Ruang Belajar &<br/>Pengembangan Diri</h1>
             <p className="text-emerald-100 text-lg mb-8">
                Tingkatkan kompetensi Anda melalui ribuan materi edukasi, workshop, dan sertifikasi resmi dari para ahli dan komunitas.
             </p>
             <div className="flex space-x-4">
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-emerald-900/50">
                   Mulai Belajar
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition backdrop-blur-sm border border-white/20">
                   Lihat Sertifikasi
                </button>
             </div>
          </div>
          {/* Decorative Elements */}
          <BookOpen className="absolute -bottom-10 -right-10 w-80 h-80 text-white/5 rotate-12" />
          <div className="absolute top-10 right-20 w-32 h-32 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
       </div>

       {/* Search & Filters */}
       <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 sticky top-20 z-20 bg-[#f3f4f6]/95 backdrop-blur py-2">
          <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto max-w-full">
             <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'all' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                Semua
             </button>
             <button 
                onClick={() => setActiveTab('edukasi')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'edukasi' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                Kursus / Edukasi
             </button>
             <button 
                onClick={() => setActiveTab('workshop')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'workshop' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                Workshop
             </button>
             <button 
                onClick={() => setActiveTab('sertifikasi')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'sertifikasi' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                Sertifikasi
             </button>
          </div>

          <div className="relative w-full md:w-80">
             <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
             <input 
                type="text" 
                placeholder="Cari topik pelajaran..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
       </div>

       {/* Course Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
          {filteredContents.map(course => (
             <div 
                key={course.id} 
                onClick={() => onNavigate(AppRoute.COURSE_PLAYER, course)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
             >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                   <img 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                   />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <PlayCircle className="w-12 h-12 text-white" />
                   </div>
                   
                   {/* Badges */}
                   <div className="absolute top-3 left-3 flex flex-col space-y-1">
                      <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                         {course.category}
                      </span>
                      {course.isPremium && (
                         <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center w-fit">
                            <Lock className="w-3 h-3 mr-1" /> PREMIUM
                         </span>
                      )}
                   </div>
                   
                   {/* Module Count Badge */}
                   <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {course.modules?.length || 0} Materi
                   </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                   <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-emerald-600 transition">
                      {course.title}
                   </h3>
                   <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {course.description}
                   </p>
                   
                   <div className="mt-auto flex items-center pt-4 border-t border-gray-100">
                      <img src={course.authorAvatar} className="w-8 h-8 rounded-full mr-2 object-cover" alt={course.authorName} />
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-slate-700 truncate">{course.authorName}</p>
                         <p className="text--[10px] text-gray-400">{course.views} Siswa</p>
                      </div>
                      {course.category === 'Sertifikasi' && (
                         <Award className="w-5 h-5 text-amber-500" />
                      )}
                   </div>
                </div>
             </div>
          ))}
       </div>

       {filteredContents.length === 0 && (
          <div className="text-center py-20">
             <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-600">Materi tidak ditemukan</h3>
             <p className="text-gray-400">Coba kata kunci lain atau ubah filter.</p>
          </div>
       )}
    </div>
  );
};
