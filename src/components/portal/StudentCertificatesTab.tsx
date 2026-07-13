import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Lock,
  QrCode,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { User, PageId } from '../../types';
import StarBorder from '../ui/StarBorder';

interface StudentCertificatesTabProps {
  currentUser: User | null;
  setCurrentPage: (page: PageId) => void;
  setVerificationCode: (code: string) => void;
}

export default function StudentCertificatesTab({ 
  currentUser,
  setCurrentPage,
  setVerificationCode
}: StudentCertificatesTabProps) {
  const studentFull = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Doutor Aluno';
  const isCompletedUser = currentUser?.email.includes('antonio') || false; // Dr. Antonio starts completed
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const certificates = [
    {
      id: 'cert_1',
      title: 'English for the Legal Field in Angola',
      level: 'CEFR C1 • Professional Proficiency',
      serial: 'MPA-2026-001',
      issueDate: '07 de Junho de 2026',
      unlocked: true,
      signature: 'Prof. Esmeralda Sumbelelo'
    },
    {
      id: 'cert_2',
      title: 'Advanced Legal Writing & Contract Drafting',
      level: 'CEFR C1 • Practical Masterclass',
      serial: 'MPA-2026-009',
      issueDate: 'Pendente',
      unlocked: isCompletedUser, // unlocked if completed
      signature: 'Prof. Esmeralda Sumbelelo'
    }
  ];

  const triggerExport = (id: string, title: string) => {
    setDownloadingId(id);
    setExportMessage("Processando dados e assinaturas digitais da gerência...");
    setTimeout(() => {
      setExportMessage("Gerando PDF com carimbo jurídico estrito...");
      setTimeout(() => {
        setDownloadingId(null);
        setExportMessage(null);
        alert(`Parabéns! O seu certificado em "${title}" foi exportado localmente com sucesso.\nCódigo Hash de Identificação: MPA-2026-001-A6`);
      }, 1500);
    }, 1200);
  };

  const handleVerifyOnPortal = (serial: string) => {
    setVerificationCode(serial);
    setCurrentPage('verify-certificate');
  };

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header Banner */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,155,60,0.04),transparent_60%)] pointer-events-none" />
        <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Acreditação Letiva CEFR</span>
        <h3 className="text-xl font-serif font-black text-ink-900 dark:text-cream-100 m-0">Meus Certificados Autenticados</h3>
        <p className="text-xs text-neutral-400 mt-1">Todos os diplomas emitidos integram códigos de validação seguros interligados ao sistema de exames.</p>
      </div>

      {exportMessage && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse relative z-10">
          <ShieldCheck size={14} className="text-gold-600" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Grid of Certificates Card lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {certificates.map(cert => {
          if (cert.unlocked) {
            return (
              <StarBorder 
                key={cert.id}
                as="div"
                speed="8s"
                thickness={1.5}
                color="#C89B3C"
                className="rounded-3xl overflow-hidden shadow-xl"
                innerClassName="bg-[#0e141f] p-6 text-left text-cream-100 flex flex-col justify-between min-h-[380px] w-full relative"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-600/10 rounded-full blur-xl pointer-events-none" />

                {/* Top row */}
                <div className="flex justify-between items-start border-b border-white/10 pb-4 w-full">
                  <div>
                    <span className="text-gold-600 text-[9px] font-mono tracking-widest uppercase font-bold block mb-1">
                      MULTIPLUS ACADEMY • ANGOLA
                    </span>
                    <span className="text-xs font-mono text-neutral-400 font-semibold block">{cert.level}</span>
                  </div>
                  
                  <div className="p-1.5 bg-gold-600 rounded-lg text-slate-950 text-3xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 select-none shrink-0">
                    <CheckCircle2 size={10} />
                    <span>Emitido</span>
                  </div>
                </div>

                {/* Core certificate name */}
                <div className="py-4 space-y-4 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase">CERTIFICA-SE QUE</span>
                    <h4 className="text-lg sm:text-xl font-serif font-bold text-cream-100 tracking-wide m-0 italic">
                      {studentFull}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 block uppercase">CONCLUIU COM ÊXITO O PROGRAMA ACADÉMICO</span>
                    <p className="text-sm font-serif font-black text-gold-600 m-0">
                      {cert.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono pt-2">
                    <div>
                      <span className="text-neutral-400 block text-[8px] uppercase">DATA DE EMISSÃO</span>
                      <span className="text-cream-100 font-bold">{cert.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[8px] uppercase">CÓDIGO DE REGISTO</span>
                      <span className="text-cream-100 font-bold">{cert.serial}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions footer */}
                <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-cream-100 rounded flex items-center justify-center shrink-0">
                      <QrCode size={36} className="text-slate-950" />
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-neutral-400 block tracking-widest uppercase">AUTENTICAÇÃO INTEGRAL</span>
                      <button 
                        onClick={() => handleVerifyOnPortal(cert.serial)}
                        className="text-gold-600 font-mono font-bold text-[9px] uppercase hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        Verificar Online <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerExport(cert.id, cert.title)}
                    disabled={downloadingId !== null}
                    className="px-4 py-2 bg-gradient-to-r from-gold-600 to-[#E2B755] hover:scale-105 active:scale-95 text-ink-900 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    {downloadingId === cert.id ? (
                      <span className="h-4.5 w-4.5 border-2 border-ink-900 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <>
                        <Download size={12} />
                        <span>Descarregar PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </StarBorder>
            );
          } else {
            return (
              <div 
                key={cert.id}
                className="bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800/60 text-neutral-400 dark:text-cream-200/60 rounded-3xl p-6 text-left flex flex-col justify-between min-h-[380px] shadow-xs select-none"
              >
                {/* Top row */}
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-ink-800/60 pb-4">
                  <div>
                    <span className="text-neutral-400 dark:text-cream-200/40 text-[9px] font-mono tracking-widest uppercase font-bold block mb-1">
                      MULTIPLUS ACADEMY • ANGOLA
                    </span>
                    <span className="text-xs font-mono text-neutral-400 dark:text-cream-200/40 font-semibold block">{cert.level}</span>
                  </div>
                  
                  <div className="p-1.5 bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200/60 rounded-lg text-3xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 border border-gray-150 dark:border-ink-750">
                    <Lock size={10} />
                    <span>Pendente</span>
                  </div>
                </div>

                {/* Core certificate name */}
                <div className="py-4 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400/60 block uppercase">CERTIFICA-SE QUE</span>
                    <h4 className="text-lg sm:text-xl font-serif font-bold text-neutral-400/60 tracking-wide m-0 italic">
                      Nome do Aluno
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400/60 block uppercase">CONCLUIU COM ÊXITO O PROGRAMA ACADÉMICO</span>
                    <p className="text-sm font-serif font-black text-neutral-400/60 m-0">
                      {cert.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono pt-2">
                    <div>
                      <span className="text-neutral-400/60 block text-[8px] uppercase">DATA DE EMISSÃO</span>
                      <span className="text-neutral-400/60 font-bold">---</span>
                    </div>
                    <div>
                      <span className="text-neutral-400/60 block text-[8px] uppercase">CÓDIGO DE REGISTO</span>
                      <span className="text-neutral-400/60 font-bold">Pendente</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions footer */}
                <div className="border-t border-gray-200 dark:border-ink-800/60 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-2xs text-neutral-400 dark:text-cream-200/60 leading-normal">
                    <AlertCircle size={14} className="text-yellow-500 flex-shrink-0" />
                    <span>Requisições de moderação ocorrem no fecho curricular.</span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

    </div>
  );
}
