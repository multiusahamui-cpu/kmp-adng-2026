
import React, { useState, useEffect } from 'react';
import { Product, AppRoute } from '../types';
import { Star, MapPin, Filter, Store, UserCheck, Plus, Package } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { ProductSkeleton } from '../components/Skeleton'; // IMPORTED

interface MarketplaceProps {
  onAddToCart: (product: Product) => void;
  onNavigate: (route: AppRoute) => void; 
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onAddToCart, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'official' | 'member'>('official');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
      const fetchProducts = async () => {
          setIsLoading(true); // Ensure loading state is true on start
          try {
              const res = await api.get('/marketplace/products');
              setProducts(res.data.data);
          } catch (error) {
              console.error("Failed to load products", error);
              showToast("Gagal memuat produk", "error");
          } finally {
              // Add small delay to show off the skeleton (optional, removed for prod speed)
              setTimeout(() => setIsLoading(false), 500);
          }
      };
      fetchProducts();
  }, []);

  const displayProducts = products.filter(p => {
      const matchTab = activeTab === 'official' ? p.isOfficial : !p.isOfficial;
      const matchCategory = selectedCategory === 'Semua' ? true : p.category === selectedCategory;
      return matchTab && matchCategory;
  });

  const categories = ['Semua', 'Makanan', 'Minuman', 'Kerajinan', 'Fashion', 'Kesehatan', 'Seni'];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/id/20/1200/400')] bg-cover bg-center"></div>
        <div className="relative z-10 max-w-lg">
          <span className="bg-emerald-500 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">KMP-ADNG E-COMMERCE</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Belanja Hemat & Sejahtera</h2>
          <p className="text-gray-300 mb-6">Nikmati produk pilihan dari KMP-ADNG Mart atau dukung usaha sesama anggota koperasi.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200">
        <div className="flex space-x-4 w-full md:w-auto overflow-x-auto">
            <button 
            onClick={() => setActiveTab('official')}
            className={`pb-3 px-4 font-bold flex items-center space-x-2 transition border-b-2 whitespace-nowrap ${activeTab === 'official' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
            >
            <Store className="w-5 h-5" />
            <span>KMP-ADNG MART</span>
            </button>
            <button 
            onClick={() => setActiveTab('member')}
            className={`pb-3 px-4 font-bold flex items-center space-x-2 transition border-b-2 whitespace-nowrap ${activeTab === 'member' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
            >
            <UserCheck className="w-5 h-5" />
            <span>Pasar Anggota</span>
            </button>
        </div>

        <button 
            onClick={() => onNavigate(AppRoute.ORDER_HISTORY)}
            className="hidden md:flex items-center space-x-2 pb-3 px-4 text-slate-600 hover:text-emerald-600 font-medium transition"
        >
            <Package className="w-5 h-5" />
            <span>Riwayat Pesanan</span>
        </button>
      </div>

      <button 
        onClick={() => onNavigate(AppRoute.ORDER_HISTORY)}
        className="md:hidden w-full bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center font-bold text-slate-700 shadow-sm"
      >
         <Package className="w-5 h-5 mr-2" /> Cek Riwayat Pesanan
      </button>

      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 bg-[#f3f4f6] py-2">
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition
                    ${selectedCategory === cat 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}
                `}
              >
                  {cat}
              </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            <Filter className="w-5 h-5" />
          </button>
          <select className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Terbaru</option>
            <option>Harga Terendah</option>
            <option>Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {isLoading ? (
          // SKELETON LOADING GRID
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <ProductSkeleton key={i} />
              ))}
          </div>
      ) : displayProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
            <Store className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Belum ada produk di kategori <span className="font-bold text-slate-600">{selectedCategory}</span>.</p>
            <button onClick={() => setSelectedCategory('Semua')} className="mt-4 text-emerald-600 font-bold hover:underline">Lihat Semua Produk</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {displayProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition flex flex-col h-full">
                <div className="relative h-48 overflow-hidden shrink-0">
                  <img 
                      src={product.image || 'https://via.placeholder.com/300'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                      {product.category}
                  </span>
                  {!product.isOfficial && (
                      <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow">
                      Mitra
                      </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                      <div className="flex items-center text-amber-400 text-xs shrink-0 ml-2">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="ml-1 text-gray-600">4.8</span>
                      </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">{product.location || 'Gudang Pusat'}</span>
                  </div>
                  
                  {product.sellerName && (
                     <div className="text-xs text-gray-400 mb-2 truncate">
                        Toko: <span className="text-slate-600 font-medium">{product.sellerName}</span>
                     </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                      <span className="text-emerald-600 font-bold text-lg">
                      Rp {Number(product.price).toLocaleString('id-ID')}
                      </span>
                      <button 
                        onClick={() => onAddToCart(product)}
                        className="p-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 rounded-lg transition-colors shadow-sm"
                        title="Tambah ke Keranjang"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                  </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};
