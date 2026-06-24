import { Send, User } from 'lucide-react';

export default function StudentMessagesPage() {
  return (
    <div id="student-messages-root" className="space-y-8 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Dúvidas e Mensagens</h2>
        <p className="text-xs text-gray-500">Contacte diretamente a secretaria académica ou o seu tutor pedagógico de inglês jurídico.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Chats directory sidebar */}
        <div className="md:col-span-4 border-r border-gray-150 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-[#F8F8F6]">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">SALA DE CONVERSA</span>
          </div>

          <div className="flex-grow p-2 space-y-1">
            <button className="w-full text-left p-3 rounded-2xl bg-[#0A2E5D]/5 border border-[#0A2E5D]/10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#0A2E5D] text-white flex items-center justify-center font-serif text-sm font-bold flex-shrink-0">
                ES
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-800">Suporte Pedagógico</p>
                <p className="text-[10px] text-gray-400">Esmeralda Bruno Sumbelelo</p>
              </div>
            </button>
          </div>
        </div>

        {/* Messaging window */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-800">Prof. Esmeralda Bruno Sumbelelo</span>
            <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">TUTORA ONLINE</span>
          </div>

          <div className="flex-grow p-6 space-y-4 overflow-y-auto text-xs">
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3.5 rounded-2xl max-w-sm">
                <p className="text-gray-650">Boa tarde, Dr. António. Relativamente à elaboração contratual do módulo 4, envie o ficheiro por aqui.</p>
                <span className="text-[9px] font-mono text-gray-400 block mt-1">14:24</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-150 flex gap-2">
            <input type="text" placeholder="Escreva a sua mensagem de suporte..." className="flex-grow p-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#C89B3C]" />
            <button className="p-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-xl transition-all">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
