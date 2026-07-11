import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PRINCIPAL_COURSE, TESTIMONIALS_PLACEHOLDERS, MAIN_INSTRUCTOR, BLOG_POSTS } from '../data';
import { PageId } from '../types';
import { 
  Award, 
  Clock, 
  Smartphone, 
  Users, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  CheckCircle, 
  ChevronRight, 
  MessageSquare,
  BookMarked,
  Info,
  Phone,
  Mail,
  ChevronLeft,
  Sparkles,
  Globe,
  GraduationCap,
  Play,
  Bookmark
} from 'lucide-react';

interface HomePanelProps {
  setCurrentPage: (page: PageId) => void;
  onOpenSignUp: () => void;
}

export default function HomePanel({ setCurrentPage, onOpenSignUp }: HomePanelProps) {
  const [activeTestimony, setActiveTestimony] = useState(0);

  const nextTestimony = () => {
    setActiveTestimony((prev) => (prev + 1) % TESTIMONIALS_PLACEHOLDERS.length);
  };

  const prevTestimony = () => {
    setActiveTestimony((prev) => (prev - 1 + TESTIMONIALS_PLACEHOLDERS.length) % TESTIMONIALS_PLACEHOLDERS.length);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/244956449084?text=Ol%C3%A1%2C+gostaria+de+saber+mais+sobre+as+forma%C3%A7%C3%B5es+de+ingl%C3%AAs+da+MultiPlus+Academy.`, '_blank');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 6 Core benefits - Por que Escolher a MultiPlus Academy
  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-gold-600" />,
      title: 'Professores Qualificados',
      description: 'Docentes certificados, com vasta experiência no ensino de línguas e capacitação profissional linguística avançada.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-gold-600" />,
      title: 'Formação Híbrida',
      description: 'Flexibilidade extraordinária combinando aulas online dinâmicas ao vivo e imersões presenciais de alto rendimento.'
    },
    {
      icon: <Award className="w-6 h-6 text-gold-600" />,
      title: 'Certificação',
      description: 'Diplomas oficiais de proficiência linguística que validam rigorosamente a sua excelência perante o mercado de trabalho global.'
    },
    {
      icon: <Clock className="w-6 h-6 text-gold-600" />,
      title: 'Horários Flexíveis',
      description: 'Regimes eletivos e múltiplas turmas que se encaixam de forma orgânica na sua agenda escolar ou profissional.'
    },
    {
      icon: <BookOpen className="w-6 h-6 text-gold-600" />,
      title: 'Metodologia Personalizada',
      description: 'Programas de aprendizagem moderna moldados em torno do seu ritmo de evolução e dos seus interesses de carreira específicos.'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-gold-600" />,
      title: 'Aprendizagem Orientada para Resultados',
      description: 'Método focado em conversação fluente e segura, permitindo o uso real autónomo do idioma logo nas primeiras sessões.'
    }
  ];

  // List of planned / future programs
  const futurePrograms = [
    { title: 'Business English', desc: 'Comunicação executiva, negociação estratégica e oratória corporativa.' },
    { title: 'Conversational English', desc: 'Sessões dinâmicas focadas em fluência nativa, escuta e segurança comunicativa.' },
    { title: 'IELTS Preparation', desc: 'Táticas avançadas de exame para obter pontuações de destaque no certificado Cambridge.' },
    { title: 'TOEFL Preparation', desc: 'Treino intensivo para acesso perfeito a candidaturas de universidades mundiais.' },
    { title: 'Academic English', desc: 'Técnicas de redação de relatórios, teses de pesquisa e leitura científica crítica.' },
    { title: 'English for Technology', desc: 'Inglês de computação, engenharia de software e terminologia de inovação digital.' },
    { title: 'English for Healthcare', desc: 'Domínio linguístico para medicina, enfermagem, artigos farmacêuticos e investigação clínica.' },
  ];

  return (
    <div id="home-panel-root" className="bg-cream-100 text-[#1C1C1C] overflow-x-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen bg-ink-900 text-cream-100 flex items-center pt-28 pb-20 overflow-hidden">
        
        {/* Subtle, luxurious ambient background gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[70%] bg-gradient-to-br from-gold-600/10 to-transparent rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-slate-900/60 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Visionary Educational Hero Copies */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream-100/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-xs font-mono text-gold-600 tracking-widest uppercase"
              >
                <span className="flex h-2 w-2 rounded-full bg-gold-600 animate-pulse"></span>
                Portal Institucional Oficial • MultiPlus Academy
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-[1.1] text-cream-100"
                >
                  Transformando <br />
                  Competências em <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 via-gold-600 to-[#E6BA62]">
                    Oportunidades.
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-cream-100/80 text-base sm:text-lg leading-relaxed max-w-2xl font-sans"
                >
                  Aprenda Inglês com uma metodologia moderna, flexível e orientada para resultados académicos e profissionais. Desenvolva as suas capacidades globais na MultiPlus Academy.
                </motion.p>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <button
                  onClick={() => {
                    setCurrentPage('courses');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-4 rounded-xl text-sm font-bold tracking-wider uppercase transition-all duration-300 text-center bg-gradient-to-r from-gold-600 to-gold-600 text-cream-100 hover:shadow-[0_8px_32px_rgba(200,155,60,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  Explorar Cursos
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => scrollToSection('sobre-section')}
                  className="px-8 py-4 rounded-xl text-sm font-bold tracking-wider uppercase transition-all duration-300 text-center border border-white/20 text-cream-100 bg-cream-100/5 hover:bg-cream-100/10 hover:border-gold-600/50"
                >
                  Saber Mais
                </button>
              </motion.div>

              {/* Trust badges indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-10 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono text-cream-100/50 text-[10px] uppercase tracking-widest"
              >
                <div className="flex flex-col items-start">
                  <span className="block text-xl font-serif text-cream-100 font-bold tracking-tight mb-1">MÉTODO</span>
                  Híbrido de Alta Performancet
                </div>
                <div className="flex flex-col items-start">
                  <span className="block text-xl font-serif text-gold-600 font-bold tracking-tight mb-1">CEFR</span>
                  Níveis Oficiais de Proficiência
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col items-start">
                  <span className="block text-xl font-serif text-cream-100 font-bold tracking-tight mb-1">SEDE</span>
                  Huambo, Rep. de Angola
                </div>
              </motion.div>

            </div>

            {/* Right Column: Premium Learning System Glassmorphic Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, cubicBezier: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              
              {/* Premium Card Container representing a Smart LMS Dashboard */}
              <div className="relative mx-auto max-w-[420px] lg:max-w-none rounded-3xl p-6 bg-cream-100/5 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md overflow-hidden flex flex-col justify-between">
                
                {/* Overlay Radial Lighting effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,155,60,0.15),transparent_65%)] pointer-events-none" />
                
                {/* Header structure */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gold-600/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-cream-100/10" />
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase font-bold">PORTAL ID DE ALUNO MULTIPLUS</span>
                </div>

                {/* Central Interactive Mockup Grid */}
                <div className="flex-1 flex flex-col justify-center py-6 space-y-6 relative z-10 text-left">
                  
                  {/* Digital Live Progress Indicator inside e-Learning preview */}
                  <div className="bg-cream-100/5 border border-white/10 rounded-2xl p-4 space-y-3 relative overflow-hidden backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-cream-100/50 uppercase tracking-wider">AULA SÍNCRONA AO VIVO</span>
                      </div>
                      <span className="text-[10px] font-mono text-gold-600 font-semibold">Regime Híbrido</span>
                    </div>

                    <p className="text-sm font-serif font-bold text-cream-100 tracking-wide">
                      Conversação Avançada e Oratória Profissional
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-cream-100/70 py-1 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-gold-600" />
                        <span>Formadora Esmeralda Sumbelelo</span>
                      </div>
                      <span className="text-[10px] font-mono bg-cream-100/10 px-1.5 py-0.5 rounded text-cream-100 font-semibold">CEFR B2-C1</span>
                    </div>

                    {/* Progress slider bar mock */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[9px] font-mono text-cream-100/45">
                        <span>Tempo Letivo Executado</span>
                        <span>75% Concluído</span>
                      </div>
                      <div className="w-full h-1.5 bg-cream-100/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold-600 to-gold-600 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                  </div>

                  {/* High fidelity stats cards block */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="bg-cream-100/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2 text-left">
                      <div className="p-1 px-2.5 rounded bg-gold-600/10 text-gold-600 font-mono text-[9px] uppercase font-bold tracking-wider float-right">
                        EXCELÊNCIA
                      </div>
                      <BookMarked size={16} className="text-gold-600" />
                      <p className="text-[9px] font-mono text-cream-100/40 uppercase font-black truncate">REDE CURRICULAR</p>
                      <p className="text-xs font-serif font-bold text-gray-200 mt-1">Multi-Programas</p>
                    </div>

                    <div className="bg-cream-100/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2 text-left">
                      <div className="p-1 px-2 rounded bg-cream-100/10 text-cream-100 font-mono text-[9px] uppercase font-bold tracking-wider float-right">
                        GLOBAL
                      </div>
                      <Globe size={16} className="text-gold-600" />
                      <p className="text-[9px] font-mono text-cream-100/40 uppercase font-[#BB8533] font-black truncate">CONETIVIDADE</p>
                      <p className="text-xs font-serif font-bold text-gray-200 mt-1">Línguas Internacionais</p>
                    </div>

                  </div>

                  {/* Logo Center Brand Visual representation */}
                  <div className="border border-white/10 bg-cream-100/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-ink-900 border border-gold-600/30 rounded-lg">
                        <img 
                          src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png" 
                          alt="Logo MultiPlus" 
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-serif font-bold text-cream-100">MultiPlus Academy</p>
                        <p className="text-[10px] font-mono text-gold-600 tracking-wide mt-0.5">EST. 2026</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-cream-100/50 font-mono">EN - AO</span>
                  </div>

                </div>

                {/* Bottom decorative notes */}
                <div className="border-t border-white/10 pt-4 flex justify-between items-center relative z-10 text-[9px] font-mono text-cream-100/40">
                  <span>SISTEMA PREMIUM DE EDUCAÇÃO</span>
                  <span className="text-gold-600 font-semibold">FORMANDO LÍDERES</span>
                </div>

              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. SOBRE A MULTIPLUS ACADEMY SECTION */}
      <section id="sobre-section" className="py-24 relative bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left side: Premium Image/Concept frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative p-2 bg-slate-50 border border-gray-200 rounded-3xl shadow-sm overflow-hidden aspect-square flex flex-col justify-between">
                <div className="flex-1 bg-ink-900 rounded-2xl relative p-8 flex flex-col justify-between overflow-hidden">
                  
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,155,60,0.15),transparent_60%)]" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs font-mono tracking-widest text-gold-600 bg-cream-100/10 px-3 py-1 rounded-md uppercase font-bold">SOBRE NÓS</span>
                    <GraduationCap size={20} className="text-gold-600" />
                  </div>

                  <div className="space-y-4 relative z-10 text-left">
                    <span className="text-6xl font-serif font-bold text-cream-100/5 block leading-none">2026</span>
                    <h3 className="text-xl font-serif font-semibold text-cream-100 leading-tight">Excelência Educacional</h3>
                    <p className="text-xs text-cream-100/70 leading-relaxed font-sans">
                      A nossa Sede no Huambo, Angola é um polo de ensino estruturado para catalisar carreiras intelectuais e comerciais.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-between items-center relative z-10 text-[9px] font-mono text-gold-600/80">
                    <span>MULTIPLUS ACADEMY</span>
                    <span>HUAMBO, ANGOLA</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Right side: Prose text with high-end margins */}
            <div className="lg:col-span-7 text-left space-y-6">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 block">Apresentação Institucional</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 leading-tight m-0">
                Uma Academia Moderna Dedicada ao Desenvolvimento de Competências
              </h2>
              
              <div className="space-y-5 text-sm text-[#1C1C1C]/75 leading-relaxed font-sans">
                <p>
                  A <strong>MultiPlus Academy</strong> é uma instituição de ensino de excelência, vocacionada para a capacitação na <strong>Língua Inglesa</strong> através de uma abordagem pedagógica altamente estruturada, prática e moderna.
                </p>
                <p>
                  Ao invés de metodologias genéricas, criamos ecossistemas de aprendizagem ajustados à realidade das carreiras internacionais. A nossa proposta pedagógica une flexibilidade total e rigor científico para profissionais, académicos ou organizações que exigem proficiência linguística para atingir metas ambiciosas.
                </p>
                <p>
                  Atuamos como um acelerador intelectual focado em Angola, com o planeamento voltado para a oferta de múltiplos cursos especializados e de proficiência geral. Unimos formadores qualificados e infraestrutura moderna para expandir o seu valor de mercado.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setCurrentPage('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-ink-900 hover:bg-ink-900 text-cream-100 transition-colors"
                >
                  Conhecer Nossa História
                </button>
              </div>
            </div>

          </div>

          {/* Mission, Vision, and Values row inside About section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            
            {/* Missão */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-gray-150 relative overflow-hidden flex flex-col justify-between text-left h-full">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-ink-900/5 flex items-center justify-center text-gold-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-serif font-bold text-ink-900">Nossa Missão</h4>
                <p className="text-xs text-[#1C1C1C]/70 leading-relaxed font-sans">
                  Desenvolver as habilidades e competências na Língua Inglesa de jovens, profissionais e executivos angolanos através de metodologias dinâmicas e rigorosas, conectando potenciais locais a oportunidades globais.
                </p>
              </div>
            </div>

            {/* Visão */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-gray-150 relative overflow-hidden flex flex-col justify-between text-left h-full">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-ink-900/5 flex items-center justify-center text-gold-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-serif font-bold text-ink-900">Nossa Visão</h4>
                <p className="text-xs text-[#1C1C1C]/70 leading-relaxed font-sans">
                  Ser tida como a academia de elite mais inovadora e respeitada de ensino técnico e geral de Inglês em Angola, expandindo continuamente a nossa oferta curricular com tecnologia LMS premium.
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="p-8 rounded-2xl bg-ink-900 text-cream-100 relative overflow-hidden flex flex-col justify-between text-left h-full">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-cream-100/10 flex items-center justify-center text-gold-600">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-serif font-bold text-cream-100">Nossos Valores</h4>
                <p className="text-xs text-cream-100/80 leading-relaxed font-sans">
                  Rigor científico e pedagógico, integridade no ensino, valorização permanente do aluno, personalização curricular de cariz prático e compromisso absoluto com resultados mensuráveis.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. POR QUE ESCOLHER A MULTIPLUS ACADEMY */}
      <section className="py-24 relative bg-cream-100 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 block">Diferenciais Pedagógicos</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 leading-tight m-0">Por que Escolher a MultiPlus Academy?</h3>
            <p className="text-sm text-[#1C1C1C]/70 font-sans leading-relaxed mt-2">
              Desenvolvemos uma estrutura focada em alta performance para que alcance a proficiência necessária no menor intervalo de tempo possível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="bg-cream-100 p-8 rounded-2xl border border-gray-200 hover:border-gold-600/40 relative flex flex-col justify-between hover:shadow-md transition-all text-left"
              >
                {/* Minimalist structural top decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-ink-900/10 rounded-t-2xl hover:bg-gold-600/50 transition-colors" />
                
                <div className="space-y-4">
                  <div className="p-3 w-12 h-12 rounded-xl bg-ink-900/5 flex items-center justify-center mb-6 border border-ink-900/10 text-gold-600">
                    {benefit.icon}
                  </div>
                  <h4 className="text-lg font-serif font-bold text-ink-900 m-0">{benefit.title}</h4>
                  <p className="text-xs text-[#1C1C1C]/70 leading-relaxed font-sans">{benefit.description}</p>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-100 text-[9px] font-mono tracking-widest uppercase text-gold-600 font-bold">
                  Padrão MultiPlus
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. PROGRAMAS EM DESTAQUE */}
      <section className="py-24 relative bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 block">Nossos Programas</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 leading-tight m-0">Capacitações Ativas & Planeadas</h3>
            <p className="text-sm text-[#1C1C1C]/70 font-sans leading-relaxed">
              Descubra a nossa formação inaugural ativa e conheça os futuros caminhos de especialização curricular que estão a ser preparados para si.
            </p>
          </div>

          {/* Active Flagship Program card */}
          <div className="mb-20">
            <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-[0_15px_45px_rgba(10,46,93,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-0 bg-cream-100">
              
              {/* Left Column of flagship: Course Info Banner & Badge */}
              <div className="lg:col-span-5 bg-ink-900 text-cream-100 p-8 sm:p-12 relative flex flex-col justify-between overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold-600/15 to-transparent rounded-full pointer-events-none" />
                
                <div className="space-y-6 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-600/20 border border-gold-600/30 text-[10px] font-mono tracking-widest uppercase text-gold-600 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-600 animate-pulse" />
                    Curso Ativo em Destaque
                  </span>

                  <h4 className="text-2xl sm:text-3xl font-serif font-bold tracking-normal leading-tight text-cream-100 m-0">
                    {PRINCIPAL_COURSE.title}
                  </h4>
                  
                  <p className="text-xs sm:text-sm text-cream-100/70 font-sans leading-relaxed m-0">
                    Capacitação linguística de nível internacional direcionada para juristas, advogados, consultores e assessores do sector comercial e energético em Angola. Domine redação de contratos internacionais (Drafting), arbitragem e vocabulário técnico comparativo.
                  </p>
                </div>

                <div className="pt-8 border-t border-white/10 mt-8 relative z-10 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cream-100/50">MultiPlus Premium System</span>
                  <span className="text-xs font-mono font-bold text-gold-600">72h de Carga Letiva</span>
                </div>
              </div>

              {/* Right Column of flagship: Details and quick list */}
              <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="text-gold-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Período de Início</span>
                      <span className="text-sm font-semibold text-ink-900">{PRINCIPAL_COURSE.startDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="text-gold-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Carga Horária</span>
                      <span className="text-sm font-semibold text-ink-900">{PRINCIPAL_COURSE.hours}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-gold-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Formato das Aulas</span>
                      <span className="text-sm font-semibold text-ink-900">{PRINCIPAL_COURSE.modality} (Huambo, Angola)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="text-gold-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Duração</span>
                      <span className="text-sm font-semibold text-ink-900">{PRINCIPAL_COURSE.duration}</span>
                    </div>
                  </div>

                </div>

                <div className="space-y-3 pt-4 border-t border-gray-150">
                  <p className="text-xs font-mono font-bold text-gold-600 uppercase tracking-widest m-0">Foco do Desenvolvimento Técnico</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
                      <span>Terminologia Comparada Civil/Common Law</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
                      <span>Drafting e Estruturação de Cláusulas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
                      <span>Inglês de Petróleo, Gás & Energia em Angola</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
                      <span>Oratória e Simulação de Resolução de Litígios</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      setCurrentPage('courses');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 py-3.5 px-6 rounded-xl text-center text-xs font-bold uppercase tracking-wider bg-ink-900 hover:bg-ink-900 text-cream-100 transition-colors"
                  >
                    Ver Grade Curricular
                  </button>
                  <button
                    onClick={onOpenSignUp}
                    className="flex-1 py-3.5 px-6 rounded-xl text-center text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gold-600 to-gold-600 text-cream-100 hover:opacity-95 transition-opacity"
                  >
                    Solicitar Admissão Académica
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Grid header for future additions */}
          <div className="text-left max-w-2xl mb-8 space-y-2">
            <span className="text-gold-600 text-xs font-mono font-bold tracking-widest uppercase block">Expansão de Programas</span>
            <h4 className="text-2xl font-serif font-bold text-ink-900 m-0">Próximos Programas Curriculares</h4>
            <p className="text-xs text-neutral-400 m-0 leading-relaxed">
              O planeamento estratégico da MultiPlus Academy foi construído para expandir a capacitação de línguas a várias vertentes intelectuais e de comércio internacional. Em fase de preparação pedagógica:
            </p>
          </div>

          {/* Grid listing future programs in a beautiful, future-proof directory layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {futurePrograms.map((prog, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-cream-100 border border-gray-200 hover:border-gold-600/30 text-left transition-all duration-300 flex flex-col justify-between group hover:bg-cream-100 hover:shadow-sm"
              >
                <div className="space-y-2">
                  <span className="inline-block text-[9px] font-mono tracking-widest uppercase text-neutral-400 bg-gray-200/50 px-2 py-0.5 rounded font-bold">
                    PREPARANDO
                  </span>
                  <h5 className="text-sm font-serif font-bold text-ink-900 group-hover:text-gold-600 transition-colors mt-2 leading-tight">
                    {prog.title}
                  </h5>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-sans mt-1">
                    {prog.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-150 text-[9px] font-mono tracking-widest uppercase text-gold-600/85 font-black">
                  Brevemente
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. FORMADORA EM DESTAQUE */}
      <section className="py-24 relative bg-slate-50 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 block">Direção Letiva</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 m-0">Coordenação Pedagógica</h3>
            <p className="text-sm text-[#1C1C1C]/70">
              Aprenda com formadores que unem vasta bagagem em linguística aplicada, tradução corporativa e ensino internacional.
            </p>
          </div>

          {/* Genuine Instructor Profile card conforming layout */}
          <div className="max-w-4xl mx-auto bg-cream-100 rounded-3xl overflow-hidden border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-0">
            
            {/* Visual Frame left */}
            <div className="md:col-span-5 relative py-8 px-6 bg-ink-900 flex flex-col justify-center items-center overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full pointer-events-none" />
              
              <div className="w-48 h-64 rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-gray-100">
                <img
                  src={MAIN_INSTRUCTOR.photo}
                  alt={MAIN_INSTRUCTOR.name}
                  className="w-full h-full object-cover grayscale block brightness-95"
                />
              </div>

              <div className="mt-6 text-center">
                <span className="block text-2xl font-serif font-bold text-cream-100 tracking-tight">{MAIN_INSTRUCTOR.experienceYears}+ Anos</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-600 font-semibold block mt-1">Carreira Docente & Tradução</span>
              </div>
            </div>

            {/* Resume Bio block right */}
            <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <div>
                  <h4 className="text-2xl font-serif font-bold text-ink-900 m-0">{MAIN_INSTRUCTOR.name}</h4>
                  <p className="text-xs font-mono text-gold-600 font-bold tracking-wide mt-1 uppercase">{MAIN_INSTRUCTOR.role}</p>
                </div>

                <p className="text-xs sm:text-sm text-[#1C1C1C]/85 leading-relaxed font-sans m-0">
                  {MAIN_INSTRUCTOR.bio}
                </p>

                {/* Validated Credentials list directly matching database */}
                <div className="space-y-2 pt-2">
                  <span className="block text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider">CREDENCIAIS INSTITUCIONAIS</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {MAIN_INSTRUCTOR.credentials.slice(0, 4).map((cred, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[#1C1C1C]/80">
                        <CheckCircle size={12} className="text-gold-600 flex-shrink-0" />
                        <span className="truncate">{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom tag block */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-1.5 self-start">
                  {MAIN_INSTRUCTOR.specializations.map((spec, sIdx) => (
                    <span key={sIdx} className="bg-slate-100 px-2.5 py-1 rounded text-[9px] font-mono text-neutral-400 font-bold uppercase">
                      {spec}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setCurrentPage('instructors');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-ink-900 hover:bg-ink-900 text-cream-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  Ver Perfil Docente
                  <ArrowRight size={13} className="text-gold-600" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. TESTEMUNHOS SECTION (Sliding placehold structure) */}
      <section className="py-24 relative overflow-hidden bg-cream-100">
        
        {/* Decorative backdrop light blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-600/5 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 mb-2 block animate-pulse">Avaliação Pedagógica</span>
          <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 mb-4">Estrutura de Testemunhos</h3>
          <p className="text-sm text-[#1C1C1C]/75 max-w-xl mx-auto mb-16 font-sans">
            Para garantir a integridade absoluta da nossa reputação, as aspas abaixo representam canais estruturados para o testemunho real das próximas turmas.
          </p>

          <div className="relative min-h-[220px] max-w-3xl mx-auto">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimony}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-cream-100 p-8 sm:p-12 rounded-3xl border border-gray-200 text-left relative"
              >
                <div className="absolute top-6 right-8 text-gray-200 font-serif text-8xl leading-none font-black select-none pointer-events-none">
                  “
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-gold-600/10 text-gold-600 text-[10px] font-mono uppercase font-bold tracking-wide border border-gold-600/15">
                    <MessageSquare size={11} />
                    Avaliação em Validação Letiva
                  </div>

                  <blockquote className="font-serif italic text-sm sm:text-base text-[#1C1C1C]/80 leading-relaxed m-0">
                    "{TESTIMONIALS_PLACEHOLDERS[activeTestimony].testimonyFeedback}"
                  </blockquote>

                  <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <cite className="not-italic font-serif font-bold text-ink-900 text-base block">
                        {TESTIMONIALS_PLACEHOLDERS[activeTestimony].authorName}
                      </cite>
                      <span className="text-xs text-gold-600 font-semibold block mt-0.5 font-sans">
                        {TESTIMONIALS_PLACEHOLDERS[activeTestimony].authorRole}
                      </span>
                    </div>

                    <div className="h-9 w-9 rounded-full bg-cream-100 flex items-center justify-center border border-gray-200 shadow-sm text-gold-600">
                      <Award size={16} />
                    </div>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>

            {/* Slider navigation controls */}
            <div className="flex justify-center gap-4 mt-8 relative z-10">
              <button
                onClick={prevTestimony}
                className="p-3 rounded-full bg-cream-100 border border-gray-200 hover:border-gold-600 hover:bg-cream-200 text-ink-900 shadow-sm transition-all"
                aria-label="Depoimento Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-2">
                {TESTIMONIALS_PLACEHOLDERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimony(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      activeTestimony === i ? 'bg-gold-600 w-6' : 'bg-gray-300 hover:bg-gray-450'
                    }`}
                    aria-label={`Ir para slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimony}
                className="p-3 rounded-full bg-cream-100 border border-gray-200 hover:border-gold-600 hover:bg-cream-200 text-ink-900 shadow-sm transition-all"
                aria-label="Depoimento Seguinte"
              >
                <ChevronRight size={16} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 7. BLOG E NOTÍCIAS (Future Articles Preview) */}
      <section className="py-24 relative bg-slate-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4 text-left">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 block">Conteúdos E Artigos</span>
              <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 m-0">Canal de Aprendizagem & Blog</h3>
              <p className="text-sm text-[#1C1C1C]/70 m-0 leading-relaxed max-w-xl font-sans">
                Aceda a novidades literárias, análises de termos internacionais e notícias académicas escritas pela nossa coordenação científica.
              </p>
            </div>
            
            <button
              onClick={() => {
                setCurrentPage('blog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-cream-100 border border-gray-200 hover:border-gold-600/55 text-ink-900 flex items-center gap-2 transition-all self-start md:self-auto shadow-sm"
            >
              Ver Todos os Artigos
              <ArrowRight size={14} className="text-gold-600" />
            </button>
          </div>

          {/* Grid layout containing 3 blog articles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <article 
                key={post.id}
                onClick={() => {
                  setCurrentPage('blog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-cream-100 rounded-2xl overflow-hidden border border-gray-200 hover:border-gold-600/30 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group"
              >
                
                {/* Image header */}
                <div className="aspect-[16/10] overflow-hidden relative bg-ink-900">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover grayscale opacity-90 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-ink-900/90 backdrop-blur text-gold-600 text-[9px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-gold-600/20">
                    {post.category}
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-3">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h4 className="text-base font-serif font-bold text-ink-900 leading-snug line-clamp-2 group-hover:text-gold-600 transition-colors mt-1">
                      {post.title}
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans line-clamp-2 mt-2 m-0">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5 text-xs text-neutral-400 font-sans">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name} 
                      className="w-6 h-6 rounded-full object-cover border border-gray-200"
                      referrerPolicy="no-referrer"
                    />
                    <span>Por {post.author.name}</span>
                  </div>
                </div>

              </article>
            ))}
          </div>

        </div>
      </section>

      {/* 8. CONTACTOS SECTION */}
      <section className="py-24 relative bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Contacts visual buttons list left */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-8 text-left">
              
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600 block">Contacto Direto</span>
                <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900 leading-tight m-0">Esclareça Toda e Qualquer Dúvida</h3>
                <p className="text-sm text-[#1C1C1C]/75">
                  Pretende formar turmas integradas na sua corporação ou organizar workshops específicos de inglês técnico? Entre em contacto connosco agora.
                </p>
              </div>

              <div className="space-y-4">
                
                {/* 1. Telefone/Phone */}
                <a 
                  href="tel:+244956449084"
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gold-600/40 bg-slate-50/50 hover:bg-cream-100 transition-all group"
                >
                  <div className="p-3 rounded-lg bg-ink-900/5 text-ink-900 group-hover:bg-gold-600/10 group-hover:text-gold-600 transition-colors">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono tracking-widest uppercase text-neutral-400">Telemóvel Suporte</span>
                    <span className="text-sm font-semibold text-ink-900">+244 956 449 084</span>
                  </div>
                </a>

                {/* 2. Email */}
                <a 
                  href="mailto:multiplusacademy@gmail.com"
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gold-600/40 bg-slate-50/50 hover:bg-cream-100 transition-all group"
                >
                  <div className="p-3 rounded-lg bg-ink-900/5 text-ink-900 group-hover:bg-gold-600/10 group-hover:text-gold-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono tracking-widest uppercase text-neutral-400">Correio Eletrónico</span>
                    <span className="text-sm font-semibold text-ink-900 break-all">multiplusacademy@gmail.com</span>
                  </div>
                </a>

                {/* 3. WhatsApp Integration */}
                <button 
                  onClick={handleWhatsApp}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gold-600/40 bg-slate-50/50 hover:bg-cream-100 transition-all text-left group"
                >
                  <div className="p-3 px-3.5 rounded-lg bg-ink-900/5 text-ink-900 group-hover:bg-gold-600/10 group-hover:text-gold-600 transition-colors text-xs font-mono font-extrabold uppercase">
                    W/A
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono tracking-widest uppercase text-neutral-400">Iniciar Conversa</span>
                    <span className="text-sm font-semibold text-ink-900">Atendimento via WhatsApp</span>
                  </div>
                </button>

                {/* 4. Location Details */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-slate-50/50">
                  <div className="p-3 rounded-lg bg-ink-900/5 text-ink-900">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono tracking-widest uppercase text-neutral-400">Sede Letiva</span>
                    <span className="text-sm font-semibold text-ink-900">Huambo, Angola</span>
                  </div>
                </div>

              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setCurrentPage('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-ink-900 text-cream-100 hover:bg-ink-900 transition-colors"
                >
                  Ir para Formulário Completo
                </button>
              </div>

            </div>

            {/* Premium Interactive World Map Panel (MultiPlus Global Connection Hub) */}
            <div className="lg:col-span-7 flex flex-col justify-stretch">
              <div className="rounded-3xl overflow-hidden p-3 bg-cream-100 border border-gray-200 flex-1 flex flex-col">
                
                {/* Header widget decor */}
                <div className="px-4 py-3 border-b border-gray-150 flex items-center justify-between text-xs font-mono text-ink-900">
                  <span className="font-semibold flex items-center gap-1.5 uppercase">
                    <Globe size={12} className="text-gold-600 animate-spin-slow" />
                    Plataforma de Conectividade Global
                  </span>
                  <span className="text-neutral-400 text-[9px] uppercase font-bold tracking-wider">Angola Conectada ao Mundo</span>
                </div>

                {/* Highly styled abstract vector world map canvas representing a premium global connect */}
                <div className="flex-grow bg-ink-900 relative p-5 flex flex-col justify-between min-h-[360px] rounded-2xl m-1 border border-slate-800 shadow-inner overflow-hidden">
                  
                  {/* Subtle radial glow effect behind the map */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,155,60,0.12),transparent_70%)] pointer-events-none" />
                  
                  {/* Grid overlay lines to give an institutional/geopolitical digital command feel */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                  {/* Premium World Map vector outlines, elegantly stylized custom shapes */}
                  <svg viewBox="0 0 540 280" className="w-full h-full relative z-10 text-slate-750/60 transition-all select-none opacity-85 animate-fadeIn">
                    
                    {/* Simplified North America Continent Math Vector */}
                    <path d="M40,50 L110,40 L160,50 L150,90 L110,120 L80,125 L50,110 Z" fill="#151D29" stroke="#151D29" strokeWidth="0.5" />
                    <path d="M120,40 L155,25 L180,45 L155,65 Z" fill="#151D29" opacity="0.4" />

                    {/* Simplified South America Continent Math Vector */}
                    <path d="M100,140 L140,135 L165,155 L150,210 L135,255 L120,265 L115,240 L95,170 Z" fill="#151D29" stroke="#151D29" strokeWidth="0.5" />

                    {/* Simplified Eurasia (Europe/Asia) Continent Math Vector */}
                    <path d="M220,50 L280,30 L360,25 L450,30 L490,55 L480,105 L440,115 L430,85 L390,125 L340,120 L320,130 L280,120 L270,90 L240,65 Z" fill="#151D29" stroke="#151D29" strokeWidth="0.5" />
                    <path d="M380,135 L420,130 L445,160 L460,190 L440,210 L400,205 Z" fill="#151D29" opacity="0.6" />

                    {/* Simplified Africa Continent Math Vector (Elegantly aligned) */}
                    <path d="M230,125 L285,115 L320,125 L325,155 L305,210 L280,250 L270,255 L260,230 L250,210 L233,185 Z" fill="#151D29" stroke="#151D29" strokeWidth="0.5" />
                    
                    {/* Australia */}
                    <path d="M440,215 L485,210 L500,235 L475,255 L445,245 Z" fill="#151D29" stroke="#151D29" strokeWidth="0.5" />

                    {/* Premium Connection Pathway Trajectory Arcs (glowing connections) */}
                    <g fill="none" strokeWidth="1.2">
                      {/* Huambo to Lisbon */}
                      <path d="M 270 215 Q 235 155 258 95" stroke="#BB8533" strokeDasharray="4 3" className="animate-pulse" />
                      {/* Huambo to London */}
                      <path d="M 270 215 Q 242 145 275 75" stroke="#BB8533" strokeDasharray="3 3" />
                      {/* Huambo to Houston */}
                      <path d="M 270 215 Q 155 185 110 85" stroke="#151D29" strokeDasharray="5 4" opacity="0.75" />
                      {/* Huambo to Dubai */}
                      <path d="M 270 215 Q 315 175 342 115" stroke="#BB8533" strokeDasharray="4 2" />
                      {/* Huambo to Singapore */}
                      <path d="M 270 215 Q 370 235 440 185" stroke="#151D29" strokeDasharray="6 3" opacity="0.6" />
                    </g>

                    {/* Interceptor Glowing Hub Nodes & Pulsing points */}
                    
                    {/* Houston Node */}
                    <circle cx="110" cy="85" r="3" fill="#151D29" />
                    <circle cx="110" cy="85" r="6" fill="none" stroke="#151D29" strokeWidth="0.5" opacity="0.5" />
                    
                    {/* Lisbon Node */}
                    <circle cx="258" cy="95" r="3" fill="#BB8533" />
                    <circle cx="258" cy="95" r="6" fill="none" stroke="#BB8533" strokeWidth="0.5" opacity="0.6" />

                    {/* London Node */}
                    <circle cx="275" cy="75" r="3" fill="#BB8533" />
                    <circle cx="275" cy="75" r="7" fill="none" stroke="#BB8533" strokeWidth="0.5" opacity="0.6" />

                    {/* Dubai Node */}
                    <circle cx="342" cy="115" r="3" fill="#BB8533" />
                    <circle cx="342" cy="115" r="6" fill="none" stroke="#BB8533" strokeWidth="0.5" opacity="0.5" />

                    {/* Main Sede Hub: Angola (Luanda / Huambo) */}
                    <g className="cursor-pointer">
                      <circle cx="270" cy="215" r="8" fill="none" stroke="#BB8533" strokeWidth="1" className="animate-ping opacity-60" style={{ transformOrigin: '270px 215px' }} />
                      <circle cx="270" cy="215" r="14" fill="none" stroke="#BB8533" strokeWidth="0.5" className="animate-pulse opacity-20" style={{ transformOrigin: '270px 215px' }} />
                      <circle cx="270" cy="215" r="4.5" fill="#BB8533" />
                      <circle cx="270" cy="215" r="1.5" fill="#151D29" />
                    </g>
                    
                    {/* Map Labels with clean styled typography */}
                    <g fill="#A0AEC0" fontSize="7" fontFamily="monospace" letterSpacing="0.5" opacity="0.9">
                      <text x="282" y="219" fill="#BB8533" fontWeight="bold">HUAMBO HUB (AO)</text>
                      <text x="212" y="205" fill="#A0AEC0">LUANDA</text>
                      <text x="186" y="99" fill="#A0AEC0">LISBOA</text>
                      <text x="284" y="73" fill="#A0AEC0">LONDRES</text>
                      <text x="48" y="88" fill="#718096">HOUSTON</text>
                      <text x="350" y="113" fill="#A0AEC0">DUBAI</text>
                    </g>

                  </svg>

                  {/* Dynamic Map Info Card Overlay */}
                  <div className="flex justify-between items-end relative z-20 mt-4 h-auto">
                    
                    {/* Connection Stats Info Box */}
                    <div className="bg-ink-900/95 border border-gold-600/35 rounded-xl p-3 shadow-lg max-w-[270px] text-left backdrop-blur-sm">
                      <span className="text-[7.5px] font-mono font-black text-gold-600 block tracking-widest uppercase">Rede Académica Global</span>
                      <h4 className="text-xs font-serif font-black text-cream-100 mt-1 leading-normal m-0 mb-0.5">Sede Central do Huambo</h4>
                      <p className="text-[9px] text-cream-100/70 leading-relaxed font-sans mt-0.5 m-0">
                        Capacitação linguística de elite conectando profissionais angolanos aos principais centros jurídicos, energéticos e comerciais mundiais.
                      </p>
                    </div>

                    {/* Institutional stamp badge */}
                    <div className="bg-ink-900/80 border border-slate-700/80 rounded-lg py-1 px-2.5 text-[8px] font-mono text-cream-100/60 tracking-wider">
                      MULTIPLUS ACADEMY • PROJEÇÃO 2026
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
