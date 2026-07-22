import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { User, PageId } from '../../types';
import StarBorder from '../ui/StarBorder';
import { academicService } from '../../services/supabase/academicService';
import { supabase } from '../../lib/supabase/client';

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentFull = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Doutor Aluno';

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await academicService.getStudentCertificates(currentUser.id);
        setCertificates(data || []);
      } catch (err) {
        console.error('Erro ao carregar certificados do aluno:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [currentUser]);

  const triggerExport = async (id: string, title: string) => {
    setDownloadingId(id);
    setExportMessage(`A preparar o PDF privado de “${title}”…`);
    try {
      const { data, error } = await supabase.functions.invoke('certificate-files?action=download', {
        body: { certificateId: id },
      });
      if (error || data?.error || !data?.url) throw new Error(error?.message || data?.error || 'PDF indisponível.');
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setExportMessage('PDF aberto com link temporário e seguro.');
    } catch (err) {
      console.error('Erro ao descarregar certificado:', err);
      setExportMessage('Não foi possível preparar o PDF. Tente novamente.');
    } finally {
      setDownloadingId(null);
      window.setTimeout(() => setExportMessage(null), 3500);
    }
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
        {loading ? (
          <div className="col-span-2 py-16 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
            <p className="m-0">A carregar certificados académicos...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="col-span-2 py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center">
            <Award size={32} className="text-gold-600/40 mb-2 animate-pulse" />
            <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm mb-1">Sem Certificados Emitidos</h4>
            <p className="m-0 max-w-xs text-center text-[11px] text-neutral-400 leading-relaxed">
              O seu diploma digital será disponibilizado e assinado nesta secção assim que concluir todas as aulas, quizzes e avaliações letivas correspondentes ao plano curricular do seu curso.
            </p>
          </div>
        ) : (
          certificates.map(cert => {
            const courseTitle = cert.course?.title || 'Curso Académico';
            const serial = cert.codigo_validacao || 'Pendente';
            const rawDate = cert.emitido_em ? new Date(cert.emitido_em).toLocaleDateString('pt-AO') : '---';
            const gradeText = cert.final_grade ? `Nota Final: ${cert.final_grade}` : 'Aprovado';

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
                    <span className="text-xs font-mono text-neutral-400 font-semibold block">{gradeText}</span>
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
                    <p className="text-sm font-serif font-black text-gold-600 m-0 leading-normal">
                      {courseTitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono pt-2">
                    <div>
                      <span className="text-neutral-400 block text-[8px] uppercase">DATA DE EMISSÃO</span>
                      <span className="text-cream-100 font-bold">{rawDate}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[8px] uppercase">CÓDIGO DE REGISTO</span>
                      <span className="text-cream-100 font-bold">{serial}</span>
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
                        onClick={() => handleVerifyOnPortal(serial)}
                        className="text-gold-600 font-mono font-bold text-[9px] uppercase hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        Verificar Online <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerExport(cert.id, courseTitle)}
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
          })
        )}
      </div>

    </div>
  );
}
