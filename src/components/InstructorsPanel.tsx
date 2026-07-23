import { useState } from 'react';
import { motion } from 'motion/react';
import { MAIN_INSTRUCTOR } from '../data';
import { PageId } from '../types';
import StarBorder from './ui/StarBorder';
import { 
  Award, 
  MapPin, 
  CheckCircle, 
  BookOpen, 
  Heart,
  Clock,
  ArrowRight
} from 'lucide-react';

interface InstructorsPanelProps {
  setCurrentPage: (page: PageId) => void;
}

export default function InstructorsPanel({ setCurrentPage }: InstructorsPanelProps) {
  const [likeCount, setLikeCount] = useState(132);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/244956449084?text=Ol%C3%A1%2C+gostaria+de+falar+com+a+diretoria+pedag%C3%B3gica+da+MultiPlus+Academy...`, '_blank');
  };

  const currentTeacher = MAIN_INSTRUCTOR;

  return (
    <div id="instructors-panel-root" className="bg-white text-slate-800 pt-10 pb-16">
      
      {/* Banner portion */}
      <section className="py-16 bg-slate-50 text-slate-900 text-center relative border-b border-slate-200">
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#C89B3C_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Língua e Jurisprudência</span>
          <h1 className="text-4xl font-serif font-black tracking-tight mt-0 text-slate-900 leading-tight">Corpo Docente Coordenador</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Formadores selecionados sob criteriosa avaliação pedagógica linguística e currículo corporativo no cenário angolano.
          </p>
        </div>
      </section>

      {/* Structured Teacher Portfolio Layout */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Column Left: Visual Premium Frame */}
            <div className="lg:col-span-5 space-y-6">
                     <StarBorder
                as="div"
                speed="8s"
                thickness={2}
                className="rounded-3xl overflow-hidden shadow-xs"
                innerClassName="relative z-1 p-4 bg-slate-50 rounded-3xl overflow-hidden w-full h-full"
              >
                <div className="aspect-[4/5] rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200/50">
                  <img
                    src={currentTeacher.photo}
                    alt={currentTeacher.name}
                    className="w-full h-full object-cover object-top hover:scale-[1.02] transition-all duration-700"
                  />
                  
                  {/* Decorative modern light gradients inside photo bounds */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-80" />
                  
                  {/* Absolute location marker */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-white/90 backdrop-blur-md rounded-xl p-3 border border-slate-200 text-slate-800 shadow-sm">
                    <div>
                      <span className="block text-[8px] font-mono tracking-wider text-slate-400 uppercase">Atuação Geográfica</span>
                      <span className="text-xs font-bold flex items-center gap-1 text-slate-900">
                        <MapPin size={10} className="text-[#C89B3C]" />
                        Huambo & Luanda Hubs
                      </span>
                    </div>

                    <StarBorder
                      as="button"
                      onClick={handleWhatsApp}
                      speed="5s"
                      thickness={1.5}
                      className="rounded-lg overflow-hidden cursor-pointer"
                      innerClassName="relative z-1 px-3 py-1.5 bg-[#C89B3C] text-white text-[9px] font-bold rounded-lg hover:bg-[#B3852C] transition-colors uppercase tracking-wider"
                    >
                      Consultar
                    </StarBorder>
                  </div>
                </div>
              </StarBorder>

              {/* Endorsements / Metrics frame */}
              <StarBorder
                as="div"
                speed="10s"
                thickness={1.5}
                className="rounded-2xl overflow-hidden shadow-sm"
                innerClassName="relative z-1 bg-white p-6 rounded-2xl overflow-hidden flex items-center justify-between w-full h-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#C89B3C]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">Período de Ensino</span>
                    <span className="text-sm font-bold text-slate-900">{currentTeacher.experienceYears} Anos Letivos</span>
                  </div>
                </div>

                <StarBorder
                  as="button"
                  onClick={handleLike}
                  speed="5s"
                  thickness={1}
                  className="rounded-lg overflow-hidden cursor-pointer"
                  innerClassName={`relative z-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    liked 
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={liked ? 'scale-110' : ''} />
                  Recomendado ({likeCount})
                </StarBorder>
              </StarBorder>
            </div>

            {/* Column Right: Complete Curriculum Credentials Narrative */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              <div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C] mb-2 block">
                  {currentTeacher.role}
                </span>
                <h2 className="text-3xl font-serif font-black text-slate-900 m-0">
                  {currentTeacher.name}
                </h2>
              </div>

              {/* Biography Section */}
              <div className="space-y-3">
                <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Biografia Científica</span>
                <p className="text-sm text-slate-600 leading-relaxed font-sans m-0 font-medium">
                  {currentTeacher.bio}
                </p>
              </div>

              {/* Expertise Area Badges */}
              <div className="space-y-3">
                <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Especializações Pedagógicas</span>
                <div className="flex flex-wrap gap-2">
                  {currentTeacher.specializations.map((spec, idx) => (
                    <StarBorder
                      key={idx}
                      as="span"
                      speed="6s"
                      thickness={1}
                      className="rounded-lg overflow-hidden shadow-2xs"
                      innerClassName="relative z-1 px-3 py-1.5 bg-slate-50 text-xs text-slate-800 font-bold font-sans"
                    >
                      {spec}
                    </StarBorder>
                  ))}
                </div>
              </div>

              {/* Credentials Outline */}
              <div className="space-y-4">
                <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Títulos e Credenciais de Registro</span>
                
                <div className="space-y-3">
                  {currentTeacher.credentials.map((cred, idx) => (
                    <StarBorder
                      key={idx}
                      as="div"
                      speed="8s"
                      thickness={1}
                      className="rounded-xl overflow-hidden shadow-2xs"
                      innerClassName="relative z-1 flex items-start gap-3 text-sm text-slate-600 bg-white p-4 rounded-xl hover:border-[#C89B3C]/30 transition-all w-full text-left"
                    >
                      <CheckCircle size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-sans leading-relaxed block font-semibold text-slate-700">{cred}</span>
                      </div>
                    </StarBorder>
                  ))}
                </div>
              </div>

              {/* Institutions associated layout */}
              <div className="pt-6 border-t border-slate-200">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">Presença Letiva e Académica Associada</span>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-500 font-bold">
                  {currentTeacher.institutions.map((inst, idx) => (
                    <StarBorder
                      key={idx}
                      as="span"
                      speed="10s"
                      thickness={1}
                      className="rounded border border-slate-200 shadow-3xs overflow-hidden"
                      innerClassName="relative z-1 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1"
                    >
                      <BookOpen size={12} className="text-[#C89B3C]" />
                      {inst}
                    </StarBorder>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Advisory Call for Corporations */}
      <section className="py-20 relative bg-slate-50 border-t border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase">Curso Especial In-Company</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 m-0 leading-tight">Formação Corporativa de Diretores</h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Personalizamos a grade curricular do idioma jurídico de acordo com as transações ou auditorias correntes do seu escritório. Agende uma consultoria com a coordenação.
          </p>
          
          <div className="flex justify-center">
            <StarBorder
              as="button"
              onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              speed="5s"
              thickness={2.5}
              className="rounded-xl overflow-hidden cursor-pointer"
              innerClassName="relative z-1 px-8 py-3.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-xl uppercase tracking-wider text-xs font-bold transition-all shadow-md"
            >
              Formular Requisito In-Company
            </StarBorder>
          </div>
        </div>
      </section>

    </div>
  );
}
