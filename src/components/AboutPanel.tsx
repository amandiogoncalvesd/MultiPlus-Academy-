import { motion } from 'motion/react';
import { PageId } from '../types';
import { MAIN_INSTRUCTOR } from '../data';
import { 
  Compass, 
  Flag, 
  Scale, 
  Award, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  LineChart 
} from 'lucide-react';

interface AboutPanelProps {
  setCurrentPage: (page: PageId) => void;
}

export default function AboutPanel({ setCurrentPage }: AboutPanelProps) {
  
  // Custom Academic Values
  const values = [
    {
      icon: <Award className="w-6 h-6 text-gold-600" />,
      title: 'Rigor Académico',
      description: 'Ensinamos de acordo com os padrões técnicos de proficiência internacional aplicáveis de forma global.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-gold-600" />,
      title: 'Integridade Jurídica',
      description: 'Alinhamos a linguagem prática às normas vigentes, respeitando a ética em transações soberanas.'
    },
    {
      icon: <Compass className="w-6 h-6 text-gold-600" />,
      title: 'Foco no Aluno',
      description: 'Acompanhamento pessoal do crescimento linguístico de cada formando e workshops específicos.'
    },
    {
      icon: <LineChart className="w-6 h-6 text-gold-600" />,
      title: 'Pragmatismo Comercial',
      description: 'Aulas moldadas em estudos de caso e elaboração de contratos comerciais de aplicação direta.'
    }
  ];

  return (
    <div id="about-panel-root" className="bg-cream-100 text-[#1C1C1C] pt-24 pb-16">
      
      {/* Editorial Header Section */}
      <section className="py-20 relative bg-gradient-to-b from-ink-900 to-sky-950 text-cream-100 overflow-hidden">
        
        {/* Abstract structural guidelines design background */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#BB8533_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-gold-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600">Nossa Identidade</span>
          
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight max-w-3xl mx-auto">
            Transformando Competências em Oportunidades Reais
          </h1>
          
          <div className="w-16 h-1 bg-gold-600 mx-auto my-6 rounded" />
          
          <p className="text-sm sm:text-base text-cream-100/70 max-w-2xl mx-auto leading-relaxed font-sans">
            A MultiPlus Academy nasceu para fazer a ponte perfeita entre o conhecimento académico vernáculo e os cenários globais de negociação jurídica e corporativa em Angola.
          </p>
        </div>
      </section>

      {/* 2. HISTORY / ORIGIN (Alternate layout with precious negative space) */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left side: Premium Image/Concept frame */}
            <div className="lg:col-span-5">
              <div className="relative p-2 bg-cream-100 border border-gray-150 rounded-3xl shadow-sm overflow-hidden aspect-square flex flex-col justify-between">
                <div className="flex-1 bg-gradient-to-tr from-ink-900 to-ink-900 rounded-2xl relative p-8 flex flex-col justify-between overflow-hidden">
                  
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,155,60,0.15),transparent_50%)]" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs font-mono tracking-widest text-gold-600 bg-cream-100/10 px-2.5 py-1 rounded-md uppercase font-bold">HISTÓRICO</span>
                    <Scale size={20} className="text-gold-600" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <span className="text-6xl font-serif font-bold text-cream-100/10 block leading-none">2026</span>
                    <h3 className="text-xl font-serif font-semibold text-cream-100 leading-tight">Uma Visão Global em Solo Angolano</h3>
                    <p className="text-xs text-cream-100/60 leading-relaxed font-sans">
                      Idealizada a partir da centralidade do Huambo para atender escritórios nacionais e transnacionais com suporte e rigor superiores.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Right side: Prose text with high-end margins */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600">As Origens</span>
              <h2 className="text-3xl font-serif font-black text-ink-900">História da MultiPlus Academy</h2>
              
              <div className="space-y-4 text-sm text-[#1C1C1C]/75 leading-relaxed font-sans">
                <p>
                  O cenário de captação de investimento estrangeiro de Angola está a expandir-se substancialmente. O desenvolvimento do setor aduaneiro, a consolidação regulatória da exploração de minas e as transações de Conteúdo Local no ramo petrolífero desencadearam um novo paradigma profissional.
                </p>
                <p>
                  Surgia, então, uma constatação crítica: advogados brilhantes e gestores jurídicos de classe nacional viam as suas carreiras limitadas em reuniões internacionais pela falta de vocabulário específico das convenções de <strong>Common Law</strong>. 
                </p>
                <p>
                  A MultiPlus Academy foi fundada para sanar essa lacuna de capacitação técnica. O nosso foco não reside no ensino do inglês primário ou de conversação recreativa, mas sim na robustez da oratória jurídica formal e no treino refinado de <strong>Technical Drafting</strong>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MISSÃO, VISÃO E VALORES (Beautiful clean columns layout) */}
      <section className="py-24 bg-gradient-to-b from-[#F2E5D7] to-[#ECECE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            
            {/* Missão Card */}
            <div className="neo-card p-10 rounded-3xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/5 rounded-full pointer-events-none" />
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-ink-900/5 flex items-center justify-center text-gold-600">
                  <Flag size={20} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-ink-900">Nossa Missão</h3>
                <p className="text-sm text-[#1C1C1C]/80 leading-relaxed font-sans">
                  Desenvolver e elevar as capacidades profissionais dos juristas, advogados e executivos em Angola através do ensino altamente rigoroso do Inglês Jurídico especializado, fomentando a inclusão de excelência do nosso mercado de trabalho no cenário diplomático e corporativo internacional.
                </p>
              </div>
            </div>

            {/* Visão Card */}
            <div className="neo-card p-10 rounded-3xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ink-900/5 rounded-full pointer-events-none" />
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-ink-900/5 flex items-center justify-center text-gold-600">
                  <Compass size={20} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-ink-900">Nossa Visão</h3>
                <p className="text-sm text-[#1C1C1C]/80 leading-relaxed font-sans">
                  Ser reconhecida no mercado de Angola e das Nações de Expressão Portuguesa como a instituição de elite de referência máxima no ensino especializado de linguística aplicada ao direito comparado, estendendo a nossa operação para um sistema integrado de ensino LMS no futuro.
                </p>
              </div>
            </div>

          </div>

          {/* Section: Core Values */}
          <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600">Pilares De Carreira</span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900">Valores Fundamentais</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="p-6 bg-cream-100 border border-gray-100 rounded-2xl shadow-sm text-left flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-ink-900/5 flex items-center justify-center text-gold-600">
                  {v.icon}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-ink-900 text-base">{v.title}</h4>
                  <p className="text-xs text-[#1C1C1C]/70 leading-relaxed font-sans mt-2">{v.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. EQUIPA ACADÉMICA / DIRECTORS */}
      <section className="py-24 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600">Corpo Docente Coordenador</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-black text-ink-900">Nossa Equipa Científica</h3>
            <p className="text-sm text-[#1C1C1C]/70 max-w-xl mx-auto font-sans">
              Reunimos especialistas credenciados focado unicamente na transferência de saberes de alta sofisticação profissional.
            </p>
          </div>

          {/* Grid de Formadores (Prepared for future expansion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto items-stretch">
            
            {/* Member 1: Esmeralda Sumbelelo */}
            <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-[4/3] bg-gradient-to-b from-ink-900 to-sky-950 relative overflow-hidden flex items-center justify-center pt-6">
                <img
                  src={MAIN_INSTRUCTOR.photo}
                  alt={MAIN_INSTRUCTOR.name}
                  className="h-full w-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-700 max-h-[300px]"
                />
                
                <div className="absolute top-4 right-4 bg-gold-600 text-cream-100 font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow">
                  Direção Letiva
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xl font-serif font-bold text-ink-900">{MAIN_INSTRUCTOR.name}</h4>
                  <p className="text-xs text-gold-600 font-semibold tracking-wide uppercase font-mono mt-1">Diretora Pedagógica & Tradutora ATIA</p>
                  <p className="text-xs text-[#1C1C1C]/75 font-sans mt-3 leading-relaxed">
                    Com mais de 15 anos ensinando em renomadas instituições como FISK e ISCED, coordena as diretrizes científicas do curso de elite de Legal English em Angola.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="font-mono text-neutral-400">15+ Anos de Carreira</span>
                  <button 
                    onClick={() => setCurrentPage('instructors')} 
                    className="text-ink-900 font-bold uppercase tracking-wider font-mono hover:text-gold-600 text-[10px] transition-colors"
                  >
                    Ver Portfolio completo
                  </button>
                </div>
              </div>
            </div>

            {/* Member 2 Future placeholder slot */}
            <div className="bg-gray-100/50 border border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-200/50 flex items-center justify-center border border-gray-300/30 text-gold-600">
                <GraduationCap size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-serif font-bold text-ink-900/60">Vaga letiva em aberto</h4>
                <p className="text-xs text-[#1C1C1C]/50 max-w-[240px] leading-relaxed mx-auto">
                  A nossa assessoria académica está a selecionar formadores associados em Luanda e no Huambo, com certificações internacionais de Ensino Jurídico.
                </p>
              </div>
              
              <button 
                onClick={() => setCurrentPage('contact')} 
                className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-ink-900 border border-gray-200 text-[10px] font-mono font-bold uppercase rounded-lg tracking-wider transition-all"
              >
                Candidatar Corpo Docente
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-20 relative bg-gradient-to-br from-ink-900 to-ink-900 text-cream-100 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest text-gold-600 uppercase">Consolidação Letiva</span>
          <h3 className="text-3xl font-serif font-bold text-cream-100">Preparado para Elevar o Seu Patamar Profissional?</h3>
          <p className="text-sm text-cream-100/70 max-w-xl mx-auto leading-relaxed">
            As turmas para o curso inaugural de Inglês para o Setor Jurídico em Angola contam com assentos estritamente geridos. Registe o seu interesse pedagógico.
          </p>
          <div className="pt-4">
            <button
              onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-8 py-3.5 bg-gold-600 hover:bg-gold-600 text-cream-100 rounded-xl uppercase tracking-wider text-xs font-bold transition-all shadow-[0_4px_12px_rgba(200,155,60,0.25)]"
            >
              Iniciar Negociação de Vaga
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
