import React, { useState } from 'react';
import { User, Product, Order } from '../types';
import { MOCK_ORDERS } from '../constants';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Plus, 
  Image as ImageIcon,
  Truck,
  MapPin
} from 'lucide-react';

interface StoreManagerProps {
  user: User;
  products: Product[];
  onAddProduct: (product: Product) => void;
}

export const StoreManager: React.FC<StoreManagerProps> = ({ user, products, onAddProduct }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'add'>('products');
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  
  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Kerajinan',
    description: '',
  });

  // Filter products belonging to this user (In a real app, this would be an API call)
  // For this demo, we assume products with sellerName matching user's shop name or just created ones.
  // Since we don't have sellerId in MOCK_PRODUCTS initially, we'll just show all for demo OR filter if we added IDs.
  // Let's filter by checking if sellerName exists, effectively showing "Marketplace" items as "My items" for demo purposes 
  // or specifically items added by this user.
  const myProducts = products.filter(p => p.sellerName === user.shopDetails?.name || !p.isOfficial);

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: `p-${Date.now()}`,
      name: newProduct.name,
      price: parseInt(newProduct.price),
      category: newProduct.category,
      image: 'https://picsum.photos/300/300', // Random image for demo
      rating: 0,
      location: user.exchangerDetails?.address || 'Lokasi Toko',
      isOfficial: false,
      sellerName: user.shopDetails?.name || user.name,
      sellerId: user.id
    };
    onAddProduct(product);
    setActiveTab('products');
    setNewProduct({ name: '', price: '', category: 'Kerajinan', description: '' });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const calculateTotalSales = () => {
    return orders
      .filter(o => o.status === 'completed')
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Dashboard */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
           <div className="flex items-center mb-4 md:mb-0">
             <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden mr-4 border border-gray-200">
               <img src={user.shopDetails?.imageUrl || "https://picsum.photos/200"} alt="Shop" className="w-full h-full object-cover" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800">{user.shopDetails?.name || "Toko Saya"}</h2>
               <p className="text-gray-500 text-sm">Merchant Resmi KMP-ADNG</p>
             </div>
           </div>
           <button 
             onClick={() => setActiveTab('add')}
             className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold flex items-center hover:bg-emerald-700 transition"
           >
             <Plus className="w-5 h-5 mr-2" /> Tambah Produk
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-emerald-700 font-medium">Total Penjualan</span>
                 <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-800">Rp {calculateTotalSales().toLocaleString('id-ID')}</p>
           </div>
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-blue-700 font-medium">Pesanan Aktif</span>
                 <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-800">{orders.filter(o => o.status === 'pending' || o.status === 'process').length} Pesanan</p>
           </div>
           <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-orange-700 font-medium">Total Produk</span>
                 <Package className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-800">{myProducts.length} Item</p>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'products' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
        >
          Produk Saya
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'orders' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
        >
          Pesanan Masuk
          {orders.filter(o => o.status === 'pending').length > 0 && (
             <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{orders.filter(o => o.status === 'pending').length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'add' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
        >
          Upload Produk
        </button>
      </div>

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           {myProducts.length === 0 ? (
             <div className="p-10 text-center text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Belum ada produk yang dijual.</p>
                <button onClick={() => setActiveTab('add')} className="mt-4 text-emerald-600 font-bold hover:underline">Upload Sekarang</button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {myProducts.map(product => (
                  <div key={product.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">
                     <div className="h-48 bg-gray-100 relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-xs font-bold rounded">
                           {product.category}
                        </span>
                     </div>
                     <div className="p-4">
                        <h3 className="font-bold text-slate-800 mb-1">{product.name}</h3>
                        <p className="text-emerald-600 font-bold">Rp {product.price.toLocaleString('id-ID')}</p>
                        <div className="mt-4 flex space-x-2">
                           <button className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">Edit</button>
                           <button className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100">Hapus</button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {/* --- ORDERS TAB --- */}
      {activeTab === 'orders' && (
         <div className="space-y-4">
            {orders.length === 0 ? (
               <div className="bg-white p-10 text-center text-gray-400 rounded-2xl">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Belum ada pesanan masuk.</p>
               </div>
            ) : (
               orders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-gray-100 pb-4">
                        <div className="flex items-center mb-2 md:mb-0">
                           <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 mr-3">#{order.id}</span>
                           <span className="text-sm text-gray-400">{order.date}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                           ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                             order.status === 'process' ? 'bg-blue-100 text-blue-600' :
                             order.status === 'shipped' ? 'bg-purple-100 text-purple-600' :
                             order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                        `}>
                           {order.status === 'pending' ? 'Menunggu Konfirmasi' : order.status}
                        </span>
                     </div>

                     <div className="flex items-start space-x-4 mb-6">
                        <img src={order.productImage} alt={order.productName} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                        <div>
                           <h4 className="font-bold text-slate-800">{order.productName}</h4>
                           <p className="text-sm text-gray-500">{order.quantity} x Rp {(order.amount / order.quantity).toLocaleString('id-ID')}</p>
                           <p className="text-emerald-600 font-bold mt-1">Total: Rp {order.amount.toLocaleString('id-ID')}</p>
                        </div>
                     </div>

                     <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                        <div>
                           <p className="font-bold text-sm text-slate-700">Dikirim ke: {order.buyerName}</p>
                           <p className="text-sm text-gray-500">{order.address}</p>
                        </div>
                     </div>

                     <div className="flex justify-end space-x-3">
                        {order.status === 'pending' && (
                           <>
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-slate-600 font-medium hover:bg-gray-50"
                              >
                                 Tolak
                              </button>
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'process')}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                              >
                                 Terima Pesanan
                              </button>
                           </>
                        )}
                        {order.status === 'process' && (
                           <button 
                             onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                             className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center"
                           >
                             <Truck className="w-4 h-4 mr-2" /> Kirim Barang
                           </button>
                        )}
                        {order.status === 'shipped' && (
                           <button className="px-6 py-2 bg-gray-100 text-gray-400 rounded-lg font-bold cursor-not-allowed">
                             Menunggu Konfirmasi Pembeli
                           </button>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      )}

      {/* --- ADD PRODUCT TAB --- */}
      {activeTab === 'add' && (
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
            <h3 className="font-bold text-xl mb-6 text-slate-800">Upload Produk Baru</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                     <input 
                       type="text" required
                       className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                       placeholder="Contoh: Kripik Singkong Balado"
                       value={newProduct.name}
                       onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                     <select 
                       className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                       value={newProduct.category}
                       onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                     >
                        <option value="Kerajinan">Kerajinan</option>
                        <option value="Makanan">Makanan & Minuman</option>
                        <option value="Fashion">Fashion & Aksesoris</option>
                        <option value="Pertanian">Hasil Pertanian</option>
                        <option value="Kesehatan">Kesehatan & Herbal</option>
                        <option value="Seni">Seni & Budaya</option>
                     </select>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-3 text-gray-500 font-bold">Rp</span>
                     <input 
                       type="number" required
                       className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                       placeholder="0"
                       value={newProduct.price}
                       onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
                  <textarea 
                     rows={4} required
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                     placeholder="Jelaskan detail produk, bahan, ukuran, dll..."
                     value={newProduct.description}
                     onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto Produk</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition cursor-pointer">
                     <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                     <span className="text-sm text-gray-500 font-medium">Klik untuk upload foto</span>
                     <span className="text-xs text-gray-400 mt-1">Format: JPG, PNG (Max 5MB)</span>
                  </div>
               </div>

               <div className="pt-4 flex space-x-4">
                  <button 
                     type="button" 
                     onClick={() => setActiveTab('products')}
                     className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                  >
                     Batal
                  </button>
                  <button 
                     type="submit" 
                     className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                  >
                     Simpan & Jual
                  </button>
               </div>
            </form>
         </div>
      )}
    </div>
  );
};