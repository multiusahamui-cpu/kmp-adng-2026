
import React, { useState } from 'react';
import { User, ContentItem, CourseModule, AppRoute } from '../types';
import { Video, Upload, Plus, ThumbsUp, Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

interface CreatorDashboardProps {
  user: User;
  contents: ContentItem[];
  onAddContent: (content: ContentItem) => void;
  onNavigate: (route: AppRoute) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ user, contents, onAddContent }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list');
  const { showToast } = useToast();
  const isAdmin = user.roles.includes('admin');
  
  // Content Meta Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: isAdmin ? 'Berita' : 'Edukasi' as ContentItem['category'], // Default based on role
    location: '', 
    thumbnailUrl: '',
  });

  // Modules State
  const [modules, setModules] = useState<CourseModule[]>([]);
  
  // Temporary Module Input
  const [newModule, setNewModule] = useState<Partial<CourseModule>>({
      type: 'video',
      title: '',
      contentUrl: '',
      textContent: '',
      duration: ''
  });

  const myContents = contents.filter(c => c.authorId === user.id);

  const addModule = () => {
      if (!newModule.title) return showToast("Mohon isi Judul Bagian konten terlebih dahulu.", "error");
      
      const mod: CourseModule = {
          id: `m-${Date.now()}`,
          title: newModule.title || 'Untitled',
          type: newModule.type as 'video' | 'article',
          duration: newModule.duration || '5 Min',
          contentUrl: newModule.contentUrl,
          textContent: newModule.textContent,
          imageContent: newModule.imageContent
      };
      
      setModules([...modules, mod]);
      setNewModule({ type: 'video', title: '', contentUrl: '', textContent: '', duration: '' }); // Reset
  };

  const removeModule = (idx: number) => {
      setModules(modules.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION CHECK
    if (!formData.title || !formData.location || !formData.description) {
        return showToast("Mohon lengkapi Judul, Lokasi, dan Deskripsi.", "error");
    }

    if (modules.length === 0) {
        return showToast("Konten masih kosong! Anda wajib menambahkan minimal 1 Bagian.", "error");
    }

    const newContent: ContentItem = {
      id: `c-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      thumbnailUrl: formData.thumbnailUrl || 'https://picsum.photos/400/225',
      authorName: user.name,
      authorId: user.id,
      authorAvatar: user.avatarUrl,
      location: formData.location || 'Nusantara',
      date: new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}),
      views: 0,
      likes: 0,
      // ADMIN: Auto Published. MEMBER: Pending Moderation.
      status: isAdmin ? 'published' : 'pending', 
      modules: modules
    };
    
    onAddContent(newContent);
    showToast(isAdmin ? "Konten resmi berhasil dipublikasikan!" : "Konten Anda telah dikirim ke Admin untuk proses Moderasi.", "success");
    setActiveTab('list');
    setFormData({ title: '', description: '', category: isAdmin ? 'Berita' : 'Edukasi', location: '', thumbnailUrl: '' });
    setModules([]);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
       
       {/* Header */}
       <div className="bg-black text-white rounded-2xl p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
             <div className="mb-4 md:mb-0">
                <div className="flex items-center space-x-2 mb-2">
                   <span className="bg-red-600 text-xs font-bold px-2 py-1 rounded uppercase">Creator Studio</span>
                   <h2 className="text-2xl font-bold">Halo, {user.name}</h2>
                </div>
                <p className="text-gray-400 max-w-lg">
                   {isAdmin 
                     ? "Panel Khusus Admin: Buat Berita, Pengumuman, dan Undangan Resmi Koperasi."
                     : "Kelola konten edukasi dan hiburan. Semua konten wajib melalui moderasi."}
                </p>
             </div>
             <div className="flex space-x-4">
                <div className="text-center">
                   <p className="text-2xl font-bold">{myContents.length}</p>
                   <p className="text-xs text-gray-500">Konten</p>
                </div>
                <div className="text-center">
                   <p className="text-2xl font-bold">{myContents.reduce((acc, c) => acc + c.views, 0)}</p>
                   <p className="text-xs text-gray-500">Total Views</p>
                </div>
             </div>
          </div>
          <Video className="absolute -bottom-6 -right-6 w-48 h-48 text-white/10" />
       </div>

       {/* Tabs */}
       <div className="flex space-x-2 border-b border-gray-200">
          <button 
             onClick={() => setActiveTab('list')}
             className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'list' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
          >
             Konten Saya
          </button>
          <button 
             onClick={() => setActiveTab('upload')}
             className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'upload' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
          >
             Buat Baru
          </button>
       </div>

       {/* Content List */}
       {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {myContents.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                   <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                   <p className="mb-4">Belum ada konten yang diupload.</p>
                   <button onClick={() => setActiveTab('upload')} className="text-black font-bold underline">Mulai Upload</button>
                </div>
             ) : (
                myContents.map(item => (
                   <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition">
                      <div className="relative h-40 bg-black">
                         <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                         <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded text-white
                            ${item.category === 'Edukasi' ? 'bg-emerald-600' : 
                              item.category === 'Berita' ? 'bg-red-600' : 
                              item.category === 'Pengumuman' ? 'bg-orange-600' :
                              item.category === 'Undangan' ? 'bg-blue-600' :
                              item.category === 'Olah Raga' ? 'bg-yellow-600' : 'bg-purple-600'}
                         `}>
                            {item.category}
                         </span>
                         <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                            {item.modules?.length || 0} Bagian
                         </span>
                         <span className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded font-bold uppercase
                            ${item.status === 'published' ? 'bg-green-500 text-white' : 
                              item.status === 'pending' ? 'bg-orange-500 text-white' : 
                              'bg-red-500 text-white'}
                         `}>
                            {item.status === 'pending' ? 'Moderasi' : item.status}
                         </span>
                      </div>
                      <div className="p-4">
                         <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 h-12">{item.title}</h3>
                         <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {item.views}</span>
                            <span className="flex items-center"><ThumbsUp className="w-3 h-3 mr-1" /> {item.likes}</span>
                            <span>{item.date}</span>
                         </div>
                         <div className="mt-4 flex space-x-2 pt-2 border-t border-gray-100">
                            <button className="flex-1 text-xs font-bold text-slate-600 py-2 hover:bg-gray-50 rounded">Edit</button>
                            <button className="flex-1 text-xs font-bold text-red-600 py-2 hover:bg-red-50 rounded">Hapus</button>
                         </div>
                      </div>
                   </div>
                ))
             )}
          </div>
       )}

       {/* Create Course Form */}
       {activeTab === 'upload' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto animate-fade-in">
             <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Upload Konten / Berita / Materi</h3>
                    <p className="text-sm text-gray-500">Pastikan mengisi <strong>Informasi Dasar</strong> DAN <strong>Isi Konten</strong>.</p>
                </div>
                {isAdmin && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">ADMIN MODE</span>
                )}
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 text-sm uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center">
                        <span className="bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                        Informasi Dasar (Wajib)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Konten <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Judul yang menarik..."
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                                >
                                    {isAdmin ? (
                                        // ADMIN ONLY CATEGORIES
                                        <>
                                            <option value="Berita">Berita (Dashboard)</option>
                                            <option value="Pengumuman">Pengumuman (Dashboard)</option>
                                            <option value="Undangan">Undangan (Dashboard)</option>
                                        </>
                                    ) : (
                                        // MEMBER / CREATOR CATEGORIES
                                        <>
                                            <optgroup label="KMP-ADNG Academy (Ruang Belajar)">
                                                <option value="Edukasi">Kursus / Edukasi</option>
                                                <option value="Workshop">Workshop</option>
                                                <option value="Sertifikasi">Sertifikasi</option>
                                            </optgroup>
                                            <optgroup label="Umum & Komunitas">
                                                <option value="Bisnis">Bisnis & UMKM (Dashboard)</option>
                                                <option value="Olah Raga">Berita Olah Raga & Liga</option>
                                                <option value="Hiburan">Hiburan (Musik/Video)</option>
                                                <option value="Seni Budaya">Seni Budaya & Tradisi</option>
                                                <option value="VLOG">VLOG Pribadi</option>
                                            </optgroup>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Kejadian <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Cth: Desa Sukamaju, Jawa Barat"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat <span className="text-red-500">*</span></label>
                                <textarea 
                                    rows={3} required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Ringkasan isi konten..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail / Cover</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition cursor-pointer">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">Upload Gambar Cover</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Content Builder */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 text-sm uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center">
                        <span className="bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                        Isi Konten / Bagian (Wajib Diisi Minimal 1)
                    </h4>
                    
                    {/* List of Added Modules */}
                    {modules.length > 0 ? (
                        <div className="space-y-2 mb-4">
                            {modules.map((mod, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded mr-3 bg-white text-emerald-600 shadow-sm`}>
                                            <CheckCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{mod.title}</p>
                                            <p className="text-xs text-gray-500">{mod.type === 'video' ? 'Video' : 'Artikel'} • {mod.duration}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeModule(idx)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                            Belum ada bagian konten. Tambahkan Video atau Artikel di bawah ini.
                        </div>
                    )}

                    {/* Add New Module Box */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-sm font-bold text-slate-700 mb-3">Tambah Bagian</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Judul Bagian (Cth: Video Liputan Acara)"
                                    value={newModule.title}
                                    onChange={e => setNewModule({...newModule, title: e.target.value})}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <select 
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    value={newModule.type}
                                    onChange={e => setNewModule({...newModule, type: e.target.value as any})}
                                >
                                    <option value="video">Video</option>
                                    <option value="article">Artikel / Teks</option>
                                </select>
                                <input 
                                    type="text" 
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Durasi (Cth: 5 Min)"
                                    value={newModule.duration}
                                    onChange={e => setNewModule({...newModule, duration: e.target.value})}
                                />
                            </div>
                        </div>

                        {newModule.type === 'video' ? (
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                                placeholder="Link YouTube (Embed URL)"
                                value={newModule.contentUrl}
                                onChange={e => setNewModule({...newModule, contentUrl: e.target.value})}
                            />
                        ) : (
                            <textarea 
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                                placeholder="Tulis isi artikel berita atau materi di sini..."
                                value={newModule.textContent}
                                onChange={e => setNewModule({...newModule, textContent: e.target.value})}
                            />
                        )}

                        <button 
                            type="button" 
                            onClick={addModule}
                            className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 shadow-md"
                        >
                            <Plus className="w-4 h-4 inline mr-1" /> Tambah Bagian (Klik Disini)
                        </button>
                    </div>
                </div>

                {/* Important Notice */}
                {!isAdmin && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold">Moderasi Konten</p>
                            <p>Setelah klik "Kirim ke Moderasi", konten akan berstatus <strong>Pending</strong>. Admin akan mereview kelayakan tayang sesuai aturan komunitas KMP-ADNG.</p>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex space-x-4 border-t border-gray-100">
                   <button 
                      type="button" 
                      onClick={() => setActiveTab('list')}
                      className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                   >
                      Batal
                   </button>
                   <button 
                      type="submit" 
                      className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg"
                   >
                      {isAdmin ? 'Publikasikan Sekarang' : 'Kirim ke Moderasi'}
                   </button>
                </div>
             </form>
          </div>
       )}
    </div>
  );
};
