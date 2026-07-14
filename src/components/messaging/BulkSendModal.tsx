import React, { useState } from 'react';
import { X, Search, Check, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface Contact {
  id: string;
  email: string;
  nome_completo: string;
  role: string;
  foto_perfil?: string;
}

interface BulkSendModalProps {
  contacts: Contact[];
  onClose: () => void;
  onSendBulk: (targetIds: string[], text: string) => Promise<void>;
}

export default function BulkSendModal({ contacts, onClose, onSendBulk }: BulkSendModalProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = contacts.filter(c =>
    c.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c.id));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !message.trim()) return;
    setLoading(true);
    try {
      await onSendBulk(selectedIds, message.trim());
      setMessage('');
      setSelectedIds([]);
      onClose();
    } catch (err: any) {
      alert(`Erro no envio em massa: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="bulk-send-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-cream-100 dark:bg-ink-950 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden border border-gray-250 dark:border-ink-800 flex flex-col max-h-[85vh]"
      >
        <div className="p-5 border-b border-gray-150 dark:border-ink-800 flex items-center justify-between bg-cream-200 dark:bg-ink-900">
          <div>
            <h3 className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-lg">Envio em Massa</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Selecione os destinatários para enviar mensagens personalizadas</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cream-100 dark:hover:bg-ink-950 transition-colors border-0 cursor-pointer text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-950 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-250 dark:border-ink-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 bg-cream-200 dark:bg-ink-900 text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
            />
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-gold-600 hover:text-gold-600/80 hover:bg-cream-200/50 px-3 py-1.5 rounded-full transition-all border border-gold-600/30 bg-transparent cursor-pointer"
          >
            {selectedIds.length === filtered.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-cream-100 dark:bg-ink-950 divide-y divide-gray-200/40 dark:divide-ink-800/45 max-h-[30vh]">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-neutral-400 py-6">Nenhum contacto encontrado.</p>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggleSelect(c.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left mt-1 border border-transparent cursor-pointer ${isSelected ? 'bg-cream-200 dark:bg-ink-900 border-gold-600/20' : 'hover:bg-cream-200 dark:hover:bg-ink-900 bg-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    {c.foto_perfil ? (
                      <img src={c.foto_perfil} alt={c.nome_completo} className="w-9 h-9 rounded-full object-cover border border-gray-150 dark:border-ink-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cream-200 dark:bg-ink-900 flex items-center justify-center text-gold-600 border border-gold-600/20 font-bold text-sm">
                        {c.nome_completo.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-ink-900 dark:text-cream-100 leading-snug">{c.nome_completo}</h4>
                      <p className="text-xs text-neutral-400 leading-none mt-0.5 capitalize">{c.role.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-gold-600 border-gold-600 text-white' : 'border-neutral-400/50 dark:border-slate-700'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-150 dark:border-ink-800 bg-cream-200 dark:bg-ink-900">
          <div className="mb-3 flex justify-between items-center text-xs text-neutral-400 px-1">
            <span>{selectedIds.length} destinatário(s) selecionado(s)</span>
          </div>
          <div className="flex gap-2">
            <textarea
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a mensagem para enviar a todos..."
              className="flex-1 p-3 border border-gray-250 dark:border-slate-750 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 bg-cream-100 dark:bg-ink-950 resize-none text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={selectedIds.length === 0 || !message.trim() || loading}
              className="self-end p-3 rounded-2xl bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-lg hover:scale-105 text-white disabled:opacity-50 transition-all shadow-sm border-0 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
