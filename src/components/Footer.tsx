import { useState, FormEvent } from 'react';
import { PageId } from '../types';
import { Phone, Mail, MapPin, Globe, ArrowUp, Send, Facebook, Instagram, Linkedin } from 'lucide-react';
import StarBorder from './ui/StarBorder';

interface FooterProps {
  setCurrentPage: (page: PageId) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const [subscribed, setSubscribed] = useState(false);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    const form = e.target as HTMLFormElement;
    form.reset();
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
    <footer id="global-footer" className="bg-slate-50 text-slate-800 pt-20 pb-10 border-t border-slate-200 relative overflow-hidden">
      
      {/* Decorative luxury abstract radial highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C89B3C]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0A2E5D]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-16 border-b border-slate-200">
          
          {/* Column 1: Brand & Identity */}
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                alt="MultiPlus Academy logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed font-sans max-w-sm font-medium">
              <span className="font-serif italic text-[#C89B3C] font-semibold mr-1">"Transformando Competências em Oportunidades"</span>
              <br />
              Referência no ensino do Inglês Jurídico adaptado ao mercado angolano de excelência comercial.
            </p>
            <div className="flex items-center gap-3">
              <StarBorder
                as="a"
                href="#"
                speed="4s"
                thickness={1}
                className="rounded-full overflow-hidden"
                innerClassName="p-2.5 bg-white flex items-center justify-center text-slate-600 hover:text-[#C89B3C] transition-colors"
              >
                <Facebook size={16} />
              </StarBorder>
              <StarBorder
                as="a"
                href="#"
                speed="4s"
                thickness={1}
                className="rounded-full overflow-hidden"
                innerClassName="p-2.5 bg-white flex items-center justify-center text-slate-600 hover:text-[#C89B3C] transition-colors"
              >
                <Instagram size={16} />
              </StarBorder>
              <StarBorder
                as="a"
                href="#"
                speed="4s"
                thickness={1}
                className="rounded-full overflow-hidden"
                innerClassName="p-2.5 bg-white flex items-center justify-center text-slate-600 hover:text-[#C89B3C] transition-colors"
              >
                <Linkedin size={16} />
              </StarBorder>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:pl-8 text-left">
            <h4 className="text-sm font-bold tracking-wider uppercase text-[#0A2E5D] font-mono mb-6">Navegação</h4>
            <ul className="space-y-3">
              {footerLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => {
                      setCurrentPage(link.page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-slate-600 hover:text-[#C89B3C] text-sm tracking-wide transition-colors duration-200 text-left font-medium cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Info */}
          <div className="text-left">
            <h4 className="text-sm font-bold tracking-wider uppercase text-[#0A2E5D] font-mono mb-6">Contactos Oficiais</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700">
                  <span className="block font-semibold">+244 956 449 084</span>
                  <span className="text-xs text-slate-500 font-mono">Atendimento Académico</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700 break-all">
                  <span className="block font-semibold">multiplusacademy@gmail.com</span>
                  <span className="text-xs text-slate-500 font-mono">Correio Eletrónico Geral</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700">
                  <span className="block font-semibold font-serif">Huambo, Angola</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="text-left">
            <h4 className="text-sm font-bold tracking-wider uppercase text-[#0A2E5D] font-mono mb-6">Informativos Académicos</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Subscreva para receber insights e as últimas novidades sobre o Inglês Jurídico e atualizações do mercado em Angola.
            </p>
            {subscribed ? (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold font-sans">
                ✓ Grato pelo interesse! O seu email foi registado para futuros informativos.
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Seu email institucional"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C89B3C] transition-colors shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-[#0A2E5D] hover:bg-[#123C73] text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Subscrever"
                  >
                    <Send size={12} />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">Ao subscrever, concorda com a nossa política académica de privacidade.</span>
              </form>
            )}
          </div>

        </div>

        {/* Closing details & compliance copyrights */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} MultiPlus Academy. Todos os direitos reservados.</p>
            <p className="mt-1 text-[10px] text-slate-400 font-mono">
              Designed dynamically for high prestige Legal & English Careers.
            </p>
          </div>
          <div className="flex gap-6 items-center text-xs text-slate-500">
            <a href="#" className="hover:text-[#C89B3C] transition-colors font-medium">Termos de Uso</a>
            <a href="#" className="hover:text-[#C89B3C] transition-colors font-medium">Política de Privacidade</a>
            <StarBorder
              as="button"
              onClick={handleScrollToTop}
              speed="5s"
              thickness={1.5}
              className="rounded-lg overflow-hidden cursor-pointer shadow-sm"
              innerClassName="flex items-center gap-1.5 p-2 px-3 bg-white text-slate-700 font-mono text-2xs uppercase tracking-wider"
            >
              Topo
              <ArrowUp size={12} className="text-[#C89B3C]" />
            </StarBorder>
          </div>
        </div>

      </div>
    </footer>
  );
}
