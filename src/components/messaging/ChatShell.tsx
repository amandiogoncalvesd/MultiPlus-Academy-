import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';
import { messageService, SupabaseMessage } from '../../services/supabase/messageService';
import NewConversationModal from './NewConversationModal';
import BulkSendModal from './BulkSendModal';
import { 
  Send, Plus, Search, MessageSquare, Megaphone, User as UserIcon, Loader2,
  Reply, Edit2, Trash2, Trash, X, Check, AlertCircle
} from 'lucide-react';
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

  // WhatsApp-like interactive states
  const [editingMessage, setEditingMessage] = useState<SupabaseMessage | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<SupabaseMessage | null>(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);
  const [conversationClearTimestamp, setConversationClearTimestamp] = useState<string | null>(null);
  
  // Custom safe modal confirmations
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<SupabaseMessage | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // 2. Real-time subscription to messages table (handles INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-realtime-whatsapp')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload: any) => {
          const eventType = payload.eventType;
          const newMsg = payload.new as SupabaseMessage;

          // Process inserts
          if (eventType === 'INSERT') {
            if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
              if (
                activePartner &&
                (newMsg.sender_id === activePartner.id || newMsg.receiver_id === activePartner.id)
              ) {
                // Respect local clear and local delete filter rules
                const localClearVal = localStorage.getItem(`chat_clear_${user.id}_${activePartner.id}`);
                const localDeleted = JSON.parse(localStorage.getItem(`chat_deleted_for_me_${user.id}_${activePartner.id}`) || '[]');
                
                if (localClearVal && new Date(newMsg.created_at).getTime() <= new Date(localClearVal).getTime()) {
                  return; // message is before clear point
                }
                if (localDeleted.includes(newMsg.id)) {
                  return; // message is locally deleted for us
                }

                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });

                if (newMsg.receiver_id === user.id) {
                  try {
                    await messageService.markAsRead(newMsg.id);
                  } catch (err) {
                    console.error('Failed to mark message as read', err);
                  }
                }
              }

              // Refresh partners list to reflect unread count or last message
              try {
                const updatedParts = await messageService.getConversationPartners(user.id);
                setPartners(updatedParts);
              } catch (err) {
                console.error('Error refreshing partners', err);
              }
            }
          }
          
          // Process updates (edits, deletions for everyone, etc.)
          if (eventType === 'UPDATE') {
            if (
              activePartner &&
              (newMsg.sender_id === activePartner.id || newMsg.receiver_id === activePartner.id)
            ) {
              setMessages((prev) =>
                prev.map((m) => (m.id === newMsg.id ? { ...m, ...newMsg } : m))
              );
            }
            // Refresh partner cards for last message text update
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

  // 3. Load active conversation history with clear and delete filters
  const loadConversationHistory = async () => {
    if (!user?.id || !activePartner) return;
    try {
      const clearTimestamp = await messageService.getConversationClearTimestamp(user.id, activePartner.id);
      setConversationClearTimestamp(clearTimestamp);

      const deletedForMeKey = `chat_deleted_for_me_${user.id}_${activePartner.id}`;
      const localDeleted = JSON.parse(localStorage.getItem(deletedForMeKey) || '[]');
      setDeletedForMeIds(localDeleted);

      const allMsgs = await messageService.getMessages(user.id);
      let filtered = allMsgs
        .filter(
          (m) =>
            (m.sender_id === user.id && m.receiver_id === activePartner.id) ||
            (m.sender_id === activePartner.id && m.receiver_id === user.id)
        );

      // Filter messages cleared before clearing timestamp
      if (clearTimestamp) {
        filtered = filtered.filter(
          (m) => new Date(m.created_at).getTime() > new Date(clearTimestamp).getTime()
        );
      }

      // Filter messages deleted "for me"
      if (localDeleted.length > 0) {
        filtered = filtered.filter((m) => !localDeleted.includes(m.id));
      }

      const sorted = filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(sorted);

      // Mark incoming messages as read
      const unreadIncoming = sorted.filter((m) => m.receiver_id === user.id && !m.lido);
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

  useEffect(() => {
    loadConversationHistory();
  }, [activePartner?.id, user?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send or Edit Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !activePartner || !inputText.trim() || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      if (editingMessage) {
        // Edit message
        await messageService.editMessage(editingMessage.id, textToSend);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, texto: textToSend, edited_at: new Date().toISOString() }
              : m
          )
        );
        setEditingMessage(null);
      } else {
        // Send message with optional reply
        const responseMsg = await messageService.sendMessage(
          user.id,
          activePartner.id,
          textToSend,
          replyingToMessage?.id || undefined
        );
        setMessages((prev) => [...prev, responseMsg]);
        setReplyingToMessage(null);

        // Update local last message in partners list
        setPartners((prev) =>
          prev.map((p) =>
            p.id === activePartner.id
              ? { ...p, lastMessage: responseMsg }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(`Erro: ${err.message || err}`);
      setInputText(textToSend); // restore draft
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
      const updatedParts = await messageService.getConversationPartners(user.id);
      setPartners(updatedParts);
      alert('Mensagens enviadas com sucesso em lote!');
    } catch (err: any) {
      throw err;
    }
  };

  // Delete message "for me"
  const handleDeleteForMe = () => {
    if (!user?.id || !activePartner || !messageToDelete) return;
    const deletedForMeKey = `chat_deleted_for_me_${user.id}_${activePartner.id}`;
    const updatedDeleted = [...deletedForMeIds, messageToDelete.id];
    localStorage.setItem(deletedForMeKey, JSON.stringify(updatedDeleted));
    setDeletedForMeIds(updatedDeleted);
    
    // Remove from active state
    setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  // Delete message "for everyone"
  const handleDeleteForEveryone = async () => {
    if (!messageToDelete) return;
    try {
      await messageService.deleteMessageForEveryone(messageToDelete.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageToDelete.id
            ? { ...m, texto: 'Mensagem eliminada', deleted_at: new Date().toISOString() }
            : m
        )
      );
      setShowDeleteModal(false);
      setMessageToDelete(null);
    } catch (err: any) {
      alert(`Erro ao apagar mensagem: ${err.message || err}`);
    }
  };

  // Clear conversation locally (syncing with Postgres cleared point)
  const handleClearConversation = async () => {
    if (!user?.id || !activePartner) return;
    try {
      await messageService.clearConversation(user.id, activePartner.id);
      setMessages([]);
      setConversationClearTimestamp(new Date().toISOString());
      setShowClearConfirm(false);
    } catch (err: any) {
      alert(`Erro ao limpar conversa: ${err.message || err}`);
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.nome_completo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="chat-shell" className="flex bg-cream-100/95 dark:bg-ink-950/80 rounded-3xl border border-gray-150 dark:border-ink-800/85 overflow-hidden shadow-[0_20px_50px_rgba(10,46,93,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] h-[650px] relative">
      
      {/* Sidebar - list of partners */}
      <div className={`w-full md:w-80 border-r border-gray-150 dark:border-ink-800 flex flex-col h-full bg-cream-100/40 dark:bg-ink-900/40 relative ${activePartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/30 to-transparent pointer-events-none" />
        
        <div className="p-4 border-b border-gray-150 dark:border-ink-800 bg-cream-100/80 dark:bg-ink-900 flex flex-col gap-3">
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
              className="w-full pl-9 pr-4 py-1.5 border border-gray-250 dark:border-ink-850 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 bg-cream-200 dark:bg-ink-950/40 text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
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
                      : 'hover:bg-cream-200/80 dark:hover:bg-ink-800 bg-cream-150/40 dark:bg-ink-900/20 border border-gray-150/40 dark:border-ink-800/40 text-ink-900 dark:text-cream-100'
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
                          : 'bg-cream-200 dark:bg-ink-850 border-gold-600/20 text-gold-600'
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
                      {p.lastMessage ? (
                        p.lastMessage.deleted_at ? (
                          <span className="italic opacity-60">🚫 Mensagem eliminada</span>
                        ) : p.lastMessage.texto
                      ) : 'Comece a conversar!'}
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
      <div className={`flex-grow flex flex-col h-full bg-cream-100/30 dark:bg-ink-950/20 ${!activePartner ? 'hidden md:flex' : 'flex'}`}>
        {activePartner ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-150 dark:border-ink-800/60 flex items-center gap-3 bg-cream-200/40 dark:bg-ink-900/40 backdrop-blur-sm shrink-0">
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
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-ink-800"
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

              {/* Clear conversation button */}
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/10 text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-700 rounded-xl transition-all border border-rose-200/35 dark:border-rose-900/30 text-3xs font-mono font-bold uppercase cursor-pointer"
                title="Limpar Conversa"
              >
                <Trash size={12} />
                <span className="hidden sm:inline">Limpar Conversa</span>
              </button>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-100/10 dark:bg-ink-950/10">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-1.5">
                  <MessageSquare className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-xs">Nenhuma mensagem nesta conversa.</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  
                  // Resolve quotes for replies
                  const repliedMsg = m.reply_to_message_id 
                    ? messages.find(x => x.id === m.reply_to_message_id) 
                    : null;

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative items-center gap-2.5 mb-2.5`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl text-sm transition-all relative ${
                          isMe
                            ? 'bg-gradient-to-r from-gold-600 to-[#E2B755] text-white rounded-tr-none shadow-xs'
                            : 'bg-cream-200/90 dark:bg-ink-800 text-ink-900 dark:text-cream-100 border border-gray-150/50 dark:border-ink-800/50 rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                        }`}
                      >
                        {/* Quoted Replying indicator block */}
                        {repliedMsg && (
                          <div className={`mb-2 p-2 rounded-lg text-[10px] text-left max-w-full truncate leading-snug border-l-4 ${
                            isMe 
                              ? 'bg-black/15 text-cream-100 border-white/80' 
                              : 'bg-cream-300 dark:bg-ink-900 text-neutral-500 dark:text-cream-200 border-gold-600'
                          }`}>
                            <span className="font-bold block mb-0.5 uppercase text-[8px] tracking-wider">
                              {repliedMsg.sender_id === user?.id ? 'Si próprio' : activePartner.nome_completo}
                            </span>
                            <span className="italic opacity-90 truncate block">
                              {repliedMsg.deleted_at ? '🚫 Mensagem eliminada' : repliedMsg.texto}
                            </span>
                          </div>
                        )}

                        {/* Content text */}
                        {m.deleted_at ? (
                          <p className="leading-snug italic opacity-60 text-xs flex items-center gap-1">
                            🚫 Esta mensagem foi eliminada
                          </p>
                        ) : (
                          <p className="leading-snug break-words whitespace-pre-line m-0">{m.texto}</p>
                        )}

                        {/* Footer details */}
                        <div className="flex items-center justify-end gap-1.5 mt-1 opacity-60">
                          {m.edited_at && !m.deleted_at && (
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider italic">
                              editada
                            </span>
                          )}
                          <span className="text-[9px] block text-right leading-none font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Micro-hover WhatsApp actions panel */}
                      {!m.deleted_at && (
                        <div className={`opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-cream-100 dark:bg-ink-900 border border-gray-200/70 dark:border-ink-800 rounded-xl p-1 shadow-sm z-10 ${
                          isMe ? 'order-first' : 'order-last'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setReplyingToMessage(m)}
                            className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-neutral-450 dark:text-cream-200/80 hover:text-gold-600 transition-colors border-0 cursor-pointer"
                            title="Responder"
                          >
                            <Reply size={12} />
                          </button>
                          
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(m);
                                setInputText(m.texto);
                              }}
                              className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-neutral-450 dark:text-cream-200/80 hover:text-blue-500 transition-colors border-0 cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setMessageToDelete(m);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-rose-500 hover:text-rose-600 transition-colors border-0 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Context Bars */}
            <div className="border-t border-gray-150 dark:border-ink-800/60 bg-cream-100 dark:bg-ink-900 shrink-0">
              
              {/* Replying Context Indicator */}
              {replyingToMessage && (
                <div className="px-5 py-2.5 bg-cream-200 dark:bg-ink-900 border-b border-gray-150 dark:border-ink-850/60 flex items-center justify-between text-xs animate-fade-in text-left border-l-4 border-gold-600">
                  <div className="truncate pr-4">
                    <span className="font-bold text-gold-600 block text-[9px] uppercase font-mono tracking-wider">
                      A responder a {replyingToMessage.sender_id === user.id ? 'si próprio' : activePartner.nome_completo}
                    </span>
                    <span className="text-neutral-500 dark:text-cream-200/75 italic text-2xs truncate block mt-0.5">
                      {replyingToMessage.texto}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    className="p-1 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full text-neutral-400 hover:text-rose-500 transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Editing Context Indicator */}
              {editingMessage && (
                <div className="px-5 py-2.5 bg-cream-200 dark:bg-ink-900 border-b border-gray-150 dark:border-ink-850/60 flex items-center justify-between text-xs animate-fade-in text-left border-l-4 border-blue-500">
                  <div className="truncate pr-4">
                    <span className="font-bold text-blue-500 block text-[9px] uppercase font-mono tracking-wider">
                      Modo Edição de Mensagem
                    </span>
                    <span className="text-neutral-500 dark:text-cream-200/75 italic text-2xs truncate block mt-0.5">
                      Antiga: {editingMessage.texto}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(null);
                      setInputText('');
                    }}
                    className="p-1 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full text-neutral-400 hover:text-rose-500 transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-3 flex gap-2">
                <input
                  type="text"
                  required
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={editingMessage ? "Edite a sua mensagem..." : "Escreva uma mensagem..."}
                  className="flex-1 px-4 py-2.5 bg-cream-200 dark:bg-ink-950 border border-gray-250 dark:border-ink-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition-all text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-lg hover:scale-105 text-white disabled:opacity-50 transition-all shadow-xs border-0 cursor-pointer flex items-center justify-center shrink-0"
                >
                  {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8">
            <StarBorder as="div" speed="8s" thickness={1.5} className="rounded-3xl overflow-hidden shadow-md" innerClassName="p-10 flex flex-col items-center justify-center text-center bg-cream-100 dark:bg-ink-950">
              <MessageSquare className="w-12 h-12 stroke-[1] text-gold-600 mb-3 animate-bounce" />
              <p className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-lg">MultiPlus Chat Premium</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Selecione uma conversa na lista ou crie uma nova para falar em tempo real.
              </p>
            </StarBorder>
          </div>
        )}
      </div>

      {/* -------------------- IN-APP MODAL CONFIRMATIONS (IFrame safe) -------------------- */}
      
      {/* 1. Clear Conversation confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-cream-100 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto animate-pulse">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Limpar Conversa?</h4>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                Isto vai ocultar todas as mensagens desta conversa do seu ecrã. O outro utilizador continuará a vê-las. Esta ação é irreversível.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-cream-200 hover:bg-cream-250 dark:bg-ink-850 dark:hover:bg-ink-800 text-neutral-500 dark:text-cream-200 text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearConversation}
                className="flex-grow py-2 bg-rose-600 hover:bg-rose-700 text-white text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Message Delete selection modal */}
      {showDeleteModal && messageToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-cream-100 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Apagar Mensagem?</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed truncate">
                "{messageToDelete.texto}"
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeleteForMe}
                className="w-full py-2 bg-cream-200 hover:bg-cream-250 dark:bg-ink-850 dark:hover:bg-ink-800 text-neutral-500 dark:text-cream-200 text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors"
              >
                Apagar para mim (Local)
              </button>
              
              {messageToDelete.sender_id === user?.id && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors"
                >
                  Apagar para todos
                </button>
              )}

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }}
                className="w-full py-1.5 text-neutral-400 hover:text-neutral-500 dark:hover:text-cream-200 bg-transparent border-0 text-3xs font-mono uppercase cursor-pointer mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub modals */}
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
