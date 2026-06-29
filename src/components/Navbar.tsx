import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from '../types';
import { Phone, GraduationCap, Menu, X, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface NavbarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  onOpenSignUp: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export default function Navbar({ 
  currentPage, 
  setCurrentPage, 
  onOpenSignUp,
  currentUser,
  setCurrentUser
}: NavbarProps) {
  const { signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Início' },
    { id: 'about', label: 'Sobre Nós' },
    { id: 'courses', label: 'Cursos' },
    { id: 'instructors', label: 'Formadores' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contactos' },
  ] as const;

  const navigateTo = (pageId: PageId) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/244956449084?text=Ol%C3%A1%2C+gostaria+de+saber+mais+sobre+a+forma%C3%A7%C3%A3o+English+for+the+Legal+Field+da+MultiPlus+Academy.`, '_blank');
  };

  const handlePortalRedirect = () => {
    if (!currentUser) {
      navigateTo('login');
      return;
    }
    if (currentUser.role === 'STUDENT') {
      navigateTo('student-dashboard');
    } else if (currentUser.role === 'INSTRUCTOR') {
      navigateTo('instructor-dashboard');
    } else if (currentUser.role === 'ADMIN') {
      navigateTo('admin-dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {}
    setCurrentUser(null);
    navigateTo('home');
  };

  return (
    <nav
      id="navbar-root"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'py-3 bg-[#0A2E5D]/90 backdrop-blur-xl border-b border-[#C89B3C]/20 shadow-lg'
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                alt="MultiPlus Academy"
                className="h-14 w-auto object-contain transition-transform duration-300 hover:scale-[1.03]"
              />
              <span className="sr-only">MultiPlus Academy</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                  currentPage === item.id
                    ? 'text-[#C89B3C]'
                    : isScrolled 
                      ? 'text-[#F8F8F6]/90 hover:text-white hover:bg-white/5' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
                {currentPage === item.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-1 left-4 right-4 h-0.5 bg-[#C89B3C]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* CTA Button Block (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-[#C89B3C]/40 transition-colors duration-200"
            >
              <Phone size={13} className="text-[#C89B3C]" />
              WhatsApp
            </button>
            
            <button
              onClick={onOpenSignUp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-[#DFB155] to-[#C89B3C] text-white border border-[#DFB155]/20 hover:from-[#E2B755] hover:to-[#D1A442] shadow-[0_4px_16px_rgba(200,155,60,0.15)] transition-all duration-200"
            >
              <GraduationCap size={14} />
              Inscrição
            </button>

            {/* Dynamic Portal Button */}
            <button
              onClick={handlePortalRedirect}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                currentUser 
                  ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-500/30' 
                  : 'bg-white/10 hover:bg-white/15 border border-[#C89B3C]/40 text-[#C89B3C]'
              }`}
            >
              {currentUser ? <LayoutDashboard size={14} className="text-[#F8F8F6]" /> : <LogIn size={14} />}
              {currentUser ? `Painel ${currentUser.firstName}` : 'Portal Académico'}
            </button>

            {/* Quick Logout if logged in */}
            {currentUser && (
              <button
                onClick={handleLogout}
                title="Sair da Conta"
                className="p-2 rounded-lg bg-white/5 hover:bg-red-950/40 border border-white/10 text-white hover:text-red-400 hover:border-red-900/50 transition-colors duration-200"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="p-2.5 rounded-lg border border-white/20 text-[#C89B3C] bg-white/5"
              aria-label="Falar no WhatsApp"
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-[#F8F8F6] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Overlay Mobile Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0A2E5D]/98 border-b border-[#C89B3C]/30 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-8 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium tracking-wide transition-colors ${
                    currentPage === item.id
                      ? 'bg-[#C89B3C]/10 text-[#C89B3C] border-l-4 border-[#C89B3C]'
                      : 'text-[#F8F8F6]/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-6 grid grid-cols-1 gap-3 px-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border border-white/20 text-[#F8F8F6] bg-white/5"
                  >
                    <Phone size={14} className="text-[#C89B3C]" />
                    WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSignUp();
                    }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C89B3C] text-white"
                  >
                    <GraduationCap size={15} />
                    Inscrição
                  </button>
                </div>

                {/* Mobile Portal Trigger */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePortalRedirect();
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 border ${
                    currentUser 
                      ? 'bg-emerald-600 text-white border-emerald-500' 
                      : 'bg-white/10 text-[#C89B3C] border-[#C89B3C]/50'
                  }`}
                >
                  {currentUser ? <LayoutDashboard size={14} /> : <LogIn size={14} />}
                  {currentUser ? `Painel Académico (${currentUser.firstName})` : 'Portal do Aluno / Formador'}
                </button>

                {currentUser && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center bg-red-950/20 text-red-400 border border-red-900/40"
                  >
                    Terminar Sessão
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
