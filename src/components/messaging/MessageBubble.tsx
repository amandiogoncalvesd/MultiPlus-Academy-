import React, { useState } from 'react';
import { 
  Reply, Edit2, Trash2, Check, CheckCheck, Clock, AlertCircle, Smile
} from 'lucide-react';
import { ChatMessage, ChatTheme } from '../../types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  theme: ChatTheme;
  activeUserId: string;
  partnerName: string;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onReact: (msgId: string, emoji: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isMe,
  theme,
  activeUserId,
  partnerName,
  onReply,
  onEdit,
  onDelete,
  onReact
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Status checkmark renderer
  const renderStatus = () => {
    if (message.status === 'SENDING') {
      return <Clock size={11} className="animate-spin text-neutral-400" />;
    }
    if (message.status === 'FAILED') {
      return <AlertCircle size={11} className="text-rose-500" />;
    }
    if (message.status === 'READ') {
      return <CheckCheck size={12} className="text-amber-500 dark:text-gold-500" />;
    }
    if (message.status === 'DELIVERED') {
      return <CheckCheck size={12} className="text-neutral-400" />;
    }
    return <Check size={12} className="text-neutral-400" />;
  };

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className={`flex w-full mb-3 relative group ${isMe ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReactions(false);
      }}
    >
      {/* Visual background wrapper */}
      <div className={`flex items-end gap-1.5 max-w-[75%] md:max-w-[65%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Actual bubble content */}
        <div
          className={`p-3 rounded-2xl relative shadow-xs border transition-all text-xs text-left ${
            isMe
              ? 'bg-gradient-to-r from-gold-600 to-[#E2B755] dark:from-gold-600/90 dark:to-gold-700/90 text-white rounded-br-none border-gold-600/10'
              : 'bg-cream-200/90 dark:bg-ink-850/95 text-ink-900 dark:text-cream-100 rounded-bl-none border-gray-150 dark:border-ink-800'
          }`}
        >
          {/* Quoted block for Replies */}
          {message.replyTo && (
            <div 
              className={`mb-2 p-2 rounded-lg text-[10px] leading-snug border-l-4 truncate ${
                isMe 
                  ? 'bg-black/15 text-cream-100 border-white/80' 
                  : 'bg-cream-300 dark:bg-ink-950 text-neutral-500 dark:text-cream-200 border-gold-600'
              }`}
            >
              <span className="font-bold block mb-0.5 uppercase text-[8px] tracking-wider">
                {message.replyTo.senderId === activeUserId ? 'Você' : partnerName}
              </span>
              <span className="italic opacity-90 block truncate">
                {message.replyTo.deletedAt ? '🚫 Mensagem eliminada' : message.replyTo.text}
              </span>
            </div>
          )}

          {/* Text block */}
          {message.deletedAt ? (
            <p className="leading-snug italic opacity-60 m-0 flex items-center gap-1">
              🚫 Esta mensagem foi eliminada
            </p>
          ) : (
            <p className="leading-snug break-words whitespace-pre-line m-0 text-xs sm:text-[13px]">
              {message.text}
            </p>
          )}

          {/* Timestamp and status details row */}
          <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-[9px] select-none">
            {message.editedAt && !message.deletedAt && (
              <span className="font-bold uppercase tracking-wider italic">editada</span>
            )}
            <span className="font-mono">{formattedTime}</span>
            {isMe && renderStatus()}
          </div>

          {/* Reaction badges group inside bubble if any exist */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-2 right-2 flex gap-1 bg-white dark:bg-ink-900 border border-gray-150 dark:border-ink-850 px-1.5 py-0.5 rounded-full shadow-xs text-[10px] items-center">
              {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
                <span key={emoji}>{emoji}</span>
              ))}
              <span className="text-[8px] font-bold text-neutral-500 font-mono">
                {message.reactions.length}
              </span>
            </div>
          )}
        </div>

        {/* Hover action bar (Telegram/WhatsApp style) */}
        {!message.deletedAt && isHovered && (
          <div 
            className={`flex items-center gap-1 bg-cream-100 dark:bg-ink-900 border border-gray-200/70 dark:border-ink-800 rounded-xl p-1 shadow-sm shrink-0 select-none animate-fade-in ${
              isMe ? 'mr-1' : 'ml-1'
            }`}
          >
            {/* Quick reaction trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-neutral-400 hover:text-gold-600 transition-colors border-0 cursor-pointer"
                title="Reagir"
              >
                <Smile size={13} />
              </button>

              {showReactions && (
                <div className="absolute bottom-full mb-1 left-0 flex bg-white dark:bg-ink-950 border border-gray-250 dark:border-ink-800 rounded-full p-1 shadow-lg z-20 gap-1 animate-scale-in">
                  {COMMON_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowReactions(false);
                      }}
                      className="hover:scale-125 transition-transform border-0 bg-transparent cursor-pointer p-0.5 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onReply(message)}
              className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-neutral-400 hover:text-gold-600 transition-colors border-0 cursor-pointer"
              title="Responder"
            >
              <Reply size={13} />
            </button>
            
            {isMe && (
              <button
                type="button"
                onClick={() => onEdit(message)}
                className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-neutral-400 hover:text-blue-500 transition-colors border-0 cursor-pointer"
                title="Editar"
              >
                <Edit2 size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(message)}
              className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-lg text-rose-500 hover:text-rose-600 transition-colors border-0 cursor-pointer"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
