import React, { useState } from 'react';
import { Search, X, User } from 'lucide-react';
import { motion } from 'motion/react';

interface Contact {
  id: string;
  email: string;
  nome_completo: string;
  role: string;
  foto_perfil?: string;
}

interface NewConversationModalProps {
  contacts: Contact[];
  onClose: () => void;
  onSelect: (contact: Contact) => void;
}

export default function NewConversationModal({ contacts, onClose, onSelect }: NewConversationModalProps) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(c =>
    c.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="new-conv-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-cream-100 dark:bg-ink-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden border border-cream-200 dark:border-ink-800 flex flex-col max-h-[85vh]"
      >
        <div className="p-5 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-200 dark:bg-ink-800">
          <h3 className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-lg">Nova Conversa</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cream-100 dark:hover:bg-ink-900 transition-colors border-0 cursor-pointer text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-cream-200 dark:border-ink-800 bg-cream-100 dark:bg-ink-900">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar contacto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-cream-200 dark:border-slate-700 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition-all bg-cream-200 dark:bg-ink-800 text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-cream-100 dark:bg-ink-900 divide-y divide-cream-200/50 dark:divide-ink-800/50">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-neutral-400 py-8">Nenhum contacto encontrado.</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full flex items-center gap-3 p-3 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-xl transition-all text-left border-0 cursor-pointer"
              >
                {c.foto_perfil ? (
                  <img src={c.foto_perfil} alt={c.nome_completo} className="w-10 h-10 rounded-full object-cover border border-cream-200 dark:border-ink-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cream-200 dark:bg-ink-800 flex items-center justify-center text-gold-600 border border-gold-600/20 font-bold">
                    {c.nome_completo.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-ink-900 dark:text-cream-100 leading-snug">{c.nome_completo}</h4>
                  <p className="text-xs text-neutral-400 leading-none mt-0.5 capitalize">{c.role.toLowerCase()}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
