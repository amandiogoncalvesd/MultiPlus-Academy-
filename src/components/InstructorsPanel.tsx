import { useState } from 'react';
import { motion } from 'motion/react';
import { MAIN_INSTRUCTOR } from '../data';
import { PageId } from '../types';
import { 
  Award, 
  MapPin, 
  CheckCircle, 
  Users, 
  BookOpen, 
  Briefcase, 
  Globe, 
  Mail, 
  Phone,
  Heart,
  Clock
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
    <div id="instructors-panel-root" className="bg-[#F8F8F6] text-[#1C1C1C] pt-24 pb-16">
      
      {/* Banner portion */}
      <section className="py-16 bg-[#0A2E5D] text-white text-center relative border-b border-[#C89B3C]/20">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#FFF_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Língua e Jurisprudência</span>
          <h1 className="text-4xl font-serif font-black tracking-tight mt-0">Corpo Docente Coordenador</h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto">
            Formadores selecionados sobre criteriosa avaliação pedagógica linguística e currículo corporativo no cenário angolano.
          </p>
        </div>
      </section>

      {/* Structured Teacher Portfolio Layout */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Column Left: Visual Premium Frame */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="neo-card p-4 rounded-3xl bg-white border border-gray-150">
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-b from-[#0A2E5D] to-black overflow-hidden relative">
                  <img
                    src={currentTeacher.photo}
                    alt={currentTeacher.name}
                    className="w-full h-full object-cover object-top filter grayscale hover:grayscale-0 transition-all duration-700"
                  />
                  
                  {/* Decorative modern light gradients inside photo bounds */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2E5D]/80 via-transparent to-transparent opacity-80" />
                  
                  {/* Absolute location marker */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-white">
                    <div>
                      <span className="block text-[8px] font-mono tracking-wider text-white/50 uppercase">Atuação Geográfica</span>
                      <span className="text-xs font-semibold flex items-center gap-1">
                        <MapPin size={10} className="text-[#C89B3C]" />
                        Huambo & Luanda Hubs
                      </span>
                    </div>

                    <button
                      onClick={handleWhatsApp}
                      className="px-2.5 py-1.5 bg-[#C89B3C] text-white text-[9px] font-bold rounded hover:bg-[#D4A747] transition-colors uppercase tracking-wider"
                    >
                      Consultar
                    </button>
                  </div>
                </div>
              </div>

              {/* Endorsements / Metrics frame */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A2E5D]/5 flex items-center justify-center text-[#C89B3C]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-gray-400 uppercase">Período de Ensino</span>
                    <span className="text-sm font-bold text-[#0A2E5D]">{currentTeacher.experienceYears} Anos Letivos</span>
                  </div>
                </div>

                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    liked 
                      ? 'bg-red-50 text-red-500 border border-red-100'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={liked ? 'scale-110' : ''} />
                  Recomendado ({likeCount})
                </button>
              </div>

            </div>

            {/* Column Right: Complete Curriculum Credentials Narrative */}
            <div className="lg:col-span-7 space-y-8">
              
              <div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C] mb-2 block">
                  {currentTeacher.role}
                </span>
                <h2 className="text-3xl font-serif font-black text-[#0A2E5D]">
                  {currentTeacher.name}
                </h2>
              </div>

              {/* Biography Section */}
              <div className="space-y-4">
                <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Biografia Científica</span>
                <p className="text-sm text-gray-600 leading-relaxed font-sans">
                  {currentTeacher.bio}
                </p>
              </div>

              {/* Expertise Area Badges */}
              <div className="space-y-3">
                <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Especializações Pedagógicas</span>
                <div className="flex flex-wrap gap-2">
                  {currentTeacher.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-[#0A2E5D]/5 border border-[#0A2E5D]/10 text-xs text-[#0A2E5D] font-medium font-sans"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Credentials Outline */}
              <div className="space-y-4">
                <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Títulos e Credenciais de Registro</span>
                
                <div className="space-y-3">
                  {currentTeacher.credentials.map((cred, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-[#C89B3C]/35 transition-colors">
                      <CheckCircle size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-sans leading-relaxed block">{cred}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutions associated layout */}
              <div className="pt-4 border-t border-gray-200">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Presença Letiva e Académica Associada</span>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                  {currentTeacher.institutions.map((inst, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <BookOpen size={12} className="text-[#C89B3C]" />
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Advisory Call for Corporations */}
      <section className="py-20 relative bg-gradient-to-b from-white to-[#ECECE8] border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase">Curso Especial In-Company</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#0A2E5D]">Formação Corporativa de Diretores</h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Personalizamos a grade curricular do idioma jurídico de acordo com as transações ou auditorias correntes do seu escritório. Agende uma consultoria com a coordenação.
          </p>
          
          <button
            onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-8 py-3.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-xl uppercase tracking-wider text-xs font-bold transition-all shadow-md"
          >
            Formular Requisito In-Company
          </button>
        </div>
      </section>

    </div>
  );
}
