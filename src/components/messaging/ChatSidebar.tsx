import React from 'react';
import { MessageSquare, Megaphone, Plus, Search, Loader2 } from 'lucide-react';
import { ChatPartner } from '../../types/chat.types';

interface ChatSidebarProps {
  partners: ChatPartner[];
  activePartner: ChatPartner | null;
  onSelectPartner: (partner: ChatPartner) => void;
  onShowNewModal: () => void;
  onShowBulkModal: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  loading: boolean;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  currentUserId: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  partners,
  activePartner,
  onSelectPartner,
  onShowNewModal,
  onShowBulkModal,
  searchQuery,
  onSearchChange,
  loading,
  role,
  currentUserId
}) => {
  const filtered = partners.filter(p =>
    p.nome_completo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-0 w-full md:w-96 md:max-w-[42%] border-r border-gray-150 dark:border-ink-800 flex flex-col h-full bg-cream-100/40 dark:bg-ink-900/40 relative ${activePartner ? 'hidden md:flex' : 'flex'}`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/30 to-transparent pointer-events-none" />
      
      {/* Sidebar Header with controls */}
      <div className="p-4 border-b border-gray-150 dark:border-ink-800 bg-cream-100/80 dark:bg-ink-900 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold-600" />
            Mensagens
          </h3>
          <div className="flex gap-1.5">
            {role === 'ADMIN' && (
              <button
                onClick={onShowBulkModal}
                title="Envio em massa" aria-label="Abrir envio em massa"
                className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-ink-800 text-gold-600 transition-colors border border-gold-600/20 bg-transparent cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onShowNewModal}
              className="p-1.5 rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-md hover:scale-105 text-white transition-all border-0 cursor-pointer flex items-center justify-center"
              title="Nova Conversa" aria-label="Iniciar nova conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Pesquisar conversa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-250 dark:border-ink-850 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 bg-cream-200 dark:bg-ink-950/40 text-ink-900 dark:text-cream-100 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Partners List container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
            <span className="text-xs">A carregar conversas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">Nenhuma conversa ativa.</p>
            <button
              onClick={onShowNewModal}
              className="text-xs text-gold-600 font-semibold hover:underline mt-2 flex items-center gap-1 mx-auto bg-transparent border-0 cursor-pointer"
            >
              Iniciar uma conversa
            </button>
          </div>
        ) : (
          filtered.map((p) => {
            const isSelected = activePartner?.id === p.id;
            const isOnline = p.status === 'ONLINE' || p.status === 'TYPING';

            return (
              <button
                key={p.id}
                onClick={() => onSelectPartner(p)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left border-0 cursor-pointer relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-gold-600 to-[#E2B755] text-white shadow-md font-bold'
                    : 'hover:bg-cream-200/80 dark:hover:bg-ink-800 bg-cream-150/40 dark:bg-ink-900/20 border border-gray-150/40 dark:border-ink-800/40 text-ink-900 dark:text-cream-100'
                }`}
              >
                {/* Avatar with Status Circle Indicator */}
                <div className="relative shrink-0">
                  {p.foto_perfil ? (
                    <img
                      src={p.foto_perfil}
                      alt={p.nome_completo}
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border text-sm shadow-xs ${
                        isSelected
                          ? 'bg-white/20 border-white/45 text-white'
                          : 'bg-cream-200 dark:bg-ink-850 border-gold-600/20 text-gold-600'
                      }`}
                    >
                      {p.nome_completo.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Presence indicator pill */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-ink-900 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold truncate leading-none mb-1">
                      {p.nome_completo}
                    </h4>
                    {p.lastMessage && (
                      <span
                        className={`text-[10px] font-mono ${
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
                    {p.status === 'TYPING' ? (
                      <span className="text-emerald-500 dark:text-gold-400 font-bold animate-pulse">A escrever...</span>
                    ) : p.lastMessage ? (
                      p.lastMessage.deleted_at ? (
                        <span className="italic opacity-60">🚫 Mensagem eliminada</span>
                      ) : (
                        p.lastMessage.texto
                      )
                    ) : (
                      'Comece a conversar!'
                    )}
                  </p>
                </div>

                {/* Unread badge count if any */}
                {p.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 animate-bounce">
                    {p.unreadCount}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
