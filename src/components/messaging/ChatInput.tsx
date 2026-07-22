import React, { useEffect, useRef } from 'react';
import { Check, Send, X } from 'lucide-react';
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
  onTyping,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage || replyingToMessage) inputRef.current?.focus();
  }, [editingMessage, replyingToMessage]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }, [inputText]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event.target.value);
    onTyping();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputText.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <div className="shrink-0 border-t border-gray-150 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95 sm:px-4">
      {replyingToMessage && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border-l-4 border-gold-600 bg-amber-50/70 px-3 py-2 text-left dark:bg-gold-600/10">
          <div className="min-w-0">
            <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gold-600">A responder a {partnerName}</span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-cream-200/75">{replyingToMessage.text}</span>
          </div>
          <button type="button" onClick={onCancelReply} aria-label="Cancelar resposta" className="rounded-full border-0 bg-transparent p-1 text-neutral-400 hover:bg-white hover:text-rose-500 dark:hover:bg-ink-800">
            <X size={16} />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border-l-4 border-blue-500 bg-blue-50/70 px-3 py-2 text-left dark:bg-blue-950/20">
          <div className="min-w-0">
            <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-blue-600">A editar mensagem</span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-cream-200/75">{editingMessage.text}</span>
          </div>
          <button type="button" onClick={onCancelEdit} aria-label="Cancelar edição" className="rounded-full border-0 bg-transparent p-1 text-neutral-400 hover:bg-white hover:text-rose-500 dark:hover:bg-ink-800">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <label className="sr-only" htmlFor="chat-message-input">Mensagem</label>
        <textarea
          id="chat-message-input"
          ref={inputRef}
          rows={1}
          required
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? 'Edite a sua mensagem…' : 'Escreva uma mensagem…'}
          className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-250 bg-cream-200 px-4 py-3 text-sm leading-5 text-ink-900 outline-none transition focus:border-gold-600 focus:ring-4 focus:ring-gold-600/10 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label={editingMessage ? 'Guardar edição' : 'Enviar mensagem'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-600 to-[#E2B755] text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-45"
        >
          {editingMessage ? <Check size={18} /> : <Send size={18} />}
        </button>
      </form>
      <p className="hidden px-1 pt-1.5 text-[10px] text-neutral-400 sm:block">Enter para enviar · Shift + Enter para nova linha</p>
    </div>
  );
};
