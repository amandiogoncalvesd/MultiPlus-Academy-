import { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface AcademicMaterial {
  id: string;
  title: string;
  description: string;
  category: 'PDF' | 'DOCX' | 'PPT' | 'Audio' | 'Video' | 'Links';
  fileSize?: string;
  downloadCount: number;
  sourceUrl: string;
}

export default function StudentMaterialsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PDF' | 'DOCX' | 'PPT' | 'Audio' | 'Video' | 'Links'>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const materials: AcademicMaterial[] = [
    {
      id: 'mat_1',
      title: 'Glossary of International Legal English terms',
      description: 'Dicionário científico bilíngue cobrindo termos de Petróleo & Gás, Arbitragem Comparativa e Cláusulas Indemnity.',
      category: 'PDF',
      fileSize: '3.4 MB',
      downloadCount: 142,
      sourceUrl: '#download-glossary'
    },
    {
      id: 'mat_2',
      title: 'Model Contract Draft template (Civil Code compliant)',
      description: 'Minuta editável de prestação de serviços internacionais adequada à boa-fé e limitações do Código Civil de Angola.',
      category: 'DOCX',
      fileSize: '412 KB',
      downloadCount: 89,
      sourceUrl: '#download-draft-model'
    },
    {
      id: 'mat_3',
      title: 'Slide Deck: Introduction to Common Law and Precedents',
      description: 'Apresentação PowerPoint utilizada no Workshop síncrono I da MultiPlus Academy.',
      category: 'PPT',
      fileSize: '5.2 MB',
      downloadCount: 61,
      sourceUrl: '#download-slides-wk1'
    },
    {
      id: 'mat_4',
      title: 'Listening Drill: Pronunciation of contractual boilerplates',
      description: 'Audio podcast focado na dicção, entonação e oratória jurídica de termos como Force Majeure, Indemnification e Severability.',
      category: 'Audio',
      fileSize: '12.8 MB',
      downloadCount: 95,
      sourceUrl: '#download-audio-pronunciation'
    },
    {
      id: 'mat_5',
      title: 'Interactive Case Study (Chevron Litigations Angola)',
      description: 'Estudo de caso e disputas legais do setor energético no Porto de Luanda em inglês e português comparativo.',
      category: 'PDF',
      fileSize: '1.2 MB',
      downloadCount: 74,
      sourceUrl: '#download-case-study'
    },
    {
      id: 'mat_6',
      title: 'Digital Reference Guide: British Court Procedures',
      description: 'Hiperligação institucional explicativa sobre os ritos de arbitragem comercial em Londres (LCIA).',
      category: 'Links',
      downloadCount: 43,
      sourceUrl: 'https://www.lcia.org/'
    },
    {
      id: 'mat_7',
      title: 'Video Guide: Mastering Contract Drafting',
      description: 'Gravação complementar de terminologia de energia de petróleo e gás angolano.',
      category: 'Video',
      fileSize: '45.1 MB',
      downloadCount: 104,
      sourceUrl: '#download-video-drafting'
    }
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setDownloadSuccessMessage(`Sucesso! Descarregou o ficheiro: "${title}"`);
      setTimeout(() => setDownloadSuccessMessage(null), 3000);
    }, 1200);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'DOCX':
        return <FileCheck className="w-5 h-5 text-blue-500" />;
      case 'PPT':
        return <BookOpen className="w-5 h-5 text-orange-500" />;
      case 'Audio':
        return <Headphones className="w-5 h-5 text-emerald-500" />;
      case 'Video':
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
        {filteredMaterials.length === 0 ? (
          <div className="col-span-2 py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center">
            <AlertCircle size={24} className="text-yellow-500 mb-2" />
            <p className="m-0">Nenhum recurso académico corresponde à pesquisa solicitada.</p>
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
                    {getCategoryIcon(mat.category)}
                  </span>
                  <div>
                    <span className="inline-block text-[8px] font-mono tracking-widest font-bold uppercase bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200 px-2 py-0.5 rounded">
                      {mat.category}
                    </span>
                    {mat.fileSize && (
                      <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 ml-2">{mat.fileSize}</span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 leading-snug group-hover:text-gold-600 dark:group-hover:text-[#E2B755] transition-colors mt-1 mb-0 line-clamp-1">
                  {mat.title}
                </h4>
                <p className="text-[11px] text-neutral-400 dark:text-cream-100/70 leading-normal font-sans line-clamp-2 mt-1 mb-0">
                  {mat.description}
                </p>
                
                <span className="block text-[9px] font-mono text-neutral-400 dark:text-cream-100/40 mt-2 font-semibold">
                  📂 {mat.downloadCount + (downloadingId === mat.id ? 1 : 0)} DESCARGAS ACADÉMICAS
                </span>
              </div>

              <div className="flex flex-col justify-between shrink-0 relative z-10">
                <button
                  onClick={() => handleDownload(mat.id, mat.title)}
                  disabled={downloadingId !== null}
                  className="p-3 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-250 dark:border-ink-750 hover:border-gold-600 dark:hover:border-gold-600 text-neutral-400 hover:text-gold-600 dark:text-cream-200 dark:hover:text-gold-600 hover:bg-cream-100 dark:hover:bg-ink-900 transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Descarregar ficheiro"
                >
                  {downloadingId === mat.id ? (
                    <span className="h-4 w-4 border-2 border-gold-600 border-t-transparent rounded-full animate-spin block" />
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
