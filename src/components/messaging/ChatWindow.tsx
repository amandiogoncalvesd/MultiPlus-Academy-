import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Trash, ChevronDown } from 'lucide-react';
import { ChatMessage, ChatPartner, ChatTheme } from '../../types/chat.types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  activePartner: ChatPartner;
  activeUserId: string;
  theme: ChatTheme;
  onClearConversation: () => void;
  onReplyMessage: (msg: ChatMessage) => void;
  onEditMessage: (msg: ChatMessage) => void;
  onDeleteMessage: (msg: ChatMessage) => void;
  onReactMessage: (msgId: string, emoji: string) => void;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  activePartner,
  activeUserId,
  theme,
  onClearConversation,
  onReplyMessage,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onBack
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activePartner.id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Handle scroll to toggle the "scroll to bottom" button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const diff = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollBtn(diff > 300);
  };

  // Group messages by day
  const groupMessagesByDay = (msgs: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    msgs.forEach(m => {
      const dateStr = new Date(m.createdAt).toDateString();
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(m);
    });
    return groups;
  };

  const getDayHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const messageGroups = groupMessagesByDay(messages);
  const isOnline = activePartner.status === 'ONLINE' || activePartner.status === 'TYPING';

  return (
    <div className="flex-grow flex flex-col h-full bg-cream-100/30 dark:bg-ink-950/20 relative">
      
      {/* Active Conversation Top Header */}
      <div className="p-4 border-b border-gray-150 dark:border-ink-800/60 flex items-center gap-3 bg-cream-200/40 dark:bg-ink-900/40 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="md:hidden text-xs font-bold text-gold-600 hover:underline mr-1 bg-transparent border-0 cursor-pointer"
        >
          ← Voltar
        </button>

        {/* Profile Avatar inside Golden Frame */}
        <div className="relative shrink-0 select-none">
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
          {isOnline && (
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-ink-900 animate-pulse" />
          )}
        </div>

        <div className="text-left">
          <h4 className="text-sm font-bold text-ink-900 dark:text-cream-100 leading-none mb-1">
            {activePartner.nome_completo}
          </h4>
          <p className="text-[10px] text-neutral-400 leading-none capitalize">
            {activePartner.status === 'TYPING' ? (
              <span className="text-emerald-500 font-bold animate-pulse">A escrever...</span>
            ) : isOnline ? (
              <span className="text-emerald-500 font-semibold">Online</span>
            ) : (
              activePartner.role.toLowerCase()
            )}
          </p>
        </div>

        {/* Clear Conversation trigger */}
        <button
          type="button"
          onClick={onClearConversation}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/10 text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-700 rounded-xl transition-all border border-rose-200/35 dark:border-rose-900/30 text-3xs font-mono font-bold uppercase cursor-pointer"
          title="Limpar Conversa"
        >
          <Trash size={12} />
          <span className="hidden sm:inline">Limpar Conversa</span>
        </button>
      </div>

      {/* Messages Scrolling Grid */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-4 space-y-4 bg-cream-100/10 dark:bg-ink-950/10 relative scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-1.5 select-none py-12">
            <MessageSquare className="w-8 h-8 stroke-[1.2] text-neutral-300" />
            <span className="text-xs">Nenhuma mensagem nesta conversa.</span>
          </div>
        ) : (
          Object.keys(messageGroups).map(dateStr => (
            <div key={dateStr} className="space-y-1">
              
              {/* Sticky day banner header */}
              <div className="flex justify-center sticky top-0 z-10 py-2 select-none">
                <span className="bg-cream-200/85 dark:bg-ink-900/90 text-[10px] font-bold text-neutral-500 dark:text-cream-300 px-3 py-1 rounded-full border border-gray-150/50 dark:border-ink-800/60 shadow-4xs backdrop-blur-xs">
                  {getDayHeader(dateStr)}
                </span>
              </div>

              {/* Day bubbles map */}
              {messageGroups[dateStr].map(m => {
                const isMe = m.senderId === activeUserId;
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={isMe}
                    theme={theme}
                    activeUserId={activeUserId}
                    partnerName={activePartner.nome_completo}
                    onReply={onReplyMessage}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    onReact={onReactMessage}
                  />
                );
              })}
            </div>
          ))
        )}

        {/* Realtime Typing anim circle indicator overlay */}
        {activePartner.status === 'TYPING' && (
          <div className="flex justify-start mb-3 select-none">
            <div className="bg-cream-200/60 dark:bg-ink-850 text-neutral-400 px-3.5 py-2.5 rounded-full rounded-tl-none border border-gray-150 dark:border-ink-800/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Floating scroller bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 p-2 rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] hover:scale-105 transition-all text-white shadow-lg border-0 cursor-pointer flex items-center justify-center animate-bounce z-10"
          title="Scroll para baixo"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
};
