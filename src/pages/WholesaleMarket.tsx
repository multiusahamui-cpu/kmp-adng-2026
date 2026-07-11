
import React, { useState, useEffect } from 'react';
import { User, AppRoute, WholesaleItem, WholesaleBid } from '../types';
import { 
    Container, 
    Gavel, 
    ShieldCheck, 
    FileText, 
    Search, 
    Filter,
    Plus,
    ArrowRight,
    Box,
    X,
    User as UserIcon,
    CheckCircle
} from 'lucide-react';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import { useToast } from '../components/Toast';

interface WholesaleMarketProps {
  user: User;
  onNavigate: (route: AppRoute) => void;
  onUpdateUser: (data: Partial<User>) => void;
}

// Initial Mock Data
const INITIAL_COMMODITIES: WholesaleItem[] = [
    {
        id: 'w1',
        commodityName: 'Kopi Arabika Gayo Green Bean',
        grade: 'Grade 1 Export',
        totalQty: 5, // Ton
        unit: 'Ton',
        minOrder: 1,
        openPrice: 85000000, // Per Ton
        harvestDate: 'Okt 2024',
        description: 'Kopi Arabika Gayo kualitas ekspor, kadar air 12%, defect < 5%. Siap kirim dari gudang Takengon.',
        images: ['https://picsum.photos/id/1060/400/300'],
        sellerGroupId: 'g1', // Assume current user (u1) belongs to g1
        sellerGroupName: 'Pokja Tani Gayo Maju',
        location: 'Aceh Tengah',
        status: 'open',
        bids: [
             { id: 'b_init_1', distributorId: 'd2', distributorName: 'CV. Kopi Nusantara', bidPrice: 83000000, notes: 'Ambil 2 Ton test market', date: '2024-10-01', status: 'pending' }
        ]
    },
    {
        id: 'w2',
        commodityName: 'Jagung Pipil Kering',
        grade: 'Kadar Air 14%',
        totalQty: 20, // Ton
        unit: 'Ton',
        minOrder: 5,
        openPrice: 4500000, // Per Ton
        harvestDate: 'Sep 2024',
        description: 'Jagung hibrida hasil panen raya, sudah dikeringkan dengan oven. Cocok untuk pakan ternak.',
        images: ['https://picsum.photos/id/112/400/300'],
        sellerGroupId: 'g2',
        sellerGroupName: 'Koperasi Tani Makmur Jawa Timur',
        location: 'Nganjuk, Jawa Timur',
        status: 'negotiation',
        bids: [
            { id: 'b1', distributorId: 'd1', distributorName: 'PT. Pakan Ternak Jaya', bidPrice: 4400000, notes: 'Ambil semua 20 Ton', date: '2024-10-05', status: 'pending' }
        ]
    }
];

