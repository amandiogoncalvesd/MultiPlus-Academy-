import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';
import { messageService, SupabaseMessage } from '../../services/supabase/messageService';
import { presenceService } from '../../services/supabase/presenceService';
import NewConversationModal from './NewConversationModal';
import BulkSendModal from './BulkSendModal';
import { 
  AlertCircle, Trash2, MessageSquare
} from 'lucide-react';
import StarBorder from '../ui/StarBorder';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
import { ChatMessage, ChatPartner, ChatTheme } from '../../types/chat.types';

interface ChatShellProps {
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}

const DEFAULT_THEME: ChatTheme = {
  id: 'multiplus_light',
  name: 'MultiPlus Classic',
  isDark: false,
  colors: {
    bgPrimary: '#F8F6F3',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F0EDE8',
    bgOverlay: 'rgba(10, 46, 93, 0.45)',
    bubbleMe: 'linear-gradient(135deg, #0A2E5D 0%, #C89B3C 100%)',
    bubbleMeText: '#FFFFFF',
    bubbleOther: '#FFFFFF',
    bubbleOtherText: '#1A1A2E',
    bubbleReply: 'rgba(10, 46, 93, 0.08)',
    bubbleReplyBorder: '#C89B3C',
    online: '#22C55E',
    offline: '#9CA3AF',
    typing: '#C89B3C',
    unread: '#EF4444',
    hover: 'rgba(200, 155, 60, 0.08)',
    selected: 'rgba(200, 155, 60, 0.15)',
    danger: '#EF4444',
    success: '#22C55E',
    textPrimary: '#0A2E5D',
    textSecondary: '#4A5568',
    textMuted: '#A0AEC0',
    textLink: '#C89B3C',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    scrollbarTrack: 'transparent',
    scrollbarThumb: '#CBD5E1',
  },
  shadows: {
    bubble: '0 1px 2px rgba(0,0,0,0.08)',
    modal: '0 25px 50px -12px rgba(10, 46, 93, 0.25)',
    sidebar: '4px 0 24px rgba(10, 46, 93, 0.06)',
  },
  borderRadius: {
    bubble: '18px',
    button: '12px',
    modal: '24px',
    avatar: '50%',
  }
};

