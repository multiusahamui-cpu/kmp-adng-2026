
import React, { useState } from 'react';
import { HelpTicket } from '../types';
import { FAQ_ITEMS } from '../constants';
import { Plus, ChevronDown, ChevronUp, History, Tag } from 'lucide-react';

interface HelpCenterProps {
  tickets: HelpTicket[];
  onSubmitTicket: (subject: string, message: string, category: string) => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ tickets, onSubmitTicket }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'create' | 'history'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ subject: '', message: '', category: 'General' });

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subject && formData.message) {
      onSubmitTicket(formData.subject, formData.message, formData.category);
      setFormData({ subject: '', message: '', category: 'General' });
      setActiveTab('history');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Pusat Bantuan KMP-ADNG</h2>
      
      <div className="flex space-x-2 mb-8 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button 
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'faq' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          FAQ
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'create' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Buka Tiket Baru
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'history' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Riwayat Tiket
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Pertanyaan Umum</h3>
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                >
                  <span className="font-medium text-slate-700">{item.q}</span>
                  {openFaqIndex === idx ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 bg-white text-gray-600 text-sm border-t border-gray-100 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-xl">
             <h3 className="font-bold text-lg mb-2 text-slate-800">Buka Tiket Keluhan (Open Ticket)</h3>
             <p className="text-sm text-gray-500 mb-6">Sampaikan keluhan atau masalah teknis yang Anda alami kepada Helpdesk.</p>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Masalah</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select 
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="General">Umum</option>
                      <option value="Transaction">Transaksi / Keuangan</option>
                      <option value="Technical">Kendala Teknis Aplikasi</option>
                      <option value="Account">Masalah Akun</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Judul Keluhan</label>
                 <input 
                   type="text" 
                   required
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                   placeholder="Contoh: Saldo tidak masuk setelah topup"
                   value={formData.subject}
                   onChange={e => setFormData({...formData, subject: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Detail Masalah</label>
                 <textarea 
                   required
                   rows={5}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                   placeholder="Jelaskan kronologi masalah Anda secara detail..."
                   value={formData.message}
                   onChange={e => setFormData({...formData, message: e.target.value})}
                 />
               </div>
               <button 
                 type="submit" 
                 className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center"
               >
                 <Plus className="w-4 h-4 mr-2" /> Kirim Tiket
               </button>
             </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
             <h3 className="font-bold text-lg mb-4 text-slate-800">Riwayat Tiket Anda</h3>
             {tickets.length === 0 ? (
               <div className="text-center text-gray-400 py-10">
                 <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                 <p>Belum ada tiket.</p>
               </div>
             ) : (
               tickets.map(ticket => (
                 <div key={ticket.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <h4 className="font-bold text-slate-800">{ticket.subject}</h4>
                         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-2">{ticket.category || 'General'}</span>
                       </div>
                       <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                         {ticket.status === 'open' ? 'Menunggu Respon' : 'Selesai'}
                       </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded-lg">{ticket.message}</p>
                    <div className="text-xs text-gray-400 mb-3">{ticket.date}</div>
                    
                    {ticket.response && (
                      <div className="mt-4 pl-4 border-l-2 border-emerald-500">
                         <p className="text-xs font-bold text-emerald-600 mb-1">Respon Helpdesk:</p>
                         <p className="text-sm text-slate-700">{ticket.response}</p>
                      </div>
                    )}
                 </div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};
