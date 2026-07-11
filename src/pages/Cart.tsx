import React from 'react';
import { CartItem, AppRoute } from '../types';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Store } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (cartId: string, newQty: number) => void;
  onRemoveItem: (cartId: string) => void;
  onNavigate: (route: AppRoute) => void;
}

export const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemoveItem, onNavigate }) => {
  
  const totalPrice = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
           <ShoppingBag className="w-16 h-16 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Wah, keranjangmu masih sepi nih. Yuk, dukung produk lokal anggota KMP-ADNG!</p>
        <button 
          onClick={() => onNavigate(AppRoute.MARKETPLACE)}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
        >
          Mulai Belanja
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        <ShoppingBag className="mr-3 text-emerald-600" /> Keranjang Belanja ({items.length})
      </h2>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Cart Items List */}
        <div className="flex-1 space-y-4">
          {items.map(item => (
            <div key={item.cartId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 animate-slide-up">
               <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                 <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
               </div>
               
               <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                 <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
                    {item.isOfficial ? (
                       <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">KMP-ADNG MART</span>
                    ) : (
                       <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold flex items-center"><Store className="w-3 h-3 mr-1"/> {item.sellerName}</span>
                    )}
                 </div>
                 <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{item.name}</h3>
                 <p className="text-emerald-600 font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
               </div>

               <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                     <button 
                       onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                       className="p-2 text-gray-600 hover:bg-white rounded-md transition"
                       disabled={item.quantity <= 1}
                     >
                       <Minus className="w-4 h-4" />
                     </button>
                     <span className="w-10 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                     <button 
                       onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                       className="p-2 text-gray-600 hover:bg-white rounded-md transition"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.cartId)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))}
        </div>

        {/* Summary & Checkout */}
        <div className="w-full lg:w-96 shrink-0">
           <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-gray-100 pb-2">Ringkasan Belanja</h3>
              
              <div className="space-y-2 mb-6 text-sm text-gray-600">
                 <div className="flex justify-between">
                    <span>Total Harga ({items.length} Barang)</span>
                    <span className="font-bold text-slate-800">Rp {totalPrice.toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Estimasi Ongkir</span>
                    <span className="text-emerald-600 italic">Dihitung saat checkout</span>
                 </div>
              </div>

              <div className="flex justify-between items-center mb-6 pt-4 border-t border-dashed border-gray-200">
                 <span className="font-bold text-lg text-slate-800">Total Tagihan</span>
                 <span className="font-bold text-xl text-emerald-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>

              <button 
                onClick={() => onNavigate(AppRoute.CHECKOUT)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center"
              >
                Checkout <ArrowRight className="ml-2 w-5 h-5" />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};