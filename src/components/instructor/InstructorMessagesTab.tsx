import React, { useState, useEffect } from 'react';
import ChatShell from '../messaging/ChatShell';
import { messageService, SupabaseAnnouncement } from '../../services/supabase/messageService';
import { useAuth } from '../auth/AuthProvider';
import { Volume2, Megaphone, Loader2 } from 'lucide-react';

export default function InstructorMessagesTab() {
  const { user } = useAuth();
  const [selectedChatType, setSelectedChatType] = useState<'individual' | 'mural'>('individual');
  const [muralAnnouncementText, setMuralAnnouncementText] = useState('');
  const [muralFeed, setMuralFeed] = useState<SupabaseAnnouncement[]>([]);
  const [loadingMural, setLoadingMural] = useState(false);

  const loadMuralAnnouncements = async () => {
    setLoadingMural(true);
    try {
      const ads = await messageService.getAnnouncements('PROFESSOR');
      setMuralFeed(ads);
    } catch (err) {
      console.error('Error fetching mural:', err);
    } finally {
      setLoadingMural(false);
    }
  };

  useEffect(() => {
    if (selectedChatType === 'mural') {
      loadMuralAnnouncements();
    }
  }, [selectedChatType]);

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muralAnnouncementText.trim() || !user?.id) return;

    try {
      await messageService.createAnnouncement({
        author_id: user.id,
        titulo: 'Aviso do Professor',
        mensagem: muralAnnouncementText.trim(),
        destinatarios: 'ALUNO' // Target students
      });

      alert('Mural de Avisos atualizado com sucesso no Supabase!');
      setMuralAnnouncementText('');
      loadMuralAnnouncements();
    } catch (err: any) {
      alert(`Erro ao publicar no mural: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6 text-left relative animate-fade-in">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Selector Title Header */}
      <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-xs">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-600/[0.01] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block mb-0.5">Comunicação e Redes</span>
          <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Canal de Debate e Mensagens Diretas</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Conecte-se com alunos, anuncie diretrizes de workshop ou ordene comunicados.</p>
        </div>

        <div className="flex gap-2 text-3xs font-mono relative z-10 shrink-0">
          <button
            onClick={() => setSelectedChatType('individual')}
            className={`px-3 py-1.5 rounded-lg border-0 uppercase font-bold cursor-pointer transition-all ${
              selectedChatType === 'individual' 
                ? 'bg-gold-600 text-ink-900 shadow-sm shadow-gold-600/20' 
                : 'bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200/60 hover:bg-cream-250 dark:hover:bg-ink-750'
            }`}
          >
            Chats Privados (Tempo Real)
          </button>
          
          <button
            onClick={() => setSelectedChatType('mural')}
            className={`px-3 py-1.5 rounded-lg border-0 uppercase font-bold cursor-pointer transition-all ${
              selectedChatType === 'mural' 
                ? 'bg-gold-600 text-ink-900 shadow-sm shadow-gold-600/20' 
                : 'bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200/60 hover:bg-cream-250 dark:hover:bg-ink-750'
            }`}
          >
            Mural Geral de Avisos
          </button>
        </div>
      </div>

      {selectedChatType === 'individual' ? (
        <ChatShell role="PROFESSOR" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          {/* Announcement formulation row */}
          <div className="lg:col-span-5 bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-4 shadow-xs">
            <div>
              <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm m-0">Afixar Aviso de Aula no Mural</h4>
              <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5 uppercase">PAINEL DE BOLETINS CURRICULARES</p>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Redija o informe para os formandos..."
                value={muralAnnouncementText}
                onChange={(e) => setMuralAnnouncementText(e.target.value)}
                className="w-full p-3 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-gold-600 hover:bg-[#b58b35] text-ink-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase tracking-widest cursor-pointer shadow-sm transition-all"
              >
                Publicar Comunicação no Mural
              </button>
            </form>
          </div>

          {/* Existing lists */}
          <div className="lg:col-span-7 bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left shadow-xs">
            <span className="text-[10px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-black border-b border-gray-150 dark:border-ink-800/60 pb-2">
              Atividade Registada no Mural de Avisos
            </span>
            
            {loadingMural ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
              </div>
            ) : muralFeed.length === 0 ? (
              <p className="text-center font-mono text-neutral-400 dark:text-cream-200/40 text-xs py-10">
                Nenhum aviso registado no mural de avisos.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto w-full pr-1">
                {muralFeed.map((feedItem) => (
                  <div key={feedItem.id} className="p-4 bg-cream-200/50 dark:bg-ink-800/40 border border-gray-150 dark:border-ink-800/60 rounded-2xl text-left space-y-1.5 hover:border-amber-250 dark:hover:border-gold-600/30 transition-all">
                    <div className="flex justify-between items-center text-[8px] font-mono font-bold text-gold-600">
                      <span className="uppercase">INFORMATIVO GERAL</span>
                      <span className="text-neutral-400 dark:text-cream-200/40 font-semibold">
                        {new Date(feedItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-cream-100 font-sans leading-relaxed m-0">{feedItem.mensagem}</p>
                    <span className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/40 font-semibold">
                      ID do Autor: {feedItem.author_id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
