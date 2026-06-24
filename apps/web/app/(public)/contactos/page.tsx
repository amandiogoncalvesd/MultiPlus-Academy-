import * as React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactosPage() {
  return (
    <div className="py-20 text-left max-w-5xl mx-auto px-4 space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Canais de Suporte</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D] m-0">Entre em Contacto Connosco</h1>
        <p className="text-sm text-slate-600 font-sans m-0">Tem alguma dúvida ou deseja agendar uma consulta personalizada? A nossa equipa está pronta para ajudar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Address Column */}
        <div className="lg:col-span-5 bg-[#0A2E5D] text-white p-8 rounded-3xl flex flex-col justify-between space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
          
          <div className="space-y-6 relative z-10">
            <h3 className="text-xl font-serif font-black text-[#C89B3C] m-0">Sede Central</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-xs">
                <Phone size={18} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block font-semibold">Telemóvel</span>
                  <span className="text-white/75">+244 956 449 084</span>
                </div>
              </div>

              <div className="flex items-start gap-4 text-xs">
                <Mail size={18} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block font-semibold">Correio Eletrónico</span>
                  <span className="text-white/75">multiplusacademy@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start gap-4 text-xs">
                <MapPin size={18} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block font-semibold">Sede Letiva</span>
                  <span className="text-white/75">Huambo, Angola</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-4 text-[10px] font-mono text-white/50">
            <span>MULTIPLUS ACADEMY • HUAMBO HUB</span>
          </div>
        </div>

        {/* Right Contact Form / Map Placeholder */}
        <div className="lg:col-span-7 bg-white border border-gray-150 p-8 rounded-3xl space-y-6 text-left">
          <h4 className="text-lg font-serif font-black text-[#0A2E5D] m-0">Enviar Mensagem Direta</h4>
          
          <form className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Seu Nome completo</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs" placeholder="Ex: António Ferreira" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Endereço de email</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs" type="email" placeholder="nome@exemplo.com" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Assunto da consulta</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs" placeholder="Ex: Candidaturas ou Dúvidas" />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Corpo da Mensagem</label>
              <textarea rows={4} className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs" placeholder="Escreva a sua mensagem..." />
            </div>

            <button type="button" className="px-5 py-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-md">
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
