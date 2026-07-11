
import React, { useState, useEffect } from 'react';
import { User, AppRoute } from '../types';
import { Store, Car, Banknote, CheckCircle, Upload, ChevronRight, MapPin, Palette, FileText, Video, Youtube, Instagram, Facebook, Container, Briefcase, User as UserIcon, XCircle, AlertTriangle, Loader2, Megaphone, Clock } from 'lucide-react';
import { APP_LOGO, OCCUPIED_TERRITORIES } from '../constants';
import { useToast } from '../components/Toast';
import api from '../services/api';

interface RoleApplicationProps {
  user: User;
  onSubmit: (role: any, details?: any) => void; // Legacy signature, we'll handle internally
  onNavigate: (route: AppRoute) => void;
}

interface ApplicationRecord {
    id: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export const RoleApplication: React.FC<RoleApplicationProps> = ({ user, onNavigate }) => {
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'merchant' | 'driver' | 'exchanger' | 'content_creator' | 'distributor' | 'producer' | 'marketing_coordinator' | 'mobile_trader' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  // Form States
  const [genericData, setGenericData] = useState({ description: '', location: '', contact: '' });
  const [coordData, setCoordData] = useState({ level: 'Desa/Kelurahan', areaCode: '', areaName: '', description: '' });
  const [isCheckingArea, setIsCheckingArea] = useState(false);
  const [areaStatus, setAreaStatus] = useState<'idle' | 'available' | 'occupied'>('idle');
  const [occupiedBy, setOccupiedBy] = useState('');
  const [kordinatorDetails, setKordinatorDetails] = useState<any[]>([]);

  const [merchantData, setMerchantData] = useState({ shopName: '', shopDescription: '', shopPhoto: '' });
  const [driverData, setDriverData] = useState({ vehicleType: 'motor' as any, plateNumber: '', color: '', vehiclePhoto: '' });
  const [exchangerData, setExchangerData] = useState({ address: '', facilities: '', mapsLocation: '', depositCapacity: '' });
  const [creatorData, setCreatorData] = useState({ platform: 'YouTube', channelName: '', category: '', followersCount: '' });
  const [distributorData, setDistributorData] = useState({ companyName: '', npwp: '', warehouseAddress: '', distributionArea: '' });
  const [mobileTraderData, setMobileTraderData] = useState({ tradeName: '', category: 'Pedagang Sayur', vehicleType: 'Motor' });
  const [producerData, setProducerData] = useState({ groupName: '', location: '', memberCount: 3, commodityType: '' });

  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  // FETCH LOCATION NAMES
  useEffect(() => {
      const fetchLocationNames = async () => {
          const codes = [
              user.regional,
              user.provinceId,
              user.cityId,
              user.districtId,
              user.villageId
          ].filter(Boolean) as string[];

          if (codes.length === 0) return;

          let updated = false;
          
          // Use functional state update to avoid stale closures
          setLocationNames(prevNames => {
              const names = { ...prevNames };
              
              // We need to do the async work outside the state updater, 
              // so we'll just return prevNames for now and do the async work below
              return prevNames;
          });

          const newNames: Record<string, string> = {};
          
          await Promise.all(codes.map(async (code) => {
              // We check if it's already in the state to avoid refetching
              // But since we can't easily access the latest state here without a ref,
              // we'll just fetch it if we don't have it in our local newNames
              try {
                  const res = await api.get(`/locations/code?code=${code}`);
                  if (res.data.data?.name) {
                      newNames[code] = res.data.data.name;
                      updated = true;
                  } else {
                      newNames[code] = 'Tidak Ditemukan';
                      updated = true;
                  }
              } catch (err) {
                  newNames[code] = 'Tidak Ditemukan';
                  updated = true;
              }
          }));

          if (updated) {
              setLocationNames(prev => {
                  const merged = { ...prev };
                  let hasChanges = false;
                  for (const [k, v] of Object.entries(newNames)) {
                      if (merged[k] !== v) {
                          merged[k] = v;
                          hasChanges = true;
                      }
                  }
                  return hasChanges ? merged : prev;
              });
          }
      };

      fetchLocationNames();
  }, [user.regional, user.provinceId, user.cityId, user.districtId, user.villageId]); // Run when user location data changes

  // FETCH APPLICATIONS
  useEffect(() => {
      const fetchApps = async () => {
          try {
              const res = await api.get('/users/applications');
              setApplications(res.data.data);
          } catch (error) {
              console.error(error);
          } finally {
              setIsLoadingApps(false);
          }
      };
      fetchApps();

      // Load Kordinator Details from API
      const fetchKordinatorDetails = async () => {
          try {
              const res = await api.get('/users/kordinator-details');
              setKordinatorDetails(res.data.data || []);
          } catch (error) {
              console.error("Failed to fetch kordinator details", error);
          }
      };
      fetchKordinatorDetails();
  }, []);

  useEffect(() => {
      const checkCoordinatorArea = async () => {
          if (selectedRole !== 'marketing_coordinator') return;

          // 1. Dapatkan kode lokasi berdasarkan pilihan user pada dropdown
          const levelMap: Record<string, string | undefined> = {
              'Regional': user.regional,
              'Provinsi': user.provinceId,
              'Kota/Kabupaten': user.cityId,
              'Kecamatan': user.districtId,
              'Desa/Kelurahan': user.villageId
          };

          const code = levelMap[coordData.level];

          // Jika kode tidak ada di profil
          if (!code) {
              setCoordData(prev => {
                  if (prev.areaCode === '' && prev.areaName === '') return prev;
                  return { ...prev, areaCode: '', areaName: '' };
              });
              setAreaStatus('idle');
              return;
          }

          setCoordData(prev => ({ ...prev, areaCode: code, areaName: 'Mengambil nama wilayah...' }));
          setIsCheckingArea(true);

          try {
              // 2. Dapatkan nama wilayah dari tabel locations
              let locName = locationNames[code];
              
              if (!locName) {
                  try {
                      const res = await api.get(`/locations/code?code=${code}`);
                      locName = res.data.data?.name || 'Nama tidak ditemukan di database';
                      
                      // Update cache
                      setLocationNames(prev => ({...prev, [code]: locName}));
                  } catch (err) {
                      console.error("Error fetching location name:", err);
                      locName = 'Nama tidak ditemukan di database';
                      setLocationNames(prev => ({...prev, [code]: locName}));
                  }
              }
              
              // Tampilkan nama di layar
              setCoordData(prev => ({ 
                  ...prev, 
                  areaName: locName 
              }));

              // 3. Periksa apakah lokasi tersebut masih lowong atau sudah ditempati
              const checkRes = await api.get(`/users/check-coordinator-area?locationCode=${code}`);
              setAreaStatus(checkRes.data?.data?.occupied ? 'occupied' : 'available');
              if (checkRes.data?.data?.occupied) {
                  setOccupiedBy(checkRes.data.data.occupiedBy);
              } else {
                  setOccupiedBy('');
              }
              
          } catch (error) {
              console.error("Error checking area:", error);
              // showToast("Gagal mengecek ketersediaan wilayah", "error");
              setAreaStatus('idle');
          } finally {
              setIsCheckingArea(false);
          }
      };

      // Gunakan debounce untuk mencegah pemanggilan beruntun (infinite loop protection)
      const timeoutId = setTimeout(() => {
          checkCoordinatorArea();
      }, 500);

      return () => clearTimeout(timeoutId);
  }, [coordData.level, selectedRole, user.regional, user.provinceId, user.cityId, user.districtId, user.villageId]); // Removed locationNames to prevent infinite loops

  const checkEligibility = (level: string) => {
      const referrals = user.referralStats?.totalInvited || 0;
      const activeCoord = kordinatorDetails.find(d => d.userId === user.id && d.status === 'active');
      const currentLevel = activeCoord?.level;
      const memberCounter = activeCoord?.memberCounter || 0;

      switch (level) {
          case 'Regional':
              return referrals >= 200 || (currentLevel === 'Provinsi' && memberCounter >= 1200);
          case 'Provinsi':
              return referrals >= 100 || (currentLevel === 'Kota/Kabupaten' && memberCounter >= 600);
          case 'Kota/Kabupaten':
              return referrals >= 50 || (currentLevel === 'Kecamatan' && memberCounter >= 300);
          case 'Kecamatan':
              return referrals >= 10 || (currentLevel === 'Desa/Kelurahan' && memberCounter >= 30);
          case 'Desa/Kelurahan':
              return referrals >= 5;
          default:
              return false;
      }
  };

  const getEligibilityMessage = (level: string) => {
      switch (level) {
          case 'Regional': return "Syarat: 200 Referral ATAU Kordinator Provinsi dengan 1200 rekrut.";
          case 'Provinsi': return "Syarat: 100 Referral ATAU Kordinator Kabupaten dengan 600 rekrut.";
          case 'Kota/Kabupaten': return "Syarat: 50 Referral ATAU Kordinator Kecamatan dengan 300 rekrut.";
          case 'Kecamatan': return "Syarat: 10 Referral ATAU Kordinator Desa dengan 30 rekrut.";
          case 'Desa/Kelurahan': return "Syarat: 5 Referral.";
          default: return "";
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    let details;
    if (selectedRole === 'merchant') details = merchantData;
    else if (selectedRole === 'driver') details = driverData;
    else if (selectedRole === 'exchanger') details = exchangerData;
    else if (selectedRole === 'content_creator') details = creatorData;
    else if (selectedRole === 'distributor') details = distributorData;
    else if (selectedRole === 'producer') details = producerData;
    else if (selectedRole === 'marketing_coordinator') {
        if (areaStatus !== 'available') {
            showToast("Harap validasi ketersediaan wilayah terlebih dahulu.", "error");
            return;
        }
        details = coordData;
    }
    else if (selectedRole === 'mobile_trader') details = mobileTraderData;
    else details = genericData;

    setIsSubmitting(true);
    try {
        if (selectedRole === 'marketing_coordinator') {
            // Standard request role for Marketing Coordinator
            await api.post('/users/request-role', { role: selectedRole, details });
            
            // Optimistic Update
            const newApp: ApplicationRecord = {
                id: 'temp-' + Date.now(),
                role: selectedRole,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            setApplications([...applications, newApp]);
            
            showToast("Pengajuan berhasil dikirim! Menunggu admin.", "success");
            setSelectedRole(null);
        } else {
            // Standard request role for other roles
            await api.post('/users/request-role', { role: selectedRole, details });
            
            // Optimistic Update
            const newApp: ApplicationRecord = {
                id: 'temp-' + Date.now(),
                role: selectedRole,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            setApplications([...applications, newApp]);
            
            showToast("Pengajuan berhasil dikirim! Menunggu admin.", "success");
            setSelectedRole(null);
        }
    } catch (error: any) {
        showToast(error.response?.data?.message || "Gagal mengajukan role.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const hasRole = (role: string) => user.roles.includes(role as any);
  
  const getPendingStatus = (role: string) => {
      const app = applications.find(a => a.role === role && a.status === 'pending');
      return app ? true : false;
  };

  const renderRoleCard = (role: string, label: string, icon: React.ReactNode, colorClass: string, bgClass: string, borderClass: string) => {
      const isActive = hasRole(role);
      const isPending = getPendingStatus(role);
      const isDisabled = isActive || isPending;

      return (
        <div 
            onClick={() => !isDisabled && setSelectedRole(role as any)}
            className={`
            p-6 rounded-2xl border-2 transition text-center relative flex flex-col items-center
            ${isDisabled ? 'opacity-70 cursor-not-allowed bg-gray-50 border-gray-200' : 'cursor-pointer hover:border-gray-300'}
            ${selectedRole === role ? `${borderClass} ${bgClass}` : 'border-gray-100 bg-white'}
            `}
        >
            {isActive && <div className={`absolute top-2 right-2 ${colorClass}`}><CheckCircle size={16} /></div>}
            {isPending && <div className="absolute top-2 right-2 text-orange-500"><Clock size={16} /></div>}
            
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${selectedRole === role ? `bg-${colorClass.split('-')[1]}-500 text-white` : 'bg-gray-100 text-gray-500'}`}>
            {icon}
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{label}</h3>
            {isActive && <span className={`text-[10px] ${colorClass} font-bold mt-1`}>AKTIF</span>}
            {isPending && <span className="text-[10px] text-orange-600 font-bold mt-1">PENDING</span>}
        </div>
      );
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Jadi Mitra KMP-ADNG</h2>
      <p className="text-gray-500 mb-8">Pilih peran mitra untuk menambah penghasilan dan kontribusi.</p>

      {/* --- STATUS BANNER --- */}
      {applications.filter(a => a.status === 'pending').length > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-8 flex items-start space-x-3 animate-fade-in">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                  <h4 className="font-bold text-orange-800 text-sm">Pengajuan Sedang Diproses</h4>
                  <p className="text-xs text-orange-700 mt-1">
                      Anda memiliki pengajuan role: 
                      <span className="font-bold"> {applications.filter(a => a.status === 'pending').map(a => a.role.toUpperCase()).join(', ')}</span>.
                      Admin Pusat sedang meninjau data Anda.
                  </p>
              </div>
          </div>
      )}

      {/* --- ROLE SELECTION --- */}
      {isLoadingApps ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
            {renderRoleCard('merchant', '1. Merchant (Toko)', <Store className="w-7 h-7" />, 'text-blue-600', 'bg-blue-50', 'border-blue-500')}
            {renderRoleCard('driver', '2. Driver', <Car className="w-7 h-7" />, 'text-slate-600', 'bg-slate-50', 'border-slate-500')}
            {renderRoleCard('exchanger', '3. Exchanger', <Banknote className="w-7 h-7" />, 'text-yellow-600', 'bg-yellow-50', 'border-yellow-500')}
            {renderRoleCard('content_creator', '4. Creator', <Video className="w-7 h-7" />, 'text-gray-800', 'bg-gray-100', 'border-black')}
            {renderRoleCard('mobile_trader', '5. Pedagang Keliling', <Megaphone className="w-7 h-7" />, 'text-pink-600', 'bg-pink-50', 'border-pink-500')}
            {renderRoleCard('distributor', '6. Distributor', <Container className="w-7 h-7" />, 'text-orange-800', 'bg-orange-50', 'border-orange-800')}
            {renderRoleCard('producer', '7. Produsen (Pokja)', <Briefcase className="w-7 h-7" />, 'text-orange-600', 'bg-orange-50', 'border-orange-400')}
            {renderRoleCard('marketing_coordinator', '8. Kordinator', <UserIcon className="w-7 h-7" />, 'text-yellow-500', 'bg-yellow-50', 'border-yellow-400')}
          </div>
      )}

      {/* --- 1. MERCHANT FORM --- */}
      {selectedRole === 'merchant' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h3 className="font-bold text-lg mb-6 text-blue-800 border-b pb-2">Formulir Merchant (Toko)</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label><input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={merchantData.shopName} onChange={e => setMerchantData({...merchantData, shopName: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Barang</label><textarea required rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={merchantData.shopDescription} onChange={e => setMerchantData({...merchantData, shopDescription: e.target.value})} /></div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Kirim Pengajuan"}
            </button>
          </form>
        </div>
      )}

      {/* --- 2. DRIVER FORM --- */}
      {selectedRole === 'driver' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h3 className="font-bold text-lg mb-6 text-slate-800 border-b pb-2">Formulir Driver</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kendaraan</label><select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={driverData.vehicleType} onChange={e => setDriverData({...driverData, vehicleType: e.target.value as any})}><option value="motor">Motor</option><option value="mobil">Mobil</option><option value="box">Mobil Box</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Plat Nomor</label><input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" value={driverData.plateNumber} onChange={e => setDriverData({...driverData, plateNumber: e.target.value})} /></div>
             </div>
             <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 flex items-center justify-center">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Kirim Pengajuan"}
            </button>
          </form>
        </div>
      )}

      {/* --- 3. EXCHANGER FORM --- */}
      {selectedRole === 'exchanger' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h3 className="font-bold text-lg mb-6 text-yellow-800 border-b pb-2">Formulir Exchanger (Agen Tunai)</h3>
          <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800">
              <p><strong>Syarat:</strong> Wajib memiliki deposit awal di Akun Khusus Exchanger untuk melayani transaksi Anggota.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lokasi</label><textarea required rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={exchangerData.address} onChange={e => setExchangerData({...exchangerData, address: e.target.value})} /></div>
             <div><label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Deposit Awal (Rp)</label><input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={exchangerData.depositCapacity} onChange={e => setExchangerData({...exchangerData, depositCapacity: e.target.value})} /></div>
             <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold hover:bg-yellow-700 flex items-center justify-center">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Kirim Pengajuan"}
            </button>
          </form>
        </div>
      )}

      {/* --- 4. CREATOR FORM --- */}
      {selectedRole === 'content_creator' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h3 className="font-bold text-lg mb-6 text-black border-b pb-2">Formulir Content Creator</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Platform Utama</label><select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={creatorData.platform} onChange={e => setCreatorData({...creatorData, platform: e.target.value})}><option value="YouTube">YouTube</option><option value="Instagram">Instagram</option><option value="TikTok">TikTok</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label><select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={creatorData.category} onChange={e => setCreatorData({...creatorData, category: e.target.value})}><option value="">Pilih...</option><option value="Edukasi">Edukasi</option><option value="Hiburan">Hiburan</option><option value="Seni Budaya">Seni Budaya</option><option value="Olahraga">Olahraga</option></select></div>
             </div>
             <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Channel</label><input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={creatorData.channelName} onChange={e => setCreatorData({...creatorData, channelName: e.target.value})} /></div>
             <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 flex items-center justify-center">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Daftar Creator"}
            </button>
          </form>
        </div>
      )}

      {/* --- 5. MOBILE TRADER FORM --- */}
      {selectedRole === 'mobile_trader' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
              <h3 className="font-bold text-lg mb-6 text-pink-700 border-b pb-2">Formulir Pedagang Keliling</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Usaha / Dagangan</label>
                      <input 
                        type="text" required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" 
                        placeholder="Contoh: Bakso Mas Kumis, Sayur Segar Bu Ani"
                        value={mobileTraderData.tradeName}
                        onChange={e => setMobileTraderData({...mobileTraderData, tradeName: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Dagangan</label>
                          <select 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                            value={mobileTraderData.category}
                            onChange={e => setMobileTraderData({...mobileTraderData, category: e.target.value as any})}
                          >
                              <option value="Pedagang Sayur">Pedagang Sayur Keliling</option>
                              <option value="Gerobak Street Food">Gerobak Street Food (Bakso, Mie Ayam, dll)</option>
                              <option value="Asongan Makanan Siap Saji">Asongan Makanan Siap Saji</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sarana Jualan</label>
                          <select 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                            value={mobileTraderData.vehicleType}
                            onChange={e => setMobileTraderData({...mobileTraderData, vehicleType: e.target.value})}
                          >
                              <option value="Motor">Motor Roda Dua</option>
                              <option value="Gerobak Dorong">Gerobak Dorong</option>
                              <option value="Becak Motor">Becak Motor (Bentor)</option>
                              <option value="Mobil Bak">Mobil Bak Terbuka</option>
                              <option value="Sepeda">Sepeda</option>
                          </select>
                      </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 shadow-md flex items-center justify-center">
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Ajukan Sebagai Pedagang Keliling"}
                  </button>
              </form>
          </div>
      )}

      {/* --- 6. DISTRIBUTOR FORM --- */}
      {selectedRole === 'distributor' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h3 className="font-bold text-lg mb-6 text-orange-900 border-b pb-2">Formulir Distributor (Pembeli Grosir)</h3>
          <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200 text-sm text-orange-800">
              <p>Peran ini memberikan akses ke <strong>Pasar Grosir</strong> sebagai PEMBELI komoditas dalam jumlah besar.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label><input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={distributorData.companyName} onChange={e => setDistributorData({...distributorData, companyName: e.target.value})} /></div>
             <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Gudang</label><textarea required rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" value={distributorData.warehouseAddress} onChange={e => setDistributorData({...distributorData, warehouseAddress: e.target.value})} /></div>
             <button type="submit" disabled={isSubmitting} className="w-full bg-orange-800 text-white py-3 rounded-xl font-bold hover:bg-orange-900 flex items-center justify-center">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Ajukan Distributor"}
            </button>
          </form>
        </div>
      )}

      {/* --- 7. PRODUCER (POKJA) FORM --- */}
      {selectedRole === 'producer' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
              <h3 className="font-bold text-lg mb-6 text-slate-800 border-b pb-2">
                  Formulir Produsen (Kelompok Kerja)
              </h3>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0" />
                  <div className="text-sm text-blue-800">
                      <strong>Syarat & Ketentuan Pokja:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Wajib membentuk Kelompok Kerja (Pokja) minimal 3 orang, maksimal 10 orang.</li>
                          <li>Anggota Pokja harus tinggal berdekatan (satu Desa/Kecamatan).</li>
                          <li>Pembentukan Pokja dilakukan di menu "Koperasi" &gt; "Ajukan Usaha Produksi".</li>
                          <li>Formulir ini adalah pendaftaran akses penjualan ke <strong>Pasar Grosir</strong>.</li>
                      </ul>
                  </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelompok (Pokja)</label>
                      <input 
                          type="text" required 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                          placeholder="Contoh: Pokja Tani Desa Sukamaju"
                          value={producerData.groupName}
                          onChange={e => setProducerData({...producerData, groupName: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Produksi</label>
                      <input 
                          type="text" required 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                          placeholder="Desa / Kecamatan"
                          value={producerData.location}
                          onChange={e => setProducerData({...producerData, location: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Anggota</label>
                          <input 
                              type="number" min={3} max={10} required 
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                              value={producerData.memberCount}
                              onChange={e => setProducerData({...producerData, memberCount: parseInt(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Komoditas</label>
                          <input 
                              type="text" required 
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                              placeholder="Kopi, Padi, Jagung..."
                              value={producerData.commodityType}
                              onChange={e => setProducerData({...producerData, commodityType: e.target.value})}
                          />
                      </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 flex items-center justify-center">
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Ajukan Akses Penjual Grosir"}
                  </button>
              </form>
          </div>
      )}

      {/* --- 8. COORDINATOR FORM --- */}
      {selectedRole === 'marketing_coordinator' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
              <h3 className="font-bold text-lg mb-6 text-yellow-800 border-b pb-2">
                  Formulir Kordinator Wilayah (Tunggal)
              </h3>
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
                  <p className="text-sm text-yellow-800">
                      <strong>Perhatian:</strong> Satu wilayah hanya boleh memiliki SATU Kordinator. 
                      Pastikan wilayah yang Anda tuju belum terisi. Jika sudah terisi, pengajuan akan ditolak otomatis.
                  </p>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Data Wilayah Profil Anda Saat Ini:</h4>
                  <ul className="text-sm text-blue-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <li><strong>Regional:</strong> {user.regional ? `${user.regional} / ${locationNames[user.regional] || '...'}` : <span className="text-gray-400 italic">Kosong</span>}</li>
                      <li><strong>Provinsi:</strong> {user.provinceId ? `${user.provinceId} / ${locationNames[user.provinceId] || '...'}` : <span className="text-gray-400 italic">Kosong</span>}</li>
                      <li><strong>Kota/Kabupaten:</strong> {user.cityId ? `${user.cityId} / ${locationNames[user.cityId] || '...'}` : <span className="text-gray-400 italic">Kosong</span>}</li>
                      <li><strong>Kecamatan:</strong> {user.districtId ? `${user.districtId} / ${locationNames[user.districtId] || '...'}` : <span className="text-gray-400 italic">Kosong</span>}</li>
                      <li><strong>Desa/Kelurahan:</strong> {user.villageId ? `${user.villageId} / ${locationNames[user.villageId] || '...'}` : <span className="text-gray-400 italic">Kosong</span>}</li>
                  </ul>
              </div>

              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Wilayah</label>
                          <select 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                            value={coordData.level}
                            onChange={(e) => setCoordData({...coordData, level: e.target.value})}
                          >
                              <option value="Regional">Regional</option>
                              <option value="Provinsi">Provinsi</option>
                              <option value="Kota/Kabupaten">Kota / Kabupaten</option>
                              <option value="Kecamatan">Kecamatan</option>
                              <option value="Desa/Kelurahan">Desa / Kelurahan</option>
                          </select>
                          <p className={`text-xs mt-1 font-bold ${checkEligibility(coordData.level) ? 'text-green-600' : 'text-gray-500'}`}>
                              {getEligibilityMessage(coordData.level)}
                              <br/>
                              <span className="font-normal text-gray-500 italic">*Syarat ini hanya sebagai acuan prioritas, Anda tetap bisa mengajukan.</span>
                          </p>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wilayah</label>
                          <input 
                              type="text" required 
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-gray-50 text-gray-600"
                              placeholder="Nama Wilayah (Otomatis)"
                              value={coordData.areaName || 'Belum ada data di profil'}
                              readOnly
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Wilayah</label>
                          <input 
                              type="text" required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-gray-50 text-gray-600"
                              placeholder="Kode Wilayah (Otomatis)"
                              value={coordData.areaCode || 'Belum ada data di profil'}
                              readOnly
                          />
                          
                          {isCheckingArea && (
                              <p className="text-xs text-blue-600 mt-1 font-bold flex items-center">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sedang mengecek ketersediaan wilayah...
                              </p>
                          )}
                          {!isCheckingArea && areaStatus === 'occupied' && (
                              <p className="text-xs text-red-600 mt-1 font-bold flex items-center">
                                  <XCircle className="w-3 h-3 mr-1" /> Maaf, posisi Kordinator untuk wilayah ini sudah diisi oleh Anggota lain ({occupiedBy}).
                              </p>
                          )}
                          {!isCheckingArea && areaStatus === 'available' && (
                              <p className="text-xs text-green-600 mt-1 font-bold flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Wilayah Tersedia! Silakan isi Rencana Pengembangan untuk mendaftar.
                              </p>
                          )}
                          {!isCheckingArea && !coordData.areaCode && (
                              <p className="text-xs text-orange-600 mt-1 flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Data wilayah tingkat ini belum diisi di profil Anda, atau Anda belum menyimpan perubahan profil.
                              </p>
                          )}
                      </div>
                  </div>

                  {areaStatus === 'available' && (
                      <>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Rencana Pengembangan</label>
                              <textarea 
                                  required rows={3}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                                  placeholder="Jelaskan strategi Anda untuk mengembangkan anggota di wilayah ini..."
                                  value={coordData.description}
                                  onChange={e => setCoordData({...coordData, description: e.target.value})}
                              />
                          </div>

                          <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting || !coordData.description.trim()}
                            className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Ajukan Kordinator ke Admin"}
                          </button>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};
