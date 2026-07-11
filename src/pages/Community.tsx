
import React, { useState } from 'react';
import { ContentItem, AppRoute } from '../types';
import { Trophy, Palette, Calendar, Heart, MessageCircle, PlayCircle } from 'lucide-react';

interface CommunityProps {
  contents: ContentItem[]; 
  onNavigate: (route: AppRoute, params?: any) => void;
}

export const Community: React.FC<CommunityProps> = ({ contents, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'sports' | 'arts'>('sports');

  const sportContents = contents.filter(c => c.category === 'Olah Raga' && c.status === 'published');
  const artsContents = contents.filter(c => ['Hiburan', 'Seni Budaya', 'VLOG'].includes(c.category) && c.status === 'published');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      
      <div className="mb-8 text-center space-y-6">
        <h2 className="text-3xl font-bold text-slate-800">Komunitas KMP-ADNG</h2>
        <div className="inline-flex bg-white p-1 rounded-full shadow-sm border border-gray-200">
          <button 
            onClick={() => setActiveTab('sports')}
            className={`px-6 py-2 rounded-full flex items-center space-x-2 font-medium transition ${activeTab === 'sports' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Trophy className="w-4 h-4" />
            <span>Olah Raga & Liga</span>
          </button>
          <button 
             onClick={() => setActiveTab('arts')}
            className={`px-6 py-2 rounded-full flex items-center space-x-2 font-medium transition ${activeTab === 'arts' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Palette className="w-4 h-4" />
            <span>Seni & Budaya</span>
          </button>
        </div>
      </div>

      {activeTab === 'sports' ? (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-800 to-green-600 rounded-2xl p-8 text-white flex justify-between items-center relative overflow-hidden">
             <div className="relative z-10 max-w-lg">
                <h3 className="text-3xl font-bold mb-2">LIGA KMP-ADNG & Olah Raga</h3>
                <p className="text-emerald-100 mb-6">Seputar olah raga dan kompetisi Sepakbola Antar Desa perebutan Juara Kabupaten/Kota.</p>
                <div className="flex space-x-4">
                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg text-center min-w-[80px]">
                     <span className="block text-2xl font-bold">12</span>
                     <span className="text-xs uppercase">Tim</span>
                  </div>
                   <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg text-center min-w-[80px]">
                     <span className="block text-2xl font-bold">48</span>
                     <span className="text-xs uppercase">Match</span>
                  </div>
                </div>
             </div>
             <Trophy className="absolute right-10 bottom-0 text-white/10 w-48 h-48 transform translate-y-12" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <h3 className="font-bold text-xl text-slate-800">Berita Olahraga Terkini</h3>
               {sportContents.length === 0 ? (
                   <p className="text-gray-400 italic">Belum ada berita olahraga.</p>
               ) : (
                   sportContents.map(item => (
                    <div 
                        key={item.id} 
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition cursor-pointer"
                        onClick={() => onNavigate(AppRoute.COURSE_PLAYER, item)}
                    >
                        <div className="relative w-full md:w-48 h-48 md:h-auto">
                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <PlayCircle className="text-white opacity-80" />
                            </div>
                        </div>
                        <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 block">{item.date}</span>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h4>
                            <p className="text-gray-500 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="flex space-x-4 mt-4 text-gray-400">
                            <button className="flex items-center text-xs hover:text-emerald-600"><Heart className="w-4 h-4 mr-1" /> {item.likes} Suka</button>
                            <button className="flex items-center text-xs hover:text-emerald-600"><MessageCircle className="w-4 h-4 mr-1" /> {item.views} Views</button>
                        </div>
                        </div>
                    </div>
                   ))
               )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <h3 className="font-bold text-lg mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-emerald-600" /> Jadwal LIGA KMP-ADNG</h3>
                 <div className="space-y-4">
                    {[1,2].map(i => (
                      <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Minggu, 6 Okt</span>
                           <span className="text-xs font-bold text-emerald-600">15:30 WIB</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">Desa A</span>
                            <span className="text-sm font-medium text-gray-400">VS</span>
                            <span className="font-bold text-slate-700">Desa B</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
           <div className="bg-gradient-to-r from-purple-800 to-indigo-600 rounded-2xl p-8 text-white flex justify-between items-center relative overflow-hidden">
             <div className="relative z-10 max-w-lg">
                <h3 className="text-3xl font-bold mb-2">Galeri Seni & Hiburan</h3>
                <p className="text-purple-100 mb-6">Hiburan, VLOG Anggota, dan pelestarian budaya leluhur Nusantara.</p>
                <button className="bg-white text-purple-900 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition">
                  Kunjungi Pameran Virtual
                </button>
             </div>
             <Palette className="absolute right-10 bottom-0 text-white/10 w-48 h-48 transform translate-y-12" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artsContents.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-10">Belum ada konten seni budaya atau hiburan.</div>
            ) : (
                artsContents.map(item => (
                <div 
                    key={item.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer"
                    onClick={() => onNavigate(AppRoute.COURSE_PLAYER, item)}
                >
                    <div className="relative h-64 overflow-hidden">
                    <img src={item.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="Art" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-6">
                        <div className="text-white">
                            <span className={`text-[10px] px-2 py-1 rounded mb-2 inline-block font-bold
                                ${item.category === 'Hiburan' ? 'bg-pink-600' : 
                                  item.category === 'VLOG' ? 'bg-orange-600' : 'bg-purple-600'}
                            `}>{item.category}</span>
                            <h4 className="font-bold text-lg leading-tight mb-1">{item.title}</h4>
                            <p className="text-sm text-gray-300">Oleh {item.authorName}</p>
                        </div>
                    </div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
