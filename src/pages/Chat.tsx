
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatContact, ChatMessage, User } from '../types';
import { MOCK_CHAT_HISTORY, MOCK_USERS_DB, CURRENT_USER } from '../constants';
import { Send, Phone, Video, Paperclip, Smile, Search, Users, User as UserIcon, Clock, UserPlus, Trash2, ArrowUp, Loader2 } from 'lucide-react';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import { useToast } from '../components/Toast';

interface ChatProps {
  contacts: ChatContact[];
}

const MESSAGE_PAGE_SIZE = 20; // Tampilkan 20 pesan per "halaman"

export const Chat: React.FC<ChatProps> = ({ contacts: initialContacts }) => {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<ChatContact[]>(() => loadData(STORAGE_KEYS.CHAT_CONTACTS, initialContacts));
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(contacts[0] || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // STATE HISTORY LENGKAP (Disimpan di Storage)
  const [allHistory, setAllHistory] = useState<Record<string, ChatMessage[]>>(() => loadData(STORAGE_KEYS.CHAT_HISTORY, MOCK_CHAT_HISTORY));

  // STATE PAGINATION (Untuk Rendering Cepat)
  const [visibleLimit, setVisibleLimit] = useState(MESSAGE_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Persist Data
  useEffect(() => saveData(STORAGE_KEYS.CHAT_HISTORY, allHistory), [allHistory]);
  useEffect(() => saveData(STORAGE_KEYS.CHAT_CONTACTS, contacts), [contacts]);

  // Reset pagination saat ganti kontak
  useEffect(() => {
      setVisibleLimit(MESSAGE_PAGE_SIZE);
      // Auto scroll ke bawah saat ganti kontak
      setTimeout(scrollToBottom, 100);
  }, [selectedContact?.id]);

  // Search Logic (Memoized)
  const filteredContacts = useMemo(() => contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [contacts, searchQuery]);

  const globalUserResults = useMemo(() => searchQuery.length > 2 
    ? MOCK_USERS_DB.filter(u => 
        u.id !== CURRENT_USER.id && 
        !contacts.find(c => c.id === u.id) && 
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [], [searchQuery, contacts]);

  // OPTIMIZED MESSAGE SLICING
  const fullMessages = selectedContact ? (allHistory[selectedContact.id] || []) : [];
  
  // Ambil hanya pesan yang perlu ditampilkan (Slice dari belakang)
  const visibleMessages = useMemo(() => {
      const start = Math.max(0, fullMessages.length - visibleLimit);
      return fullMessages.slice(start);
  }, [fullMessages, visibleLimit]);

  const hasMoreMessages = fullMessages.length > visibleLimit;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Scroll effect hanya saat kirim pesan baru (bukan saat load more)
  useEffect(() => {
      if (visibleLimit === MESSAGE_PAGE_SIZE) {
          scrollToBottom();
      }
  }, [visibleMessages.length, visibleLimit]);

  const handleLoadMore = () => {
      setIsLoadingMore(true);
      // Simulasi delay network kecil agar UX lebih natural
      setTimeout(() => {
          setVisibleLimit(prev => prev + MESSAGE_PAGE_SIZE);
          setIsLoadingMore(false);
      }, 500);
  };

  const handleSend = () => {
    if (!messageInput.trim() || !selectedContact) return;
    if (selectedContact.status !== 'connected') return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'u1', 
      text: messageInput,
      timestamp: timeString,
      isMe: true
    };

    setAllHistory(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
    }));

    setContacts(prev => {
        const updatedContacts = prev.map(c => {
            if (c.id === selectedContact.id) {
                return {
                    ...c,
                    lastMessage: newMessage.text,
                    time: timeString,
                    unread: 0
                };
            }
            return c;
        });
        
        // Move active contact to top
        const active = updatedContacts.find(c => c.id === selectedContact.id);
        const others = updatedContacts.filter(c => c.id !== selectedContact.id);
        
        return active ? [active, ...others] : updatedContacts;
    });

    setMessageInput('');
    // Reset limit agar auto scroll jalan
    setVisibleLimit(prev => prev + 1); 
    setTimeout(scrollToBottom, 50);
  };

  const handleClearHistory = () => {
      if (!selectedContact) return;
      if (confirm("Hapus semua riwayat chat dengan kontak ini? Tindakan ini tidak dapat dibatalkan.")) {
          setAllHistory(prev => ({
              ...prev,
              [selectedContact.id]: []
          }));
          showToast("Riwayat percakapan dihapus.", "info");
      }
  };

  const handleContactClick = (contact: ChatContact) => {
      if (selectedContact?.id !== contact.id) {
        setSelectedContact(contact);
        setContacts(prev => prev.map(c => c.id === contact.id ? {...c, unread: 0} : c));
        setSearchQuery('');
      }
  };

  // ... (Invitation handlers remain same)
  const sendInvitation = (user: User) => {
      const newContact: ChatContact = {
          id: user.id,
          type: 'personal',
          status: 'pending_outgoing',
          name: user.name,
          avatar: user.avatarUrl,
          lastMessage: 'Menunggu konfirmasi...',
          time: 'Now',
          unread: 0
      };
      setContacts([newContact, ...contacts]);
      setSelectedContact(newContact);
      setSearchQuery('');
      setAllHistory(prev => ({...prev, [user.id]: []}));
  };

  const acceptInvitation = (contactId: string) => {
      setContacts(prev => prev.map(c => 
          c.id === contactId 
          ? { ...c, status: 'connected', lastMessage: 'Undangan diterima. Mulai mengobrol!' } 
          : c
      ));
      const welcomeMsg: ChatMessage = {
          id: Date.now().toString(),
          senderId: 'system',
          text: 'Undangan diterima. Anda sekarang dapat saling mengirim pesan.',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isMe: true
      };
      setAllHistory(prev => ({...prev, [contactId]: [welcomeMsg]}));
  };

  const declineInvitation = (contactId: string) => {
      setContacts(prev => prev.filter(c => c.id !== contactId));
      if (selectedContact?.id === contactId) {
          setSelectedContact(null);
      }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-white border-t border-gray-200">
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50">
           <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-slate-800 text-lg">Pesan</h2>
           </div>
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Cari teman atau chat..." 
               className="w-full bg-white text-sm pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {globalUserResults.length > 0 && (
             <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase">Hasil Pencarian Global</div>
                {globalUserResults.map(user => (
                   <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-50">
                      <div className="flex items-center">
                          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover mr-3 grayscale" />
                          <div>
                              <h4 className="font-semibold text-slate-800 text-sm">{user.name}</h4>
                              <p className="text-xs text-gray-500 capitalize">{user.roles[0]?.replace('_', ' ')}</p>
                          </div>
                      </div>
                      <button onClick={() => sendInvitation(user)} className="bg-emerald-100 text-emerald-700 p-2 rounded-full hover:bg-emerald-200 transition">
                         <UserPlus size={16} />
                      </button>
                   </div>
                ))}
             </div>
          )}

          {filteredContacts.length === 0 && globalUserResults.length === 0 && searchQuery && (
              <div className="p-8 text-center text-gray-400 text-sm">Tidak ditemukan user atau chat.</div>
          )}

          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => handleContactClick(contact)}
              className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50
                ${selectedContact?.id === contact.id ? 'bg-emerald-50 border-emerald-100' : ''}`}
            >
              <div className="relative">
                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                {contact.unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-in">{contact.unread}</span>
                )}
                <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 border border-gray-200 flex items-center justify-center w-4 h-4 ${contact.status === 'connected' ? 'bg-white' : 'bg-orange-100'}`}>
                    {contact.status === 'connected' ? (
                        contact.type === 'group' ? <Users size={10} className="text-blue-500" /> : <UserIcon size={10} className="text-emerald-500" />
                    ) : (
                        <Clock size={10} className="text-orange-500" />
                    )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-semibold text-slate-800 truncate text-sm">{contact.name}</h4>
                  <span className={`text-[10px] ${contact.unread > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>{contact.status === 'pending_incoming' ? 'Undangan' : contact.time}</span>
                </div>
                <p className={`text-xs truncate mt-1 ${contact.unread > 0 ? 'font-semibold text-slate-800' : 'text-gray-500'}`}>
                  {contact.status === 'pending_incoming' ? <span className="text-orange-600 font-medium">Meminta koneksi...</span> : contact.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedContact ? (
        <div className="flex-1 flex flex-col h-full bg-[#e5ddd5] relative">
           <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-sm relative">
            <div className="flex items-center cursor-pointer">
              <button className="md:hidden mr-3" onClick={() => setSelectedContact(null)}>←</button>
              <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 rounded-full mr-3 border border-gray-100" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center">
                    {selectedContact.name}
                    {selectedContact.type === 'group' && <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">GROUP</span>}
                </h3>
                <span className="text-xs text-gray-500 flex items-center">
                   {selectedContact.status === 'connected' ? 'Online' : selectedContact.status === 'pending_incoming' ? 'Menunggu persetujuan Anda' : 'Menunggu konfirmasi teman'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
                {selectedContact.status === 'pending_incoming' ? (
                    <>
                        <button onClick={() => declineInvitation(selectedContact.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">Tolak</button>
                        <button onClick={() => acceptInvitation(selectedContact.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-md">Terima</button>
                    </>
                ) : selectedContact.status === 'connected' && (
                    <>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-emerald-600"><Phone className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-emerald-600"><Video className="w-5 h-5" /></button>
                        <button 
                            onClick={handleClearHistory}
                            title="Bersihkan Chat (Tuning)" 
                            className="p-2 hover:bg-red-50 rounded-full text-red-500"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative z-10">
            {selectedContact.status === 'pending_outgoing' && (
                <div className="flex justify-center mt-4">
                    <div className="bg-orange-50 text-orange-800 px-4 py-2 rounded-lg text-sm shadow-sm flex items-center border border-orange-100">
                        <Clock className="w-4 h-4 mr-2" /> Undangan terkirim. Chat tersedia setelah diterima.
                    </div>
                </div>
            )}
            
            {selectedContact.status === 'pending_incoming' && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <img src={selectedContact.avatar} className="w-20 h-20 rounded-full shadow-md" alt="" />
                    <p className="text-center max-w-xs"><strong>{selectedContact.name}</strong> ingin mengobrol dengan Anda.</p>
                </div>
            )}

            {/* LOAD MORE BUTTON */}
            {selectedContact.status === 'connected' && hasMoreMessages && (
                <div className="flex justify-center py-2">
                    <button 
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full flex items-center shadow-sm transition"
                    >
                        {isLoadingMore ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <ArrowUp className="w-3 h-3 mr-1" />}
                        Muat pesan sebelumnya
                    </button>
                </div>
            )}

            {selectedContact.status === 'connected' && visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="bg-white/50 p-4 rounded-full mb-2"><Smile className="w-8 h-8" /></div>
                    <p className="text-sm">Mulai percakapan dengan {selectedContact.name}!</p>
                </div>
            )}

            {selectedContact.status === 'connected' && visibleMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                    <div className={`max-w-[75%] md:max-w-[60%] px-3 py-2 rounded-lg shadow-sm relative text-sm ${msg.isMe ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                        {selectedContact.type === 'group' && !msg.isMe && msg.senderName && (
                            <p className="text-[10px] font-bold text-orange-600 mb-0.5">{msg.senderName}</p>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-[10px] text-gray-400 block text-right mt-1 ml-4 min-w-[50px]">{msg.timestamp}</span>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {selectedContact.status === 'connected' ? (
            <div className="bg-[#f0f2f5] px-4 py-3 border-t border-gray-200 sticky bottom-0 w-full z-20">
                <div className="flex items-end space-x-2 max-w-4xl mx-auto">
                <button className="text-gray-500 hover:text-emerald-600 p-2 mb-1 transition-colors"><Paperclip className="w-6 h-6" /></button>
                <div className="flex-1 relative bg-white rounded-2xl shadow-sm border border-white focus-within:border-emerald-500 transition-colors">
                    <textarea
                        rows={1}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ketik pesan..."
                        className="w-full bg-transparent border-0 rounded-2xl pl-4 pr-10 py-3 focus:ring-0 resize-none max-h-32 text-sm text-slate-800 placeholder:text-slate-400"
                        style={{minHeight: '44px'}}
                    />
                    <button className="absolute right-3 bottom-3 text-gray-400 hover:text-emerald-600 transition-colors"><Smile className="w-5 h-5" /></button>
                </div>
                <button onClick={handleSend} disabled={!messageInput.trim()} className={`p-3 rounded-full shadow-md mb-1 transition-all transform active:scale-95 ${messageInput.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                    <Send className="w-5 h-5" />
                </button>
                </div>
            </div>
          ) : (
            <div className="bg-[#f0f2f5] px-4 py-4 border-t border-gray-200 sticky bottom-0 w-full z-20 text-center">
                <p className="text-sm text-gray-500 italic">
                    {selectedContact.status === 'pending_outgoing' ? 'Menunggu undangan diterima...' : 'Anda belum terhubung dengan pengguna ini.'}
                </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center flex-col text-gray-400 bg-[#f0f2f5] border-l border-gray-200">
          <div className="w-64 h-64 opacity-50 bg-[url('https://cdn-icons-png.flaticon.com/512/1041/1041916.png')] bg-contain bg-no-repeat bg-center mb-4 grayscale"></div>
          <h2 className="text-2xl font-light text-slate-600 mb-2">KMP-ADNG Chat Web</h2>
          <p className="text-sm max-w-md text-center">Cari pengguna lain di kolom pencarian dan kirim undangan untuk memulai obrolan P2P yang aman.</p>
          <div className="mt-8 flex items-center text-xs text-gray-400"><span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span> End-to-end encrypted</div>
        </div>
      )}
    </div>
  );
};
