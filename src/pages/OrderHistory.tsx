
import React, { useState, useEffect } from 'react';
import { Order, AppRoute } from '../types';
import { Package, Truck, Clock, MapPin, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface OrderHistoryProps {
  orders: Order[]; // Keep prop type but use internal state
  onNavigate: (route: AppRoute) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
      const fetchOrders = async () => {
          try {
              const res = await api.get('/marketplace/orders');
              setOrders(res.data.data);
          } catch (error) {
              console.error("Failed to load orders", error);
              showToast("Gagal memuat riwayat pesanan", "error");
          } finally {
              setIsLoading(false);
          }
      };
      fetchOrders();
  }, []);

  const getTimeline = (status: string) => {
      const steps = [
          { status: 'pending', label: 'Pesanan Dibuat', date: '---' },
          { status: 'process', label: 'Diproses Penjual', date: '---' },
          { status: 'shipped', label: 'Dalam Pengiriman', date: '---' },
          { status: 'completed', label: 'Pesanan Selesai', date: '---' }
      ];
      
      const currentIndex = steps.findIndex(s => s.status === status);
      if (status === 'cancelled') return [];

      return steps.map((step, idx) => ({
          ...step,
          completed: idx <= (currentIndex === -1 ? 0 : currentIndex) 
      }));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        <Package className="mr-3 text-emerald-600" /> Riwayat Pesanan Saya
      </h2>

      {isLoading ? (
          <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
      ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada riwayat pesanan.</p>
                <button onClick={() => onNavigate(AppRoute.MARKETPLACE)} className="mt-4 text-emerald-600 font-bold hover:underline">Belanja Sekarang</button>
            </div>
      ) : (
            <div className="space-y-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2 md:mb-0">
                                <span className="font-mono text-xs text-gray-500 bg-white px-2 py-1 border border-gray-200 rounded">#{order.id.slice(0, 8)}</span>
                                <span className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(order.date || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                  'bg-blue-100 text-blue-700'}
                            `}>
                                {order.status}
                            </span>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-800 mb-1">Pesanan Marketplace</h3>
                                    <p className="text-sm text-gray-500 mb-2">Total Belanja</p>
                                    <p className="font-bold text-emerald-600 text-lg">Rp {Number(order.amount).toLocaleString('id-ID')}</p>
                                </div>
                                
                                {order.status !== 'cancelled' && order.status !== 'pending' && (
                                    <div className="flex-1 border-l border-gray-100 pl-6 md:border-l-0 md:pl-0 md:border-l border-gray-100 md:pl-6">
                                        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center"><Truck className="w-4 h-4 mr-2" /> Status Pengiriman</h4>
                                        <div className="space-y-4 relative">
                                            <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                                            {getTimeline(order.status).map((step, idx) => (
                                                <div key={idx} className="flex items-start relative z-10">
                                                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${step.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'} mr-3 mt-0.5`}></div>
                                                    <div>
                                                        <p className={`text-xs font-bold ${step.completed ? 'text-slate-800' : 'text-gray-400'}`}>{step.label}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {order.address && (
                                            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                <span className="font-bold block mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Alamat Tujuan:</span>
                                                {order.address}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-white">Bantuan</button>
                            <button 
                                onClick={() => onNavigate(AppRoute.MARKETPLACE)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                            >
                                Beli Lagi
                            </button>
                        </div>
                    </div>
                ))
            }
            </div>
      )}
    </div>
  );
};
