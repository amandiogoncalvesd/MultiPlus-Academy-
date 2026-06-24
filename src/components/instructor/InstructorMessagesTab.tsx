import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Clock, 
  Search, 
  PlusCircle, 
  Volume2, 
  HelpCircle,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import { User, Course } from '../../types';

interface InstructorMessagesTabProps {
  students: User[];
  courses: Course[];
}

export default function InstructorMessagesTab({
  students = [],
  courses = []
}: InstructorMessagesTabProps) {
  const [selectedChatType, setSelectedChatType] = useState<'individual' | 'mural'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('per_student');

  // Input fields state
  const [composeText, setComposeText] = useState('');
  const [muralAnnouncementText, setMuralAnnouncementText] = useState('');

  // Sample chat threads for simulating real conversations
  const [conversationsDB, setConversationsDB] = useState<Record<string, { sender: 'instructor' | 'student'; text: string; time: string }[]>>({
    'per_student': [
      { sender: 'student', text: 'Boa tarde Dr(a). Esmeralda. Têm alguma recomendação sobre a bibliografia de arbitragem nacional do Módulo 3?', time: '14:22' },
      { sender: 'instructor', text: 'Sim António! Recomendo que visualizem a Lei nº 16/03 sobre Arbitragem Voluntária no Diário da República que disponibilizei na Biblioteca.', time: '14:35' },
      { sender: 'student', text: 'Excelente, já localizei na pasta de Modelos. Irei ler os artigos sobre cláusula compromissória.', time: '14:38' }
    ],
    'user_temp_1': [
      { sender: 'instructor', text: 'Prezada Isabel, gostaria de orientá-la a concluir as aulas gravadas do Módulo I.', time: 'Ontem' },
      { sender: 'student', text: 'Muito obrigada, professora. Irei pôr as lições em dia este sábado sem falta!', time: 'Ontem' }
    ]
  });

  const [muralFeed, setMuralFeed] = useState([
    { id: 1, author: 'Prof. Esmeralda Bruno', content: 'Aviso: Workshop presencial no sábado das 09:00 às 13:00 na nossa sala de oratória no Huambo. Levem os rascunhos impressos.', date: 'Há 5 horas', category: 'Huambo Presencial' },
    { id: 2, author: 'Diretoria Executiva', content: 'As revisões automáticas de transição de módulo via Cloudinary já estão indexadas.', date: 'Há 1 dia', category: 'Atualizações' }
  ]);

  const activeChat = conversationsDB[selectedStudentId] || [];
  const currentStudentObj = students.find(s => s.id === selectedStudentId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim()) return;

    const formattedTime = new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
    const userMsg = composeText;

    // Append Instructor message immediately
    const updatedThread = [
      ...activeChat,
      { sender: 'instructor' as const, text: userMsg, time: formattedTime }
    ];

    setConversationsDB(prev => ({
      ...prev,
      [selectedStudentId]: updatedThread
    }));

    setComposeText('');

    // Simulate reactive, automatic student feedback response after 1.5 seconds!
    setTimeout(() => {
      let automatedResponse = 'Recebido, professora! Irei analisar as suas anotações com toda a atenção.';
      if (userMsg.toLowerCase().includes('exame') || userMsg.toLowerCase().includes('nota') || userMsg.toLowerCase().includes('prova')) {
        automatedResponse = 'Obrigado pelo aviso sobre as avaliações de exames de oratória jurídica. Submeti no prazo regulado!';
      } else if (userMsg.toLowerCase().includes('certificado') || userMsg.toLowerCase().includes('diploma')) {
        automatedResponse = 'Agradeço imensamente a outorga do certificado! Já o vejo no meu painel pronto para download.';
      } else if (userMsg.toLowerCase().includes('ola') || userMsg.toLowerCase().includes('boas') || userMsg.toLowerCase().includes('como')) {
        automatedResponse = 'Olá professora Esmeralda! Tudo ótimo. Como posso ajudar com os aspetos contratuais do Mês 2?';
      }

      setConversationsDB(prev => ({
        ...prev,
        [selectedStudentId]: [
          ...(prev[selectedStudentId] || []),
          { sender: 'student' as const, text: automatedResponse, time: formattedTime }
        ]
      }));
    }, 1500);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!muralAnnouncementText.trim()) return;

    setMuralFeed([
      {
        id: Date.now(),
        author: 'Prof. Esmeralda Bruno',
        content: muralAnnouncementText,
        date: 'Agora mesmo',
        category: 'Informativo Geral'
      },
      ...muralFeed
    ]);

    alert('Mural atualizado com êxito! Todos os formandos ativos foram alertados por correio eletrónico e push notification.');
    setMuralAnnouncementText('');
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
            Chats Privados (Simulação Ativa)
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* VIEW 1: PRIVATE CONVERSATION BUBBLES */}
        {selectedChatType === 'individual' && (
          <>
            {/* Student Side Contact List */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-gray-150 space-y-4">
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold border-b border-gray-100 pb-2">Seleccione o Conversador</span>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedStudentId === student.id
                        ? 'bg-[#0A2E5D]/5 border-[#C89B3C] text-[#0A2E5D]'
                        : 'bg-transparent border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150'}
                      alt={student.firstName}
                      className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                    />
                    <div className="truncate text-left">
                      <span className="font-serif font-black text-xs block leading-tight">Dr. {student.firstName} {student.lastName}</span>
                      <span className="text-[9px] font-mono text-gray-400 block mt-0.5 truncate max-w-[155px]">{student.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Flow Area */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col justify-between min-h-[400px]">
              
              {/* Header Converser */}
              <div className="border-b border-gray-100 pb-3 flex items-center gap-3">
                <img
                  src={currentStudentObj?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150'}
                  alt={currentStudentObj?.firstName || 'Formando'}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100"
                />
                <div>
                  <h4 className="font-serif font-black text-[#0A2E5D] text-sm m-0 leading-tight">
                    Conversação Síncrona com Dr. {currentStudentObj?.firstName} {currentStudentObj?.lastName}
                  </h4>
                  <span className="text-[9px] font-mono text-emerald-600 uppercase font-bold tracking-wider block mt-1">
                    ● FORMAÇÃO ATIVA LIGADO ao LMS
                  </span>
                </div>
              </div>

              {/* Chat history bubbles list */}
              <div className="flex-grow my-4 space-y-3 max-h-72 overflow-y-auto p-2 bg-gray-50/50 rounded-2xl border border-gray-105 shadow-inner">
                {activeChat.length === 0 ? (
                  <p className="text-center font-mono text-gray-400 text-xs py-10">
                    Nenhuma mensagem anterior registada. Inicie o diálogo de instrução contratual!
                  </p>
                ) : (
                  activeChat.map((msg, idx) => {
                    const isInstructor = msg.sender === 'instructor';
                    return (
                      <div 
                        key={idx}
                        className={`flex flex-col max-w-[75%] gap-1 select-text ${
                          isInstructor ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'
                        }`}
                      >
                        <span className="text-[7.5px] font-mono text-gray-400 font-semibold">{isInstructor ? 'A Minha Resposta' : 'Dr. Aluno'} • {msg.time}</span>
                        <div 
                          className={`p-3 rounded-2xl text-xs leading-normal ${
                            isInstructor
                              ? 'bg-[#0A2E5D] text-white rounded-tr-none'
                              : 'bg-white text-gray-800 border border-gray-150 rounded-tl-none shadow-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composition footer with responsive submission */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-gray-100">
                <input
                  type="text"
                  required
                  placeholder="Escreva orientação ou tire dúvidas académicas (Ex: Veja o modelo PDF atualizado)..."
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  className="flex-grow p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C89B3C] text-slate-800"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-[#0A2E5D] hover:bg-[#C89B3C] text-white hover:text-slate-900 border-0 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 shadow"
                >
                  <Send size={15} />
                </button>
              </form>

            </div>
          </>
        )}

        {/* VIEW 2: MURAL DE AVISOS */}
        {selectedChatType === 'mural' && (
          <>
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
                  placeholder="Redija o informe (Ex: A aula síncrona de terça foi reprogramada para quarta às 19h)..."
                  value={muralAnnouncementText}
                  onChange={(e) => setMuralAnnouncementText(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl text-slate-800"
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
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-black border-b border-gray-100 pb-2">Atividade Registada no Mural de Avisos</span>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {muralFeed.map((feedItem) => (
                  <div key={feedItem.id} className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl text-left space-y-1.5 hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-center text-[8px] font-mono font-bold text-[#C89B3C]">
                      <span className="uppercase">{feedItem.category}</span>
                      <span className="text-gray-450 font-semibold">{feedItem.date}</span>
                    </div>
                    <p className="text-xs text-gray-800 font-sans leading-relaxed m-0">{feedItem.content}</p>
                    <span className="block text-[8px] font-mono text-gray-400 font-semibold">Emitido por: {feedItem.author}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
