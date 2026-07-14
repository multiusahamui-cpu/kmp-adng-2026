
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AppRoute, User } from '../types';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Loader2, 
  FileText,
  User as UserIcon,
  AlertTriangle,
  Lock,
  X,
  CheckCircle,
  Wallet,
  Camera
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { CameraCapture } from '../components/CameraCapture';
import api from '../services/api';
import { authService } from '../services/auth.service';
import { locationService, Location } from '../services/location.service';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY, THE_COVENANT } from '../constants/legalDocs';

interface OnboardingProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
  onComplete: (ktaId: string, referralCode?: string) => void;
  onRefreshProfile?: () => Promise<void>;
  referralCodeFromLink?: string; 
}

const OCCUPATIONS = [
    'Petani / Peternakan',
    'Pedagang Kecil / Bisnis Sendiri',
    'PNS / TNI - Polri',
    'Wiraswasta (UKM)',
    'Pelajar / Mahasiswa',
    'Profesional (Guru, Dosen, Dokter)',
    'PMI / Diaspora',
    'Lainnya'
];

export const Onboarding: React.FC<OnboardingProps> = ({ user, onNavigate, onRefreshProfile }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  // --- STATE DATA ---
  const [agreements, setAgreements] = useState({ terms: false, privacy: false, charter: false });
  const [legalModal, setLegalModal] = useState<{show: boolean, title: string, content: string}>({
      show: false, title: '', content: ''
  });
  
  const [profileData, setProfileData] = useState({
      nik: user.nik || '',
      name: user.name || '',
      gender: user.gender || 'Laki-laki',
      occupation: user.occupation || '',
      heir: user.heir || ''
  });

  const [addressData, setAddressData] = useState({
      street: user.address || '',
      regional: '', // New field
      provinceId: user.provinceId || '',
      cityId: user.cityId || '',
      districtId: user.districtId || '',
      villageId: user.villageId || '',
      postalCode: user.postalCode || ''
  });

  const [docs, setDocs] = useState({
      ktp: null as File | null,
      selfie: null as File | null
  });

  // Preview URLs
  const [previews, setPreviews] = useState({
      ktp: '',
      selfie: ''
  });

  const [cameraOpen, setCameraOpen] = useState<{ isOpen: boolean, type: 'ktp' | 'selfie' | null }>({
      isOpen: false,
      type: null
  });

  const [otpCode, setOtpCode] = useState('');
  
  // --- REFS FOR FALLBACK ---
  const ktpInputRef = React.useRef<HTMLInputElement>(null);
  const selfieInputRef = React.useRef<HTMLInputElement>(null);

  const handleCameraError = () => {
      const type = cameraOpen.type;
      setCameraOpen({ isOpen: false, type: null });
      
      // Delay to allow modal to close before opening file picker
      setTimeout(() => {
          if (type === 'ktp' && ktpInputRef.current) {
              ktpInputRef.current.click();
          } else if (type === 'selfie' && selfieInputRef.current) {
              selfieInputRef.current.click();
          }
      }, 300);
      
      showToast("Kamera tidak tersedia, membuka galeri...", "info");
  };
  
  // --- LOCATION DATA STATE ---
  const [regions, setRegions] = useState<Location[]>([]);
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);

  // --- SMART INIT ---
  useEffect(() => {
      // Fetch Regions on mount
      locationService.getRegions().then(setRegions).catch(console.error);
  }, []);

  // --- CASCADING DROPDOWNS ---
  // 1. Fetch Provinces when Regional changes
  useEffect(() => {
      if (addressData.regional) {
          locationService.getProvinces(addressData.regional).then(setProvinces).catch(console.error);
          // Reset children
          setAddressData(prev => ({ ...prev, provinceId: '', cityId: '', districtId: '', villageId: '' }));
          setCities([]);
          setDistricts([]);
          setVillages([]);
      } else {
          setProvinces([]);
      }
  }, [addressData.regional]);

  // 2. Fetch Cities when Province changes
  useEffect(() => {
      if (addressData.provinceId) {
          locationService.getChildren(addressData.provinceId, 'City').then(setCities).catch(console.error);
      } else {
          setCities([]);
      }
  }, [addressData.provinceId]);

  // 3. Fetch Districts when City changes
  useEffect(() => {
      if (addressData.cityId) {
          locationService.getChildren(addressData.cityId, 'District').then(setDistricts).catch(console.error);
      } else {
          setDistricts([]);
      }
  }, [addressData.cityId]);

  // 4. Fetch Villages when District changes
  useEffect(() => {
      if (addressData.districtId) {
          locationService.getChildren(addressData.districtId, 'Village').then(setVillages).catch(console.error);
      } else {
          setVillages([]);
      }
  }, [addressData.districtId]);

  // --- HANDLERS ---

  const handleNext = async () => {
      // Step 1: Legal
      if (step === 1) {
          if (!agreements.terms || !agreements.privacy || !agreements.charter) {
              return showToast("Anda wajib menyetujui semua dokumen.", "error");
          }
          setStep(2);
      }
      // Step 2: Profile
      else if (step === 2) {
          if (!profileData.nik || !profileData.name || !profileData.occupation || !profileData.heir) {
              return showToast("Mohon lengkapi semua data pribadi.", "error");
          }
          if (profileData.nik.length !== 16) return showToast("NIK harus 16 digit.", "error");
          setStep(3);
      }
      // Step 3: Address
      else if (step === 3) {
          if (!addressData.street || !addressData.provinceId || !addressData.villageId) {
              return showToast("Mohon lengkapi alamat domisili.", "error");
          }
          setStep(4);
      }
      // Step 4: Docs & Submit (SAVE DATA ONLY, THEN REQUEST OTP)
      else if (step === 4) {
          if (!docs.ktp) return showToast("Wajib upload Foto KTP.", "error");
          
          setIsLoading(true);
          try {
              // 1. Upload Files
              let ktpUrl = '';
              let selfieUrl = '';

              if (docs.ktp) {
                  const formData = new FormData();
                  formData.append('file', docs.ktp);
                  const res = await api.post('/upload', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  ktpUrl = res.data.data.url;
              }

              if (docs.selfie) {
                  const formData = new FormData();
                  formData.append('file', docs.selfie);
                  const res = await api.post('/upload', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  selfieUrl = res.data.data.url;
              }
              
              // 2. SAVE DATA TO BACKEND (Persistence)
              // IMPORTANT: Save data BEFORE OTP request
              await api.post('/auth/onboarding/kyc', {
                  ...profileData,
                  ...addressData,
                  ktpPhoto: ktpUrl,
                  selfiePhoto: selfieUrl
              });

              // 3. Refresh Local User Profile (To update UI/State in parent)
              // Ideally parent component handles this, but for now we assume next reload will fetch
              
              // 4. Request OTP
              await api.post('/auth/kyc/request-otp');
              
              showToast("Data Tersimpan. Masukkan OTP untuk konfirmasi.", "success");
              setStep(5);
          } catch (e: any) {
              console.error(e);
              showToast(e.response?.data?.message || "Gagal menyimpan data.", "error");
          } finally {
              setIsLoading(false);
          }
      }
      // Step 5: OTP Verification
      else if (step === 5) {
          if (otpCode.length < 6) return;
          setIsLoading(true);
          try {
              // Verify OTP & Unlock Wallet Access
              const res = await api.post('/auth/kyc/verify-otp', { otp: otpCode });
              
              showToast(res.data.message || "Verifikasi Sukses! Akses Dompet Dibuka.", "success");
              
              // Force reload profile to get new status/flags
              if (onRefreshProfile) {
                  await onRefreshProfile();
              } else {
                  await authService.getProfile(); 
              }
              
              // Move to Success Step
              setStep(6);

          } catch (error: any) {
              // Handle error gracefully (allow retry if not blacklisted)
              const msg = error.response?.data?.message || "OTP Salah";
              showToast(msg, "error");
              
              if (msg.includes("Digugurkan") || msg.includes("dihapus")) {
                  // Blacklisted scenario: logout
                  setTimeout(() => {
                      authService.logout();
                      window.location.href = '/';
                  }, 2000);
              }
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'selfie') => {
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          setDocs({ ...docs, [type]: file });
          setPreviews({ ...previews, [type]: URL.createObjectURL(file) });
      }
  };

  const handleCameraCapture = (file: File) => {
      if (cameraOpen.type) {
          setDocs({ ...docs, [cameraOpen.type]: file });
          setPreviews({ ...previews, [cameraOpen.type]: URL.createObjectURL(file) });
          setCameraOpen({ isOpen: false, type: null });
      }
  };

  // --- RENDER STEPS ---

  const renderStep1_Legal = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
              <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Persetujuan Keanggotaan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sebelum memulai, mohon baca dan setujui ketentuan berikut.</p>
          </div>

          <div className="space-y-4">
              <label className="flex items-start p-4 border dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-emerald-600" checked={agreements.terms} onChange={e => setAgreements({...agreements, terms: e.target.checked})} />
                  <div className="ml-3">
                      <span 
                        className="font-bold text-emerald-600 hover:underline hover:text-emerald-700 dark:text-emerald-400 block"
                        onClick={(e) => {
                            e.preventDefault();
                            setLegalModal({ show: true, title: 'Syarat & Ketentuan', content: TERMS_AND_CONDITIONS });
                        }}
                      >
                        Syarat & Ketentuan
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Saya menyetujui aturan penggunaan aplikasi KMP-ADNG.</p>
                  </div>
              </label>
              <label className="flex items-start p-4 border dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-emerald-600" checked={agreements.privacy} onChange={e => setAgreements({...agreements, privacy: e.target.checked})} />
                  <div className="ml-3">
                      <span 
                        className="font-bold text-emerald-600 hover:underline hover:text-emerald-700 dark:text-emerald-400 block"
                        onClick={(e) => {
                            e.preventDefault();
                            setLegalModal({ show: true, title: 'Kebijakan Privasi', content: PRIVACY_POLICY });
                        }}
                      >
                        Kebijakan Privasi
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Saya mengizinkan KMP-ADNG mengelola data pribadi saya.</p>
                  </div>
              </label>
              <label className="flex items-start p-4 border dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-emerald-600" checked={agreements.charter} onChange={e => setAgreements({...agreements, charter: e.target.checked})} />
                  <div className="ml-3">
                      <span 
                        className="font-bold text-emerald-600 hover:underline hover:text-emerald-700 dark:text-emerald-400 block"
                        onClick={(e) => {
                            e.preventDefault();
                            setLegalModal({ show: true, title: 'Piagam KMP-ADNG', content: THE_COVENANT });
                        }}
                      >
                        Piagam KMP-ADNG
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Saya tunduk pada AD/ART Koperasi Multi Pihak - Aset Digital Nusantara Garuda (KMP-ADNG).</p>
                  </div>
              </label>
          </div>
      </div>
  );

  const renderStep2_Profile = () => (
      <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">Data Pribadi</h3>
          
          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">NIK (Nomor KTP)</label>
              <input 
                type="text" maxLength={16} 
                className="w-full p-3 border dark:border-slate-600 rounded-lg font-mono text-lg dark:bg-slate-700 dark:text-white" 
                placeholder="16 Digit Angka" 
                value={profileData.nik} 
                onChange={e => setProfileData({...profileData, nik: e.target.value.replace(/\D/g,'')})} 
              />
          </div>
          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nama Lengkap (Sesuai KTP)</label>
              <input type="text" className="w-full p-3 border dark:border-slate-600 rounded-lg uppercase dark:bg-slate-700 dark:text-white" placeholder="Nama Lengkap" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
          </div>
          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Jenis Kelamin</label>
              <div className="flex gap-4 mt-1">
                  <label className="flex items-center dark:text-white"><input type="radio" name="gender" className="mr-2" checked={profileData.gender === 'Laki-laki'} onChange={() => setProfileData({...profileData, gender: 'Laki-laki'})} /> Laki-laki</label>
                  <label className="flex items-center dark:text-white"><input type="radio" name="gender" className="mr-2" checked={profileData.gender === 'Perempuan'} onChange={() => setProfileData({...profileData, gender: 'Perempuan'})} /> Perempuan</label>
              </div>
          </div>
          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Pekerjaan</label>
              <select className="w-full p-3 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" value={profileData.occupation} onChange={e => setProfileData({...profileData, occupation: e.target.value})}>
                  <option value="">Pilih Pekerjaan...</option>
                  {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
          </div>
          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nama Ahli Waris</label>
              <input type="text" className="w-full p-3 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Nama Istri/Suami/Anak/Ortu" value={profileData.heir} onChange={e => setProfileData({...profileData, heir: e.target.value})} />
          </div>
      </div>
  );

  const renderStep3_Address = () => (
      <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">Alamat Domisili</h3>
          <p className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/30 p-2 rounded mb-2">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Isi alamat tempat tinggal saat ini untuk pengiriman barang (Bukan alamat KTP).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regional */}
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Regional</label>
                  <select 
                      className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                      value={addressData.regional}
                      onChange={e => setAddressData({...addressData, regional: e.target.value})}
                  >
                      <option value="">-- Pilih Regional --</option>
                      {regions.map(r => (
                          <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                  </select>
              </div>

              {/* Provinsi */}
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Provinsi</label>
                  <select 
                      className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                      value={addressData.provinceId}
                      onChange={e => setAddressData({...addressData, provinceId: e.target.value})}
                      disabled={!addressData.regional}
                  >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                  </select>
              </div>

              {/* Kota/Kab */}
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Kabupaten/Kota</label>
                  <select 
                      className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                      value={addressData.cityId}
                      onChange={e => setAddressData({...addressData, cityId: e.target.value})}
                      disabled={!addressData.provinceId}
                  >
                      <option value="">-- Pilih Kota/Kab --</option>
                      {cities.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                  </select>
              </div>

              {/* Kecamatan */}
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Kecamatan</label>
                  <select 
                      className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                      value={addressData.districtId}
                      onChange={e => setAddressData({...addressData, districtId: e.target.value})}
                      disabled={!addressData.cityId}
                  >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map(d => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                  </select>
              </div>

              {/* Desa */}
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Desa/Kelurahan</label>
                  <select 
                      className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                      value={addressData.villageId}
                      onChange={e => {
                          // Mock Zip Code Auto-Fill based on village selection length/hash
                          const mockZip = (parseInt(e.target.value.replace(/\D/g,'') || '0') % 10000 + 40000).toString(); 
                          setAddressData({...addressData, villageId: e.target.value, postalCode: mockZip});
                      }}
                      disabled={!addressData.districtId}
                  >
                      <option value="">-- Pilih Desa --</option>
                      {villages.map(v => (
                          <option key={v.code} value={v.code}>{v.name}</option>
                      ))}
                  </select>
              </div>
          </div>
          
          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Kode Pos</label>
              <input type="text" readOnly className="w-full p-3 border dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed" value={addressData.postalCode || 'Otomatis'} />
          </div>

          <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Detail Jalan / No. Rumah</label>
              <textarea rows={2} className="w-full p-3 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Jl. Merdeka No. 45 RT01/RW02" value={addressData.street} onChange={e => setAddressData({...addressData, street: e.target.value})} />
          </div>
      </div>
  );

  const renderStep4_Docs = () => (
      <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">Upload Dokumen</h3>
          
          {/* KTP UPLOAD SECTION */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300">Foto KTP (Wajib)</label>
            <div className="flex gap-2">
                <button 
                    onClick={() => setCameraOpen({ isOpen: true, type: 'ktp' })}
                    className="flex-1 bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center font-bold hover:bg-emerald-700 transition shadow-md"
                >
                    <Camera className="w-5 h-5 mr-2" /> Ambil Foto
                </button>
                <div className="relative flex-1">
                    <input ref={ktpInputRef} type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" onChange={e => handleFileChange(e, 'ktp')} />
                    <button className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-white p-3 rounded-xl flex items-center justify-center font-bold hover:bg-gray-50 dark:hover:bg-slate-600 transition">
                        <FileText className="w-5 h-5 mr-2" /> Upload File
                    </button>
                </div>
            </div>
            
            {previews.ktp && (
                <div className="relative w-full h-48 mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <img src={previews.ktp} alt="Preview KTP" className="w-full h-full object-contain bg-black/5" />
                    <button onClick={() => setPreviews({...previews, ktp: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {!previews.ktp && <p className="text-xs text-gray-500">Pastikan KTP terlihat jelas dan tidak buram.</p>}
          </div>

          {/* SELFIE UPLOAD SECTION */}
          <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-slate-700">
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300">Foto Selfie (Opsional)</label>
            <div className="flex gap-2">
                <button 
                    onClick={() => setCameraOpen({ isOpen: true, type: 'selfie' })}
                    className="flex-1 bg-blue-600 text-white p-3 rounded-xl flex items-center justify-center font-bold hover:bg-blue-700 transition shadow-md"
                >
                    <Camera className="w-5 h-5 mr-2" /> Ambil Selfie
                </button>
                <div className="relative flex-1">
                    <input ref={selfieInputRef} type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" onChange={e => handleFileChange(e, 'selfie')} />
                    <button className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-white p-3 rounded-xl flex items-center justify-center font-bold hover:bg-gray-50 dark:hover:bg-slate-600 transition">
                        <UserIcon className="w-5 h-5 mr-2" /> Upload File
                    </button>
                </div>
            </div>

            {previews.selfie && (
                <div className="relative w-full h-48 mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <img src={previews.selfie} alt="Preview Selfie" className="w-full h-full object-cover" />
                    <button onClick={() => setPreviews({...previews, selfie: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {!previews.selfie && <p className="text-xs text-gray-500">Gunakan mode potret agar wajah terlihat jelas.</p>}
          </div>
      </div>
  );

  const renderStep5_OTP = () => (
      <div className="text-center animate-fade-in py-8">
          <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Akhir</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Kami telah mengirimkan kode OTP ke WhatsApp <strong>{user.phone}</strong>. 
              Masukkan kode untuk menandatangani data secara digital.
          </p>
          
          <input 
            type="text" 
            maxLength={6} 
            className="text-center text-3xl tracking-[0.5em] font-bold w-full border-b-2 border-emerald-500 focus:outline-none py-2 mb-8 bg-transparent dark:text-white"
            placeholder="000000"
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))}
            autoFocus
          />
      </div>
  );

  const renderStep6_Success = () => (
      <div className="text-center animate-fade-in py-8">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Verifikasi Berhasil!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
              Selamat, data Anda telah diverifikasi. <br/>
              Langkah terakhir untuk mengaktifkan keanggotaan adalah menyelesaikan pembayaran <strong>Simpanan Pokok & Pendaftaran</strong>.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-8 text-left flex items-start">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg mr-3 shrink-0">
                  <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Akses Dompet Digital Terbuka</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Menu Dompet Digital kini aktif. Silakan lakukan Top Up dan pembayaran tagihan keanggotaan di sana.
                  </p>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px] border border-gray-100 dark:border-slate-700">
          
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                  <h1 className="text-xl font-bold">Onboarding Anggota</h1>
                  <p className="text-xs text-slate-400">Langkah {step} dari 6</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold">
                  {step}
              </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100 dark:bg-slate-700 w-full">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(step/6)*100}%` }}></div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
              {step === 1 && renderStep1_Legal()}
              {step === 2 && renderStep2_Profile()}
              {step === 3 && renderStep3_Address()}
              {step === 4 && renderStep4_Docs()}
              {step === 5 && renderStep5_OTP()}
              {step === 6 && renderStep6_Success()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
              {step > 1 && step < 5 ? (
                  <button onClick={() => setStep(step - 1)} className="text-gray-500 font-bold flex items-center hover:text-slate-800 dark:hover:text-white">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
                  </button>
              ) : <div></div>}

              {step < 5 ? (
                  <button 
                    onClick={handleNext}
                    disabled={isLoading}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center disabled:bg-gray-400"
                  >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          step === 4 ? 'Simpan Data' : 'Lanjut'
                      )}
                      {step !== 4 && !isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
                  </button>
              ) : step === 5 ? (
                  <button 
                    onClick={handleNext}
                    disabled={isLoading || otpCode.length < 6}
                    className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-gray-400"
                  >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verifikasi & Selesai"}
                  </button>
              ) : (
                  <button 
                    onClick={() => onNavigate(AppRoute.WALLET)}
                    className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center justify-center animate-pulse"
                  >
                      Buka Dompet Digital <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
              )}
          </div>
      </div>

      {/* Legal Modal */}
      {legalModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{legalModal.title}</h3>
                    <button 
                        onClick={() => setLegalModal({...legalModal, show: false})} 
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <article className="prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center border-b-2 border-emerald-500 pb-4 tracking-tight" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 dark:text-emerald-400 mt-8 mb-4 flex items-center" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-md font-semibold text-slate-700 dark:text-gray-200 mt-6 mb-3" {...props} />,
                                p: ({node, ...props}) => <p className="text-slate-600 dark:text-gray-300 mb-4 leading-relaxed text-justify text-sm" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-2 text-slate-600 dark:text-gray-300 text-sm" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-2 text-slate-600 dark:text-gray-300 text-sm" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-slate-500 dark:text-gray-400 my-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-r-lg text-sm" {...props} />,
                                hr: ({node, ...props}) => <hr className="my-8 border-gray-200 dark:border-slate-700" {...props} />,
                            }}
                        >
                            {legalModal.content}
                        </ReactMarkdown>
                    </article>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
                    <button 
                        onClick={() => setLegalModal({...legalModal, show: false})}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg"
                    >
                        Tutup & Mengerti
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Camera Modal */}
      {cameraOpen.isOpen && (
          <CameraCapture 
            onCapture={handleCameraCapture}
            onClose={() => setCameraOpen({ isOpen: false, type: null })}
            onError={handleCameraError}
            facingMode={cameraOpen.type === 'ktp' ? 'environment' : 'user'}
            title={cameraOpen.type === 'ktp' ? 'Ambil Foto KTP' : 'Ambil Foto Selfie'}
          />
      )}
    </div>
  );
};
