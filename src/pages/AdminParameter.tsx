
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader2, MapPin, Database } from 'lucide-react';
import { useToast } from '../components/Toast';
import api from '../services/api';

interface AdminParameterProps {}

// Kita menyatukan tipe data karena strukturnya sama di tabel 'locations'
interface LocationData {
    code: string;
    name: string;
    type: 'Province' | 'City' | 'District' | 'Village';
    parentCode: string | null;
    memberCounter?: number;
}

export const AdminParameter: React.FC<AdminParameterProps> = () => {
    const { showToast } = useToast();

    // --- STATE ---
    const [activeTable, setActiveTable] = useState<'Province' | 'City' | 'District' | 'Village'>('Province');
    const [isLoading, setIsLoading] = useState(false);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [allLocations, setAllLocations] = useState<LocationData[]>([]); // Cache for parent lookup
    
    const [showFormModal, setShowFormModal] = useState(false);
    const [formData, setFormData] = useState<Partial<LocationData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch ALL locations to handle parent mapping easily in frontend (for now)
            // In huge production, this should be paginated or fetched by parent ID dynamically
            const res = await api.get('/admin/locations');
            const data = res.data.data;
            
            setAllLocations(data);
            setLocations(data.filter((l: LocationData) => l.type === activeTable));
        } catch (error) {
            console.error("Failed to fetch locations", error);
            showToast("Gagal mengambil data wilayah", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTable]); // Re-filter when tab changes

    // --- HANDLERS ---

    const handleOpenAdd = () => {
        setFormData({ type: activeTable });
        setShowFormModal(true);
    };

    const handleDeleteItem = async (code: string) => {
        if (!window.confirm("Hapus data wilayah ini? Data tidak bisa dihapus jika memiliki sub-wilayah (anak).")) return;

        try {
            await api.delete(`/admin/locations/${code}`);
            showToast("Data berhasil dihapus.", "success");
            fetchData(); // Refresh
        } catch (error: any) {
            showToast(error.response?.data?.message || "Gagal menghapus data", "error");
        }
    };

    const handleSaveDb = async () => {
        if(!formData.code || !formData.name) return showToast("Lengkapi Kode & Nama", "error");
        if(activeTable !== 'Province' && !formData.parentCode) return showToast("Wajib memilih Induk Wilayah (Parent)", "error");

        setIsSubmitting(true);
        try {
            await api.post('/admin/locations', {
                code: formData.code,
                name: formData.name,
                type: activeTable,
                parentCode: formData.parentCode || null
            });
            
            showToast("Data tersimpan ke Master Lokasi.", "success");
            setShowFormModal(false);
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Gagal menyimpan data", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to get potential parents based on active tab
    const getParentOptions = () => {
        if (activeTable === 'City') return allLocations.filter(l => l.type === 'Province');
        if (activeTable === 'District') return allLocations.filter(l => l.type === 'City');
        if (activeTable === 'Village') return allLocations.filter(l => l.type === 'District');
        return [];
    };

    const getParentLabel = () => {
        if (activeTable === 'City') return 'Provinsi';
        if (activeTable === 'District') return 'Kota/Kabupaten';
        if (activeTable === 'Village') return 'Kecamatan';
        return '';
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 flex items-center shadow-lg">
                <div className="bg-white/10 p-3 rounded-xl mr-4">
                    <Database className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Master Data Wilayah</h2>
                    <p className="text-white/70">Manajemen Kode Lokasi untuk Generator KTA (Provinsi, Kota, Kec, Desa)</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[600px]">
                
                {/* TABS */}
                <div className="border-b border-gray-200 overflow-x-auto">
                    <div className="flex p-2 gap-2">
                        {[
                            { id: 'Province', label: '1. Provinsi' },
                            { id: 'City', label: '2. Kota/Kab' },
                            { id: 'District', label: '3. Kecamatan' },
                            { id: 'Village', label: '4. Desa/Kel' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTable(tab.id as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition flex items-center
                                    ${activeTable === tab.id ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'text-gray-500 hover:bg-gray-50'}
                                `}
                            >
                                <MapPin className="w-4 h-4 mr-2" /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TOOLBAR */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-700 uppercase">Tabel: {activeTable}</h3>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{locations.length} Data</span>
                    </div>
                    <button onClick={handleOpenAdd} className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-cyan-700 flex items-center shadow-md">
                        <Plus className="w-4 h-4 mr-2" /> Tambah {activeTable}
                    </button>
                </div>

                {/* TABLE CONTENT */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-500 font-bold uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-32">Kode</th>
                                <th className="p-4">Nama Wilayah</th>
                                {activeTable !== 'Province' && <th className="p-4">Induk ({getParentLabel()})</th>}
                                {activeTable === 'City' && <th className="p-4 text-center">Counter Anggota</th>}
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat Data...
                                        </div>
                                    </td>
                                </tr>
                            ) : locations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">Belum ada data untuk {activeTable}. Silahkan tambah baru.</td>
                                </tr>
                            ) : (
                                locations.map(item => {
                                    const parent = allLocations.find(p => p.code === item.parentCode);
                                    return (
                                        <tr key={item.code} className="hover:bg-cyan-50/30 border-b border-gray-50 transition">
                                            <td className="p-4 font-mono font-bold text-slate-600 bg-slate-50/50">{item.code}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                            {activeTable !== 'Province' && (
                                                <td className="p-4 text-gray-600">
                                                    {parent ? (
                                                        <span className="flex flex-col">
                                                            <span className="font-bold text-xs">{parent.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">{parent.code}</span>
                                                        </span>
                                                    ) : <span className="text-red-400 italic">Induk Tidak Ditemukan</span>}
                                                </td>
                                            )}
                                            {activeTable === 'City' && (
                                                <td className="p-4 text-center font-mono font-bold text-emerald-600">
                                                    {item.memberCounter || 0}
                                                </td>
                                            )}
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteItem(item.code)} className="text-red-500 hover:bg-red-50 p-2 rounded transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold uppercase flex items-center"><MapPin className="w-4 h-4 mr-2" /> Tambah {activeTable}</h3>
                            <button onClick={() => setShowFormModal(false)} className="hover:text-cyan-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            
                            {/* DYNAMIC PARENT SELECTOR */}
                            {activeTable !== 'Province' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Pilih {getParentLabel()} (Induk)</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                        onChange={e => setFormData({...formData, parentCode: e.target.value})}
                                        value={formData.parentCode || ''}
                                    >
                                        <option value="">-- Pilih Induk --</option>
                                        {getParentOptions().map(p => (
                                            <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Kode Wilayah (Kemendagri)</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono tracking-wide focus:ring-2 focus:ring-cyan-500 outline-none" 
                                    onChange={e => setFormData({...formData, code: e.target.value})} 
                                    placeholder={
                                        activeTable === 'Province' ? "32 (2 Digit)" : 
                                        activeTable === 'City' ? "32.04 (5 Digit)" : 
                                        activeTable === 'District' ? "32.04.01 (8 Digit)" : "32.04.01.2001"
                                    } 
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Gunakan titik sebagai pemisah (Contoh: 32.04)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nama Wilayah</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none uppercase" 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder={`Nama ${activeTable}...`} 
                                />
                            </div>

                            <div className="pt-4 border-t flex justify-end space-x-2">
                                <button onClick={() => setShowFormModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-bold text-gray-600 text-sm">Batal</button>
                                <button 
                                    onClick={handleSaveDb} 
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-bold text-sm flex items-center disabled:bg-gray-400"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
