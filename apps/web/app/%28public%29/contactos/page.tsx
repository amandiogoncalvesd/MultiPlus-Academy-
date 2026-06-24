import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactosPage() {
  return (
    <div id="contactos-root" className="max-w-7xl mx-auto px-6 py-16 space-y-12 text-left">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">SUPORTE E ADMISSÕES</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D]">Fale Connosco</h1>
        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          Tem dúvidas sobre os cursos, formas de pagamento, ou deseja marcar uma visita pedagógica presencial? Use os nossos contactos ou envie-nos uma mensagem direta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
        
        {/* Contact info list */}
        <div className="md:col-span-4 bg-[#0A2E5D] text-white p-8 rounded-3xl space-y-6">
          <h4 className="font-serif font-black text-xl border-b border-white/10 pb-3">Informações de Contato</h4>
          <div className="space-y-4 text-xs font-mono text-white/80">
            <p className="flex items-center gap-2"><Phone size={14} className="text-[#C89B3C]" /> +244 923 000 000</p>
            <p className="flex items-center gap-2"><Mail size={14} className="text-[#C89B3C]" /> admissões@multiplus.ao</p>
            <p className="flex items-start gap-2"><MapPin size={14} className="text-[#C89B3C] mt-0.5" /> Edifício MultiPlus, Av. da República, Huambo, Angola</p>
          </div>
        </div>

        {/* Form container */}
        <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-gray-150 space-y-4">
          <h4 className="font-serif font-black text-[#0A2E5D] text-lg">Envie-nos Mensagem</h4>
          <form className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Nome Completo</label>
                <input type="text" placeholder="Dr(a). Nome" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#C89B3C]" />
              </div>
              <div>
                <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Correio Eletrónico</label>
                <input type="email" placeholder="email@exemplo.com" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#C89B3C]" />
              </div>
            </div>
            <div>
              <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Mensagem</label>
              <textarea rows={4} placeholder="Escreva aqui a sua questão..." className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#C89B3C] resize-none" />
            </div>
            <button type="button" className="py-3 px-6 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center gap-2">
              <Send size={12} />
              Enviar Mensagem
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
