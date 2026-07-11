
import React, { useState, useEffect } from 'react';
import { User, AppRoute } from '../types';
import { 
    User as UserIcon, 
    CreditCard, 
    MapPin, 
    Phone, 
    Mail, 
    ShieldCheck, 
    AlertTriangle, 
    Edit, 
    Camera, 
    Save, 
    ChevronRight,
    Users,
    CheckCircle,
    X,
    Loader2,
    FileText
} from 'lucide-react';
import { userService } from '../services/user.service';
import { locationService, Location } from '../services/location.service';
import { useToast } from '../components/Toast';

interface ProfileProps {
    user: User;
    onUpdateUser: (data: Partial<User>) => void;
    onNavigate: (route: AppRoute) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onNavigate }) => {
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // KYC Modal State
    const [showKycModal, setShowKycModal] = useState(false);
    const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

    // Location Data State
    const [regions, setRegions] = useState<Location[]>([]);
    const [provinces, setProvinces] = useState<Location[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [districts, setDistricts] = useState<Location[]>([]);
    const [villages, setVillages] = useState<Location[]>([]);

    // Editable State (General Profile)
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        heir: user.heir || '',
    });

    // KYC Form State
    const [kycData, setKycData] = useState({
        nik: user.nik || '',
        ktpPhoto: null as File | null,
        selfiePhoto: null as File | null,
        regional: '', // New field
        provinceId: user.provinceId || '',
        cityId: user.cityId || '',
        districtId: user.districtId || '',
        villageId: user.villageId || '',
        postalCode: user.postalCode || ''
    });

    const isPending = user.status === 'pending';

    // --- EFFECTS FOR LOCATION ---
    useEffect(() => {
        if (showKycModal) {
            loadRegions();
        }
    }, [showKycModal]);

    useEffect(() => {
        if (kycData.regional) {
            loadProvinces(kycData.regional);
            setProvinces([]);
            setCities([]);
            setDistricts([]);
            setVillages([]);
        }
    }, [kycData.regional]);

    useEffect(() => {
        if (kycData.provinceId) {
            loadCities(kycData.provinceId);
            setCities([]);
            setDistricts([]);
            setVillages([]);
        }
    }, [kycData.provinceId]);

    useEffect(() => {
        if (kycData.cityId) {
            loadDistricts(kycData.cityId);
            setDistricts([]);
            setVillages([]);
        }
    }, [kycData.cityId]);

    useEffect(() => {
        if (kycData.districtId) {
            loadVillages(kycData.districtId);
            setVillages([]);
        }
    }, [kycData.districtId]);

    const loadRegions = async () => {
        try {
            const data = await locationService.getRegions();
            setRegions(data);
        } catch (e) {
            console.error("Failed to load regions", e);
        }
    };

    const loadProvinces = async (regionCode: string) => {
        try {
            const data = await locationService.getProvinces(regionCode);
            setProvinces(data);
        } catch (e) {
            console.error("Failed to load provinces", e);
        }
    };

    const loadCities = async (provCode: string) => {
        try {
            const data = await locationService.getChildren(provCode, 'City');
            setCities(data);
        } catch (e) {
            console.error("Failed to load cities", e);
        }
    };

    const loadDistricts = async (cityCode: string) => {
        try {
            const data = await locationService.getChildren(cityCode, 'District');
            setDistricts(data);
        } catch (e) {
            console.error("Failed to load districts", e);
        }
    };

    const loadVillages = async (districtCode: string) => {
        try {
            const data = await locationService.getChildren(districtCode, 'Village');
            setVillages(data);
        } catch (e) {
            console.error("Failed to load villages", e);
        }
    };

    // --- HANDLERS ---

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            await userService.updateProfile(formData);
            onUpdateUser(formData);
            setIsEditing(false);
            showToast("Profil berhasil diperbarui", "success");
        } catch (error) {
            showToast("Gagal update profil", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKycSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!kycData.nik || kycData.nik.length < 16) {
            return showToast("NIK harus 16 digit angka.", "error");
        }
        if (!kycData.ktpPhoto || !kycData.selfiePhoto) {
            return showToast("Wajib upload foto KTP dan Selfie.", "error");
        }
        if (!kycData.provinceId || !kycData.cityId || !kycData.districtId || !kycData.villageId) {
            return showToast("Lengkapi data wilayah domisili.", "error");
        }

        setIsSubmittingKyc(true);
        try {
            // Simulasi Upload ke Backend
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update user data locally (NIK & Location saved)
            const payload = {
                nik: kycData.nik,
                provinceId: kycData.provinceId,
                cityId: kycData.cityId,
                districtId: kycData.districtId,
                villageId: kycData.villageId,
                postalCode: kycData.postalCode
            };

            await userService.updateProfile(payload);
            onUpdateUser(payload); // Optimistic update

            setShowKycModal(false);
            showToast("Data KYC Terkirim! Silahkan lakukan pembayaran di menu Dompet untuk aktivasi.", "success");
            
            // Optional: Redirect to Wallet for payment after KYC
            setTimeout(() => onNavigate(AppRoute.WALLET), 1500);

        } catch (error) {
            showToast("Gagal mengirim data KYC", "error");
        } finally {
            setIsSubmittingKyc(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'ktpPhoto' | 'selfiePhoto') => {
        if (e.target.files && e.target.files[0]) {
            setKycData(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
            
            {/* 1. Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-8 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative">
                    <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-lg object-cover" />
                    <button className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-700 shadow-md">
                        <Camera size={14} />
                    </button>
                </div>

                <div className="md:ml-6 mt-4 md:mt-2 flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{user.phone}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                        {user.roles.map(role => (
                            <span key={role} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                {role.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-6 md:mt-0 text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Status Keanggotaan</p>
                    {isPending ? (
                        <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Calon Anggota
                        </span>
                    ) : (
                        <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center">
                            <ShieldCheck className="w-4 h-4 mr-2" /> Anggota Aktif
                        </span>
                    )}
                    {!isPending && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono font-bold">{user.ktaId}</p>
                    )}
                </div>
            </div>

            {/* 2. KYC Alert (If Pending) */}
            {isPending && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold flex items-center mb-2">
                            <ShieldCheck className="w-6 h-6 mr-2" /> Lengkapi Data KYC Anda
                        </h3>
                        <p className="text-orange-100 text-sm max-w-xl">
                            Agar akun aktif dan bisa bertransaksi, Anda wajib melengkapi NIK, Foto KTP, dan Selfie.
                            Data Anda dilindungi enkripsi standar perbankan.
                        </p>
                    </div>
                    {/* BUTTON REDIRECTS TO ONBOARDING PAGE */}
                    <button 
                        onClick={() => onNavigate(AppRoute.ONBOARDING)}
                        className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-orange-50 transition flex items-center transform hover:scale-105"
                    >
                        Lengkapi Sekarang <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
            )}

            {/* 3. Detailed Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" /> Data Pribadi
                    </h3>
                    {!isPending && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline flex items-center"
                        >
                            <Edit className="w-4 h-4 mr-1" /> Edit Data
                        </button>
                    )}
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    {/* NIK & KTP Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">NIK (Nomor Induk Kependudukan)</label>
                            {user.nik ? (
                                <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200 tracking-wide">{user.nik}</p>
                            ) : (
                                <p className="text-sm text-red-500 italic flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-1" /> Belum diisi (Wajib KYC)
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status Dokumen</label>
                            <div className="flex space-x-4">
                                <span className={`flex items-center text-sm font-bold ${user.nik ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                    <CreditCard className="w-4 h-4 mr-1" /> KTP {user.nik ? 'Terupload' : '-'}
                                </span>
                                <span className={`flex items-center text-sm font-bold ${user.nik ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                    <UserIcon className="w-4 h-4 mr-1" /> Selfie {user.nik ? 'Terupload' : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-slate-700" />

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                            {isEditing ? (
                                <input 
                                    type="email" 
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            ) : (
                                <p className="text-slate-700 dark:text-slate-200 flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400"/> {user.email || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor WhatsApp</label>
                            <p className="text-slate-700 dark:text-slate-200 flex items-center"><Phone className="w-4 h-4 mr-2 text-gray-400"/> {user.phone}</p>
                            {isEditing && <p className="text-[10px] text-orange-500 mt-1">*Nomor HP tidak dapat diubah sembarangan.</p>}
                        </div>
                    </div>

                    {/* Address & Heir */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alamat Domisili</label>
                            {isEditing ? (
                                <textarea 
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            ) : (
                                <p className="text-slate-700 dark:text-slate-200 flex items-start"><MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1"/> {user.address || 'Belum diisi'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ahli Waris</label>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.heir}
                                    onChange={e => setFormData({...formData, heir: e.target.value})}
                                />
                            ) : (
                                <p className="text-slate-700 dark:text-slate-200 flex items-center"><Users className="w-4 h-4 mr-2 text-gray-400"/> {user.heir || 'Belum diisi'}</p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isLoading}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center"
                            >
                                {isLoading ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Business Profiles (Read Only) */}
            {(user.shopDetails || user.driverDetails || user.mobileTraderDetails) && (
                <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Profil Usaha</h3>
                    <div className="space-y-4">
                        {user.shopDetails && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <span className="font-bold text-blue-800 dark:text-blue-300">Merchant: {user.shopDetails.name}</span>
                                <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Aktif</span>
                            </div>
                        )}
                        {user.driverDetails && (
                            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <span className="font-bold text-slate-800 dark:text-white">Driver: {user.driverDetails.plateNumber}</span>
                                <span className="text-xs bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white px-2 py-1 rounded">Aktif</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- KYC MODAL (RESTORED & STYLED) --- */}
            {showKycModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                            <div>
                                <h3 className="text-xl font-bold flex items-center"><ShieldCheck className="w-6 h-6 mr-2 text-emerald-400"/> Verifikasi Identitas (KYC)</h3>
                                <p className="text-slate-400 text-sm">Lengkapi data untuk mengaktifkan akun.</p>
                            </div>
                            <button onClick={() => setShowKycModal(false)} className="hover:text-red-400 transition"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleKycSubmit} className="space-y-6">
                                {/* 1. NIK Input */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> Nomor Induk Kependudukan (NIK)
                                    </label>
                                    <input 
                                        type="text" 
                                        maxLength={16}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono tracking-widest bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                                        placeholder="16 Digit NIK KTP"
                                        value={kycData.nik}
                                        onChange={e => setKycData({...kycData, nik: e.target.value.replace(/\D/g, '')})}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">*Pastikan NIK sesuai dengan KTP asli.</p>
                                </div>

                                {/* 2. Upload Photos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 transition relative">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'ktpPhoto')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {kycData.ktpPhoto ? (
                                            <div className="text-center">
                                                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Foto KTP Dipilih</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{kycData.ktpPhoto.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <CreditCard className="w-6 h-6" />
                                                </div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200">Foto e-KTP</p>
                                                <p className="text-xs text-gray-400 mt-1">Klik untuk upload</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 transition relative">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'selfiePhoto')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {kycData.selfiePhoto ? (
                                            <div className="text-center">
                                                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Selfie Dipilih</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{kycData.selfiePhoto.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Camera className="w-6 h-6" />
                                                </div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200">Foto Selfie</p>
                                                <p className="text-xs text-gray-400 mt-1">Wajah terlihat jelas</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3 text-sm text-blue-800 dark:text-blue-300">
                                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>Data Anda dienkripsi dan disimpan aman sesuai standar perlindungan data pribadi. Kami tidak menyebarkan data tanpa izin.</p>
                                </div>

                                {/* 3. Location Dropdowns */}
                                <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                                        <MapPin className="w-4 h-4 mr-2" /> Alamat Domisili
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Regional */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Regional</label>
                                            <select 
                                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={kycData.regional}
                                                onChange={e => setKycData({...kycData, regional: e.target.value, provinceId: '', cityId: '', districtId: '', villageId: ''})}
                                            >
                                                <option value="">Pilih Regional</option>
                                                {regions.map(r => (
                                                    <option key={r.code} value={r.code}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Province */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Provinsi</label>
                                            <select 
                                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={kycData.provinceId}
                                                onChange={e => setKycData({...kycData, provinceId: e.target.value, cityId: '', districtId: '', villageId: ''})}
                                                disabled={!kycData.regional}
                                            >
                                                <option value="">Pilih Provinsi</option>
                                                {provinces.map(p => (
                                                    <option key={p.code} value={p.code}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* City */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kota/Kabupaten</label>
                                            <select 
                                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={kycData.cityId}
                                                onChange={e => setKycData({...kycData, cityId: e.target.value, districtId: '', villageId: ''})}
                                                disabled={!kycData.provinceId}
                                            >
                                                <option value="">Pilih Kota/Kab</option>
                                                {cities.map(c => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* District */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kecamatan</label>
                                            <select 
                                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={kycData.districtId}
                                                onChange={e => setKycData({...kycData, districtId: e.target.value, villageId: ''})}
                                                disabled={!kycData.cityId}
                                            >
                                                <option value="">Pilih Kecamatan</option>
                                                {districts.map(d => (
                                                    <option key={d.code} value={d.code}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Village */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Desa/Kelurahan</label>
                                            <select 
                                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={kycData.villageId}
                                                onChange={e => setKycData({...kycData, villageId: e.target.value})}
                                                disabled={!kycData.districtId}
                                            >
                                                <option value="">Pilih Desa/Kelurahan</option>
                                                {villages.map(v => (
                                                    <option key={v.code} value={v.code}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Postal Code (Manual Input for now) */}
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kode Pos</label>
                                            <input 
                                                type="text"
                                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="Contoh: 40123"
                                                value={kycData.postalCode}
                                                onChange={e => setKycData({...kycData, postalCode: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSubmittingKyc || !kycData.nik || !kycData.ktpPhoto || !kycData.selfiePhoto}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingKyc ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Mengirim Data...</>
                                    ) : (
                                        "Kirim Verifikasi"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
