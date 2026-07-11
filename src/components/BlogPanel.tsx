import { useState, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_POSTS } from '../data';
import { BlogPost, PageId } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Search, 
  BookOpen, 
  Share2, 
  Bookmark, 
  CheckCircle,
  TrendingUp,
  X,
  User
} from 'lucide-react';

interface BlogPanelProps {
  setCurrentPage: (page: PageId) => void;
}

export default function BlogPanel({ setCurrentPage }: BlogPanelProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Toggle bookmark function for premium feeling
  const toggleBookmark = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  const handleShare = (postTitle: string, e: MouseEvent) => {
    e.stopPropagation();
    alert(`Link de partilha copiado para a área de transferência:\n"MultiPlus Insights — ${postTitle}"`);
  };

  // Filtering
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      activeCategory === 'all' || 
      post.category.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categoriesList = ['all', 'Setor de Petróleo e Gás', 'Redação de Contratos', 'Resolução de Conflitos'];

  return (
    <div id="blog-panel-root" className="bg-cream-100 text-[#1C1C1C] pt-24 pb-16">
      
      <AnimatePresence mode="wait">
        {!selectedPost ? (
          
          /* VIEW 1: BLOG DIRECTORY (MAGAZINE STYLE) */
          <motion.div
            key="directory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
          >
            
            {/* Header portion */}
            <div className="border-b border-gray-200 pb-12 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-gold-600">Doutrina e Atualidades</span>
                <h1 className="text-4xl font-serif font-black tracking-tight text-ink-900 m-0">MultiPlus Insights</h1>
                <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                  Artigos explicativos, comentários doutrinários e tendências regulatórias sobre o ecossistema legal angolano e internacional.
                </p>
              </div>

              {/* Magazine Search */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar artigos..."
                  className="w-full neo-input rounded-xl pl-9 pr-4 py-2.5 text-xs"
                />
              </div>
            </div>

            {/* Category Filter Pills (Stripe/Linear editorial layout) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-gray-100 scrollbar-none">
              <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider mr-2 whitespace-nowrap">Categorias:</span>
              {categoriesList.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all capitalize whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-gold-600 text-cream-100'
                      : 'hover:bg-gray-100 text-neutral-400 bg-cream-100 border border-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Ver Todos' : cat}
                </button>
              ))}
            </div>

            {/* Featured Post (Highlighted above the grid) */}
            {filteredPosts.length > 0 && searchTerm === '' && activeCategory === 'all' && (
              <div 
                onClick={() => setSelectedPost(filteredPosts[0])}
                className="neo-card bg-cream-100 rounded-3xl overflow-hidden cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gray-150 transition-all hover:border-gold-600/35"
              >
                <div className="lg:col-span-7 h-64 lg:h-auto overflow-hidden relative">
                  <img
                    src={filteredPosts[0].image}
                    alt={filteredPosts[0].title}
                    className="w-full h-full object-cover grayscale brightness-95 hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-ink-900 text-cream-100 text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow border border-white/10">
                    ARTIGO EM DESTAQUE
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6 text-left">
                  <div className="space-y-4">
                    <span className="text-xs font-mono font-bold text-gold-600 uppercase tracking-wider">{filteredPosts[0].category}</span>
                    <h2 className="text-2xl font-serif font-bold text-ink-900 tracking-tight">{filteredPosts[0].title}</h2>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans line-clamp-3">{filteredPosts[0].excerpt}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-150 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gold-600" />
                      <span>{filteredPosts[0].readTime}</span>
                    </div>
                    <span className="text-ink-900 font-bold uppercase tracking-wider font-mono text-[10px]">Ler Artigo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of Other Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="neo-card rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between bg-cream-100 border border-gray-150 text-left hover:border-gold-600/35 h-full"
                >
                  <div>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover filter grayscale brightness-95 transition-all duration-500 hover:grayscale-0"
                      />
                      <span className="absolute bottom-3 left-3 bg-cream-100/90 backdrop-blur-md text-ink-900 text-[9px] font-mono font-bold uppercase py-1 px-2 rounded border border-gray-200">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <span className="text-[10px] text-neutral-400 font-mono block">{post.date}</span>
                      <h3 className="text-lg font-serif font-bold text-ink-900 leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Operational Footer within cards */}
                  <div className="px-6 py-4 bg-cream-200/50 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">{post.readTime}</span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => toggleBookmark(post.id, e)}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                          bookmarkedIds.includes(post.id) ? 'text-gold-600' : 'text-neutral-400'
                        }`}
                        title="Guardar artigo"
                      >
                        <Bookmark size={13} fill={bookmarkedIds.includes(post.id) ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => handleShare(post.title, e)}
                        className="p-1.5 rounded hover:bg-gray-100 text-neutral-400 hover:text-neutral-400 transition-colors"
                        title="Partilhar artigo"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>

                </article>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl max-w-md mx-auto space-y-4">
                <span className="block text-gray-300 font-serif text-6xl">?</span>
                <h3 className="text-base font-serif font-semibold text-neutral-400">Nenhum artigo encontrado</h3>
                <p className="text-xs text-neutral-400 max-w-[240px] mx-auto">
                  A fita intelectual de pesquisas está vazia. Altere as palavras-chave tentadas.
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                  className="px-4 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-900 text-cream-100 text-xs font-mono font-bold uppercase transition-colors"
                >
                  Ver Todos os Artigos
                </button>
              </div>
            )}

          </motion.div>
        ) : (
          
          /* VIEW 2: FULL ARTICLE READ SCREEN */
          <motion.article
            key="reader"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left"
          >
            
            {/* Back to Blog directory trigger */}
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-ink-900 hover:text-gold-600 mb-8 transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar ao Diretório do Blog
            </button>

            {/* Document Header */}
            <div className="space-y-6">
              
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-ink-900/5 text-xs text-ink-900 border border-ink-900/10 font-bold uppercase font-mono tracking-wide">
                  {selectedPost.category}
                </span>
                <span className="text-xs text-neutral-400 font-mono">• {selectedPost.date}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-ink-900 leading-tight m-0">
                {selectedPost.title}
              </h1>

              {/* Author and Reading Info */}
              <div className="flex items-center justify-between p-4 bg-cream-100 rounded-2xl border border-gray-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-gold-600/20 overflow-hidden bg-cream-200 flex items-center justify-center">
                    <User size={18} className="text-gold-600" />
                  </div>
                  <div>
                    <span className="block text-sm font-serif font-bold text-neutral-400">{selectedPost.author.name}</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">{selectedPost.author.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 pr-2">
                  <Clock size={12} className="text-gold-600" />
                  <span>{selectedPost.readTime}</span>
                </div>
              </div>

            </div>

            {/* Display Image of post */}
            <div className="my-8 rounded-3xl overflow-hidden aspect-[16/9] border border-gray-250 bg-gray-100">
              <img
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Body contents prose */}
            <div className="prose prose-slate max-w-none text-[#1C1C1C] leading-relaxed font-sans text-sm sm:text-base space-y-6 pt-4 border-b border-gray-200 pb-12">
              {/* Separate by paragraphs for crisp editorial view */}
              {selectedPost.content.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.')) {
                  return (
                    <div key={pIdx} className="pl-4 border-l-2 border-gold-600 italic text-neutral-400 my-4">
                      {paragraph}
                    </div>
                  );
                }
                return (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Read Next segment / buttons */}
            <div className="pt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-gold-600" />
                <span className="text-xs text-neutral-400 font-sans">MultiPlus Insights — Autenticidade e Excelência Académica.</span>
              </div>

              <button
                onClick={() => setSelectedPost(null)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-mono font-bold uppercase hover:bg-cream-200 transition-colors"
              >
                Refazer Leitura do Acervo
              </button>
            </div>

          </motion.article>
        )}
      </AnimatePresence>

    </div>
  );
}
