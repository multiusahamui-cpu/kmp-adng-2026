import React, { useState } from 'react';
import { User } from '../types';
import { Car, MapPin, Navigation, ToggleRight, ToggleLeft, User as UserIcon, CheckCircle } from 'lucide-react';

interface DriverDashboardProps {
  user: User;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [isOnline, setIsOnline] = useState(false);

  // Mock Active Orders
  const incomingOrder = isOnline ? {
    id: 'ord-ride-001',
    customer: 'Siti Aminah',
    pickup: 'Pasar Baru Traditional Market',
    dropoff: 'Perumahan Griya Asri No. 4',
    price: 15000,
    distance: '3.2 km',
    type: 'Ride'
  } : null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
       {/* Status Header */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-bold text-slate-800">Halo, {user.name}</h2>
             <p className="text-gray-500 text-sm">Driver • {user.driverDetails?.plateNumber}</p>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center px-6 py-3 rounded-full font-bold transition-all ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {isOnline ? (
                <>
                    <ToggleRight className="w-6 h-6 mr-2" /> ONLINE
                </>
            ) : (
                <>
                    <ToggleLeft className="w-6 h-6 mr-2" /> OFFLINE
                </>
            )}
          </button>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <p className="text-xs text-blue-600 font-bold uppercase mb-1">Pendapatan Hari Ini</p>
             <h3 className="text-xl font-bold text-slate-800">Rp 145.000</h3>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
             <p className="text-xs text-orange-600 font-bold uppercase mb-1">Total Order</p>
             <h3 className="text-xl font-bold text-slate-800">8</h3>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
             <p className="text-xs text-purple-600 font-bold uppercase mb-1">Jam Online</p>
             <h3 className="text-xl font-bold text-slate-800">4.5 Jam</h3>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
             <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Rating</p>
             <h3 className="text-xl font-bold text-slate-800">4.9 ⭐</h3>
          </div>
       </div>

       {/* Incoming Order Area */}
       <div className="bg-slate-900 rounded-2xl p-6 text-white min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/city-fields.png')]"></div>
          
          {!isOnline ? (
             <div className="text-center z-10">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Anda Sedang Offline</h3>
                <p className="text-gray-400">Aktifkan status untuk mulai menerima orderan.</p>
             </div>
          ) : incomingOrder ? (
             <div className="w-full max-w-md bg-white rounded-xl p-6 text-slate-800 shadow-2xl animate-bounce-in z-10">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Order Baru Masuk!</span>
                    <span className="text-sm font-medium text-gray-500">K-Ride</span>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-emerald-600 mt-1 mr-3 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-400">Jemput</p>
                            <p className="font-bold">{incomingOrder.pickup}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Navigation className="w-5 h-5 text-orange-500 mt-1 mr-3 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-400">Tujuan</p>
                            <p className="font-bold">{incomingOrder.dropoff}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-medium">{incomingOrder.customer}</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-600">Rp {incomingOrder.price.toLocaleString('id-ID')}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50">Tolak</button>
                    <button className="py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/30">Terima Order</button>
                </div>
             </div>
          ) : (
             <div className="text-center z-10">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <h3 className="text-xl font-bold mb-2">Mencari Orderan...</h3>
                 <p className="text-emerald-400">Tetap stand by, orderan akan segera masuk.</p>
             </div>
          )}
       </div>

       {/* Recent History */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Riwayat Perjalanan Terakhir</h3>
          <div className="space-y-4">
              {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-full mr-4">
                              <CheckCircle className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                              <p className="font-bold text-slate-700">Antar Penumpang (K-Ride)</p>
                              <p className="text-xs text-gray-400">Kemarin, 14:30 • 4.2 km</p>
                          </div>
                      </div>
                      <span className="font-bold text-emerald-600">+ Rp 18.000</span>
                  </div>
              ))}
          </div>
       </div>
    </div>
  );
};