export const WholesaleMarket: React.FC<WholesaleMarketProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'market' | 'my_listings' | 'escrow'>('market');
  const { showToast } = useToast();
  
  // MAIN STATE for Commodities (PERSISTED)
  const [commodities, setCommodities] = useState<WholesaleItem[]>(() => loadData(STORAGE_KEYS.WHOLESALE_ITEMS, INITIAL_COMMODITIES));
  
  // MODAL STATES
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [listingModalOpen, setListingModalOpen] = useState(false); // NEW: Listing Modal
  const [selectedItem, setSelectedItem] = useState<WholesaleItem | null>(null);

  // FORM STATES
  const [bidForm, setBidForm] = useState({ price: '', notes: '' });
  
  // NEW LISTING FORM STATE
  const [listingForm, setListingForm] = useState({
      commodityName: '',
      grade: '',
      totalQty: '',
      unit: 'Ton',
      minOrder: '',
      openPrice: '',
      harvestDate: '',
      location: '',
      description: ''
  });

  // PERMISSIONS
  // 6. Distributor = Buyer
  // 7. Producer = Seller
  const isSeller = user.roles.includes('producer');
  const isDistributor = user.roles.includes('distributor');
  
  // Assume User 'u1' is owner of group 'g1' for demo purposes if producer
  const myGroupId = isSeller ? 'g1' : 'unknown'; 

  // --- PERSISTENCE EFFECT ---
  useEffect(() => saveData(STORAGE_KEYS.WHOLESALE_ITEMS, commodities), [commodities]);

  // --- ACTIONS: BUYER SIDE ---

  const openBidModal = (item: WholesaleItem) => {
      setSelectedItem(item);
      setBidForm({ price: item.openPrice.toString(), notes: '' });
      setBidModalOpen(true);
  };

  const submitBid = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem || !bidForm.price) return;

      const newBid: WholesaleBid = {
          id: `bid-${Date.now()}`,
          distributorId: user.id,
          distributorName: user.distributorDetails?.companyName || user.name,
          bidPrice: parseInt(bidForm.price),
          notes: bidForm.notes,
          date: new Date().toLocaleDateString('id-ID'),
          status: 'pending'
      };

      // Update State
      setCommodities(prev => prev.map(item => {
          if (item.id === selectedItem.id) {
              return {
                  ...item,
                  status: 'negotiation', // Change status to negotiation
                  bids: [newBid, ...item.bids]
              };
          }
          return item;
      }));

      setBidModalOpen(false);
      showToast("Penawaran berhasil dikirim! Menunggu respon dari Ketua Pokja.", "success");
  };

  // --- ACTIONS: SELLER SIDE ---

  const openManageModal = (item: WholesaleItem) => {
      setSelectedItem(item);
      setManageModalOpen(true);
  };

  const handleAcceptBid = (bidId: string) => {
      if (!selectedItem) return;
      const confirm = window.confirm("Apakah Anda yakin menerima tawaran ini? Barang akan ditandai TERJUAL dan proses Escrow dimulai.");
      if (!confirm) return;

      setCommodities(prev => prev.map(item => {
          if (item.id === selectedItem.id) {
              // Mark specific bid as accepted, others as rejected/pending logic could be complex, simple for now
              const updatedBids = item.bids.map(b => 
                  b.id === bidId ? { ...b, status: 'accepted' as const } : b
              );
              return {
                  ...item,
                  status: 'sold', // Mark item as SOLD
                  bids: updatedBids
              };
          }
          return item;
      }));
      setManageModalOpen(false);
      showToast("Tawaran diterima. Proses Escrow dimulai.", "success");
      setActiveTab('escrow'); // Redirect to Escrow tab
  };

  const handleRejectBid = (bidId: string) => {
      setCommodities(prev => prev.map(item => {
          if (item.id === selectedItem?.id) {
              const updatedBids = item.bids.map(b => 
                  b.id === bidId ? { ...b, status: 'rejected' as const } : b
              );
              return { ...item, bids: updatedBids };
          }
          return item;
      }));
      showToast("Tawaran ditolak.", "info");
  };

  const handleCreateListing = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newCommodity: WholesaleItem = {
          id: `w-${Date.now()}`,
          commodityName: listingForm.commodityName,
          grade: listingForm.grade,
          totalQty: parseFloat(listingForm.totalQty),
          unit: listingForm.unit as any,
          minOrder: parseFloat(listingForm.minOrder),
          openPrice: parseFloat(listingForm.openPrice),
          harvestDate: listingForm.harvestDate,
          description: listingForm.description,
          location: listingForm.location,
          images: ['https://picsum.photos/id/112/400/300'], // Placeholder image
          sellerGroupId: myGroupId,
          sellerGroupName: user.name, // Usually Pokja Name
          status: 'open',
          bids: []
      };

      setCommodities([newCommodity, ...commodities]);
      setListingModalOpen(false);
      setListingForm({
          commodityName: '', grade: '', totalQty: '', unit: 'Ton', minOrder: '', openPrice: '', harvestDate: '', location: '', description: ''
      });
      showToast("Listing berhasil dibuat! Menunggu pembeli.", "success");
      setActiveTab('my_listings');
  };

  // --- RENDER HELPERS ---

  // Get items for 'My Listings' (Seller View)
  const myListings = commodities.filter(c => c.sellerGroupId === myGroupId);
  
  // Get items for 'Escrow' (Sold items involving current user as seller OR buyer)
  const escrowItems = commodities.filter(c => {
      if (c.status !== 'sold') return false;
      const winningBid = c.bids.find(b => b.status === 'accepted');
      
      const amISeller = c.sellerGroupId === myGroupId && isSeller;
      const amIBuyer = winningBid?.distributorId === user.id;
      
      return amISeller || amIBuyer;
  });


  // --- STATE 1: INVITATION LOBBY (If not yet active) ---
  if (user.wholesaleAccess === 'invited') {
      return (
          <div className="p-8 min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div className="relative z-10 max-w-2xl text-center space-y-6">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-cyan-500/50">
                      <Container className="w-12 h-12 text-cyan-400" />
                  </div>
                  
                  <h1 className="text-4xl font-bold tracking-tight">Undangan Pasar Grosir Nasional</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
                      Selamat! Anda terpilih untuk mengakses <strong>Lelang Nasional KMP-ADNG (B2B)</strong>.
                      Hubungkan hasil produksi Anda langsung dengan Distributor Besar tanpa perantara.
                  </p>

                  <div className="pt-8">
                      <button 
                        onClick={() => onUpdateUser({ wholesaleAccess: 'active' })}
                        className="bg-cyan-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-cyan-500 transition shadow-lg shadow-cyan-500/30 flex items-center mx-auto"
                      >
                          Terima Undangan & Masuk <ArrowRight className="ml-3 w-6 h-6" />
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- STATE 2: DASHBOARD (Active) ---
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#f8fafc]">
       
       {/* Header */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center">
           <div className="flex items-center mb-4 md:mb-0">
               <div className="bg-cyan-100 p-3 rounded-xl mr-4">
                   <Container className="w-8 h-8 text-cyan-700" />
               </div>
               <div>
                   <h1 className="text-2xl font-bold text-slate-800">Pasar Grosir Nasional</h1>
                   <p className="text-slate-500 text-sm">Platform B2B & Lelang Komoditas Terverifikasi</p>
               </div>
           </div>
           
           <div className="flex space-x-2">
               {isSeller && (
                   <button 
                    onClick={() => setListingModalOpen(true)}
                    className="bg-cyan-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-cyan-800 transition flex items-center"
                   >
                       <Plus className="w-5 h-5 mr-2" /> Listing Barang
                   </button>
               )}
               <button 
                 onClick={() => setActiveTab('escrow')}
                 className={`px-6 py-2 rounded-lg font-bold transition flex items-center border
                    ${activeTab === 'escrow' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}
                 `}
               >
                   <ShieldCheck className="w-5 h-5 mr-2" /> Escrow Status
               </button>
           </div>
       </div>

       {/* Tabs */}
       <div className="flex space-x-2 mb-6 border-b border-gray-200 overflow-x-auto">
           <button 
             onClick={() => setActiveTab('market')}
             className={`px-6 py-3 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'market' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
           >
             Bursa Komoditas
           </button>
           {isSeller && (
               <button 
                 onClick={() => setActiveTab('my_listings')}
                 className={`px-6 py-3 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'my_listings' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-gray-500 hover:text-slate-800'}`}
               >
                 Barang Saya {myListings.some(i => i.bids.some(b => b.status === 'pending')) && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Action</span>}
               </button>
           )}
       </div>

       {/* --- TAB: MARKETPLACE --- */}
       {activeTab === 'market' && (
           <div className="animate-fade-in">
               {/* Filters */}
               <div className="flex flex-col md:flex-row gap-4 mb-6">
                   <div className="relative flex-1">
                       <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                       <input type="text" placeholder="Cari komoditas (Kopi, Jagung, Padi)..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" />
                   </div>
                   <button className="bg-white px-6 py-3 border border-gray-300 rounded-xl font-bold text-slate-700 flex items-center hover:bg-gray-50">
                       <Filter className="w-5 h-5 mr-2" /> Filter
                   </button>
               </div>

               {/* Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {commodities.filter(c => c.status !== 'sold').map(item => (
                       <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition group flex flex-col h-full">
                           <div className="h-48 bg-gray-200 relative overflow-hidden">
                               <img src={item.images[0]} alt={item.commodityName} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                               <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full uppercase
                                   ${item.status === 'open' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}
                               `}>
                                   {item.status === 'open' ? 'Bidding Open' : 'Negosiasi'}
                               </span>
                           </div>
                           <div className="p-6 flex flex-col flex-1">
                               <div className="flex justify-between items-start mb-2">
                                   <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{item.commodityName}</h3>
                               </div>
                               <p className="text-sm text-cyan-700 font-medium mb-4">{item.sellerGroupName} • {item.location}</p>
                               
                               <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                   <div className="bg-slate-50 p-2 rounded-lg">
                                       <span className="block text-gray-500 text-xs">Total Stok</span>
                                       <span className="font-bold text-slate-800">{item.totalQty} {item.unit}</span>
                                   </div>
                                   <div className="bg-slate-50 p-2 rounded-lg">
                                       <span className="block text-gray-500 text-xs">Min. Order</span>
                                       <span className="font-bold text-slate-800">{item.minOrder} {item.unit}</span>
                                   </div>
                               </div>

                               <div className="mt-auto pt-4 border-t border-gray-100">
                                   <div className="flex justify-between items-center mb-3">
                                       <p className="text-xs text-gray-500">Harga Buka / {item.unit}</p>
                                       <p className="text-lg font-bold text-emerald-600">Rp {item.openPrice.toLocaleString('id-ID')}</p>
                                   </div>
                                   
                                   {isDistributor ? (
                                       <button 
                                         onClick={() => openBidModal(item)}
                                         className="w-full bg-cyan-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-cyan-700 transition flex items-center justify-center shadow-lg shadow-cyan-600/20"
                                       >
                                           <Gavel className="w-4 h-4 mr-2" /> Ajukan Penawaran
                                       </button>
                                   ) : (
                                       <button className="w-full bg-slate-100 text-slate-500 px-4 py-3 rounded-xl font-bold text-sm cursor-not-allowed">
                                           {isSeller ? "Anda adalah Penjual" : "Login sebagai Distributor"}
                                       </button>
                                   )}
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* --- TAB: MY LISTINGS (SELLER) --- */}
       {activeTab === 'my_listings' && isSeller && (
           <div className="animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {myListings.length === 0 ? (
                       <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                           <Container className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                           <p className="text-gray-500 mb-4">Anda belum memiliki listing komoditas.</p>
                           <button 
                            onClick={() => setListingModalOpen(true)}
                            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-cyan-700"
                           >
                               + Buat Listing Pertama
                           </button>
                       </div>
                   ) : (
                        myListings.map(item => {
                            const pendingBids = item.bids.filter(b => b.status === 'pending').length;
                            return (
                                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                                    <div className="h-40 bg-gray-200 relative">
                                        <img src={item.images[0]} alt={item.commodityName} className="w-full h-full object-cover" />
                                        {item.status === 'sold' ? (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl uppercase tracking-widest">
                                                <CheckCircle className="w-6 h-6 mr-2" /> Terjual
                                            </div>
                                        ) : (
                                            <div className="absolute top-2 right-2 flex space-x-2">
                                                {pendingBids > 0 && (
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-md">
                                                        {pendingBids} Tawaran Baru
                                                    </span>
                                                )}
                                                <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                    {item.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-slate-800 mb-1">{item.commodityName}</h3>
                                        <p className="text-sm text-gray-500 mb-4">Qty: {item.totalQty} {item.unit}</p>
                                        
                                        <div className="flex space-x-2">
                                            {item.status !== 'sold' && (
                                                <button 
                                                    onClick={() => openManageModal(item)}
                                                    className="flex-1 bg-cyan-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-cyan-700 shadow-md flex items-center justify-center"
                                                >
                                                    Kelola ({item.bids.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                   )}
               </div>
           </div>
       )}

       {/* --- TAB: ESCROW STATUS (Visual) --- */}
       {activeTab === 'escrow' && (
           <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                   <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                   <h2 className="text-2xl font-bold text-slate-800 mb-2">Rekening Bersama (Escrow) KMP-ADNG</h2>
                   <p className="text-gray-500 max-w-lg mx-auto">
                       Dana pembeli ditahan aman oleh sistem. Dana hanya diteruskan ke Penjual (Pokja) setelah barang diterima dan diverifikasi oleh Pembeli (Distributor).
                   </p>
               </div>

               <h3 className="font-bold text-lg text-slate-800">Transaksi Berlangsung</h3>
               
               {escrowItems.length === 0 ? (
                   <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <Box className="w-12 h-12 mx-auto mb-2 opacity-50" />
                       <p>Belum ada transaksi escrow yang aktif.</p>
                   </div>
               ) : (
                   escrowItems.map(item => {
                       const winningBid = item.bids.find(b => b.status === 'accepted');
                       const totalVal = winningBid ? winningBid.bidPrice * item.totalQty : 0; 
                       
                       return (
                           <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
                               <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                   <span className="font-mono text-sm text-gray-500">TRX-{item.id.toUpperCase()}-{Date.now().toString().slice(-4)}</span>
                                   <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Proses Pengiriman</span>
                               </div>
                               <div className="p-6">
                                   <div className="flex flex-col md:flex-row justify-between mb-8">
                                       <div>
                                           <h4 className="font-bold text-lg text-slate-800">{item.commodityName}</h4>
                                           <p className="text-sm text-gray-500">Seller: {item.sellerGroupName} • Buyer: {winningBid?.distributorName}</p>
                                       </div>
                                       <div className="mt-2 md:mt-0 text-right">
                                           <p className="text-sm text-gray-500">Nilai Transaksi (Estimasi)</p>
                                           <p className="text-2xl font-bold text-emerald-600">Rp {totalVal.toLocaleString('id-ID')}</p>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       );
                   })
               )}
           </div>
       )}

       {/* --- MODAL: CREATE LISTING (SELLER) --- */}
       {listingModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                   <div className="bg-slate-900 p-4 flex justify-between items-center text-white sticky top-0 z-10">
                       <h3 className="font-bold flex items-center"><Plus className="w-5 h-5 mr-2 text-cyan-400" /> Buat Listing Komoditas Baru</h3>
                       <button onClick={() => setListingModalOpen(false)} className="hover:text-cyan-400"><X size={20} /></button>
                   </div>
                   <form onSubmit={handleCreateListing} className="p-6 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Nama Komoditas</label>
                               <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                   placeholder="Contoh: Kopi Arabika Gayo"
                                   value={listingForm.commodityName}
                                   onChange={e => setListingForm({...listingForm, commodityName: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Grade / Kualitas</label>
                               <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                   placeholder="Contoh: Grade 1, Kadar Air 12%"
                                   value={listingForm.grade}
                                   onChange={e => setListingForm({...listingForm, grade: e.target.value})}
                               />
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Total Stok</label>
                               <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                   placeholder="0"
                                   value={listingForm.totalQty}
                                   onChange={e => setListingForm({...listingForm, totalQty: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Satuan</label>
                               <select className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                   value={listingForm.unit}
                                   onChange={e => setListingForm({...listingForm, unit: e.target.value})}
                               >
                                   <option value="Ton">Ton</option>
                                   <option value="Kg">Kg</option>
                                   <option value="Kuintal">Kuintal</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Min. Order</label>
                               <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                   placeholder="0"
                                   value={listingForm.minOrder}
                                   onChange={e => setListingForm({...listingForm, minOrder: e.target.value})}
                               />
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Harga Buka (Per Satuan)</label>
                               <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-bold" 
                                   placeholder="0"
                                   value={listingForm.openPrice}
                                   onChange={e => setListingForm({...listingForm, openPrice: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Bulan Panen</label>
                               <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                                   placeholder="Bulan Tahun (Okt 2024)"
                                   value={listingForm.harvestDate}
                                   onChange={e => setListingForm({...listingForm, harvestDate: e.target.value})}
                               />
                           </div>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Lokasi Gudang</label>
                           <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                               placeholder="Alamat lengkap gudang pengambilan barang"
                               value={listingForm.location}
                               onChange={e => setListingForm({...listingForm, location: e.target.value})}
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi & Kondisi</label>
                           <textarea required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" 
                               placeholder="Jelaskan detail spesifikasi barang, kondisi pengemasan, dll..."
                               value={listingForm.description}
                               onChange={e => setListingForm({...listingForm, description: e.target.value})}
                           />
                       </div>

                       <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                           <button type="button" onClick={() => setListingModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Batal</button>
                           <button type="submit" className="px-6 py-2 bg-cyan-700 text-white rounded-lg font-bold hover:bg-cyan-800 shadow-md">Terbitkan Listing</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* --- MODAL: BID FORM (DISTRIBUTOR) --- */}
       {bidModalOpen && selectedItem && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                   <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                       <h3 className="font-bold flex items-center"><Gavel className="w-5 h-5 mr-2 text-cyan-400" /> Ajukan Penawaran</h3>
                       <button onClick={() => setBidModalOpen(false)} className="hover:text-cyan-400"><X size={20} /></button>
                   </div>
                   <form onSubmit={submitBid} className="p-6 space-y-4">
                       <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                           <p className="font-bold text-slate-800">{selectedItem.commodityName}</p>
                           <p className="text-sm text-gray-500">Harga Buka: Rp {selectedItem.openPrice.toLocaleString('id-ID')} / {selectedItem.unit}</p>
                       </div>
                       
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Harga Tawaran (Per {selectedItem.unit})</label>
                           <input 
                             type="number" 
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-bold text-lg"
                             value={bidForm.price}
                             onChange={e => setBidForm({...bidForm, price: e.target.value})}
                             required
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Catatan (Jumlah, Syarat, dll)</label>
                           <textarea 
                             rows={3}
                             className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                             placeholder="Contoh: Saya ambil semua 5 Ton, pembayaran termin 1 minggu."
                             value={bidForm.notes}
                             onChange={e => setBidForm({...bidForm, notes: e.target.value})}
                             required
                           />
                       </div>

                       <div className="pt-2">
                           <button type="submit" className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold hover:bg-cyan-700 shadow-lg">
                               Kirim Penawaran
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* --- MODAL: MANAGE BIDS (SELLER) --- */}
       {manageModalOpen && selectedItem && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                   <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                       <h3 className="font-bold flex items-center"><FileText className="w-5 h-5 mr-2 text-cyan-400" /> Daftar Penawaran Masuk</h3>
                       <button onClick={() => setManageModalOpen(false)} className="hover:text-cyan-400"><X size={20} /></button>
                   </div>
                   
                   <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0">
                       <h4 className="font-bold text-slate-800">{selectedItem.commodityName}</h4>
                       <p className="text-sm text-gray-600">Total Stok: {selectedItem.totalQty} {selectedItem.unit} | Open Price: Rp {selectedItem.openPrice.toLocaleString('id-ID')}</p>
                   </div>

                   <div className="p-6 overflow-y-auto">
                       {selectedItem.bids.length === 0 ? (
                           <p className="text-center text-gray-400 py-8">Belum ada penawaran masuk.</p>
                       ) : (
                           <div className="space-y-4">
                               {selectedItem.bids.map(bid => (
                                   <div key={bid.id} className={`border rounded-xl p-4 transition ${bid.status === 'accepted' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 hover:border-cyan-300'}`}>
                                       <div className="flex justify-between items-start mb-2">
                                           <div className="flex items-center">
                                               <div className="bg-gray-200 p-2 rounded-full mr-3"><UserIcon size={16} /></div>
                                               <div>
                                                   <p className="font-bold text-slate-800">{bid.distributorName}</p>
                                                   <p className="text-xs text-gray-500">{bid.date}</p>
                                               </div>
                                           </div>
                                           <div className="text-right">
                                               <p className="font-bold text-lg text-emerald-600">Rp {bid.bidPrice.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-normal">/ {selectedItem.unit}</span></p>
                                               <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${bid.status === 'pending' ? 'bg-orange-100 text-orange-600' : bid.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                   {bid.status}
                                               </span>
                                           </div>
                                       </div>
                                       
                                       <div className="bg-white p-3 rounded border border-gray-100 text-sm text-gray-600 mb-4">
                                           <span className="font-bold block text-xs text-gray-400 mb-1">Catatan Pembeli:</span>
                                           {bid.notes}
                                       </div>

                                       {bid.status === 'pending' && (
                                           <div className="flex space-x-3 justify-end border-t border-gray-100 pt-3">
                                               <button 
                                                 onClick={() => handleRejectBid(bid.id)}
                                                 className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50"
                                               >
                                                   Tolak
                                               </button>
                                               <button 
                                                 onClick={() => handleAcceptBid(bid.id)}
                                                 className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md"
                                               >
                                                   Terima Tawaran
                                               </button>
                                           </div>
                                       )}
                                       {bid.status === 'accepted' && (
                                           <div className="text-center text-sm font-bold text-green-700 bg-green-100 py-2 rounded">
                                               Tawaran Diterima & Masuk Escrow
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
