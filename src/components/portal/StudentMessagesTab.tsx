import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, User } from '../../types';
import { 
  Mail, 
  Send, 
  User as UserIcon, 
  Bell, 
  Inbox, 
  Paperclip, 
  Check, 
  CheckCircle,
  MessageSquare,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface StudentMessagesTabProps {
  currentUser: User | null;
}

export default function StudentMessagesTab({ currentUser }: StudentMessagesTabProps) {
  const studentName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Aluno';
  
  const [folder, setFolder] = useState<'all' | 'academia' | 'teacher' | 'system'>('teacher');
  const [selectedMessageId, setSelectedMessageId] = useState<string>('msg_1');
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      senderName: 'Prof. Esmeralda Bruno Sumbelelo',
      recipientName: studentName,
      subject: 'Bem-vindo(a) ao Inglês Jurídico MultiPlus 2026',
      content: 'Estimado(a) formando(a), congratulo o seu engajamento no nosso curso de elite. Estou inteiramente disponível neste canal direto de tutoria para responder às suas dúvidas sobre drafting terminológico de contratos internacionais de Petróleo, Gás ou Joint Ventures em Angola.',
      createdAt: '2026-06-02 10:15',
      isRead: true
    },
    {
      id: 'msg_academy_1',
      senderName: 'Secretaria Académica • MultiPlus',
      recipientName: studentName,
      subject: 'Regulamento e Guia Prático para Exame CEFR',
      content: 'Informamos a todos os alunos inscritos que as datas limite para o teste de proficiência oral foram publicadas no painel do Calendário. Certifiquem-se de submeter todas as tarefas em atraso antes do dia 30 do corrente mês para obtenção do certificado digital autenticado.',
      createdAt: '2026-06-05 08:30',
      isRead: false
    },
    {
      id: 'msg_sys_1',
      senderName: 'Notificação de Sistema',
      recipientName: studentName,
      subject: 'Dispositivo Seguro Registado com Sucesso',
      content: 'O seu dispositivo IP 192.168.100.41 (Huambo, Angola) foi validado no portal LMS com integridade criptográfica standard para reprodução das videoaulas.',
      createdAt: '2026-06-07 00:01',
      isRead: true
    }
  ]);

  const filteredMessages = messages.filter(m => {
    if (folder === 'academia') return m.senderName.includes('Secretaria');
    if (folder === 'teacher') return m.senderName.includes('Esmeralda');
    if (folder === 'system') return m.senderName.includes('Sistema');
    return true; // all
  });

  const activeMessage = messages.find(m => m.id === selectedMessageId) || messages[0];

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderName: studentName,
      recipientName: 'Prof. Esmeralda Bruno Sumbelelo',
      subject: 'Re: Dúvida de Estudo',
      content: draft.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isRead: true,
      isReply: true
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setDraft('');
    setIsTyping(true);

    // Simulate smart, domain-specific reply based on keyword detection
    setTimeout(() => {
      setIsTyping(false);
      let replyText = `Prezado(a) colega, agradeço a reflexão. Analisei a sua colocação. Sugiro focar na redação das cláusulas de exoneração de responsabilidade civil ("Limitation of Liability") do Módulo II, comparando a eficácia delas sob o Direito Civil Angolano e o Common Law inglês.`;
      
      const query = newMsg.content.toLowerCase();
      if (query.includes('boilerplate') || query.includes('cláusula') || query.includes('clause')) {
        replyText = `Excelente questão sobre Cláusulas "Boilerplate"! Sob a lei angolana, em especial a Lei das Cláusulas Contratuais Gerais, ambiguidades na minuta ("draft") são interpretadas contra a entidade predisponente. No Common Law britânico, aplica-se a regra "Contra Proferentem". É imperativo redigir com vocabulário inequívoco.`;
      } else if (query.includes('common law') || query.includes('civil law') || query.includes('diferença')) {
        replyText = `Ótima sensibilidade técnica! O Common Law apoia-se firmemente em precedentes judiciais (Stare Decisis), enquanto o Civil Law (vigente em Angola) tem como pilar a codificação da lei (Código Civil). Em arbitragens de Petróleo e Gás, é comum que o contrato adote o Common Law como lei reguladora, mas as operações físicas obedeçam às leis imperativas de Angola.`;
      } else if (query.includes('certificado') || query.includes('exame') || query.includes('avaliação')) {
        replyText = `Sobre a avaliação final, ela consiste na elaboração técnica de uma minuta de contrato em inglês e um "Oral Advocacy Test" de 15 minutos via Google Meet para testar a sua fluência oratória. Assim que as notas de moderação forem inseridas, o link de download do certificado surgirá no painel.`;
      } else if (query.includes('olá') || query.includes('bom dia') || query.includes('boa tarde')) {
        replyText = `Olá! Espero que esteja a desfrutar da nossa plataforma. Como vão os seus estudos das videoaulas de inglês jurídico? Qualquer dúvida de pronúncia ou vocabulário técnico, basta registar aqui!`;
      }

      const reply: Message = {
        id: 'reply_' + Date.now(),
        senderName: 'Prof. Esmeralda Bruno Sumbelelo',
        recipientName: studentName,
        subject: 'Re: Dúvida de Estudo',
        content: replyText,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        isRead: false
      };
      
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
      
      {/* Messages Left Sidebar */}
      <div className="md:col-span-3 bg-gray-50 border-r border-gray-150 p-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="text-left">
            <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Canais Académicos</span>
            <h4 className="text-sm font-serif font-bold text-[#0A2E5D] m-0">Mensagens</h4>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => { setFolder('all'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                folder === 'all' ? 'bg-[#0A2E5D] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Inbox size={14} />
                Todas as Mensagens
              </span>
              <span className="text-[10px] font-mono bg-white/20 text-[#0A2E5D] font-bold px-1.5 py-0.5 rounded">
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => { setFolder('teacher'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                folder === 'teacher' ? 'bg-[#0A2E5D] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={14} />
                Canal da Professora
              </span>
              <span className="text-[10px] font-mono bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                {messages.filter(m => m.senderName.includes('Esmeralda')).length}
              </span>
            </button>

            <button
              onClick={() => { setFolder('academia'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                folder === 'academia' ? 'bg-[#0A2E5D] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bell size={14} />
                Secretaria Letiva
              </span>
            </button>

            <button
              onClick={() => { setFolder('system'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                folder === 'system' ? 'bg-[#0A2E5D] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldAlert size={14} />
                Alertas do Sistema
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-150 text-[10px] leading-relaxed text-gray-500">
          <p className="m-0">💡 <strong>Dica jurídica:</strong> Pergunte à Professora sobre diferenças de Clausulados ou Regulações no Huambo em inglês.</p>
        </div>
      </div>

      {/* Messages Middle Column: Thread List */}
      <div className="md:col-span-4 border-r border-gray-150 flex flex-col items-stretch max-h-[500px] overflow-y-auto">
        <div className="p-3 bg-gray-100 border-b border-gray-150 text-left">
          <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">CAIXA DE ENTRADA</span>
        </div>

        <div className="divide-y divide-gray-100 flex-1">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-mono">
              Sem correspondência nesta pasta.
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`w-full text-left p-4 hover:bg-gray-50/50 block transition-all relative ${
                  selectedMessageId === msg.id ? 'bg-[#0A2E5D]/5 border-l-4 border-l-[#C89B3C]' : ''
                }`}
              >
                {!msg.isRead && selectedMessageId !== msg.id && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
                )}
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-800 font-serif truncate max-w-[130px] block">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 block">{msg.createdAt}</span>
                </div>
                <p className="text-xs font-semibold text-[#01142e] truncate mt-1 mb-0">{msg.subject}</p>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 m-0">{msg.content}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Right Column: Reading and Reply Pane */}
      <div className="md:col-span-5 p-6 flex flex-col justify-between max-h-[500px] overflow-hidden">
        {activeMessage ? (
          <div className="flex flex-col h-full overflow-hidden text-left">
            <div className="border-b border-gray-100 pb-4 space-y-2">
              <span className="text-[9px] font-mono text-[#C89B3C] uppercase tracking-widest block font-bold">
                Leitor de Correspondência Académica
              </span>
              <h3 className="text-base font-serif font-black text-[#0A2E5D] leading-snug m-0">
                {activeMessage.subject}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-gray-200 text-[#0A2E5D] text-[10px] rounded-full flex items-center justify-center font-bold uppercase">
                    {activeMessage.senderName[0]}
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">{activeMessage.senderName}</span>
                    <span className="text-gray-400 ml-1">para mim</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono">{activeMessage.createdAt}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <p className="text-xs sm:text-sm text-gray-700 font-sans leading-relaxed m-0 whitespace-pre-wrap">
                {activeMessage.content}
              </p>

              {/* Dynamic typing bubble mockup */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center gap-2 max-w-[200px]"
                  >
                    <Loader2 size={12} className="text-[#C89B3C] animate-spin" />
                    <span className="text-[10px] font-mono text-amber-800">Prof. Esmeralda está a digitar rascunho...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Instant response footer input */}
            {activeMessage.senderName.includes('Esmeralda') && (
              <form onSubmit={handleSend} className="border-t border-gray-150 pt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva sua pergunta ou nota jurídica para reações síncronas..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-all text-[#1C1C1C]"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !draft.trim()}
                  className="p-2 bg-[#C89B3C] hover:bg-[#b08530] text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  aria-label="Enviar"
                >
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <Mail size={32} className="text-gray-300 mb-2" />
            <p className="text-xs font-mono">Selecione uma mensagem para ler.</p>
          </div>
        )}
      </div>

    </div>
  );
}
