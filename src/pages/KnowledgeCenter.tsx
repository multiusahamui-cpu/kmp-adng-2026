
import React, { useState } from 'react';
import { 
    Info, 
    BookOpen, 
    ShieldCheck, 
    Award, 
    Layers, 
    Network, 
    Lock, 
    Scale, 
    AlertCircle,
    ChevronRight,
    Search,
    Book,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import { AppRoute } from '../types';

interface KnowledgeCenterProps {
    onNavigate: (route: AppRoute) => void;
}

const SECTIONS = [
    { id: 'objective', title: '1. Objektif & Visi', icon: Info },
    { id: 'advantages', title: '2. Keunggulan Aplikasi', icon: Award },
    { id: 'benefits', title: '3. Manfaat bagi Anggota', icon: BookOpen },
    { id: 'architecture', title: '4. Arsitektur SuperApp', icon: Layers },
    { id: 'features', title: '5. Fitur Utama & Alur', icon: Network },
    { id: 'governance', title: '6. Governance & Kepatuhan', icon: Scale },
    { id: 'security', title: '7. Standar Keamanan', icon: Lock },
    { id: 'attributions', title: '8. Atribusi & Teknologi', icon: Layers },
    { id: 'disclaimer', title: '9. Disclaimer', icon: AlertCircle },
    { id: 'glossary', title: '10. Glossary (Kamus Istilah)', icon: Book },
];

const GLOSSARY_TERMS = [
    { term: 'SHU', desc: 'Sisa Hasil Usaha. Keuntungan bersih koperasi yang dibagikan kembali kepada anggota setiap tahun berdasarkan jasa modal dan transaksi.' },
    { term: 'Simpanan Pokok', desc: 'Simpanan yang dibayarkan satu kali saat mendaftar menjadi anggota. Tidak dapat diambil selama masih menjadi anggota.' },
    { term: 'Simpanan Wajib', desc: 'Simpanan yang wajib dibayarkan setiap bulan dengan nominal tetap. Dapat diambil jika berhenti menjadi anggota.' },
    { term: 'Tanggung Renteng', desc: 'Sistem tanggung jawab bersama dalam kelompok (Pokja). Jika satu anggota gagal bayar, anggota lain dalam kelompok ikut menanggung.' },
    { term: 'Escrow', desc: 'Rekening Bersama. Sistem penampungan dana sementara untuk transaksi jual beli. Dana baru diteruskan ke penjual setelah barang diterima pembeli.' },
    { term: 'KYC (Know Your Customer)', desc: 'Proses verifikasi identitas anggota menggunakan KTP dan Foto Wajah untuk mencegah penipuan dan pencucian uang.' },
    { term: 'PPOB', desc: 'Payment Point Online Bank. Layanan pembayaran tagihan online seperti Listrik, PDAM, Pulsa, dan Paket Data.' },
    { term: 'Pokja (Kelompok Kerja)', desc: 'Unit terkecil dalam koperasi produksi (minimal 3 orang) yang dibentuk untuk menjalankan usaha sektor riil (tani/ternak).' },
    { term: 'GMV', desc: 'Gross Merchandise Value. Total nilai kotor transaksi barang atau jasa yang terjadi dalam platform selama periode tertentu.' },
    { term: 'KTA Digital', desc: 'Kartu Tanda Anggota elektronik yang terdapat di dalam aplikasi, berfungsi sebagai identitas sah anggota KMP-ADNG.' },
];

export const KnowledgeCenter: React.FC<KnowledgeCenterProps> = ({ onNavigate }) => {
    const [activeSection, setActiveSection] = useState('objective');
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSectionClick = (id: string) => {
        setActiveSection(id);
        setIsMobileMenuOpen(false); // Close menu on mobile after selection
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeTitle = SECTIONS.find(s => s.id === activeSection)?.title;

    const renderContent = () => {
        switch(activeSection) {
            case 'objective':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">1. Objektif & Visi KMP-ADNG</h2>
                        <p className="text-slate-600 leading-relaxed">
                            KMP-ADNG (Koperasi Multi Pihak - Aset Digital Nusantara Garuda) dibangun dengan visi utama untuk <strong>mendekatkan kesejahteraan</strong> kepada anggota dan pelaku UMKM melalui transformasi digital.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li><strong>Digitalisasi Ekonomi UMKM:</strong> Mengubah pengelolaan usaha dan produk lokal dari konvensional menjadi digital yang terukur.</li>
                            <li><strong>Kedaulatan Data:</strong> Memastikan data anggota dan transaksi dikelola secara mandiri oleh koperasi, bukan pihak asing.</li>
                            <li><strong>Inklusi Keuangan:</strong> Memberikan akses layanan keuangan (simpanan, pembiayaan, pembayaran) kepada masyarakat yang belum terjangkau bank (unbankable).</li>
                            <li><strong>Efisiensi Rantai Pasok:</strong> Memotong jalur distribusi yang panjang melalui fitur Pasar Grosir B2B, menghubungkan petani langsung ke pembeli besar.</li>
                        </ul>
                    </div>
                );
            case 'advantages':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">2. Keunggulan Aplikasi Secara Umum</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <h3 className="font-bold text-emerald-800 mb-2">Super App Terintegrasi</h3>
                                <p className="text-sm text-emerald-700">Bukan sekadar dompet digital. KMP-ADNG menggabungkan Marketplace, Logistik, Finansial, dan Sosial dalam satu aplikasi.</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-2">Hybrid Online-Offline</h3>
                                <p className="text-sm text-blue-700">Didukung jaringan "Exchanger" (Agen Tunai) fisik di desa-desa, memudahkan pencairan dana tunai (Cash In/Out).</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <h3 className="font-bold text-purple-800 mb-2">Ekosistem Tertutup (Closed-Loop)</h3>
                                <p className="text-sm text-purple-700">Perputaran uang dijaga tetap di dalam koperasi untuk memaksimalkan SHU bagi anggota.</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <h3 className="font-bold text-orange-800 mb-2">Multi-Platform</h3>
                                <p className="text-sm text-orange-700">Dapat diakses melalui Aplikasi Mobile (Android) dan Web Browser, data tersinkronisasi realtime.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'benefits':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">3. Manfaat bagi Anggota</h2>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="bg-green-100 p-2 rounded-lg mr-3 mt-1"><Award className="w-5 h-5 text-green-600"/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Dividen Tahunan (SHU)</h4>
                                    <p className="text-slate-600 text-sm">Setiap transaksi Anda (belanja, bayar listrik, naik ojek) dihitung sebagai "Jasa Usaha" yang akan dikembalikan dalam bentuk SHU.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3 mt-1"><BookOpen className="w-5 h-5 text-blue-600"/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Akses Modal Usaha</h4>
                                    <p className="text-slate-600 text-sm">Anggota aktif berhak mengajukan pembiayaan modal kerja melalui skema Tanggung Renteng (Kelompok) tanpa agunan fisik yang memberatkan.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-orange-100 p-2 rounded-lg mr-3 mt-1"><Network className="w-5 h-5 text-orange-600"/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Pasar Pasti</h4>
                                    <p className="text-slate-600 text-sm">Hasil panen/produk anggota diprioritaskan untuk dibeli oleh KMP-ADNG Mart atau jaringan Distributor Mitra.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'architecture':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">4. Arsitektur Aplikasi</h2>
                        <p className="text-slate-600">KMP-ADNG menggunakan arsitektur modern <strong>Centralized Backend</strong> untuk menjamin integritas data.</p>
                        
                        <div className="bg-slate-900 text-white p-6 rounded-xl overflow-hidden relative">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-white/10 p-3 rounded-lg border border-white/20 text-center w-32">
                                        <p className="font-bold text-sm">Database Pusat</p>
                                        <p className="text-[10px] text-gray-400">PostgreSQL</p>
                                    </div>
                                    <div className="h-0.5 w-10 bg-white/30"></div>
                                    <div className="bg-white/10 p-3 rounded-lg border border-white/20 text-center w-32">
                                        <p className="font-bold text-sm">API Gateway</p>
                                        <p className="text-[10px] text-gray-400">Express.js</p>
                                    </div>
                                    <div className="h-0.5 w-10 bg-white/30"></div>
                                    <div className="flex flex-col space-y-2">
                                        <span className="bg-emerald-600 px-3 py-1 rounded text-xs">Web Member</span>
                                        <span className="bg-blue-600 px-3 py-1 rounded text-xs">Internal Portal</span>
                                        <span className="bg-purple-600 px-3 py-1 rounded text-xs">Mobile App</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 italic mt-2">
                            Konsep "Single Source of Truth": Satu database untuk semua platform. Anda login dengan akun yang sama di Web maupun Mobile.
                        </p>
                    </div>
                );
            case 'features':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">5. Alur Proses & Fitur Utama</h2>
                        <div className="space-y-6">
                            <div className="border-l-4 border-emerald-500 pl-4">
                                <h3 className="font-bold text-lg text-slate-800">A. Onboarding & KYC</h3>
                                <p className="text-slate-600 text-sm">Pendaftaran &rarr; Upload KTP/Selfie &rarr; Pembayaran Simpanan Pokok &rarr; Terbit KTA Digital.</p>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="font-bold text-lg text-slate-800">B. Transaksi Keuangan</h3>
                                <p className="text-slate-600 text-sm">
                                    <strong>Top Up:</strong> Via Bank (VA) atau Agen Exchanger.<br/>
                                    <strong>Transfer:</strong> Gratis antar anggota menggunakan No HP/ID.<br/>
                                    <strong>PPOB:</strong> Bayar tagihan langsung potong saldo.
                                </p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="font-bold text-lg text-slate-800">C. Perdagangan (Commerce)</h3>
                                <p className="text-slate-600 text-sm">
                                    <strong>Marketplace:</strong> Toko online untuk UMKM.<br/>
                                    <strong>Grosir (Wholesale):</strong> Lelang komoditas B2B untuk Pokja Tani & Distributor.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'governance':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">6. Governance & Kepatuhan</h2>
                        <p className="text-slate-600">KMP-ADNG dijalankan dengan prinsip <strong>Good Cooperative Governance (GCG)</strong>.</p>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-2">Struktur Pengawasan:</h4>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                <li><strong>Rapat Anggota:</strong> Pemegang kekuasaan tertinggi (dilakukan via E-Voting).</li>
                                <li><strong>Internal Portal:</strong> Dashboard khusus untuk Pengurus, Pengawas, dan Manajer untuk memantau transaksi secara realtime.</li>
                                <li><strong>Audit Trail:</strong> Setiap transaksi dicatat digital dan tidak dapat diubah (immutable log) untuk keperluan audit.</li>
                            </ul>
                        </div>
                        <p className="text-sm text-slate-500">
                            Kami mematuhi UU Perkoperasian No. 25 Tahun 1992 dan peraturan terkait transaksi elektronik (UU ITE).
                        </p>
                    </div>
                );
            case 'security':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">7. Standar Keamanan</h2>
                        <p className="text-slate-600">Keamanan aset anggota adalah prioritas utama.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start">
                                <Lock className="w-5 h-5 text-emerald-600 mr-2 mt-1" />
                                <div>
                                    <h4 className="font-bold text-sm">Enkripsi Data</h4>
                                    <p className="text-xs text-gray-500">Password dan PIN dienkripsi (Hash Bcrypt) di database. Kami tidak bisa melihat PIN Anda.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2 mt-1" />
                                <div>
                                    <h4 className="font-bold text-sm">Server-Side Validation</h4>
                                    <p className="text-xs text-gray-500">Validasi saldo dan PIN dilakukan di server aman, bukan di aplikasi HP (mencegah hack).</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-emerald-600 mr-2 mt-1" />
                                <div>
                                    <h4 className="font-bold text-sm">Device Fingerprinting</h4>
                                    <p className="text-xs text-gray-500">Mendeteksi login dari perangkat baru dan meminta OTP tambahan.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'attributions':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">8. Atribusi Teknologi</h2>
                        <p className="text-slate-600 text-sm">Aplikasi ini dibangun menggunakan teknologi Open Source terdepan:</p>
                        <ul className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> React & TypeScript</li>
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> Node.js & Express</li>
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> PostgreSQL & Drizzle ORM</li>
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> Tailwind CSS</li>
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> Lucide Icons</li>
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> Leaflet Maps</li>
                            <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-gray-400"/> Recharts</li>
                        </ul>
                    </div>
                );
            case 'disclaimer':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">9. Disclaimer (Penafian)</h2>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-800/80 leading-relaxed">
                            <p className="mb-2"><strong>Bukan Bank:</strong> KMP-ADNG adalah Koperasi Jasa & Konsumen, bukan Bank. Simpanan anggota tidak dijamin oleh Lembaga Penjamin Simpanan (LPS), namun dijamin oleh aset produktif koperasi (Tanggung Renteng).</p>
                            <p className="mb-2"><strong>Risiko Usaha:</strong> Hasil SHU bersifat fluktuatif tergantung kinerja bisnis koperasi. Koperasi tidak menjanjikan bunga tetap (fixed return) yang melanggar prinsip syariah/koperasi.</p>
                            <p><strong>Penyalahgunaan:</strong> KMP-ADNG tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian anggota menjaga kerahasiaan PIN/Password atau penipuan teknik rekayasa sosial (social engineering).</p>
                        </div>
                    </div>
                );
            case 'glossary':
                return (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">10. Kamus Istilah (Glossary)</h2>
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Cari istilah (misal: SHU, Escrow)..." 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {GLOSSARY_TERMS
                                .filter(item => item.term.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((item, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition shadow-sm">
                                    <h4 className="font-bold text-lg text-emerald-700 mb-1">{item.term}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                            {GLOSSARY_TERMS.filter(item => item.term.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <p className="text-center text-gray-400 py-4">Istilah tidak ditemukan.</p>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-50 relative">
            
            {/* MOBILE NAVIGATION HEADER (Sticky Top) */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
                <div 
                    className="flex items-center gap-2 overflow-hidden cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </div>
                    <div className="truncate">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Topik Saat Ini</span>
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1 truncate">
                            {activeTitle}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                        </h2>
                    </div>
                </div>
            </div>

            {/* MOBILE NAVIGATION OVERLAY (Full Screen Menu) */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-[73px] left-0 right-0 bottom-0 bg-white z-40 overflow-y-auto animate-fade-in border-t border-gray-100 pb-20">
                    <div className="p-4">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4 px-2">Daftar Isi</p>
                        <nav className="space-y-1">
                            {SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => handleSectionClick(section.id)}
                                    className={`w-full flex items-center p-4 rounded-xl text-sm font-medium transition-all duration-200 border
                                        ${activeSection === section.id 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
                                            : 'bg-white text-slate-600 border-transparent hover:bg-gray-50'}
                                    `}
                                >
                                    <section.icon className={`w-5 h-5 mr-3 ${activeSection === section.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {section.title}
                                    {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto text-blue-600" />}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="font-bold text-sm text-slate-700 mb-2 px-2">Butuh Bantuan?</h4>
                            <button 
                                onClick={() => onNavigate(AppRoute.HELP)}
                                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center"
                            >
                                Hubungi Helpdesk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DESKTOP SIDEBAR (Visible only on md+) */}
            <div className="hidden md:block w-80 bg-white border-r border-gray-200 overflow-y-auto shrink-0 h-full">
                <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center">
                        <Info className="w-6 h-6 mr-2 text-blue-600" /> Pusat Informasi
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Panduan & Filosofi KMP-ADNG</p>
                </div>
                <nav className="p-4 space-y-1">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => handleSectionClick(section.id)}
                            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200
                                ${activeSection === section.id 
                                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
                                    : 'text-slate-600 hover:bg-gray-50 hover:pl-4'}
                            `}
                        >
                            <section.icon className={`w-4 h-4 mr-3 ${activeSection === section.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            {section.title}
                        </button>
                    ))}
                </nav>
                
                {/* Contact Support Desktop */}
                <div className="p-6 mt-4 border-t border-gray-100 bg-slate-50">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">Butuh Bantuan Lebih?</h4>
                    <p className="text-xs text-gray-500 mb-4">Tim support kami siap membantu kendala teknis Anda.</p>
                    <button 
                        onClick={() => onNavigate(AppRoute.HELP)}
                        className="w-full py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-gray-100"
                    >
                        Hubungi Helpdesk
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 relative z-0">
                <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                    {renderContent()}
                </div>
                <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-gray-400 pb-8 md:pb-0">
                    &copy; 2024 Koperasi Multi Pihak - Aset Digital Nusantara Garuda. Dokumen ini dilindungi hak cipta.
                </div>
            </div>
        </div>
    );
};
