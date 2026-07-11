
import React, { useState, useEffect } from 'react';
import { ContentItem, CourseModule, AppRoute, User } from '../types';
import { ChevronLeft, PlayCircle, FileText, CheckCircle, Menu, X, MapPin, Calendar, User as UserIcon, AlertTriangle } from 'lucide-react';

interface CoursePlayerProps {
  course: ContentItem;
  user: User;
  onNavigate: (route: AppRoute) => void;
  onUpdateProgress: (courseId: string, moduleId: string) => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, user, onNavigate, onUpdateProgress }) => {
  const [activeModule, setActiveModule] = useState<CourseModule>(course.modules[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Check enrollment
  const enrollment = user.enrolledCourses?.find(e => e.courseId === course.id);
  const completedIds = enrollment?.completedModuleIds || [];

  useEffect(() => {
      // If returning user, set active module to last accessed
      if (enrollment?.lastAccessedModuleId) {
          const lastMod = course.modules.find(m => m.id === enrollment.lastAccessedModuleId);
          if (lastMod) setActiveModule(lastMod);
      }
  }, [enrollment, course]);

  const handleModuleClick = (module: CourseModule) => {
      setActiveModule(module);
      // On mobile, close sidebar after selection
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleMarkComplete = () => {
      onUpdateProgress(course.id, activeModule.id);
      
      // Auto advance to next module
      const currentIndex = course.modules.findIndex(m => m.id === activeModule.id);
      if (currentIndex < course.modules.length - 1) {
          setActiveModule(course.modules[currentIndex + 1]);
      }
  };

  const isCompleted = (moduleId: string) => completedIds.includes(moduleId);

  return (
    <div className="flex flex-col h-screen bg-white">
       {/* Top Bar */}
       <div className="bg-slate-900 text-white h-16 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex items-center">
             <button onClick={() => onNavigate(AppRoute.DASHBOARD)} className="mr-4 hover:text-emerald-400">
                <ChevronLeft />
             </button>
             <div>
                 <h1 className="font-bold text-sm md:text-lg line-clamp-1">{course.title}</h1>
                 <span className="text-[10px] text-gray-400 uppercase tracking-widest">{course.category}</span>
             </div>
          </div>
          <div className="flex items-center">
             <div className="hidden md:block text-xs text-gray-400 mr-4">
                Progress: {Math.round((completedIds.length / course.modules.length) * 100)}%
             </div>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
                {isSidebarOpen ? <X /> : <Menu />}
             </button>
          </div>
       </div>

       <div className="flex flex-1 overflow-hidden relative">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-8 flex flex-col items-center">
             <div className="w-full max-w-4xl">
                
                {/* Content Header Info */}
                <div className="mb-6 flex flex-wrap items-center text-xs text-gray-500 space-x-4 bg-white px-4 py-2 rounded-full w-fit shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <UserIcon className="w-3 h-3 mr-1 text-slate-400" />
                        <span className="font-bold text-slate-700">{course.authorName}</span>
                    </div>
                    <div className="h-3 w-px bg-gray-300"></div>
                    <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        <span>{course.location || 'Nusantara'}</span>
                    </div>
                    <div className="h-3 w-px bg-gray-300"></div>
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        <span>{course.date}</span>
                    </div>
                </div>

                {/* Content Player */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 min-h-[400px]">
                   {activeModule.type === 'video' ? (
                      <div className="aspect-video bg-black flex items-center justify-center relative">
                         {activeModule.contentUrl ? (
                            <iframe 
                               src={activeModule.contentUrl} 
                               className="w-full h-full" 
                               title={activeModule.title} 
                               allowFullScreen
                            />
                         ) : (
                            <div className="text-center text-gray-500">
                               <PlayCircle className="w-16 h-16 mx-auto mb-2 opacity-50" />
                               <p>Video Preview Placeholder</p>
                            </div>
                         )}
                      </div>
                   ) : (
                      <div className="p-8">
                         <div className="flex items-center space-x-2 text-emerald-600 mb-4 font-bold text-sm uppercase tracking-wide">
                            <FileText className="w-4 h-4" /> 
                            <span>Materi Bacaan</span>
                         </div>
                         <h2 className="text-3xl font-bold text-slate-800 mb-6">{activeModule.title}</h2>
                         
                         {activeModule.imageContent && (
                            <img src={activeModule.imageContent} alt="" className="w-full h-64 object-cover rounded-xl mb-6" />
                         )}
                         
                         <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {activeModule.textContent || "Tidak ada konten teks."}
                         </div>
                      </div>
                   )}
                </div>

                {/* Navigation Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
                   <div>
                      <h3 className="font-bold text-slate-800">{activeModule.title}</h3>
                      <p className="text-xs text-gray-500">Bagian {course.modules.findIndex(m => m.id === activeModule.id) + 1} dari {course.modules.length}</p>
                   </div>
                   
                   <button 
                      onClick={handleMarkComplete}
                      className={`px-6 py-2 rounded-lg font-bold transition flex items-center
                         ${isCompleted(activeModule.id) 
                            ? 'bg-green-100 text-green-700 cursor-default' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'}
                      `}
                   >
                      {isCompleted(activeModule.id) ? (
                         <><CheckCircle className="w-4 h-4 mr-2" /> Selesai</>
                      ) : (
                         "Tandai Selesai"
                      )}
                   </button>
                </div>

                {/* LEGAL DISCLAIMER FOOTER */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center text-xs text-red-800/80">
                    <div className="flex justify-center mb-2">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="font-bold mb-2 uppercase tracking-wide">Disclaimer Hukum</p>
                    <p className="max-w-2xl mx-auto leading-relaxed">
                        KMP-ADNG (Koperasi Multi Pihak - Aset Digital Nusantara Garuda) bertindak sebagai platform distribusi konten. 
                        KMP-ADNG <strong>tidak bertanggung jawab secara hukum</strong> atas isi konten yang mengandung unsur SARA (Suku, Agama, Ras, Antargolongan), ujaran kebencian, hoax, atau pelanggaran hukum lainnya. 
                        Segala bentuk tuntutan hukum dan tanggung jawab atas materi yang disampaikan sepenuhnya berada pada <strong>Pembuat Konten (Author)</strong> yang namanya tercantum di atas.
                    </p>
                </div>

             </div>
          </div>

          {/* Sidebar / Curriculum (Collapsible on mobile) */}
          <div className={`
             absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 z-10
             md:relative md:translate-x-0
             ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
             <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-slate-800">Daftar Materi / Segmen</h3>
             </div>
             <div className="overflow-y-auto h-full pb-20">
                {course.modules.map((mod, idx) => (
                   <button 
                      key={mod.id}
                      onClick={() => handleModuleClick(mod)}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition flex items-start
                         ${activeModule.id === mod.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''}
                      `}
                   >
                      <div className="mt-1 mr-3 shrink-0">
                         {isCompleted(mod.id) ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                         ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                         )}
                      </div>
                      <div>
                         <p className={`text-sm font-medium ${activeModule.id === mod.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {idx + 1}. {mod.title}
                         </p>
                         <div className="flex items-center text-xs text-gray-400 mt-1">
                            {mod.type === 'video' ? <PlayCircle className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                            <span>{mod.duration}</span>
                         </div>
                      </div>
                   </button>
                ))}
             </div>
          </div>

       </div>
    </div>
  );
};
