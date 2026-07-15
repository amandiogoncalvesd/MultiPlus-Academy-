import React, { useEffect, useRef } from 'react';
import { Send, Check, X } from 'lucide-react';
import { ChatMessage } from '../../types/chat.types';

interface ChatInputProps {
  inputText: string;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  editingMessage: ChatMessage | null;
  onCancelEdit: () => void;
  replyingToMessage: ChatMessage | null;
  onCancelReply: () => void;
  partnerName: string;
  onTyping: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onInputChange,
  onSubmit,
  editingMessage,
  onCancelEdit,
  replyingToMessage,
  onCancelReply,
  partnerName,
  onTyping
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing or replying
  useEffect(() => {
    if (editingMessage || replyingToMessage) {
      inputRef.current?.focus();
    }
  }, [editingMessage, replyingToMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value);
    onTyping();
  };

  return (
    <div className="border-t border-gray-150 dark:border-ink-800/60 bg-cream-100 dark:bg-ink-900 shrink-0 select-none">
      
      {/* Replying Context Banner */}
      {replyingToMessage && (
        <div className="px-5 py-2.5 bg-cream-200 dark:bg-ink-900 border-b border-gray-150 dark:border-ink-850/60 flex items-center justify-between text-xs animate-fade-in text-left border-l-4 border-gold-600">
          <div className="truncate pr-4">
            <span className="font-bold text-gold-600 block text-[9px] uppercase font-mono tracking-wider">
              A responder a {partnerName}
            </span>
            <span className="text-neutral-500 dark:text-cream-200/75 italic text-2xs truncate block mt-0.5">
              {replyingToMessage.text}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full text-neutral-400 hover:text-rose-500 transition-colors bg-transparent border-0 cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editing Context Banner */}
      {editingMessage && (
        <div className="px-5 py-2.5 bg-cream-200 dark:bg-ink-900 border-b border-gray-150 dark:border-ink-850/60 flex items-center justify-between text-xs animate-fade-in text-left border-l-4 border-blue-500">
          <div className="truncate pr-4">
            <span className="font-bold text-blue-500 block text-[9px] uppercase font-mono tracking-wider">
              Modo Edição de Mensagem
            </span>
            <span className="text-neutral-500 dark:text-cream-200/75 italic text-2xs truncate block mt-0.5">
              Antiga: {editingMessage.text}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full text-neutral-400 hover:text-rose-500 transition-colors bg-transparent border-0 cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Form Box */}
      <form onSubmit={onSubmit} className="p-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          required
          value={inputText}
          onChange={handleChange}
          placeholder={editingMessage ? "Edite a sua mensagem..." : "Escreva uma mensagem..."}
          className="flex-1 px-4 py-2.5 bg-cream-200 dark:bg-ink-950 border border-gray-250 dark:border-ink-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition-all text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-lg hover:scale-105 text-white disabled:opacity-50 transition-all shadow-xs border-0 cursor-pointer flex items-center justify-center shrink-0"
        >
          {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
