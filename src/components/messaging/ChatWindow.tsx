import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MessageSquare, Trash } from 'lucide-react';
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
  onBack,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior });
    nearBottomRef.current = true;
    setShowScrollButton(false);
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activePartner.id]);

  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom('smooth');
    else setShowScrollButton(true);
  }, [messages.length]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    nearBottomRef.current = distanceFromBottom < 96;
    setShowScrollButton(!nearBottomRef.current);
  };

  const groups = messages.reduce<Record<string, ChatMessage[]>>((accumulator, message) => {
    const key = new Date(message.createdAt).toDateString();
    (accumulator[key] ||= []).push(message);
    return accumulator;
  }, {});

  const getDayLabel = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isOnline = activePartner.status === 'ONLINE' || activePartner.status === 'TYPING';

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-[#f6f4ef] dark:bg-ink-950" aria-label={`Conversa com ${activePartner.nome_completo}`}>
      <header className="z-10 flex shrink-0 items-center gap-3 border-b border-gray-150 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95 sm:px-4">
        <button onClick={onBack} className="rounded-xl border-0 bg-cream-200 px-2.5 py-2 text-xs font-bold text-gold-600 md:hidden dark:bg-ink-800" aria-label="Voltar à lista de conversas">
          ←
        </button>
        <div className="relative shrink-0">
          {activePartner.foto_perfil ? (
            <img src={activePartner.foto_perfil} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-600/15 font-bold text-gold-600">{activePartner.nome_completo.charAt(0).toUpperCase()}</div>
          )}
          {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900" aria-label="Online" />}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <h2 className="truncate text-sm font-bold text-ink-900 dark:text-cream-100">{activePartner.nome_completo}</h2>
          <p className="mt-0.5 text-[10px] text-neutral-400">{activePartner.status === 'TYPING' ? 'A escrever…' : isOnline ? 'Online' : activePartner.role.toLowerCase()}</p>
        </div>
        <button type="button" onClick={onClearConversation} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[10px] font-mono font-bold uppercase text-rose-600 transition hover:bg-rose-600 hover:text-white dark:border-rose-900/40 dark:bg-rose-950/20" aria-label="Limpar conversa">
          <Trash size={13} /><span className="hidden sm:inline">Limpar</span>
        </button>
      </header>

      <div ref={scrollRef} onScroll={handleScroll} role="log" aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 py-16 text-center text-neutral-400">
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-ink-900"><MessageSquare className="text-gold-600" size={28} /></div>
            <div><p className="text-sm font-semibold text-ink-900 dark:text-cream-100">Comece a conversa</p><p className="mt-1 text-xs">Envie uma mensagem para {activePartner.nome_completo}.</p></div>
          </div>
        ) : Object.entries(groups).map(([day, dayMessages]) => (
          <div key={day} className="mb-4">
            <div className="sticky top-0 z-10 mb-3 flex justify-center py-1"><span className="rounded-full border border-gray-150 bg-white/90 px-3 py-1 text-[10px] font-semibold text-neutral-500 shadow-sm backdrop-blur dark:border-ink-800 dark:bg-ink-900/90">{getDayLabel(day)}</span></div>
            {dayMessages.map((message) => <MessageBubble key={message.id} message={message} isMe={message.senderId === activeUserId} theme={theme} activeUserId={activeUserId} partnerName={activePartner.nome_completo} onReply={onReplyMessage} onEdit={onEditMessage} onDelete={onDeleteMessage} onReact={onReactMessage} />)}
          </div>
        ))}
        {activePartner.status === 'TYPING' && <p className="mb-3 w-fit rounded-2xl bg-white px-3 py-2 text-xs text-neutral-400 shadow-sm dark:bg-ink-900">A escrever…</p>}
      </div>

      {showScrollButton && <button onClick={() => scrollToBottom('smooth')} className="absolute bottom-24 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white shadow-lg transition hover:bg-gold-600" aria-label="Ir para as mensagens mais recentes"><ChevronDown size={19} /></button>}
    </section>
  );
};
