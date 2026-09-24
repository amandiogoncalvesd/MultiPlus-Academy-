import React, { useEffect, useRef, useState } from 'react';
import { Check, FileText, Paperclip, Send, Smile, X } from 'lucide-react';
import { ChatMessage } from '../../types/chat.types';

interface ChatInputProps {
  inputText: string;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent, attachments?: File[]) => void;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  editingMessage: ChatMessage | null;
  onCancelEdit: () => void;
  replyingToMessage: ChatMessage | null;
  onCancelReply: () => void;
  partnerName: string;
  onTyping: () => void;
}

const QUICK_EMOJIS = ['👍', '🙏', '✅', '📚', '🤝', '🎉'];
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onInputChange,
  onSubmit,
  attachments,
  onAttachmentsChange,
  editingMessage,
  onCancelEdit,
  replyingToMessage,
  onCancelReply,
  partnerName,
  onTyping,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (editingMessage || replyingToMessage) inputRef.current?.focus();
  }, [editingMessage, replyingToMessage]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }, [inputText]);

  useEffect(() => {
    if (!emojiOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setEmojiOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [emojiOpen]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event.target.value);
    onTyping();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputText.trim() || attachments.length) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setAttachmentError(`“${file.name}” excede 8 MB e não foi anexado.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) {
      onAttachmentsChange([...attachments, ...accepted].slice(0, 5));
      setAttachmentError('');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    onSubmit(event, attachments);
    setEmojiOpen(false);
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

      {/* Pré-visualização de anexos */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2" aria-label="Anexos selecionados">
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative flex items-center gap-2 rounded-xl border border-gray-250 bg-cream-200 px-2 py-1.5 dark:border-ink-800 dark:bg-ink-950">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="" className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gold-600 dark:bg-ink-900"><FileText size={16} /></span>
              )}
              <span className="max-w-32">
                <span className="block truncate text-[11px] font-semibold text-ink-900 dark:text-cream-100">{file.name}</span>
                <span className="block text-[9px] text-neutral-400">{formatSize(file.size)}</span>
              </span>
              <button type="button" onClick={() => removeFile(index)} aria-label={`Remover anexo ${file.name}`} className="rounded-full p-1 text-neutral-400 hover:bg-white hover:text-rose-500 dark:hover:bg-ink-800">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachmentError && <p className="mb-2 text-[10px] font-semibold text-rose-500" role="alert">{attachmentError}</p>}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOpen((open) => !open)}
            aria-label="Inserir emoji"
            aria-expanded={emojiOpen}
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-neutral-400 transition hover:bg-cream-200 hover:text-gold-600 dark:hover:bg-ink-800"
          >
            <Smile size={19} />
          </button>
          {emojiOpen && (
            <div role="menu" aria-label="Emojis rápidos" className="absolute bottom-12 left-0 z-30 flex gap-1 rounded-2xl border border-gray-250 bg-white p-2 shadow-xl dark:border-ink-800 dark:bg-ink-900">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => { onInputChange(`${inputText}${emoji}`); onTyping(); inputRef.current?.focus(); }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-cream-200 dark:hover:bg-ink-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden" onChange={(event) => addFiles(event.target.files)} aria-hidden="true" tabIndex={-1} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Anexar ficheiro"
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-neutral-400 transition hover:bg-cream-200 hover:text-gold-600 dark:hover:bg-ink-800"
        >
          <Paperclip size={19} />
        </button>

        <label className="sr-only" htmlFor="chat-message-input">Mensagem</label>
        <textarea
          id="chat-message-input"
          ref={inputRef}
          rows={1}
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? 'Edite a sua mensagem…' : 'Escreva uma mensagem…'}
          className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-250 bg-cream-200 px-4 py-3 text-sm leading-5 text-ink-900 outline-none transition focus:border-gold-600 focus:ring-4 focus:ring-gold-600/10 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100"
        />
        <button
          type="submit"
          disabled={!inputText.trim() && !attachments.length}
          aria-label={editingMessage ? 'Guardar edição' : 'Enviar mensagem'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-600 to-[#CA8A04] text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-45"
        >
          {editingMessage ? <Check size={18} /> : <Send size={18} />}
        </button>
      </form>
      <p className="hidden px-1 pt-1.5 text-[10px] text-neutral-400 sm:block">Enter para enviar · Shift + Enter para nova linha · anexos até 8 MB</p>
    </div>
  );
};
