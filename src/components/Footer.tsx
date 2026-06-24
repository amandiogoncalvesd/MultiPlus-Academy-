import { PageId } from '../types';
import { Phone, Mail, MapPin, Globe, ArrowUp, Send, Facebook, Instagram, Linkedin } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: PageId) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = [
    { label: 'Início', page: 'home' as PageId },
    { label: 'Sobre Nós', page: 'about' as PageId },
    { label: 'Cursos', page: 'courses' as PageId },
    { label: 'Formadores', page: 'instructors' as PageId },
    { label: 'Blog & Notícias', page: 'blog' as PageId },
    { label: 'Contactos', page: 'contact' as PageId },
  ];

  return (
    <footer id="global-footer" className="bg-[#0A2E5D] text-white pt-20 pb-10 border-t border-[#C89B3C]/30 relative overflow-hidden">
      
      {/* Decorative luxury abstract radial highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C89B3C]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-950/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-16 border-b border-white/10">
          
          {/* Column 1: Brand & Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1780728240/logotipo-dourado-sem-fundo_abouxm.png"
                alt="MultiPlus Academy logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed font-sans max-w-sm">
              <span className="font-serif italic text-[#C89B3C] font-medium mr-1">"Transformando Competências em Oportunidades"</span>
              <br />
              Referência no ensino do Inglês Jurídico adaptado ao mercado angolano de excelência comercial.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-[#C89B3C]/20 hover:border-[#C89B3C] transition-all duration-300 group">
                <Facebook size={16} className="text-white/80 group-hover:text-white" />
              </a>
              <a href="#" className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-[#C89B3C]/20 hover:border-[#C89B3C] transition-all duration-300 group">
                <Instagram size={16} className="text-white/80 group-hover:text-white" />
              </a>
              <a href="#" className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-[#C89B3C]/20 hover:border-[#C89B3C] transition-all duration-300 group">
                <Linkedin size={16} className="text-white/80 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:pl-8">
            <h4 className="text-sm font-bold tracking-wider uppercase text-[#C89B3C] font-mono mb-6">Navegação</h4>
            <ul className="space-y-3">
              {footerLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => {
                      setCurrentPage(link.page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-white/70 hover:text-[#C89B3C] text-sm tracking-wide transition-colors duration-200 text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Info */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-[#C89B3C] font-mono mb-6">Contactos Oficiais</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/80">
                  <span className="block font-medium">+244 956 449 084</span>
                  <span className="text-xs text-white/50 font-mono">Atendimento Académico</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/80 break-all">
                  <span className="block font-medium">multiplusacademy@gmail.com</span>
                  <span className="text-xs text-white/50 font-mono">Correio Eletrónico Geral</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/80">
                  <span className="block font-medium">Huambo, Angola</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-[#C89B3C] font-mono mb-6">Informativos Académicos</h4>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Subscreva para receber insights e as últimas novidades sobre o Inglês Jurídico e atualizações do mercado em Angola.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Grato pelo interesse! O seu email foi registado para futuros informativos.'); (e.target as HTMLFormElement).reset(); }} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Seu email institucional"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C89B3C] transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-[#C89B3C] hover:bg-[#D4A747] text-white flex items-center justify-center transition-colors"
                  aria-label="Subscrever"
                >
                  <Send size={12} />
                </button>
              </div>
              <span className="text-[10px] text-white/40 block">Ao subscrever, concorda com a nossa política académica de privacidade.</span>
            </form>
          </div>

        </div>

        {/* Closing details & compliance copyrights */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/50 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} MultiPlus Academy. Todos os direitos reservados.</p>
            <p className="mt-1 text-[10px] text-white/35 font-mono">
              Designed dynamically for high prestige Legal & English Careers.
            </p>
          </div>
          <div className="flex gap-6 text-xs text-white/50">
            <a href="#" className="hover:text-[#C89B3C] transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-[#C89B3C] transition-colors">Política de Privacidade</a>
            <button
              onClick={handleScrollToTop}
              className="flex items-center gap-1.5 p-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-all font-mono text-2xs uppercase tracking-wider"
            >
              Topo
              <ArrowUp size={12} className="text-[#C89B3C]" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
