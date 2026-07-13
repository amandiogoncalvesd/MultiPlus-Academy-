import { useState, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_POSTS } from '../data';
import { BlogPost, PageId } from '../types';
import StarBorder from './ui/StarBorder';
import { 
  ArrowLeft, 
  Clock, 
  Search, 
  Share2, 
  Bookmark, 
  CheckCircle,
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
    <div id="blog-panel-root" className="bg-white text-slate-800 pt-24 pb-16">
      
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
            <div className="border-b border-slate-200 pb-12 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-2xl text-left">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Doutrina e Atualidades</span>
                <h1 className="text-4xl font-serif font-black tracking-tight text-slate-900 m-0 leading-tight">MultiPlus Insights</h1>
                <p className="text-sm text-slate-600 font-sans leading-relaxed">
                  Artigos explicativos, comentários doutrinários e tendências regulatórias sobre o ecossistema legal angolano e internacional.
                </p>
              </div>

              {/* Magazine Search */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar artigos..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Category Filter Pills (Stripe/Linear editorial layout) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-slate-100 scrollbar-none">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider mr-2 whitespace-nowrap">Categorias:</span>
              {categoriesList.map((cat, idx) => (
                <StarBorder
                  key={idx}
                  as="button"
                  onClick={() => setActiveCategory(cat)}
                  speed="8s"
                  thickness={1}
                  className="rounded-full overflow-hidden cursor-pointer"
                  innerClassName={`relative z-1 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all capitalize whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-[#0A2E5D] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat === 'all' ? 'Ver Todos' : cat}
                </StarBorder>
              ))}
            </div>

            {/* Featured Post (Highlighted above the grid) */}
            {filteredPosts.length > 0 && searchTerm === '' && activeCategory === 'all' && (
              <StarBorder
                as="div"
                speed="8s"
                thickness={2}
                className="w-full rounded-3xl overflow-hidden shadow-xs cursor-pointer text-left"
                innerClassName="relative z-1 grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-3xl overflow-hidden w-full"
                onClick={() => setSelectedPost(filteredPosts[0])}
              >
                <div className="lg:col-span-7 h-64 lg:h-auto overflow-hidden relative border-r border-slate-100">
                  <img
                    src={filteredPosts[0].image}
                    alt={filteredPosts[0].title}
                    className="w-full h-full object-cover hover:scale-[1.01] transition-all duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-[#0A2E5D] text-white text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow border border-white/10">
                    ARTIGO EM DESTAQUE
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-xs font-mono font-bold text-[#C89B3C] uppercase tracking-wider">{filteredPosts[0].category}</span>
                    <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight leading-snug">{filteredPosts[0].title}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans line-clamp-3">{filteredPosts[0].excerpt}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#C89B3C]" />
                      <span className="font-semibold text-slate-500">{filteredPosts[0].readTime}</span>
                    </div>
                    <span className="text-[#0A2E5D] font-bold uppercase tracking-wider font-mono text-[10px] hover:text-[#C89B3C] transition-colors">Ler Artigo</span>
                  </div>
                </div>
              </StarBorder>
            )}

            {/* Grid of Other Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
              {filteredPosts.map((post) => (
                <StarBorder
                  key={post.id}
                  as="article"
                  onClick={() => setSelectedPost(post)}
                  speed="8s"
                  thickness={1.5}
                  className="rounded-2xl overflow-hidden cursor-pointer shadow-2xs text-left"
                  innerClassName="relative z-1 flex flex-col justify-between bg-white rounded-2xl overflow-hidden w-full h-full text-left"
                >
                  <div className="w-full">
                    <div className="h-48 overflow-hidden relative border-b border-slate-100">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-all duration-500 hover:scale-[1.02]"
                      />
                      <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-slate-900 text-[9px] font-mono font-bold uppercase py-1 px-2.5 rounded border border-slate-200 shadow-xs">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <span className="text-[10px] text-slate-400 font-mono block font-bold">{post.date}</span>
                      <h3 className="text-lg font-serif font-bold text-slate-900 leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-3 m-0">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Operational Footer within cards */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-mono w-full">
                    <span className="text-slate-500 font-semibold">{post.readTime}</span>
                    
                    <div className="flex gap-2">
                      <StarBorder
                        as="button"
                        onClick={(e) => toggleBookmark(post.id, e)}
                        speed="4s"
                        thickness={1}
                        className="rounded overflow-hidden cursor-pointer"
                        innerClassName={`p-1.5 rounded bg-white transition-colors flex items-center justify-center ${
                          bookmarkedIds.includes(post.id) ? 'text-[#C89B3C] bg-[#C89B3C]/5' : 'text-slate-400'
                        }`}
                        title="Guardar artigo"
                      >
                        <Bookmark size={13} fill={bookmarkedIds.includes(post.id) ? 'currentColor' : 'none'} />
                      </StarBorder>

                      <StarBorder
                        as="button"
                        onClick={(e) => handleShare(post.title, e)}
                        speed="4s"
                        thickness={1}
                        className="rounded overflow-hidden cursor-pointer"
                        innerClassName="p-1.5 rounded bg-white text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center"
                        title="Partilhar artigo"
                      >
                        <Share2 size={13} />
                      </StarBorder>
                    </div>
                  </div>

                </StarBorder>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl max-w-md mx-auto space-y-4">
                <span className="block text-slate-300 font-serif text-6xl">?</span>
                <h3 className="text-base font-serif font-bold text-slate-700">Nenhum artigo encontrado</h3>
                <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                  A fita intelectual de pesquisas está vazia. Altere as palavras-chave tentadas.
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                  className="px-4 py-2 rounded-lg bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono font-bold uppercase transition-colors shadow-sm"
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
            <div className="mb-8">
              <StarBorder
                as="button"
                onClick={() => setSelectedPost(null)}
                speed="6s"
                thickness={1.5}
                className="rounded-lg overflow-hidden cursor-pointer"
                innerClassName="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#0A2E5D] hover:text-[#C89B3C] bg-slate-50 px-3.5 py-2"
              >
                <ArrowLeft size={14} />
                Voltar ao Diretório do Blog
              </StarBorder>
            </div>

            {/* Document Header */}
            <div className="space-y-6">
              
              <div className="flex items-center gap-2">
                <StarBorder
                  as="span"
                  speed="5s"
                  thickness={1}
                  className="rounded-lg overflow-hidden"
                  innerClassName="px-2.5 py-1 bg-slate-50 text-xs text-[#0A2E5D] font-bold uppercase font-mono tracking-wide"
                >
                  {selectedPost.category}
                </StarBorder>
                <span className="text-xs text-slate-400 font-mono font-bold">• {selectedPost.date}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-slate-900 leading-tight m-0">
                {selectedPost.title}
              </h1>

              {/* Author and Reading Info */}
              <StarBorder
                as="div"
                speed="8s"
                thickness={1.5}
                className="rounded-2xl overflow-hidden shadow-xs"
                innerClassName="relative z-1 flex items-center justify-between p-4 bg-slate-50 rounded-2xl w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                    <User size={18} className="text-[#C89B3C]" />
                  </div>
                  <div>
                    <span className="block text-sm font-serif font-extrabold text-slate-800">{selectedPost.author.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">{selectedPost.author.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 pr-2 font-bold">
                  <Clock size={12} className="text-[#C89B3C]" />
                  <span>{selectedPost.readTime}</span>
                </div>
              </StarBorder>

            </div>

            {/* Display Image of post */}
            <div className="my-8">
              <StarBorder
                as="div"
                speed="10s"
                thickness={2}
                className="rounded-3xl overflow-hidden shadow-sm"
                innerClassName="relative z-1 aspect-[16/9] bg-slate-50 rounded-3xl overflow-hidden w-full h-full"
              >
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </StarBorder>
            </div>

            {/* Body contents prose */}
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-sans text-sm sm:text-base space-y-6 pt-4 border-b border-slate-200 pb-12 font-medium">
              {/* Separate by paragraphs for crisp editorial view */}
              {selectedPost.content.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.')) {
                  return (
                    <div key={pIdx} className="pl-4 border-l-2 border-[#C89B3C] italic text-slate-500 my-4 bg-slate-50 py-1 rounded-r">
                      {paragraph}
                    </div>
                  );
                }
                return (
                  <p key={pIdx} className="leading-relaxed text-slate-600 m-0">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Read Next segment / buttons */}
            <div className="pt-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#C89B3C]" />
                <span className="text-xs text-slate-500 font-sans font-semibold">MultiPlus Insights — Autenticidade e Excelência Académica.</span>
              </div>

              <StarBorder
                as="button"
                onClick={() => setSelectedPost(null)}
                speed="5s"
                thickness={1}
                className="rounded-xl overflow-hidden cursor-pointer"
                innerClassName="px-6 py-3 text-xs font-mono font-bold uppercase bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-xs"
              >
                Voltar aos Artigos
              </StarBorder>
            </div>

          </motion.article>
        )}
      </AnimatePresence>
  
    </div>
  );
}
