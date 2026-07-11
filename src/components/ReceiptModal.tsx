
import React from 'react';
import { Transaction } from '../types';
import { X, Share2, Printer, CheckCircle } from 'lucide-react';
import { APP_LOGO } from '../constants';

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            
            {/* Header / Cut Pattern */}
            <div className="bg-slate-900 p-6 text-center text-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                    <X size={24} />
                </button>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg">Transaksi Berhasil</h3>
                <p className="text-slate-400 text-sm">{transaction.date}, {new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                
                {/* Zigzag Bottom */}
                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white" style={{
                    clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'
                }}></div>
            </div>

            {/* Receipt Body */}
            <div className="p-8 pt-6 space-y-6">
                <div className="text-center">
                    <img src={APP_LOGO} alt="Logo" className="h-8 mx-auto mb-2 opacity-50 grayscale" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Bukti Transaksi Resmi</p>
                </div>

                <div className="text-center">
                    <p className="text-3xl font-bold text-slate-800">Rp {transaction.amount.toLocaleString('id-ID')}</p>
                    <p className="text-sm font-medium text-emerald-600 mt-1 capitalize bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">
                        {transaction.type === 'ride' ? 'Layanan Transportasi' : 
                         transaction.type === 'topup' ? 'Isi Saldo' :
                         transaction.type === 'purchase' ? 'Pembayaran Belanja' : 
                         transaction.description}
                    </p>
                </div>

                <div className="space-y-3 border-t border-dashed border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Reff ID</span>
                        <span className="font-mono font-bold text-slate-700">{transaction.refId || `TRX-${transaction.id.slice(-6).toUpperCase()}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Keterangan</span>
                        <span className="font-medium text-slate-800 text-right max-w-[180px]">{transaction.description}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="font-bold text-emerald-600 uppercase">BERHASIL</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 flex items-center justify-center hover:bg-gray-50">
                        <Printer className="w-4 h-4 mr-2" /> Cetak
                    </button>
                    <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-emerald-700 shadow-lg shadow-emerald-600/30">
                        <Share2 className="w-4 h-4 mr-2" /> Bagikan
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
