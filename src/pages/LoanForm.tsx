import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { Calculator, ChevronLeft, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface LoanFormProps {
  onNavigate: (route: AppRoute) => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({ onNavigate }) => {
  const [amount, setAmount] = useState<number>(1000000);
  const [duration, setDuration] = useState<number>(3); // Months
  const [purpose, setPurpose] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const INTEREST_RATE = 0.015; // 1.5% flat per month
  const ADMIN_FEE = 50000;

  const [calculation, setCalculation] = useState({
    monthlyPrincipal: 0,
    monthlyInterest: 0,
    totalMonthly: 0,
    totalPayment: 0
  });

  useEffect(() => {
    const principal = amount / duration;
    const interest = amount * INTEREST_RATE;
    const totalMonth = principal + interest;
    
    setCalculation({
      monthlyPrincipal: principal,
      monthlyInterest: interest,
      totalMonthly: totalMonth,
      totalPayment: totalMonth * duration
    });
  }, [amount, duration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="p-8 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengajuan Berhasil!</h2>
        <p className="text-gray-500 mb-6">
          Pengajuan pinjaman sebesar <strong>Rp {amount.toLocaleString('id-ID')}</strong> telah diterima. 
          Tim analis kredit KMP-ADNG akan menghubungi Anda dalam waktu 1x24 jam untuk verifikasi.
        </p>
        <button 
          onClick={() => onNavigate(AppRoute.KOPERASI)}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
        >
          Kembali ke Koperasi
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <button 
        onClick={() => onNavigate(AppRoute.KOPERASI)}
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6 transition"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Kembali
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Calculator className="mr-3 text-emerald-400" /> Simulasi & Pengajuan Pinjaman
          </h2>
          <p className="text-slate-400 text-sm mt-1">Dapatkan modal usaha dengan bunga ringan anggota.</p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pinjaman (Rp)</label>
              <input 
                type="number"
                min="500000"
                max="25000000"
                step="500000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg text-slate-800"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Min: 500rb</span>
                <span>Max: 25 Juta</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenor (Bulan): <span className="font-bold text-emerald-600">{duration} Bulan</span></label>
              <input 
                type="range"
                min="3"
                max="24"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3 Bulan</span>
                <span>24 Bulan</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan Peminjaman</label>
              <select 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              >
                <option value="">Pilih Tujuan...</option>
                <option value="modal">Modal Usaha</option>
                <option value="pendidikan">Biaya Pendidikan</option>
                <option value="kesehatan">Biaya Kesehatan</option>
                <option value="renovasi">Renovasi Rumah</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
            >
              Ajukan Pinjaman
            </button>
          </form>

          {/* Simulation Result */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 h-fit">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-gray-200 pb-2">Rincian Angsuran</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pokok Pinjaman</span>
                <span className="font-medium">Rp {amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tenor</span>
                <span className="font-medium">{duration} Bulan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bunga (1.5% / bln)</span>
                <span className="font-medium text-orange-600">Rp {Math.round(calculation.monthlyInterest).toLocaleString('id-ID')}</span>
              </div>
              
              <div className="border-t border-gray-200 my-4 pt-4">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-800 font-bold">Angsuran per Bulan</span>
                    <span className="text-xl font-bold text-emerald-600">Rp {Math.round(calculation.totalMonthly).toLocaleString('id-ID')}</span>
                 </div>
                 <p className="text-xs text-gray-400 text-right italic">*Flat rate system</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-start space-x-2 text-xs text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Biaya Admin Rp {ADMIN_FEE.toLocaleString('id-ID')} akan dipotong saat pencairan dana.</p>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg flex items-start space-x-2 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Pastikan saldo simpanan sukarela mencukupi minimal 10% dari pinjaman sebagai agunan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};