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
  const isCompletedUser = currentUser?.email.includes('antonio') || false; // Dr. Antonio startscompleted
  
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
        // open mock pdf link in frame/tab safely
        alert(`Parabéns! O seu certificado em "${title}" foi exportado localmente com sucesso.\nCódigo Hash de Identificação: MPA-2026-001-A6`);
      }, 1500);
    }, 1200);
  };

  const handleVerifyOnPortal = (serial: string) => {
    setVerificationCode(serial);
    setCurrentPage('verify-certificate');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 shadow-sm">
        <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Acreditação Letiva CEFR</span>
        <h3 className="text-xl font-serif font-black text-ink-900 m-0">Meus Certificados Autenticados</h3>
        <p className="text-xs text-neutral-400 mt-1">Todos os diplomas emitidos integram códigos de validação seguros interligados ao sistema de exames.</p>
      </div>

      {exportMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse">
          <ShieldCheck size={14} className="text-gold-600" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Grid of Certificates Card lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map(cert => (
          <div 
            key={cert.id}
            className={`rounded-3xl border relative overflow-hidden transition-all flex flex-col justify-between min-h-[380px] p-6 text-left ${
              cert.unlocked 
                ? 'bg-slate-950 border-4 border-gold-600 text-cream-100 shadow-xl' 
                : 'bg-cream-100 border-gray-150 text-neutral-400 select-none'
            }`}
          >
            {/* Hologram or badge decor */}
            {cert.unlocked && (
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-600/10 rounded-full blur-xl pointer-events-none" />
            )}

            {/* Top row */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-gold-600 text-[9px] font-mono tracking-widest uppercase font-bold block mb-1">
                  MULTIPLUS ACADEMY • ANGOLA
                </span>
                <span className="text-xs font-mono text-neutral-400 font-semibold block">{cert.level}</span>
              </div>
              
              {cert.unlocked ? (
                <div className="p-1.5 bg-gold-600 rounded-lg text-slate-950 text-3xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>Emitido</span>
                </div>
              ) : (
                <div className="p-1.5 bg-gray-100 text-neutral-400 rounded-lg text-3xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock size={10} />
                  <span>Pendente</span>
                </div>
              )}
            </div>

            {/* Core certificate name */}
            <div className="py-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 block uppercase">CERTIFICA-SE QUE</span>
                <h4 className="text-lg sm:text-xl font-serif font-bold text-cream-100 tracking-wide m-0 italic">
                  {cert.unlocked ? studentFull : 'Nome do Aluno'}
                </h4>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-neutral-400 block uppercase">CONCLUIU COM ÊXITO O PROGRAMA ACADÉMICO</span>
                <p className={`text-sm font-serif font-black ${cert.unlocked ? 'text-gold-600' : 'text-neutral-400'} m-0`}>
                  {cert.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono pt-2">
                <div>
                  <span className="text-neutral-400 block text-[8px] uppercase">DATA DE EMISSÃO</span>
                  <span className="text-cream-100 font-bold">{cert.unlocked ? cert.issueDate : '---'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[8px] uppercase">CÓDIGO DE REGISTO</span>
                  <span className="text-cream-100 font-bold">{cert.unlocked ? cert.serial : 'Pendente'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-4">
              
              {cert.unlocked ? (
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
              ) : (
                <div className="flex items-center gap-2 text-2xs text-neutral-400 leading-normal">
                  <AlertCircle size={14} className="text-yellow-500 flex-shrink-0" />
                  <span>Requisições de moderação ocorrem no fecho curricular.</span>
                </div>
              )}

              {cert.unlocked && (
                <button
                  onClick={() => triggerExport(cert.id, cert.title)}
                  disabled={downloadingId !== null}
                  className="px-4 py-2 bg-gold-600 text-ink-900 hover:bg-cream-100 hover:text-ink-900 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
              )}

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
