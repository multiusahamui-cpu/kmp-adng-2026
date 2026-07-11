import React from 'react';
import { User } from '../types';
import { Banknote, ArrowUpRight, ArrowDownLeft, RefreshCw, MapPin, Wallet } from 'lucide-react';

interface ExchangerDashboardProps {
  user: User;
}

export const ExchangerDashboard: React.FC<ExchangerDashboardProps> = ({ user }) => {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Banknote size={180} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center mb-4">
                    <span className="bg-purple-500 text-xs font-bold px-2 py-1 rounded mr-2">RESMI</span>
                    <h2 className="text-2xl font-bold">Agen Exchanger KMP-ADNG</h2>
                </div>
                <p className="text-purple-200 max-w-xl">
                    Kelola layanan setor dan tarik tunai untuk anggota di sekitar wilayah Anda.
                    Pastikan saldo tunai dan digital selalu tersedia.
                </p>
                
                <div className="mt-8 flex items-center space-x-6">
                    <div>
                        <p className="text-sm text-purple-300">Saldo Digital Agen</p>
                        <p className="text-3xl font-bold">Rp {user.balance.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="h-10 w-px bg-white/20"></div>
                    <div>
                         <p className="text-sm text-purple-300">Limit Transaksi Harian</p>
                         <p className="text-xl font-bold text-white/80">Rp {user.exchangerDetails?.depositCapacity || '50.000.000'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <ArrowDownLeft className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800">Terima Setor Tunai</h3>
                <p className="text-sm text-gray-500 mt-2">Terima uang tunai dari anggota, kirim saldo digital.</p>
            </button>

            <button className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <ArrowUpRight className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800">Layani Tarik Tunai</h3>
                <p className="text-sm text-gray-500 mt-2">Kirim uang tunai ke anggota, potong saldo digital mereka.</p>
            </button>

            <button className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800">Re-stock Saldo</h3>
                <p className="text-sm text-gray-500 mt-2">Top up saldo agen dari Bank atau Koperasi Pusat.</p>
            </button>
        </div>

        {/* Active Requests List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Permintaan Transaksi Sekitar</h3>
                <span className="flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3 mr-1" /> {user.exchangerDetails?.address || 'Lokasi Agen'}
                </span>
            </div>
            
            <div className="divide-y divide-gray-100">
                {[1, 2].map((i) => (
                    <div key={i} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 transition">
                        <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto">
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                            <div>
                                <h4 className="font-bold text-slate-800">Ahmad Zulkifli</h4>
                                <p className="text-sm text-gray-500">Ingin Tarik Tunai • 0.5 km</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full md:w-auto space-x-6">
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Nominal</p>
                                <p className="font-bold text-xl text-slate-800">Rp 500.000</p>
                            </div>
                            <div className="flex space-x-2">
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-100">Tolak</button>
                                <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">Proses</button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State visual if no transactions */}
                {false && (
                    <div className="p-10 text-center text-gray-400">
                        <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>Belum ada permintaan transaksi di area Anda.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};