import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  CreditCard, 
  Camera 
} from 'lucide-react';
import { useToast } from '../Toast';
import { locationService, Location } from '../../services/location.service';
import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { User } from '../../types';

interface KycSectionProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const KycSection: React.FC<KycSectionProps> = ({ user, onUpdateUser }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [kycStep, setKycStep] = useState<'entry' | 'otp'>('entry');
  const [kycOtp, setKycOtp] = useState('');
  
  // --- LOCATION DATA STATE ---
  const [regions, setRegions] = useState<Location[]>([]);
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);

  const [kycFormData, setKycFormData] = useState({
      nik: user.nik || '',
      namaLengkap: user.name || '',
      jenisKelamin: user.gender || 'Laki-laki',
      alamatDomisili: user.address || '',
      regional: '', 
      propinsi: user.provinceId || '',
      kabupaten: user.cityId || '',
      kecamatan: user.districtId || '',
      desa: user.villageId || '',
      kodePos: user.postalCode || '',
      pekerjaan: user.occupation || '',
      namaAhliWaris: user.heir || '',
      ktpFile: null as File | null,
      fotoSelfie: null as File | null
  });

  // --- SMART INIT ---
  useEffect(() => {
      locationService.getRegions().then(setRegions).catch(console.error);
  }, []);

  // --- CASCADING DROPDOWNS ---
  useEffect(() => {
      if (kycFormData.regional) {
          locationService.getProvinces(kycFormData.regional).then(setProvinces).catch(console.error);
          setKycFormData(prev => ({ ...prev, propinsi: '', kabupaten: '', kecamatan: '', desa: '' }));
          setCities([]);
          setDistricts([]);
          setVillages([]);
      } else {
          setProvinces([]);
      }
  }, [kycFormData.regional]);

  useEffect(() => {
      if (kycFormData.propinsi) {
          locationService.getChildren(kycFormData.propinsi, 'City').then(setCities).catch(console.error);
      } else {
          setCities([]);
      }
  }, [kycFormData.propinsi]);

  useEffect(() => {
      if (kycFormData.kabupaten) {
          locationService.getChildren(kycFormData.kabupaten, 'District').then(setDistricts).catch(console.error);
      } else {
          setDistricts([]);
      }
  }, [kycFormData.kabupaten]);

  useEffect(() => {
      if (kycFormData.kecamatan) {
          locationService.getChildren(kycFormData.kecamatan, 'Village').then(setVillages).catch(console.error);
      } else {
          setVillages([]);
      }
  }, [kycFormData.kecamatan]);

  const handleKycFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'ktpFile' | 'fotoSelfie') => {
      if (e.target.files && e.target.files[0]) {
          setKycFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
      }
  };

  const submitKycData = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (kycFormData.nik.length !== 16) return showToast("NIK harus 16 digit.", "error");
      if (!kycFormData.ktpFile) return showToast("Wajib upload foto KTP.", "error");

      setIsLoading(true);
      try {
          const payload = {
              nik: kycFormData.nik,
              name: kycFormData.namaLengkap,
              gender: kycFormData.jenisKelamin,
              occupation: kycFormData.pekerjaan,
              heir: kycFormData.namaAhliWaris,
              street: kycFormData.alamatDomisili,
              provinceId: kycFormData.propinsi,
              cityId: kycFormData.kabupaten,
              districtId: kycFormData.kecamatan,
              villageId: kycFormData.desa,
              postalCode: kycFormData.kodePos
          };

          await api.post('/auth/onboarding/kyc', payload);
          await api.post('/auth/kyc/request-otp');
          
          showToast("Data KYC diterima. Kode OTP telah dikirim.", "success");
          setKycStep('otp');
      } catch (error: any) {
          showToast(error.response?.data?.message || "Gagal mengirim data KYC.", "error");
      } finally {
          setIsLoading(false);
      }
  };

  const verifyKycOtp = async () => {
      if(kycOtp.length < 6) return showToast("Masukkan 6 digit OTP", "error");
      
      setIsLoading(true);
      try {
          await api.post('/auth/kyc/verify-otp', { otp: kycOtp });
          
          showToast("Verifikasi Sukses! Akses Dompet Dibuka.", "success");
          
          const freshUser = await authService.getProfile();
          onUpdateUser(freshUser);

          setTimeout(() => {
              window.location.hash = '#/wallet'; 
              window.location.reload(); 
          }, 1000);

      } catch (error: any) {
          showToast(error.response?.data?.message || "OTP Salah.", "error");
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <div className="animate-fade-in">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-blue-900 dark:text-blue-400">KYC ANGGOTA KMP-ADNG</h1>
            <p className="text-gray-600 dark:text-gray-300">Lengkapi profil untuk bergabung dengan Koperasi Digital</p>
          </header>

          {kycStep === 'entry' ? (
              <form onSubmit={submitKycData} className="space-y-6 bg-white dark:bg-slate-800 p-1 md:p-6 rounded-lg">
                
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor NIK / KTP (16 Digit)</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          maxLength={16}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                          placeholder="320xxxxxxxxxxxxx"
                          value={kycFormData.nik}
                          onChange={e => setKycFormData({...kycFormData, nik: e.target.value.replace(/\D/g, '')})}
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap (Sesuai KTP)</label>
                    <input 
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white uppercase"
                      value={kycFormData.namaLengkap}
                      onChange={e => setKycFormData({...kycFormData, namaLengkap: e.target.value})}
                    />
                  </div>
                </section>

                <section>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Kelamin</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center cursor-pointer dark:text-white">
                        <input 
                            type="radio" 
                            name="gender" 
                            value="Laki-laki" 
                            className="mr-2"
                            checked={kycFormData.jenisKelamin === 'Laki-laki'}
                            onChange={() => setKycFormData({...kycFormData, jenisKelamin: 'Laki-laki'})}
                        /> Laki-laki
                    </label>
                    <label className="flex items-center cursor-pointer dark:text-white">
                        <input 
                            type="radio" 
                            name="gender" 
                            value="Perempuan" 
                            className="mr-2"
                            checked={kycFormData.jenisKelamin === 'Perempuan'}
                            onChange={() => setKycFormData({...kycFormData, jenisKelamin: 'Perempuan'})}
                        /> Perempuan
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat Domisili (Untuk Pengantaran)</label>
                    <textarea 
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                        rows={2}
                        value={kycFormData.alamatDomisili}
                        onChange={e => setKycFormData({...kycFormData, alamatDomisili: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Regional</label>
                        <select 
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                            value={kycFormData.regional}
                            onChange={e => setKycFormData({...kycFormData, regional: e.target.value})}
                        >
                          <option value="">-- Pilih Regional --</option>
                          {regions.map(r => (
                              <option key={r.code} value={r.code}>{r.name}</option>
                          ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Provinsi</label>
                        <select 
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                            value={kycFormData.propinsi}
                            onChange={e => setKycFormData({...kycFormData, propinsi: e.target.value, kabupaten: '', kecamatan: '', desa: ''})}
                            disabled={!kycFormData.regional}
                        >
                          <option value="">-- Pilih Provinsi --</option>
                          {provinces.map(p => (
                              <option key={p.code} value={p.code}>{p.name}</option>
                          ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Kabupaten/Kota</label>
                        <select 
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                            value={kycFormData.kabupaten}
                            onChange={e => setKycFormData({...kycFormData, kabupaten: e.target.value, kecamatan: '', desa: ''})}
                            disabled={!kycFormData.propinsi}
                        >
                          <option value="">-- Pilih Kota/Kab --</option>
                          {cities.map(c => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Kecamatan</label>
                        <select 
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                            value={kycFormData.kecamatan}
                            onChange={e => setKycFormData({...kycFormData, kecamatan: e.target.value, desa: ''})}
                            disabled={!kycFormData.kabupaten}
                        >
                          <option value="">-- Pilih Kecamatan --</option>
                          {districts.map(d => (
                              <option key={d.code} value={d.code}>{d.name}</option>
                          ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Desa/Kelurahan</label>
                        <select 
                            required
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                            onChange={e => setKycFormData({...kycFormData, desa: e.target.value})}
                            value={kycFormData.desa}
                            disabled={!kycFormData.kecamatan}
                        >
                          <option value="">-- Pilih Desa --</option>
                          {villages.map(v => (
                              <option key={v.code} value={v.code}>{v.name}</option>
                          ))}
                        </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Pos (Otomatis)</label>
                    <input 
                        readOnly 
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
                        value={kycFormData.kodePos}
                    />
                  </div>
                </section>

                <section>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pekerjaan</label>
                  <div className="relative">
                      <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <select 
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                        value={kycFormData.pekerjaan}
                        onChange={e => setKycFormData({...kycFormData, pekerjaan: e.target.value})}
                      >
                        <option value="">-- Pilih Pekerjaan --</option>
                        <option value="Petani">Petani / Peternakan</option>
                        <option value="Pedagang">Pedagang Kecil / Bisnis Sendiri</option>
                        <option value="PNS">PNS / TNI - Polri</option>
                        <option value="Wiraswasta">Wiraswasta (UKM)</option>
                        <option value="Pelajar">Pelajar / Mahasiswa</option>
                        <option value="Profesional">Profesional (Guru, Dokter, dll)</option>
                        <option value="PMI">PMI / Diaspora</option>
                      </select>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 p-4 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-slate-700 relative">
                    <label className="block text-sm font-medium text-red-600 mb-2 cursor-pointer">
                        <CreditCard className="mx-auto mb-1 w-6 h-6" /> Upload KTP (Wajib)
                    </label>
                    <input 
                        type="file" 
                        required 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*" 
                        onChange={e => handleKycFileChange(e, 'ktpFile')}
                    />
                    <p className="text-xs text-gray-500">{kycFormData.ktpFile ? kycFormData.ktpFile.name : 'Klik untuk memilih file'}</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 p-4 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-slate-700 relative">
                    <label className="block text-sm font-medium text-blue-600 mb-2 cursor-pointer">
                        <Camera className="mx-auto mb-1 w-6 h-6" /> Foto Selfie (Opsional)
                    </label>
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*" 
                        onChange={e => handleKycFileChange(e, 'fotoSelfie')}
                    />
                    <p className="text-xs text-gray-500">{kycFormData.fotoSelfie ? kycFormData.fotoSelfie.name : 'Klik untuk memilih file'}</p>
                  </div>
                </section>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Ahli Waris</label>
                  <input 
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                    placeholder="Nama anggota keluarga"
                    value={kycFormData.namaAhliWaris}
                    onChange={e => setKycFormData({...kycFormData, namaAhliWaris: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition shadow-lg flex items-center justify-center disabled:opacity-70"
                >
                  {isLoading ? 'Mengirim Data...' : 'Kirim Data KYC & Minta Kode OTP'}
                </button>
              </form>
          ) : (
              <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl text-center border border-gray-100 dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Verifikasi OTP</h2>
                <p className="mb-4 text-gray-600 dark:text-gray-300">Kode OTP telah dikirim sebagai persetujuan bergabung dengan <strong>KMP-ADNG</strong>.</p>
                
                <input 
                    type="text" 
                    placeholder="000000" 
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg mb-6 text-center tracking-[0.5em] text-2xl font-bold bg-white dark:bg-slate-700 dark:text-white"
                    value={kycOtp}
                    onChange={e => setKycOtp(e.target.value.replace(/\D/g, ''))}
                />
                
                <button 
                    onClick={verifyKycOtp}
                    disabled={isLoading || kycOtp.length < 6}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 w-full font-bold shadow-md disabled:bg-gray-400"
                >
                    {isLoading ? 'Memverifikasi...' : 'Konfirmasi & Setuju Bergabung'}
                </button>
                
                <button 
                    onClick={() => setKycStep('entry')}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Kembali ke Form
                </button>
              </div>
          )}
      </div>
  );
};
