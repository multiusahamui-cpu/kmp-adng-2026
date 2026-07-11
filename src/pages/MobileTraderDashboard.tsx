
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
    Megaphone, 
    Plus, 
    Trash2, 
    Utensils, 
    MapPin,
    Power,
    Navigation,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useToast } from '../components/Toast';
import api from '../services/api';

interface MobileTraderDashboardProps {
  user: User;
}

export const MobileTraderDashboard: React.FC<MobileTraderDashboardProps> = ({ user }) => {
  const { showToast } = useToast();
  const traderDetails = user.mobileTraderDetails || { tradeName: 'Pedagang Keliling', category: 'Umum', vehicleType: 'Motor' };
  
  const [activeTab, setActiveTab] = useState<'status' | 'menu'>('status');
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [menuItems, setMenuItems] = useState<any[]>([
      { id: 1, name: 'Bakso Urat Besar', price: 15000, category: 'Makanan' },
      { id: 2, name: 'Mie Ayam Ceker', price: 12000, category: 'Makanan' },
      { id: 3, name: 'Es Teh Manis', price: 3000, category: 'Minuman' },
  ]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Makanan' });

  // Load Status Awal
  useEffect(() => {
      // Di real app, fetch status terakhir dari API
      // api.get('/trader/status').then(...)
  }, []);

  const handleToggleStatus = async () => {
      setIsLoading(true);
      const newStatus = !isOnline;

      if (newStatus) {
          // AKTIFKAN: Ambil Lokasi Dulu
          if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                  async (position) => {
                      try {
                          // 1. Update Lokasi ke Server
                          await api.put('/trader/location', {
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude
                          });

                          // 2. Set Online
                          await api.put('/trader/status', { isOnline: true });
                          
                          setIsOnline(true);
                          showToast("Lapak ONLINE! Lokasi Anda terlihat di peta warga.", "success");
                      } catch (error) {
                          console.error(error);
                          showToast("Gagal update server.", "error");
                      } finally {
                          setIsLoading(false);
                      }
                  },
                  (error) => {
                      console.error(error);
                      showToast("Gagal akses GPS. Pastikan izin lokasi aktif.", "error");
                      setIsLoading(false);
                  },
                  { enableHighAccuracy: true }
              );
          } else {
              showToast("Browser tidak support GPS.", "error");
              setIsLoading(false);
          }
      } else {
          // MATIKAN
          try {
              await api.put('/trader/status', { isOnline: false });
              setIsOnline(false);
              showToast("Lapak OFFLINE. Istirahat yang cukup!", "info");
          } catch (e) {
              showToast("Gagal update status.", "error");
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleUpdateLocationManual = () => {
      if (!isOnline) return;
      showToast("Memperbarui titik lokasi...", "info");
      navigator.geolocation.getCurrentPosition(async (pos) => {
          await api.put('/trader/location', { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          showToast("Lokasi Terkini Diperbarui", "success");
      });
  };

  // ... (Menu Handlers tetap sama)
  const handleAddItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItem.name || !newItem.price) return;
      const item = { id: Date.now(), name: newItem.name, price: parseInt(newItem.price), category: newItem.category };
      setMenuItems([...menuItems, item]);
      setNewItem({ name: '', price: '', category: 'Makanan' });
      setIsAddingItem(false);
      showToast("Menu ditambahkan!", "success");
  };

  const handleDeleteItem = (id: number) => {
      if(window.confirm("Hapus menu ini?")) setMenuItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto min-h-screen space-y-6">
        {/* Header Branding */}
        <div className={`rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl transition-all duration-500
            ${isOnline ? 'bg-gradient-to-br from-green-600 to-emerald-800' : 'bg-gradient-to-br from-slate-700 to-slate-900'}
        `}>
            <div className="relative z-10 text-center">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 border-4 border-white/20 shadow-lg
                    ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}
                `}>
                    <Megaphone className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-1">{traderDetails.tradeName}</h1>
                <p className="text-white/80 text-sm mb-6 flex items-center justify-center">
                    {traderDetails.category} • {traderDetails.vehicleType}
                </p>

                <button 
                    onClick={handleToggleStatus}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform transform active:scale-95 flex items-center justify-center
                        ${isOnline ? 'bg-white text-green-700 hover:bg-gray-100' : 'bg-emerald-500 text-white hover:bg-emerald-600'}
                    `}
                >
                    {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                        isOnline ? <><Power className="w-6 h-6 mr-2" /> TUTUP LAPAK (OFFLINE)</> : <><Navigation className="w-6 h-6 mr-2" /> BUKA LAPAK (GO LIVE)</>
                    )}
                </button>

                {isOnline && (
                    <div className="mt-4 flex justify-center">
                        <button onClick={handleUpdateLocationManual} className="text-xs flex items-center text-green-100 hover:text-white bg-white/10 px-3 py-1 rounded-full">
                            <RefreshCw className="w-3 h-3 mr-1" /> Update Titik Lokasi
                        </button>
                    </div>
                )}
            </div>
            
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button 
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center ${activeTab === 'status' ? 'bg-slate-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <MapPin className="w-4 h-4 mr-2" /> Status & Lokasi
            </button>
            <button 
                onClick={() => setActiveTab('menu')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center ${activeTab === 'menu' ? 'bg-slate-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Utensils className="w-4 h-4 mr-2" /> Atur Menu
            </button>
        </div>

        {/* Content Status */}
        {activeTab === 'status' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Statistik Hari Ini</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                        <p className="text-xs text-blue-600 font-bold uppercase">Dilihat Warga</p>
                        <p className="text-2xl font-bold text-slate-800">24 <span className="text-sm font-normal text-gray-500">kali</span></p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                        <p className="text-xs text-orange-600 font-bold uppercase">Durasi Online</p>
                        <p className="text-2xl font-bold text-slate-800">1.5 <span className="text-sm font-normal text-gray-500">jam</span></p>
                    </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
                    <p className="flex items-start">
                        <span className="mr-2">💡</span> 
                        <strong>Tips:</strong> Pastikan Anda melakukan "Update Titik Lokasi" setiap berpindah tempat (misal: pindah dari RT 01 ke RT 05) agar pembeli tidak bingung.
                    </p>
                </div>
            </div>
        )}

        {/* Content Menu */}
        {activeTab === 'menu' && (
            <div className="animate-fade-in space-y-4">
                <button 
                    onClick={() => setIsAddingItem(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 hover:border-emerald-400 hover:text-emerald-600 transition flex items-center justify-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> Tambah Menu Dagangan
                </button>

                {isAddingItem && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-lg animate-slide-up relative z-10">
                        <form onSubmit={handleAddItem} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Menu</label>
                                <input type="text" className="w-full border rounded p-2 text-sm" placeholder="Contoh: Bakso Urat" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Harga (Rp)</label>
                                    <input type="number" className="w-full border rounded p-2 text-sm" placeholder="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                                    <select className="w-full border rounded p-2 text-sm bg-white" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                        <option value="Makanan">Makanan</option>
                                        <option value="Minuman">Minuman</option>
                                        <option value="Cemilan">Cemilan</option>
                                        <option value="Sayur">Sayur</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setIsAddingItem(false)} className="px-4 py-2 text-gray-500 text-sm font-bold">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold">Simpan</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-3">
                    {menuItems.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category} • Rp {item.price.toLocaleString('id-ID')}</p>
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
