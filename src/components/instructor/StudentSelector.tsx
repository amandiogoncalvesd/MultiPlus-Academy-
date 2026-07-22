import React, { useState, useEffect } from 'react';
import { Search, Check, UserPlus, X, Loader2 } from 'lucide-react';
import { enrollmentService } from '../../services/supabase/enrollmentService';

interface StudentSelectorProps {
  courseId: string;
  alreadyEnrolledIds: string[];
  onEnroll: (studentIds: string[]) => Promise<void>;
  onClose: () => void;
}

export default function StudentSelector({
  courseId,
  alreadyEnrolledIds = [],
  onEnroll,
  onClose
}: StudentSelectorProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAllStudents();
  }, [courseId, alreadyEnrolledIds]);

  const loadAllStudents = async () => {
    try {
      setLoading(true);
      const allStudents = await enrollmentService.getEnrollmentCandidates(courseId);
      // Filter out already enrolled students
      const nonEnrolled = allStudents.filter(
        student => !alreadyEnrolledIds.includes(student.id)
      );
      setStudents(nonEnrolled);
    } catch (err) {
      console.error('Error loading students in selector:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (studentId: string) => {
    setSelectedIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredStudents();
    const filteredIds = filtered.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all filtered
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedIds(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      const search = searchQuery.toLowerCase();
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(search) || student.email.toLowerCase().includes(search);
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsSubmitting(true);
      await onEnroll(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error in multi enroll submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = getFilteredStudents();

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-cream-100 dark:bg-ink-900 rounded-3xl max-w-lg w-full overflow-hidden border border-gray-150 dark:border-ink-800/60 shadow-2xl flex flex-col max-h-[85vh] relative">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        {/* Header */}
        <div className="p-5 border-b border-gray-150 dark:border-ink-800/60 flex justify-between items-center bg-cream-200 dark:bg-ink-950/40 relative z-10">
          <div>
            <h4 className="text-base font-serif font-black text-ink-900 dark:text-cream-100 m-0">Matricular Novos Alunos</h4>
            <p className="text-[10px] text-neutral-400 dark:text-cream-200/60 font-sans mt-0.5">Selecione um ou mais juristas para integrar esta turma académica.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full text-neutral-400 hover:text-gray-650 dark:hover:text-cream-100 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 dark:border-ink-800/40 flex gap-2 relative z-10">
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Procurar aluno por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-ink-750 rounded-xl text-xs bg-cream-200 dark:bg-ink-800 text-slate-850 dark:text-cream-100 placeholder-neutral-450 focus:outline-none focus:border-gold-600 dark:focus:border-gold-600 transition-colors"
            />
          </div>
          {filteredStudents.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 border border-gray-250 dark:border-ink-750 text-[10px] font-mono font-bold rounded-xl hover:bg-cream-250 dark:hover:bg-ink-800 text-neutral-450 dark:text-cream-100 transition-colors uppercase cursor-pointer bg-transparent"
            >
              {filteredStudents.every(s => selectedIds.includes(s.id)) ? 'Desmarcar' : 'Selecionar Todos'}
            </button>
          )}
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="animate-spin text-gold-600" size={24} />
              <span className="text-xs font-mono text-neutral-400">Consultando perfis de alunos...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-400 dark:text-cream-200/40 border border-dashed border-gray-250 dark:border-ink-800/60 rounded-2xl">
              {students.length === 0 
                ? 'Todos os alunos elegíveis já estão matriculados.' 
                : 'Nenhum aluno correspondente à sua pesquisa.'}
            </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = selectedIds.includes(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => handleToggleSelect(student.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-gold-600 dark:border-gold-500 bg-ink-900/5 dark:bg-gold-600/5 shadow-xs' 
                      : 'border-gray-150 dark:border-ink-800/80 bg-cream-100 dark:bg-ink-900 hover:bg-cream-200 dark:hover:bg-ink-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                      alt={student.firstName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-ink-750"
                    />
                    <div className="text-left">
                      <span className="font-semibold block text-xs text-ink-900 dark:text-cream-100">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-cream-200/60 block">{student.email}</span>
                    </div>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-gold-600 border-gold-600 dark:border-gold-500 text-ink-900' 
                      : 'border-gray-300 dark:border-ink-750 bg-cream-100 dark:bg-ink-900'
                  }`}>
                    {isSelected && <Check size={12} strokeWidth={3} className="text-ink-900" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-150 dark:border-ink-800/60 bg-cream-200 dark:bg-ink-950/40 flex justify-between items-center relative z-10">
          <span className="text-[10px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase">
            {selectedIds.length} selecionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-250 dark:border-ink-750 text-xs font-mono font-bold rounded-xl hover:bg-cream-250 dark:hover:bg-ink-800 text-neutral-450 dark:text-cream-100 transition-colors uppercase cursor-pointer bg-transparent"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0 || isSubmitting}
              className={`px-4 py-2 bg-gold-600 text-ink-900 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 uppercase cursor-pointer border-0 shadow-sm ${
                selectedIds.length === 0 || isSubmitting
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[#b58b35]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={12} />
                  <span>Matriculando...</span>
                </>
              ) : (
                <>
                  <UserPlus size={12} />
                  <span>Matricular Alunos</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
