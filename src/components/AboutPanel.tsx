import { motion } from 'motion/react';
import { PageId } from '../types';
import { MAIN_INSTRUCTOR } from '../data';
import { GlobeInteractive } from './ui/cobe-globe-interactive';
import StarBorder from './ui/StarBorder';
import { 
  Compass, 
  Flag, 
  Scale, 
  Award, 
  GraduationCap, 
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
      icon: <Award className="w-6 h-6 text-[#C89B3C]" />,
      title: 'Rigor Académico',
      description: 'Ensinamos de acordo com os padrões técnicos de proficiência internacional aplicáveis de forma global.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#C89B3C]" />,
      title: 'Integridade Jurídica',
      description: 'Alinhamos a linguagem prática às normas vigentes, respeitando a ética em transações soberanas.'
    },
    {
      icon: <Compass className="w-6 h-6 text-[#C89B3C]" />,
      title: 'Foco no Aluno',
      description: 'Acompanhamento pessoal do crescimento linguístico de cada formando e workshops específicos.'
    },
    {
      icon: <LineChart className="w-6 h-6 text-[#C89B3C]" />,
      title: 'Pragmatismo Comercial',
      description: 'Aulas moldadas em estudos de caso e elaboração de contratos comerciais de aplicação direta.'
    }
  ];

  return (
    <div id="about-panel-root" className="bg-white text-slate-800 pt-10 pb-16">
      
      {/* Editorial Header Section */}
      <section className="py-20 relative bg-slate-50 border-b border-slate-100 overflow-hidden">
        
        {/* Abstract structural guidelines design background */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-[#C89B3C]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Nossa Identidade</span>
          
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight max-w-3xl mx-auto text-slate-900 leading-tight">
            Transformando Competências em Oportunidades Reais
          </h1>
          
          <div className="w-16 h-1 bg-[#C89B3C] mx-auto my-6 rounded" />
          
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            A MultiPlus Academy nasceu para fazer a ponte perfeita entre o conhecimento académico vernáculo e os cenários globais de negociação jurídica e corporativa em Angola.
          </p>
        </div>
      </section>

      {/* 2. HISTORY / ORIGIN (Alternate layout with precious negative space) */}
      <section className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left side: Premium Image/Concept frame */}
            <div className="lg:col-span-5">
              <StarBorder
                as="div"
                speed="8s"
                thickness={2}
                className="w-full rounded-3xl overflow-hidden shadow-sm"
                innerClassName="relative z-1 p-2 bg-slate-50 rounded-3xl overflow-hidden aspect-square flex flex-col justify-between w-full"
              >
                <div className="flex-1 bg-white rounded-2xl border border-slate-100 relative p-8 flex flex-col justify-between overflow-hidden">
                  
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,155,60,0.04),transparent_50%)]" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs font-mono tracking-widest text-[#C89B3C] bg-slate-50 px-2.5 py-1 rounded-md uppercase font-bold border border-slate-200/50">HISTÓRICO</span>
                    <Scale size={20} className="text-[#C89B3C]" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <span className="text-6xl font-serif font-bold text-slate-200 block leading-none">2026</span>
                    <h3 className="text-xl font-serif font-semibold text-slate-900 leading-tight">Uma Visão Global em Solo Angolano</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Idealizada a partir da centralidade do Huambo para atender escritórios nacionais e transnacionais com suporte e rigor superiores.
                    </p>
                  </div>

                </div>
              </StarBorder>
            </div>

            {/* Right side: Prose text with high-end margins */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">As Origens</span>
              <h2 className="text-3xl font-serif font-black text-slate-900">História da MultiPlus Academy</h2>
              
              <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-sans">
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
      <section className="py-24 bg-slate-50/50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            
            {/* Missão Card */}
            <StarBorder
              as="div"
              speed="6s"
              thickness={1.5}
              className="rounded-3xl overflow-hidden shadow-sm"
              innerClassName="relative z-1 bg-white p-10 rounded-3xl overflow-hidden flex flex-col justify-between w-full h-full"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B3C]/5 rounded-full pointer-events-none" />
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#C89B3C]">
                  <Flag size={20} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900">Nossa Missão</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  Desenvolver e elevar as capacidades profissionais dos juristas, advogados e executivos em Angola através do ensino altamente rigoroso do Inglês Jurídico especializado, fomentando a inclusão de excelência do nosso mercado de trabalho no cenário diplomático e corporativo internacional.
                </p>
              </div>
            </StarBorder>

            {/* Visão Card */}
            <StarBorder
              as="div"
              speed="7s"
              thickness={1.5}
              className="rounded-3xl overflow-hidden shadow-sm"
              innerClassName="relative z-1 bg-white p-10 rounded-3xl overflow-hidden flex flex-col justify-between w-full h-full"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full pointer-events-none" />
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#C89B3C]">
                  <Compass size={20} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900">Nossa Visão</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  Ser reconhecida no mercado de Angola e das Nações de Expressão Portuguesa como a instituição de elite de referência máxima no ensino especializado de linguística aplicada ao direito comparado, estendendo a nossa operação para um sistema integrado de ensino LMS no futuro.
                </p>
              </div>
            </StarBorder>

          </div>

          {/* Section: Core Values */}
          <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Pilares De Carreira</span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">Valores Fundamentais</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <StarBorder
                key={i}
                as="div"
                speed={`${6 + i}s`}
                thickness={1}
                className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                innerClassName="relative z-1 p-6 bg-white rounded-2xl overflow-hidden text-left flex flex-col justify-between space-y-4 w-full h-full"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#C89B3C]">
                  {v.icon}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-base">{v.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans mt-2">{v.description}</p>
                </div>
              </StarBorder>
            ))}
          </div>

        </div>
      </section>

      {/* INTERACTIVE GLOBAL REACH GLOBE */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Subtle decorative gold light */}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#C89B3C]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Col: Globe component with customizable width */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <div className="w-full max-w-[360px] sm:max-w-[420px] aspect-square rounded-full border border-slate-800/80 bg-slate-950/40 p-4 relative shadow-2xl">
                <GlobeInteractive 
                  speed={0.004}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Right Col: Descriptive details */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C] block">Estratégia e Conexões Transnacionais</span>
              <h3 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white leading-tight m-0">Nossas Pontes com os Grandes Hubs Globais</h3>
              <p className="text-sm text-slate-400 font-sans leading-relaxed m-0">
                A prática jurídica de elite em Angola não ocorre isoladamente. Ao dominar as estruturas linguísticas do inglês jurídico, o profissional de Angola ganha autoridade direta perante clientes e investidores sediados nos maiores polos corporativos mundiais.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex gap-4 items-start">
                  <div className="text-[#C89B3C] font-mono text-sm font-bold mt-0.5">01/</div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white mb-1">Setor de Recursos e Mineração</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans m-0">Intercâmbio terminológico direto com as bolsas de valores de Londres e hubs petrolíferos de Houston.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="text-[#C89B3C] font-mono text-sm font-bold mt-0.5">02/</div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white mb-1">Conformidade Regulatória Sino-Angolana</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans m-0">Preparações rigorosas para lidar com joint-ventures financeiras e acordos bilaterais estruturados de infraestrutura.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. EQUIPA ACADÉMICA / DIRECTORS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Corpo Docente Coordenador</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">Nossa Equipa Científica</h3>
            <p className="text-sm text-slate-600 max-w-xl mx-auto font-sans">
              Reunimos especialistas credenciados focados unicamente na transferência de saberes de alta sofisticação profissional.
            </p>
          </div>

          {/* Grid de Formadores (Prepared for future expansion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto items-stretch">
            
            {/* Member 1: Esmeralda Sumbelelo */}
            <StarBorder
              as="div"
              speed="8s"
              thickness={1.5}
              className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              innerClassName="relative z-1 bg-white rounded-3xl overflow-hidden flex flex-col w-full h-full text-left"
            >
              <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden flex items-center justify-center pt-6 border-b border-slate-100">
                <img
                  src={MAIN_INSTRUCTOR.photo}
                  alt={MAIN_INSTRUCTOR.name}
                  className="h-full w-full object-cover object-top hover:scale-[1.02] transition-all duration-700 max-h-[300px]"
                />
                
                <div className="absolute top-4 right-4 bg-[#0A2E5D] text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow border border-white/10">
                  Direção Letiva
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xl font-serif font-bold text-slate-900">{MAIN_INSTRUCTOR.name}</h4>
                  <p className="text-xs text-[#C89B3C] font-bold tracking-wide uppercase font-mono mt-1">Diretora Pedagógica & Tradutora ATIA</p>
                  <p className="text-xs text-slate-600 font-sans mt-3 leading-relaxed">
                    Com mais de 15 anos ensinando em renomadas instituições como FISK e ISCED, coordena as diretrizes científicas do curso de elite de Legal English em Angola.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-400">15+ Anos de Carreira</span>
                  <button 
                    onClick={() => setCurrentPage('instructors')} 
                    className="text-[#0A2E5D] font-bold uppercase tracking-wider font-mono hover:text-[#C89B3C] text-[10px] transition-colors"
                  >
                    Ver Portfolio completo
                  </button>
                </div>
              </div>
            </StarBorder>

            {/* Member 2 Future placeholder slot */}
            <StarBorder
              as="div"
              speed="10s"
              thickness={1.5}
              className="rounded-3xl overflow-hidden"
              innerClassName="relative z-1 bg-slate-50/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 w-full h-full"
            >
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-slate-200 text-[#C89B3C] shadow-sm">
                <GraduationCap size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-serif font-bold text-slate-900/80">Vaga letiva em aberto</h4>
                <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mx-auto">
                  A nossa assessoria académica está a selecionar formadores associados em Luanda e no Huambo, com certificações internacionais de Ensino Jurídico.
                </p>
              </div>
              
              <StarBorder
                as="button"
                onClick={() => setCurrentPage('contact')}
                speed="6s"
                thickness={1.5}
                className="rounded-lg overflow-hidden cursor-pointer"
                innerClassName="relative z-1 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[10px] font-mono font-bold uppercase rounded-lg tracking-wider transition-all shadow-sm"
              >
                Candidatar Corpo Docente
              </StarBorder>
            </StarBorder>

          </div>

        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-20 relative bg-[#0A2E5D] text-white text-center border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase">Consolidação Letiva</span>
          <h3 className="text-3xl font-serif font-bold text-white">Preparado para Elevar o Seu Patamar Profissional?</h3>
          <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            As turmas para o curso inaugural de Inglês para o Setor Jurídico em Angola contam com assentos estritamente geridos. Registe o seu interesse pedagógico.
          </p>
          <div className="pt-4 flex justify-center">
            <StarBorder
              as="button"
              onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              speed="5s"
              thickness={2.5}
              className="rounded-xl overflow-hidden cursor-pointer"
              innerClassName="relative z-1 px-8 py-3.5 bg-[#C89B3C] hover:bg-[#B3852C] text-white rounded-xl uppercase tracking-wider text-xs font-bold transition-all"
            >
              Iniciar Negociação de Vaga
            </StarBorder>
          </div>
        </div>
      </section>

    </div>
  );
}
