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
    <div className="space-y-6 text-left">
      {/* Selector Title Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-0.5">Comunicação e Redes</span>
          <h3 className="text-lg font-serif font-black text-[#0A2E5D] m-0">Canal de Debate e Mensagens Diretas</h3>
          <p className="text-xs text-gray-400 mt-0.5">Conecte-se com alunos, anuncie diretrizes de workshop ou ordene comunicados.</p>
        </div>

        <div className="flex gap-2 text-3xs font-mono">
          <button
            onClick={() => setSelectedChatType('individual')}
            className={`px-3 py-1.5 rounded-lg border uppercase font-bold cursor-pointer transition-all ${
              selectedChatType === 'individual' ? 'bg-[#0A2E5D] text-white border-[#0A2E5D]' : 'bg-transparent text-gray-550 hover:bg-gray-50'
            }`}
          >
            Chats Privados (Tempo Real)
          </button>
          
          <button
            onClick={() => setSelectedChatType('mural')}
            className={`px-3 py-1.5 rounded-lg border uppercase font-bold cursor-pointer transition-all ${
              selectedChatType === 'mural' ? 'bg-[#0A2E5D] text-white border-[#0A2E5D]' : 'bg-transparent text-gray-550 hover:bg-gray-50'
            }`}
          >
            Mural Geral de Avisos
          </button>
        </div>
      </div>

      {selectedChatType === 'individual' ? (
        <ChatShell role="PROFESSOR" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Announcement formulation row */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-4">
            <div>
              <h4 className="font-serif font-black text-[#0A2E5D] text-sm m-0">Afixar Aviso de Aula no Mural</h4>
              <p className="text-2xs text-gray-400 font-mono mt-0.5 uppercase">PAINEL DE BULLETINS CURRICULARES</p>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Redija o informe para os formandos..."
                value={muralAnnouncementText}
                onChange={(e) => setMuralAnnouncementText(e.target.value)}
                className="w-full p-3 text-xs bg-gray-55 border border-gray-200 rounded-xl text-slate-800"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase tracking-widest cursor-pointer shadow transition-all"
              >
                Publicar Comunicação no Mural
              </button>
            </form>
          </div>

          {/* Existing lists */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-left">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-black border-b border-gray-100 pb-2">
              Atividade Registada no Mural de Avisos
            </span>
            
            {loadingMural ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : muralFeed.length === 0 ? (
              <p className="text-center font-mono text-gray-400 text-xs py-10">
                Nenhum aviso registado no mural de avisos.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto w-full">
                {muralFeed.map((feedItem) => (
                  <div key={feedItem.id} className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl text-left space-y-1.5 hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-center text-[8px] font-mono font-bold text-[#C89B3C]">
                      <span className="uppercase">INFORMATIVO GERAL</span>
                      <span className="text-gray-450 font-semibold">
                        {new Date(feedItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-sans leading-relaxed m-0">{feedItem.mensagem}</p>
                    <span className="block text-[8px] font-mono text-gray-400 font-semibold">
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
