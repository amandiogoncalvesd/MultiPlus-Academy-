import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { PageId } from '../types';
import { ArrowLeft, Award, ShieldAlert, ShieldCheck } from 'lucide-react';
import { academicService } from '../services/supabase/academicService';
import StarBorder from './ui/StarBorder';

interface VerifyCertificatePanelProps {
  setCurrentPage: (page: PageId) => void;
  verificationCode?: string;
  setVerificationCode: (code: string) => void;
}

export default function VerifyCertificatePanel({
  setCurrentPage,
  verificationCode,
  setVerificationCode,
}: VerifyCertificatePanelProps) {
  const [code, setCode] = useState(verificationCode || '');
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyCertificate = async (searchCode: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const match = await academicService.verifyCertificate(searchCode);
      if (match) {
        setResult({
          certificateNumber: match.codigo_validacao,
          courseName: match.course?.titulo || 'Curso Jurídico',
          recipientName: match.student?.nome_completo || 'Aluno MultiPlus',
          completionDate: match.emitido_em ? match.emitido_em.slice(0, 10) : '2026-06-01',
          instructorName: 'Esmeralda Bruno Sumbelelo',
          finalGrade: match.final_grade || '92/100',
          validUntil: 'Sem limite',
          isValid: true,
          institution: 'MultiPlus Academy (Huambo, Angola)',
          verificationCode: match.codigo_validacao,
        });
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error('Network verify failed:', err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationCode) {
      setCode(verificationCode);
      verifyCertificate(verificationCode);
    }
  }, [verificationCode]);

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    verifyCertificate(code);
  };

  return (
    <div id="verify-certificate-root" className="bg-white text-slate-800 pt-28 pb-20 min-h-screen flex flex-col justify-center items-center">
      <div className="max-w-xl w-full px-4 text-left">
        
        {/* Navigation Indicator */}
        <button
          onClick={() => {
            setVerificationCode('');
            setCurrentPage('home');
          }}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#0A2E5D] hover:text-[#C89B3C] mb-8 transition-colors border border-slate-200 bg-slate-50 px-3.5 py-2 rounded-lg shadow-2xs"
        >
          <ArrowLeft size={14} />
          Voltar à Página Principal
        </button>

        {/* Dynamic Card */}
        <StarBorder
          as="div"
          color="#C89B3C"
          speed="6s"
          thickness={2}
          className="w-full rounded-3xl overflow-hidden shadow-sm"
          innerClassName="relative z-1 p-8 rounded-3xl bg-white w-full text-center space-y-6 border border-slate-200"
        >
          <div className="w-16 h-16 bg-slate-50 text-[#C89B3C] border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Award size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight m-0">Portal de Verificação</h1>
            <p className="text-xs text-slate-500 font-sans leading-relaxed m-0 font-medium">
              Introduza o código de validação único impresso no certificado MultiPlus Academy para verificar a sua autenticidade académica.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: MPA-2026-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-center font-mono text-sm tracking-wider font-extrabold text-slate-900 focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors placeholder-slate-400 shadow-2xs"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors shadow-md cursor-pointer"
            >
              Consultar Autenticidade
            </button>
          </form>

          {/* Verification Result */}
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-6 border-t border-slate-200 text-left space-y-4 font-sans"
            >
              {result ? (
                /* TRUE VALID CERTIFICATE */
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                  <div className="flex items-center gap-3 border-b border-emerald-200 pb-3">
                    <ShieldCheck className="text-emerald-600 flex-shrink-0 animate-pulse" size={24} />
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                        Certificado de Excelência Válido ✓
                      </span>
                      <span className="text-xs font-mono text-emerald-700 font-bold">{result.certificateNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                    <div>
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Titular do Diploma</span>
                      <span className="font-serif font-black text-slate-900 text-sm block leading-tight mt-0.5">{result.recipientName}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Formação Concluída</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{result.courseName}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Diretora Pedagógica</span>
                      <span className="font-semibold text-slate-700 block mt-0.5">{result.instructorName}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Data de Emissão</span>
                      <span className="font-mono text-slate-700 block mt-0.5">{result.completionDate}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Aproveitamento Académico</span>
                      <span className="font-mono text-emerald-700 font-extrabold block mt-0.5 text-sm">{result.finalGrade}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Validade Regulamentar</span>
                      <span className="font-semibold text-slate-700 block mt-0.5">{result.validUntil}</span>
                    </div>
                  </div>

                  <div className="text-2xs text-center text-emerald-700 font-mono pt-3 border-t border-emerald-100 font-bold">
                    Selo Digital MultiPlus • Processado sob Certificação Segura
                  </div>
                </div>
              ) : (
                /* INEXISTENT CODE ERROR */
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-150 flex gap-3">
                  <ShieldAlert className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="space-y-1">
                    <h4 className="text-sm font-serif font-bold text-rose-800 m-0">Código Não Encontrado</h4>
                    <p className="text-xs text-rose-700 leading-relaxed font-sans m-0 font-medium">
                      O código inserido <strong>"{code}"</strong> não corresponde a nenhum registo educativo no nosso banco de dados. Por favor verifique e tente novamente ou contacte a nossa diretoria.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Quick tips */}
          <div className="pt-2 text-[10px] text-slate-400 font-sans leading-normal font-medium">
            * Se registou interesse recente e ainda não concluiu todas as disciplinas, a aprovação pedagógica é necessária para que o certificado conste ativo neste sistema institucional.
          </div>

        </StarBorder>
      </div>
    </div>
  );
}
