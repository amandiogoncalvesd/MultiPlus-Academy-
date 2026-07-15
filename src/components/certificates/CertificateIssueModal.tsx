import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';
import { X, Upload, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Student {
  id: string;
  email: string;
  nome_completo: string;
}

interface Course {
  id: string;
  title: string;
}

interface CertificateIssueModalProps {
  initialStudentId?: string;
  initialCourseId?: string;
  onClose: () => void;
  onSave?: (certificate: any) => void;
}

export default function CertificateIssueModal({
  initialStudentId = '',
  initialCourseId = '',
  onClose,
  onSave
}: CertificateIssueModalProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        // 1. Fetch Students
        const { data: studentsData, error: studentsErr } = await supabase
          .from('users')
          .select('id, email, nome_completo')
          .eq('role', 'ALUNO')
          .order('nome_completo', { ascending: true });
        
        if (studentsErr) throw studentsErr;
        setStudents(studentsData || []);

        // 2. Fetch Courses
        const { data: coursesData, error: coursesErr } = await supabase
          .from('courses')
          .select('id, title')
          .order('title', { ascending: true });

        if (coursesErr) throw coursesErr;
        setCourses(coursesData || []);
      } catch (err: any) {
        console.error('Error loading modal data:', err);
        setErrorMsg('Erro ao carregar dados do formulário.');
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  // Set initial selected values if props change
  useEffect(() => {
    if (initialStudentId) setSelectedStudentId(initialStudentId);
    if (initialCourseId) setSelectedCourseId(initialCourseId);
  }, [initialStudentId, initialCourseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('O arquivo deve ser um PDF.');
      setPdfFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setErrorMsg('O arquivo PDF deve ter menos de 10MB.');
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setErrorMsg('');

    if (!selectedStudentId) {
      setErrorMsg('Por favor, selecione um aluno.');
      return;
    }

    if (!selectedCourseId) {
      setErrorMsg('Por favor, selecione um curso.');
      return;
    }

    if (!pdfFile) {
      setErrorMsg('Por favor, carregue o arquivo PDF do certificado.');
      return;
    }

    try {
      setIsSubmitting(true);

      const codigo = `MPA-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      // Insert metadata into certificates table
      const { data: certRow, error: insertError } = await supabase
        .from('certificates')
        .insert({
          student_id: selectedStudentId,
          course_id: selectedCourseId,
          codigo_validacao: codigo,
          issued_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload file to storage
      const fileExt = pdfFile.name.split('.').pop();
      const filePath = `certificates/${certRow.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      // Update certificate with public URL
      const { error: updateError } = await supabase
        .from('certificates')
        .update({ certificate_pdf_url: urlData.publicUrl })
        .eq('id', certRow.id);

      if (updateError) throw updateError;

      setSuccessMsg(`Certificado outorgado com sucesso! Código: ${codigo}`);
      if (onSave) {
        onSave({
          ...certRow,
          certificate_pdf_url: urlData.publicUrl
        });
      }

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      setErrorMsg(err.message || 'Erro inesperado ao emitir certificado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="certificate-issue-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-cream-100 dark:bg-ink-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden border border-gray-200 dark:border-ink-800 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-150 dark:border-ink-800 flex items-center justify-between bg-cream-200/50 dark:bg-ink-950">
          <div>
            <h3 className="font-serif font-black tracking-tight text-ink-900 dark:text-cream-100 text-base">Outorga de Diploma Digital</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Envio direto de certificado em PDF para a carteira do aluno.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cream-250 dark:hover:bg-ink-850 transition-colors border-0 cursor-pointer text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {successMsg ? (
          <div className="p-8 text-center space-y-3 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />
            <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm">Outorga Concluída</h4>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">{successMsg}</p>
          </div>
        ) : loadingData ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
            <span className="text-xs text-neutral-400">A carregar estruturas académicas...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl flex items-start gap-2 text-xs border border-rose-200/40">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Student */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Aluno outorgado *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setErrorMsg('');
                }}
                required
                disabled={!!initialStudentId}
                className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600 font-sans"
              >
                <option value="">-- Escolha o Formando --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome_completo} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Course */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Curso de Conclusão *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setErrorMsg('');
                }}
                required
                disabled={!!initialCourseId}
                className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600 font-sans"
              >
                <option value="">-- Escolha o Curso --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Component */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Arquivo de Certificado (PDF) *</label>
              <div className="border-2 border-dashed border-gray-250 dark:border-ink-800 rounded-2xl p-4 text-center cursor-pointer hover:border-gold-600 dark:hover:border-gold-600 transition-colors relative bg-cream-150/40 dark:bg-ink-950/20">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="space-y-2 text-xs flex flex-col items-center">
                  <Upload className="w-6 h-6 text-gold-600 animate-bounce" />
                  {pdfFile ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">{pdfFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-neutral-400">
                      <span className="font-bold text-gold-600 hover:underline">Clique para carregar</span> ou arraste o PDF aqui.
                      <p className="text-[9px] text-neutral-500 mt-1">Apenas PDF (máx 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-250 dark:bg-ink-850 dark:hover:bg-ink-800 text-neutral-500 dark:text-cream-200 text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-grow py-2.5 bg-gradient-to-r from-gold-600 to-[#E2B755] hover:shadow-lg text-white text-2xs font-mono font-bold uppercase rounded-xl border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Outorgar Certificado'
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
