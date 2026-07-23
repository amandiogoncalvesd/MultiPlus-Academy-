import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ContactMessage, PageId } from '../types';
import StarBorder from './ui/StarBorder';
import { 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Send, 
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

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
    <div id="contact-panel-root" className="bg-white text-slate-800 pt-10 pb-16">
      
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
                <StarBorder
                  as="div"
                  speed="6s"
                  thickness={1.5}
                  className="rounded-xl overflow-hidden shadow-3xs"
                  innerClassName="relative z-1 flex items-center gap-4 p-4 bg-white w-full text-left"
                >
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[#C89B3C]">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Telefone Académico</span>
                    <a href="tel:+244956449084" className="text-sm font-extrabold text-slate-900 hover:underline">
                      +244 956 449 084
                    </a>
                  </div>
                </StarBorder>

                {/* 2. Email */}
                <StarBorder
                  as="div"
                  speed="7s"
                  thickness={1.5}
                  className="rounded-xl overflow-hidden shadow-3xs"
                  innerClassName="relative z-1 flex items-center gap-4 p-4 bg-white w-full text-left"
                >
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[#C89B3C]">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Correio Eletrónico Geral</span>
                    <a href="mailto:multiplusacademy@gmail.com" className="text-sm font-extrabold text-slate-900 hover:underline break-all">
                      multiplusacademy@gmail.com
                    </a>
                  </div>
                </StarBorder>

                {/* 3. Localização */}
                <StarBorder
                  as="div"
                  speed="8s"
                  thickness={1.5}
                  className="rounded-xl overflow-hidden shadow-3xs"
                  innerClassName="relative z-1 flex items-center gap-4 p-4 bg-white w-full text-left"
                >
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[#C89B3C]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Sede Letiva Regional</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">Huambo, Angola</span>
                  </div>
                </StarBorder>

              </div>

              {/* Direct WhatsApp Call banner for user satisfaction */}
              <StarBorder
                as="div"
                speed="10s"
                thickness={2}
                className="rounded-2xl overflow-hidden shadow-md"
                innerClassName="relative z-1 p-6 bg-[#0A2E5D] text-white space-y-4 overflow-hidden w-full h-full text-left"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
                
                <h4 className="text-base font-serif font-bold text-white m-0">Canal de Chat Expresso</h4>
                <p className="text-xs text-white/80 font-sans leading-relaxed m-0 font-medium">
                  Necessita de uma resposta imediata sobre as datas e workshops no Huambo? Inicie uma conversa imediata com a diretora pelo WhatsApp oficial.
                </p>
                
                <StarBorder
                  as="button"
                  onClick={handleWhatsAppDirect}
                  speed="5s"
                  thickness={1.5}
                  className="w-full rounded-lg overflow-hidden cursor-pointer shadow-md"
                  innerClassName="relative z-1 w-full py-2.5 bg-[#C89B3C] text-white hover:bg-[#B3852C] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <MessageSquare size={14} />
                  Iniciar Conversa no WhatsApp
                </StarBorder>
              </StarBorder>

            </div>

            {/* Right Column: Full tactile Contact Form */}
            <div className="lg:col-span-7 flex flex-col justify-stretch">
              
              <StarBorder
                as="div"
                speed="12s"
                thickness={2}
                className="rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col justify-stretch"
                innerClassName="relative z-1 p-8 sm:p-10 bg-white rounded-3xl overflow-hidden flex-1 flex flex-col justify-between w-full h-full"
              >
                
                <div className="space-y-6 w-full">
                  
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
                        <StarBorder
                          as="button"
                          onClick={() => setSubmitStatus('idle')}
                          speed="5s"
                          thickness={1.5}
                          className="rounded-lg overflow-hidden cursor-pointer mt-4"
                          innerClassName="px-6 py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono uppercase tracking-wider font-bold shadow-sm"
                        >
                          Escrever Nova Mensagem
                        </StarBorder>
                      </motion.div>

                    ) : (

                      /* FORM FIELDS */
                      <form onSubmit={handleSubmit} className="space-y-4 text-left w-full">
                        
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
                          <StarBorder
                            as="button"
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            speed="4s"
                            thickness={2}
                            className="w-full rounded-xl overflow-hidden cursor-pointer"
                            innerClassName="relative z-1 w-full py-3.5 rounded-xl uppercase tracking-wider text-xs font-bold bg-[#0A2E5D] hover:bg-[#123C73] text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md"
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
                          </StarBorder>
                        </div>

                      </form>
                    )}
                  </AnimatePresence>

                </div>

              </StarBorder>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