export default function ChatShell({ role }: ChatShellProps) {
  const { user } = useAuth();
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [allowedContacts, setAllowedContacts] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Advanced contextual and interactive states
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);
  const [conversationClearTimestamp, setConversationClearTimestamp] = useState<string | null>(null);
  
  // Clean custom modaling confirmations
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper mapper to convert flat DBMessage representation to rich ChatMessage
  const mapDBMessageToChatMessage = useCallback((dbMsg: SupabaseMessage, rawList: SupabaseMessage[] = []): ChatMessage => {
    const replyToMsg = dbMsg.reply_to_message_id 
      ? rawList.find(x => x.id === dbMsg.reply_to_message_id) 
      : null;

    return {
      id: dbMsg.id,
      senderId: dbMsg.sender_id,
      receiverId: dbMsg.receiver_id,
      text: dbMsg.texto,
      lido: dbMsg.lido,
      createdAt: dbMsg.created_at,
      editedAt: dbMsg.edited_at,
      deletedAt: dbMsg.deleted_at,
      replyToId: dbMsg.reply_to_message_id,
      replyTo: replyToMsg ? {
        id: replyToMsg.id,
        senderId: replyToMsg.sender_id,
        receiverId: replyToMsg.receiver_id,
        text: replyToMsg.texto,
        lido: replyToMsg.lido,
        createdAt: replyToMsg.created_at,
        deletedAt: replyToMsg.deleted_at,
        status: replyToMsg.lido ? 'READ' : 'SENT'
      } as ChatMessage : null,
      status: dbMsg.status as any || (dbMsg.lido ? 'READ' : 'SENT'),
      reactions: JSON.parse(localStorage.getItem(`local_reactions_${dbMsg.id}`) || '[]')
    };
  }, []);

  // 1. Load initial channels and allowed contacts
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

  // 2. Real-time sub channels to sync messages and presence indicators
  useEffect(() => {
    if (!user?.id) return;

    // Listen to messaging changes
    const channel = supabase
      .channel('messages-realtime-whatsapp')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload: any) => {
          const eventType = payload.eventType;
          const newMsg = payload.new as SupabaseMessage;

          if (eventType === 'INSERT') {
            if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
              if (
                activePartner &&
                (newMsg.sender_id === activePartner.id || newMsg.receiver_id === activePartner.id)
              ) {
                const localClearVal = localStorage.getItem(`chat_clear_${user.id}_${activePartner.id}`);
                const localDeleted = JSON.parse(localStorage.getItem(`chat_deleted_for_me_${user.id}_${activePartner.id}`) || '[]');
                
                if (localClearVal && new Date(newMsg.created_at).getTime() <= new Date(localClearVal).getTime()) {
                  return;
                }
                if (localDeleted.includes(newMsg.id)) {
                  return;
                }

                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  // Map raw DBMessage to rich ChatMessage
                  const mapped = mapDBMessageToChatMessage(newMsg, prev as any);
                  return [...prev, mapped];
                });

                if (newMsg.receiver_id === user.id) {
                  try {
                    await messageService.markAsRead(newMsg.id);
                  } catch (err) {
                    console.error('Failed to mark message as read', err);
                  }
                }
              }

              // Refresh contact cards
              try {
                const updatedParts = await messageService.getConversationPartners(user.id);
                setPartners(updatedParts);
              } catch (err) {
                console.error('Error refreshing partners', err);
              }
            }
          }
          
          if (eventType === 'UPDATE') {
            if (
              activePartner &&
              (newMsg.sender_id === activePartner.id || newMsg.receiver_id === activePartner.id)
            ) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id === newMsg.id) {
                    return {
                      ...m,
                      text: newMsg.texto,
                      editedAt: newMsg.edited_at,
                      deletedAt: newMsg.deleted_at,
                      status: newMsg.status as any || (newMsg.lido ? 'READ' : 'SENT')
                    };
                  }
                  return m;
                })
              );
            }
            
            // Refresh conversation partners
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

    // Listen to real-time typing events from partners
    const unsubTyping = presenceService.subscribeToTyping(user.id, (event) => {
      setPartners((prev) =>
        prev.map((p) => {
          if (p.id === event.userId) {
            return {
              ...p,
              status: event.isTyping ? 'TYPING' : 'ONLINE'
            };
          }
          return p;
        })
      );
      
      if (activePartner && activePartner.id === event.userId) {
        setActivePartner((prev) => prev ? { ...prev, status: event.isTyping ? 'TYPING' : 'ONLINE' } : null);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      unsubTyping();
    };
  }, [user?.id, activePartner?.id, mapDBMessageToChatMessage]);

  // 3. Sync and fetch active conversation history
  const loadConversationHistory = async () => {
    if (!user?.id || !activePartner) return;
    try {
      const clearTimestamp = await messageService.getConversationClearTimestamp(user.id, activePartner.id);
      setConversationClearTimestamp(clearTimestamp);

      const deletedForMeKey = `chat_deleted_for_me_${user.id}_${activePartner.id}`;
      const localDeleted = JSON.parse(localStorage.getItem(deletedForMeKey) || '[]');
      setDeletedForMeIds(localDeleted);

      // Usar getMessagesPaginated em vez de carregar todas as mensagens
      const { messages: conversationMsgs } = await messageService.getMessagesPaginated(
        user.id,
        activePartner.id,
        undefined,
        200 // Carregar até 200 mensagens iniciais
      );

      let filtered = [...conversationMsgs];

      if (clearTimestamp) {
        filtered = filtered.filter(
          (m) => new Date(m.created_at).getTime() > new Date(clearTimestamp).getTime()
        );
      }

      if (localDeleted.length > 0) {
        filtered = filtered.filter((m) => !localDeleted.includes(m.id));
      }

      // Map DBMessage structures to rich ChatMessage types
      const mappedList = filtered.map(m => mapDBMessageToChatMessage(m, conversationMsgs));
      const sorted = mappedList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setMessages(sorted);

      // Mark unread incoming messages as read
      const unreadIncoming = sorted.filter((m) => m.receiverId === user.id && m.status !== 'READ');
      if (unreadIncoming.length > 0) {
        await Promise.all(unreadIncoming.map((m) => messageService.markAsRead(m.id)));
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

  // Broadcast typing event when writing text
  const handleTypingBroadcast = () => {
    if (!user?.id || !activePartner) return;
    
    // Broadcast active writing status
    presenceService.broadcastTyping(user.id, activePartner.id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (user?.id && activePartner) {
        presenceService.broadcastTyping(user.id, activePartner.id, false);
      }
    }, 2500);
  };

  // Handle Send or edit Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !activePartner || !inputText.trim() || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    // Stop writing broadcast immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    presenceService.broadcastTyping(user.id, activePartner.id, false);

    try {
      if (editingMessage) {
        await messageService.editMessage(editingMessage.id, textToSend);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, text: textToSend, editedAt: new Date().toISOString() }
              : m
          )
        );
        setEditingMessage(null);
      } else {
        const responseMsg = await messageService.sendMessage(
          user.id,
          activePartner.id,
          textToSend,
          replyingToMessage?.id || undefined
        );
        
        // Map response DBMessage to rich ChatMessage
        const mapped = mapDBMessageToChatMessage(responseMsg, messages as any);
        setMessages((prev) => [...prev, mapped]);
        setReplyingToMessage(null);

        // Update last message in partners list
        setPartners((prev) =>
          prev.map((p) =>
            p.id === activePartner.id
              ? { ...p, lastMessage: responseMsg }
              : p
          )
        );
      }
    } catch (err: any) {
      console.error('Error in handleSend:', err);
      setInputText(textToSend); // restore draft
    } finally {
      setSending(false);
    }
  };

  // Launch new chat conversation from contact modal select list
  const handleStartConversation = (contact: any) => {
    setShowNewModal(false);
    const existing = partners.find((p) => p.id === contact.id);
    if (existing) {
      setActivePartner(existing);
    } else {
      const newPartner: ChatPartner = {
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

  // Broadcast announcements/notifications in bulk (Admin role only)
  const handleSendBulk = async (targetIds: string[], text: string) => {
    if (!user?.id) return;
    try {
      await Promise.all(
        targetIds.map((tid) => messageService.sendMessage(user.id, tid, text))
      );
      const updatedParts = await messageService.getConversationPartners(user.id);
      setPartners(updatedParts);
    } catch (err: any) {
      console.error('Bulk sending failure:', err);
    }
  };

  // Handle local delete workflow (message hidden for me)
  const handleDeleteForMe = () => {
    if (!user?.id || !activePartner || !messageToDelete) return;
    messageService.deleteMessageForMe(user.id, messageToDelete.id, activePartner.id);
    
    // Remove from active scrolling viewport state
    setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  // Handle global delete workflow (hard soft-delete wipe text)
  const handleDeleteForEveryone = async () => {
    if (!messageToDelete) return;
    try {
      await messageService.deleteMessageForEveryone(messageToDelete.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageToDelete.id
            ? { ...m, text: 'Mensagem eliminada', deletedAt: new Date().toISOString() }
            : m
        )
      );
      setShowDeleteModal(false);
      setMessageToDelete(null);
    } catch (err: any) {
      console.error('Wipe for everyone error:', err);
    }
  };

  // Local-cleared conversation boundaries
  const handleClearConversation = async () => {
    if (!user?.id || !activePartner) return;
    try {
      await messageService.clearConversation(user.id, activePartner.id);
      setMessages([]);
      setConversationClearTimestamp(new Date().toISOString());
      setShowClearConfirm(false);
    } catch (err: any) {
      console.error('Clear conversation error:', err);
    }
  };

  // Handle local dynamic reactions logic
  const handleReactMessage = useCallback((msgId: string, emoji: string) => {
    if (!user?.id) return;
    
    const key = `local_reactions_${msgId}`;
    const reactions = JSON.parse(localStorage.getItem(key) || '[]');
    const existingIndex = reactions.findIndex((r: any) => r.userId === user.id && r.emoji === emoji);

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
      messageService.removeReaction(msgId, user.id, emoji);
    } else {
      reactions.push({ id: Math.random().toString(), messageId: msgId, userId: user.id, emoji, userName: user.firstName });
      messageService.addReaction(msgId, user.id, emoji);
    }

    localStorage.setItem(key, JSON.stringify(reactions));

    // Update active state in viewport list
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reactions } : m))
    );
  }, [user]);

  return (
    <div id="chat-shell" className="relative flex h-full min-h-0 overflow-hidden bg-cream-100/95 shadow-[0_20px_50px_rgba(10,46,93,0.08)] dark:bg-ink-950/80 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:rounded-3xl sm:border sm:border-gray-150 sm:dark:border-ink-800/85">
      
      {/* 1. Left Contact Sidebar View */}
      <ChatSidebar
        partners={partners}
        activePartner={activePartner}
        onSelectPartner={setActivePartner}
        onShowNewModal={() => setShowNewModal(true)}
        onShowBulkModal={() => setShowBulkModal(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loading}
        role={role}
        currentUserId={user?.id || ''}
      />

      {/* 2. Main Active Chat Window */}
      <div className={`min-w-0 min-h-0 flex-1 flex flex-col bg-cream-100/30 dark:bg-ink-950/20 ${!activePartner ? 'hidden md:flex' : 'flex'}`}>
        {activePartner ? (
          <>
            <ChatWindow
              messages={messages}
              activePartner={activePartner}
              activeUserId={user?.id || ''}
              theme={DEFAULT_THEME}
              onClearConversation={() => setShowClearConfirm(true)}
              onReplyMessage={setReplyingToMessage}
              onEditMessage={(m) => {
                setEditingMessage(m);
                setInputText(m.text || '');
              }}
              onDeleteMessage={(m) => {
                setMessageToDelete(m);
                setShowDeleteModal(true);
              }}
              onReactMessage={handleReactMessage}
              onBack={() => setActivePartner(null)}
            />

            {/* Bottom active Chat Input */}
            <ChatInput
              inputText={inputText}
              onInputChange={setInputText}
              onSubmit={handleSend}
              editingMessage={editingMessage}
              onCancelEdit={() => {
                setEditingMessage(null);
                setInputText('');
              }}
              replyingToMessage={replyingToMessage}
              onCancelReply={() => setReplyingToMessage(null)}
              partnerName={activePartner.nome_completo}
              onTyping={handleTypingBroadcast}
            />
          </>
        ) : (
          /* Empty StarBorder Card layout view */
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 select-none">
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

      {/* 3. Safe Modal Confirmations */}
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

      {showDeleteModal && messageToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-cream-100 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Apagar Mensagem?</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed truncate">
                "{messageToDelete.text}"
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeleteForMe}
                className="w-full py-2 bg-cream-200 hover:bg-cream-250 dark:bg-ink-850 dark:hover:bg-ink-800 text-neutral-500 dark:text-cream-200 text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors"
              >
                Apagar para mim (Local)
              </button>
              
              {messageToDelete.senderId === user?.id && (
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

      {/* New conversation lists and bulk sender overlay modals */}
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
