import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  FileCheck, 
  BookOpen, 
  Headphones, 
  Video, 
  ExternalLink,
  Search,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { academicService } from '../../services/supabase/academicService';

interface StudentMaterialsTabProps {
  userId?: string;
}

interface AcademicMaterial {
  id: string;
  lesson_id: string;
  titulo: string;
  arquivo_url: string;
  tipo: string;
  lesson_title?: string;
  course_id?: string;
}

export default function StudentMaterialsTab({ userId }: StudentMaterialsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PDF' | 'DOCX' | 'PPT' | 'Audio' | 'Video' | 'Links'>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [materials, setMaterials] = useState<AcademicMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await academicService.getStudentMaterials(userId);
        setMaterials(data || []);
      } catch (err) {
        console.error('Erro ao carregar materiais do aluno:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [userId]);

  const handleDownload = async (material: AcademicMaterial) => {
    if (!material.arquivo_url) return;
    setDownloadingId(material.id);
    try {
      // Abre a URL do material em nova aba (pode ser arquivo no Supabase Storage)
      window.open(material.arquivo_url, '_blank');
      setDownloadSuccessMessage(`Sucesso! Iniciou o download de: "${material.titulo}"`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao descarregar material:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.lesson_title && m.lesson_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const materialCategoryNormalized = m.tipo?.toUpperCase() === 'LINK' ? 'LINKS' : m.tipo?.toUpperCase() || 'PDF';
    const selectedCategoryNormalized = selectedCategory.toUpperCase();
    
    const matchesCategory = selectedCategory === 'ALL' || materialCategoryNormalized === selectedCategoryNormalized;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: string) => {
    const normalized = cat?.toUpperCase();
    switch (normalized) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'DOCX':
      case 'DOC':
        return <FileCheck className="w-5 h-5 text-blue-500" />;
      case 'PPT':
      case 'PPTX':
        return <BookOpen className="w-5 h-5 text-orange-500" />;
      case 'AUDIO':
      case 'MP3':
        return <Headphones className="w-5 h-5 text-emerald-500" />;
      case 'VIDEO':
      case 'MP4':
        return <Video className="w-5 h-5 text-gold-500" />;
      default:
        return <ExternalLink className="w-5 h-5 text-gold-600" />;
    }
  };

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Search and Category Filter Toolbar header */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(200,155,60,0.04),transparent_50%)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Biblioteca Académica</span>
            <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Materiais de Estudo</h3>
          </div>

          {/* Real-time search widget container */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar manuais ou modelos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-700 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:border-gold-600 text-[#1C1C1C] dark:text-cream-100"
            />
          </div>
        </div>

        {/* Category Toggles button rails */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-150 dark:border-ink-800/60 relative z-10">
          {(['ALL', 'PDF', 'DOCX', 'PPT', 'Audio', 'Video', 'Links'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-0 ${
                selectedCategory === cat 
                  ? 'bg-gold-600 text-cream-100 shadow-sm shadow-gold-600/20' 
                  : 'bg-cream-200 dark:bg-ink-800 hover:bg-cream-250 dark:hover:bg-ink-750 text-neutral-400 dark:text-cream-200'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Floating Success Alert Banner */}
      <AnimatePresence>
        {downloadSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 shadow-sm text-left"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-cream-100 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</div>
            <span>{downloadSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials Visual List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
            <p className="m-0">A carregar biblioteca académica...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="col-span-2 py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center">
            <AlertCircle size={24} className="text-yellow-500 mb-2" />
            <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm mb-1">
              Biblioteca Vazia
            </h4>
            <p className="m-0 max-w-xs mx-auto text-center text-[11px] text-neutral-400">
              Nenhum recurso académico disponível neste momento ou correspondente à sua pesquisa.
            </p>
          </div>
        ) : (
          filteredMaterials.map(mat => (
            <div 
              key={mat.id} 
              className="bg-cream-100 dark:bg-ink-900 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 hover:border-gold-600/35 dark:hover:border-gold-600/50 hover:shadow-lg hover:scale-[1.01] transition-all flex justify-between gap-4 text-left group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-600/[0.01] to-transparent pointer-events-none" />
              <div className="space-y-2 flex-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-100 dark:border-ink-700/40 shrink-0 block">
                    {getCategoryIcon(mat.tipo || 'PDF')}
                  </span>
                  <div>
                    <span className="inline-block text-[8px] font-mono tracking-widest font-bold uppercase bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200 px-2 py-0.5 rounded">
                      {mat.tipo || 'PDF'}
                    </span>
                    {mat.lesson_title && (
                      <span className="text-[9px] font-mono text-gold-600 ml-2">Aula: {mat.lesson_title}</span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 leading-snug group-hover:text-gold-600 dark:group-hover:text-[#E2B755] transition-colors mt-1 mb-0 line-clamp-1">
                  {mat.titulo}
                </h4>
                <p className="text-[11px] text-neutral-400 dark:text-cream-100/70 leading-normal font-sans line-clamp-2 mt-1 mb-0">
                  Material de apoio curricular disponibilizado para acompanhamento pedagógico.
                </p>
              </div>

              <div className="flex flex-col justify-between shrink-0 relative z-10">
                <button
                  onClick={() => handleDownload(mat)}
                  disabled={downloadingId !== null}
                  className="p-3 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-250 dark:border-ink-750 hover:border-gold-600 dark:hover:border-gold-600 text-neutral-400 hover:text-gold-600 dark:text-cream-200 dark:hover:text-gold-600 hover:bg-cream-100 dark:hover:bg-ink-900 transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Descarregar ficheiro"
                >
                  {downloadingId === mat.id ? (
                    <Loader2 size={14} className="animate-spin text-gold-600" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
