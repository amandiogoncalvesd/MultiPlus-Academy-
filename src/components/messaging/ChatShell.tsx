import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';
import { messageService, SupabaseMessage } from '../../services/supabase/messageService';
import NewConversationModal from './NewConversationModal';
import BulkSendModal from './BulkSendModal';
import { Send, Plus, Search, MessageSquare, Megaphone, User as UserIcon, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import StarBorder from '../ui/StarBorder';

interface ChatShellProps {
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}

interface Partner {
  id: string;
  email: string;
  nome_completo: string;
  role: string;
  foto_perfil?: string;
  lastMessage?: SupabaseMessage;
  unreadCount: number;
}

export default function ChatShell({ role }: ChatShellProps) {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allowedContacts, setAllowedContacts] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch initial partners and allowed contacts
  const loadInitialData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const parts = await messageService.getConversationPartners(user.id);
      setPartners(parts);
      const allowed = await messageService.getAllowedContacts(user.id, role);
      setAllowedContacts(allowed);
    } catch (err) {
      console.error('Error loading chat partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [user?.id, role]);

  // 2. Real-time subscription to messages table
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: any) => {
          const newMsg = payload.new as SupabaseMessage;

          // Only care if the message is for us or sent by us
          if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
            // If the message is with the active partner, add it to the active stream
            if (
              activePartner &&
              (newMsg.sender_id === activePartner.id || newMsg.receiver_id === activePartner.id)
            ) {
              setMessages((prev) => {
                // Prevent duplicate inserts
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              // Mark as read immediately if we are the recipient
              if (newMsg.receiver_id === user.id) {
                try {
                  await messageService.markAsRead(newMsg.id);
                } catch (err) {
                  console.error('Failed to mark message as read', err);
                }
              }
            }

            // Refresh the partners list to update unread badges & last message
            try {
              const updatedParts = await messageService.getConversationPartners(user.id);
              setPartners(updatedParts);
            } catch (err) {
              console.error('Error refreshing partners', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activePartner?.id]);

  // 3. Load active conversation history
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!user?.id || !activePartner) return;
      try {
        const allMsgs = await messageService.getMessages(user.id);
        const filtered = allMsgs
          .filter(
            (m) =>
              (m.sender_id === user.id && m.receiver_id === activePartner.id) ||
              (m.sender_id === activePartner.id && m.receiver_id === user.id)
          )
          // Sort ascending for chronological view
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        setMessages(filtered);

        // Mark incoming messages as read
        const unreadIncoming = filtered.filter((m) => m.receiver_id === user.id && !m.lido);
        if (unreadIncoming.length > 0) {
          await Promise.all(unreadIncoming.map((m) => messageService.markAsRead(m.id)));
          // Refresh partners list after marking as read
          const updatedParts = await messageService.getConversationPartners(user.id);
          setPartners(updatedParts);
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
      }
    };

    loadConversationHistory();
  }, [activePartner?.id, user?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !activePartner || !inputText.trim() || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const responseMsg = await messageService.sendMessage(user.id, activePartner.id, textToSend);
      setMessages((prev) => [...prev, responseMsg]);

      // Update local last message in partners list
      setPartners((prev) =>
        prev.map((p) =>
          p.id === activePartner.id
            ? { ...p, lastMessage: responseMsg }
            : p
        )
      );
    } catch (err: any) {
      alert(`Erro ao enviar mensagem: ${err.message || err}`);
      setInputText(textToSend); // restore
    } finally {
      setSending(false);
    }
  };

  // Select contact from New Conversation Modal
  const handleStartConversation = (contact: any) => {
    setShowNewModal(false);
    const existing = partners.find((p) => p.id === contact.id);
    if (existing) {
      setActivePartner(existing);
    } else {
      const newPartner: Partner = {
        id: contact.id,
        email: contact.email,
        nome_completo: contact.nome_completo,
        role: contact.role,
        foto_perfil: contact.foto_perfil,
        unreadCount: 0,
      };
      setPartners((prev) => [newPartner, ...prev]);
      setActivePartner(newPartner);
    }
  };

  // Send message to multiple people (Admin Only)
  const handleSendBulk = async (targetIds: string[], text: string) => {
    if (!user?.id) return;
    try {
      await Promise.all(
        targetIds.map((tid) => messageService.sendMessage(user.id, tid, text))
      );
      // Refresh
      const updatedParts = await messageService.getConversationPartners(user.id);
      setPartners(updatedParts);
      alert('Mensagens enviadas com sucesso em lote!');
    } catch (err: any) {
      throw err;
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.nome_completo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="chat-shell" className="flex bg-cream-100 dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-gold-600/10 overflow-hidden shadow-[0_20px_50px_rgba(10,46,93,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] h-[650px] relative">
      {/* Sidebar - list of partners */}
      <div className={`w-full md:w-80 border-r border-cream-200 dark:border-ink-800 flex flex-col h-full bg-cream-100/40 dark:bg-ink-900/40 relative ${activePartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/30 to-transparent pointer-events-none" />
        
        <div className="p-4 border-b border-cream-200 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold-600" />
              Mensagens
            </h3>
            <div className="flex gap-1">
              {role === 'ADMIN' && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  title="Envio em massa"
                  className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-ink-800 text-gold-600 transition-colors border border-gold-600/20 bg-transparent cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowNewModal(true)}
                className="p-1.5 rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-md hover:scale-105 text-white transition-all border-0 cursor-pointer flex items-center justify-center"
                title="Nova Conversa"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-cream-200 dark:border-slate-700 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 bg-cream-200 dark:bg-ink-800 text-ink-900 dark:text-cream-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
              <span className="text-xs">A carregar conversas...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs text-neutral-400">Nenhuma conversa ativa.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="text-xs text-gold-600 font-semibold hover:underline mt-2 flex items-center gap-1 mx-auto bg-transparent border-0 cursor-pointer"
              >
                Iniciar uma conversa
              </button>
            </div>
          ) : (
            filteredPartners.map((p) => {
              const isSelected = activePartner?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePartner(p)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left border-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold-600 to-[#E2B755] text-white shadow-md font-bold'
                      : 'hover:bg-cream-200 dark:hover:bg-ink-800 bg-cream-100/70 dark:bg-ink-900/30 border border-cream-200/50 dark:border-ink-800/50 text-ink-900 dark:text-cream-100'
                  }`}
                >
                  {p.foto_perfil ? (
                    <img
                      src={p.foto_perfil}
                      alt={p.nome_completo}
                      className="w-10 h-10 rounded-full object-cover border border-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border text-sm ${
                        isSelected
                          ? 'bg-white/20 border-white/45 text-white'
                          : 'bg-cream-200 dark:bg-ink-800 border-gold-600/20 text-gold-600'
                      }`}
                    >
                      {p.nome_completo.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold truncate leading-none mb-1">
                        {p.nome_completo}
                      </h4>
                      {p.lastMessage && (
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-white/60' : 'text-neutral-400'
                          }`}
                        >
                          {new Date(p.lastMessage.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate ${
                        isSelected ? 'text-white/80' : 'text-neutral-400 dark:text-cream-100/60'
                      }`}
                    >
                      {p.lastMessage ? p.lastMessage.texto : 'Comece a conversar!'}
                    </p>
                  </div>

                  {p.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {p.unreadCount}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div className={`flex-1 flex flex-col h-full bg-cream-100 dark:bg-ink-900 ${!activePartner ? 'hidden md:flex' : 'flex'}`}>
        {activePartner ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-cream-200 dark:border-ink-800 flex items-center gap-3 bg-cream-200/50 dark:bg-ink-800/50 backdrop-blur-sm">
              <button
                onClick={() => setActivePartner(null)}
                className="md:hidden text-xs font-bold text-gold-600 hover:underline mr-1 bg-transparent border-0 cursor-pointer"
              >
                ← Voltar
              </button>

              {activePartner.foto_perfil ? (
                <img
                  src={activePartner.foto_perfil}
                  alt={activePartner.nome_completo}
                  className="w-10 h-10 rounded-full object-cover border border-cream-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cream-200 dark:bg-ink-800 flex items-center justify-center text-gold-600 font-bold border border-gold-600/20">
                  {activePartner.nome_completo.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-ink-900 dark:text-cream-100 leading-none mb-1">
                  {activePartner.nome_completo}
                </h4>
                <p className="text-[10px] text-neutral-400 leading-none capitalize">
                  {activePartner.role.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream-100/20 dark:bg-ink-950/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-1.5">
                  <MessageSquare className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-xs">Nenhuma mensagem nesta conversa.</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl shadow-xs text-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-gold-600 to-[#E2B755] text-white rounded-tr-none shadow-sm'
                            : 'bg-cream-200 dark:bg-ink-800 text-ink-900 dark:text-cream-100 border border-cream-200/40 dark:border-ink-800/40 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-snug break-words">{m.texto}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 leading-none ${
                            isMe ? 'text-white/60' : 'text-neutral-400/80 dark:text-cream-100/50'
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-3 border-t border-cream-200 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 flex gap-2">
              <input
                type="text"
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 px-4 py-2.5 bg-cream-200 dark:bg-ink-800 border border-cream-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition-all text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-lg hover:scale-105 text-white disabled:opacity-50 transition-colors shadow-xs border-0 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8">
            <StarBorder as="div" speed="8s" thickness={1.5} className="rounded-3xl overflow-hidden shadow-md" innerClassName="p-10 flex flex-col items-center justify-center text-center bg-cream-100 dark:bg-ink-900">
              <MessageSquare className="w-12 h-12 stroke-[1] text-gold-600 mb-3" />
              <p className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-lg">MultiPlus Chat Premium</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Selecione uma conversa na lista ou crie uma nova para falar em tempo real.
              </p>
            </StarBorder>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewConversationModal
          contacts={allowedContacts}
          onClose={() => setShowNewModal(false)}
          onSelect={handleStartConversation}
        />
      )}

      {showBulkModal && (
        <BulkSendModal
          contacts={allowedContacts}
          onClose={() => setShowBulkModal(false)}
          onSendBulk={handleSendBulk}
        />
      )}
    </div>
  );
}
