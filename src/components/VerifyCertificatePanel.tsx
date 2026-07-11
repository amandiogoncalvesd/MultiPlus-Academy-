import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { PageId } from '../types';
import { CheckCircle, AlertCircle, ArrowLeft, Award, FileCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { academicService } from '../services/supabase/academicService';

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
    <div id="verify-certificate-root" className="bg-cream-100 text-[#1C1C1C] pt-28 pb-20 min-h-screen flex flex-col justify-center items-center">
      <div className="max-w-xl w-full px-4">
        
        {/* Navigation Indicator */}
        <button
          onClick={() => {
            setVerificationCode('');
            setCurrentPage('home');
          }}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-ink-900 hover:text-gold-600 mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar à Página Principal
        </button>

        {/* Dynamic Card */}
        <div className="neo-card bg-cream-100 rounded-3xl overflow-hidden border border-gray-150 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-ink-900/5 text-gold-600 border border-gold-600/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Award size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-black text-ink-900 tracking-tight m-0">Portal de Verificação</h1>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
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
                className="w-full neo-input rounded-xl py-3 px-4 text-center font-mono text-sm tracking-wider font-semibold"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-ink-900 hover:bg-ink-900 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors shadow-md"
            >
              Consultar Autenticidade
            </button>
          </form>

          {/* Verification Result */}
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-6 border-t border-gray-150 text-left space-y-4 font-sans"
            >
              {result ? (
                /* TRUE VALID CERTIFICATE */
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-3">
                    <ShieldCheck className="text-emerald-600 flex-shrink-0" size={24} />
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                        Certificado de Excelência Válido ✓
                      </span>
                      <span className="text-xs font-mono text-emerald-700">{result.certificateNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Titular do Diploma</span>
                      <span className="font-serif font-black text-ink-900 text-sm block">{result.recipientName}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Formação Concluída</span>
                      <span className="font-semibold text-neutral-400 block">{result.courseName}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Diretora Pedagógica</span>
                      <span className="font-medium text-neutral-400 block">{result.instructorName}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Data de Emissão</span>
                      <span className="font-mono text-neutral-400 block">{result.completionDate}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Aproveitamento Académico</span>
                      <span className="font-mono text-emerald-700 font-bold block">{result.finalGrade}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Validade Regulamentar</span>
                      <span className="font-medium text-neutral-400 block">{result.validUntil}</span>
                    </div>
                  </div>

                  <div className="text-2xs text-center text-emerald-800 font-mono pt-2 border-t border-emerald-500/10">
                    Selo Digital MultiPlus • Processado sob Certificação Segura
                  </div>
                </div>
              ) : (
                /* INEXISTENT CODE ERROR */
                <div className="p-5 rounded-2xl bg-red-50 border border-red-200/50 flex gap-3">
                  <ShieldAlert className="text-danger-700 flex-shrink-0 mt-0.5" size={20} />
                  <div className="space-y-1">
                    <h4 className="text-sm font-serif font-bold text-red-800">Código Não Encontrado</h4>
                    <p className="text-xs text-red-700 leading-relaxed font-sans">
                      O código inserido <strong>"{code}"</strong> não corresponde a nenhum registo educativo no nosso banco de dados. Por favor verifique e tente novamente ou contacte a nossa diretoria.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Quick tips */}
          <div className="pt-2 text-2xs text-neutral-400 font-sans leading-normal">
            * Se tentou registar interesse agora e não concluiu o curso, obtenha a aprovação pedagógica para que o certificado apareça ativo neste sistema nacional.
          </div>

        </div>
      </div>
    </div>
  );
}
