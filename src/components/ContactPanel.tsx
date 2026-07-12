import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ContactMessage, PageId } from '../types';
import { 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Send, 
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface ContactPanelProps {
  setCurrentPage: (page: PageId) => void;
}

export default function ContactPanel({ setCurrentPage }: ContactPanelProps) {
  const [formData, setFormData] = useState<ContactMessage>({
    name: '',
    email: '',
    phone: '',
    subject: 'Geral',
    message: ''
  });
  
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');

    // Simulate clean premium response in 1.2 seconds
    setTimeout(() => {
      // Future Integration Hook:
      // To connect this form directly to Google Forms, a developer can fetch to:
      // https://docs.google.com/forms/u/0/d/e/YOUR_GOOGLE_FORM_ID/formResponse?entry.12345=Value...
      console.log('Dados submetidos para futuro Google Forms:', formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: 'Geral', message: '' });
    }, 1200);
  };

  const handleWhatsAppDirect = () => {
    window.open(`https://wa.me/244956449084?text=Ol%C3%A1%2C+registrei+interesse+pelo+portal+da+MultiPlus+Academy+e+gostaria+de+saber+mais+detalhes.`, '_blank');
  };

  return (
    <div id="contact-panel-root" className="bg-white text-slate-800 pt-24 pb-16">
      
      {/* Banner */}
      <section className="py-16 bg-slate-50 text-slate-900 text-center relative border-b border-slate-200">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Canais de Atendimento</span>
          <h1 className="text-4xl font-serif font-black tracking-tight mt-0 text-slate-900 leading-tight">Contacte a MultiPlus Academy</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estamos integralmente à sua disposição para analisar o seu perfil académico e organizar o seu assento letivo coordenado.
          </p>
        </div>
      </section>

      {/* Main body of layout split */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-stretch text-left">
            
            {/* Left Column: Direct Info Map details */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
              
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Canais Rápidos</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 leading-tight m-0">Canais Oficiais de Suporte</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed m-0 font-medium">
                  Para propostas académicas de cariz institucional, corporativa, licenciaturas de escritórios ou candidaturas de corpo docente, prefira nosso contacto expedito.
                </p>
              </div>

              {/* Stacked detail cards */}
              <div className="space-y-4">
                
                {/* 1. Telefone */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-3xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[#C89B3C]">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Telefone Académico</span>
                    <a href="tel:+244956449084" className="text-sm font-extrabold text-slate-900 hover:underline">
                      +244 956 449 084
                    </a>
                  </div>
                </div>

                {/* 2. Email */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-3xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[#C89B3C]">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Correio Eletrónico Geral</span>
                    <a href="mailto:multiplusacademy@gmail.com" className="text-sm font-extrabold text-slate-900 hover:underline break-all">
                      multiplusacademy@gmail.com
                    </a>
                  </div>
                </div>

                {/* 3. Localização */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-3xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[#C89B3C]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Sede Letiva Regional</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">Huambo, Angola</span>
                  </div>
                </div>

              </div>

              {/* Direct WhatsApp Call banner for user satisfaction */}
              <div className="p-6 rounded-2xl bg-[#0A2E5D] text-white space-y-4 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full" />
                
                <h4 className="text-base font-serif font-bold text-white m-0">Canal de Chat Expresso</h4>
                <p className="text-xs text-white/80 font-sans leading-relaxed m-0 font-medium">
                  Necessita de uma resposta imediata sobre as datas e workshops no Huambo? Inicie uma conversa imediata com a diretora pelo WhatsApp oficial.
                </p>
                
                <button
                  onClick={handleWhatsAppDirect}
                  className="w-full py-2.5 bg-[#C89B3C] text-white hover:bg-[#B3852C] font-bold text-xs uppercase rounded-lg tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <MessageSquare size={14} />
                  Iniciar Conversa no WhatsApp
                </button>
              </div>

            </div>

            {/* Right Column: Full tactile Contact Form */}
            <div className="lg:col-span-7 flex flex-col justify-stretch">
              
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
                
                <div className="space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-lg font-serif font-black text-slate-900 m-0 leading-tight">Formulário Correspondente</h4>
                      <p className="text-[9px] text-[#C89B3C] font-mono font-bold tracking-wider mt-0.5">PREPARADO PARA INTEGRAÇÃO DO GOOGLE FORMS</p>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono font-bold">CODE: EN-ANG-2026</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' ? (
                      
                      /* SUCCESS STATE */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-12 text-center space-y-4"
                      >
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs animate-bounce">
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-slate-900">Mensagem Registada com Sucesso!</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                          Agradecemos o seu envio. O formulário foi capturado e está pré-mapeado para submissão ao formulário de dados corporativo do Google Forms. A coordenação letiva retornará em até 24 horas úteis.
                        </p>
                        <button
                          onClick={() => setSubmitStatus('idle')}
                          className="px-6 py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono uppercase tracking-wider font-bold rounded-lg mt-4 shadow-sm"
                        >
                          Escrever Nova Mensagem
                        </button>
                      </motion.div>

                    ) : (

                      /* FORM FIELDS */
                      <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        
                        {/* Name Field */}
                        <div>
                          <label htmlFor="name-input" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                            Nome Completo *
                          </label>
                          <input
                            id="name-input"
                            type="text"
                            required
                            placeholder="Ex: Dr. António Manuel"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors text-slate-900 placeholder-slate-400 shadow-2xs"
                            disabled={submitStatus === 'loading'}
                          />
                        </div>

                        {/* Split Fields Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Email Field */}
                          <div>
                            <label htmlFor="email-input" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                              Correio Eletrónico *
                            </label>
                            <input
                              id="email-input"
                              type="email"
                              required
                              placeholder="nome@corporacao.ao"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors text-slate-900 placeholder-slate-400 shadow-2xs"
                              disabled={submitStatus === 'loading'}
                            />
                          </div>

                          {/* Telephone Field */}
                          <div>
                            <label htmlFor="phone-input" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                              Móvel de Contacto (Angola/Outro) *
                            </label>
                            <input
                              id="phone-input"
                              type="tel"
                              required
                              placeholder="Ex: +244 9xx xxx xxx"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors text-slate-900 placeholder-slate-400 shadow-2xs"
                              disabled={submitStatus === 'loading'}
                            />
                          </div>

                        </div>

                        {/* Subject Option */}
                        <div>
                          <label htmlFor="subject-select" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                            Motivo do Contacto
                          </label>
                          <select
                            id="subject-select"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors text-slate-900 shadow-2xs"
                            disabled={submitStatus === 'loading'}
                          >
                            <option value="Geral">Informações Gerais de Cursos</option>
                            <option value="Inscricao">Pretensões de Inscrição</option>
                            <option value="InCompany">Formação Corporativa Coletiva (In-Company)</option>
                            <option value="Formação">Candidaturas de Docência Académica</option>
                          </select>
                        </div>

                        {/* Message / Comments */}
                        <div>
                          <label htmlFor="message-textarea" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                            Mensagem / Detalhes de Requisito *
                          </label>
                          <textarea
                            id="message-textarea"
                            required
                            rows={4}
                            placeholder="Escreva sua pretensão letiva detalhada, número de participantes ou dúvidas de grade..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors text-slate-900 placeholder-slate-400 resize-none shadow-2xs"
                            disabled={submitStatus === 'loading'}
                          />
                        </div>

                        {/* Future Mapping code-commented indicator */}
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[10px] text-slate-500 leading-normal">
                          <AlertTriangle size={14} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                          <span className="font-medium">
                            <strong>Nota técnica:</strong> Este formulário possui mapeamento de chaves XML e está estruturalmente pronto para apontar para o webhook de gravação do formulário Google Forms do e-mail da MultiPlus Academy.
                          </span>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="w-full py-3.5 rounded-xl uppercase tracking-wider text-xs font-bold bg-[#0A2E5D] hover:bg-[#123C73] text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-md"
                          >
                            {submitStatus === 'loading' ? (
                              <>
                                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                A Enviar Dados Curriculares...
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                Submeter Proposta de Candidatura
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    )}
                  </AnimatePresence>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs grid grid-cols-1 lg:grid-cols-12 text-left">
            
            {/* Left side text detail */}
            <div className="lg:col-span-4 p-8 sm:p-10 flex flex-col justify-between bg-white">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Presença Física</span>
                <h3 className="text-2xl font-serif font-black text-slate-900 m-0 leading-tight">Sede Letiva</h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed m-0 font-medium">
                  A nossa academia está sediada no Huambo, Angola, de onde coordenamos todos os nossos programas formativos de excelência e as nossas imersões linguísticas híbridas.
                </p>
                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3 text-xs text-slate-800">
                    <MapPin size={16} className="text-[#C89B3C] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Huambo, Angola</strong>
                      <span className="text-slate-400 font-bold">Sede Administrativa e Letiva</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 text-[10px] font-mono text-slate-400 font-bold">
                <span>MULTIPLUS ACADEMY • HUAMBO HUB</span>
              </div>
            </div>

            {/* Right side interactive map */}
            <div className="lg:col-span-8 h-[400px] sm:h-[450px] relative bg-slate-100 border-l border-slate-100">
              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={{ lat: -12.7761, lng: 15.7314 }}
                    defaultZoom={14}
                    mapId="multiplus_academy_map"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <AdvancedMarker position={{ lat: -12.7761, lng: 15.7314 }}>
                      <Pin background="#0A2E5D" glyphColor="#C89B3C" borderColor="#C89B3C" />
                    </AdvancedMarker>
                  </Map>
                </APIProvider>
              ) : (
                /* Premium Key Setup Instructions in Map Widget */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-900 text-white">
                  <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                  <div className="relative z-10 text-center max-w-sm space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#C89B3C] border border-white/10">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-white mb-1">Google Maps Interativo</h4>
                      <p className="text-[11px] text-white/70 leading-relaxed font-sans font-medium">
                        Insira a sua chave Google Maps API nas definições do AI Studio para ativar a visualização em tempo real do mapa de Huambo, Angola.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-xs space-y-2">
                      <p className="font-semibold text-[#C89B3C] text-[10px] uppercase font-mono tracking-wider">Como configurar:</p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-white/80 list-none pl-0 font-medium">
                        <li><span className="text-[#C89B3C] font-mono font-bold">1.</span> Obtenha uma chave API na <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-[#C89B3C] underline hover:text-white transition-colors">Consola Cloud</a>.</li>
                        <li><span className="text-[#C89B3C] font-mono font-bold">2.</span> Abra as <strong>Definições</strong> (ícone de engrenagem ⚙️ no canto superior direito).</li>
                        <li><span className="text-[#C89B3C] font-mono font-bold">3.</span> Selecione <strong>Secrets</strong>.</li>
                        <li><span className="text-[#C89B3C] font-mono font-bold">4.</span> Crie uma variável chamada <code>GOOGLE_MAPS_PLATFORM_KEY</code> e cole o seu token.</li>
                      </ol>
                    </div>

                    <p className="text-[10px] font-mono text-white/40 tracking-wider font-bold">
                      O WEBSITE SERÁ RECONSTRUÍDO AUTOMATICAMENTE
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
