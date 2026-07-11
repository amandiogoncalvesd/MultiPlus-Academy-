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
          ? 'py-3 bg-ink-900/90 backdrop-blur-xl border-b border-gold-600/20 shadow-lg'
          : 'py-6 bg-ink-900/40 backdrop-blur-sm'
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
                    ? 'text-gold-600'
                    : isScrolled 
                      ? 'text-cream-100/90 hover:text-cream-100 hover:bg-cream-100/5' 
                      : 'text-cream-100/80 hover:text-cream-100 hover:bg-cream-100/10'
                }`}
              >
                {item.label}
                {currentPage === item.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-1 left-4 right-4 h-0.5 bg-gold-600"
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase border border-cream-100/20 text-cream-100 bg-cream-100/5 hover:bg-cream-100/10 hover:border-gold-600/40 transition-colors duration-200"
            >
              <Phone size={13} className="text-gold-600" />
              WhatsApp
            </button>
            
            <button
              onClick={onOpenSignUp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-gold-600 to-gold-600/90 text-cream-100 border border-gold-600/20 hover:from-gold-600/90 hover:to-gold-600 shadow-[0_4px_16px_rgba(187,133,51,0.15)] transition-all duration-200"
            >
              <GraduationCap size={14} />
              Inscrição
            </button>

            {/* Dynamic Portal Button */}
            <button
              onClick={handlePortalRedirect}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                currentUser 
                  ? 'bg-emerald-600/80 hover:bg-emerald-600 text-cream-100 border border-emerald-500/30' 
                  : 'bg-cream-100/10 hover:bg-cream-100/15 border border-gold-600/40 text-gold-600'
              }`}
            >
              {currentUser ? <LayoutDashboard size={14} className="text-cream-100" /> : <LogIn size={14} />}
              {currentUser ? `Painel ${currentUser.firstName}` : 'Portal Académico'}
            </button>

            {/* Quick Logout if logged in */}
            {currentUser && (
              <button
                onClick={handleLogout}
                title="Sair da Conta"
                className="p-2 rounded-lg bg-cream-100/5 hover:bg-danger-700/40 border border-cream-100/10 text-cream-100 hover:text-danger-700 hover:border-red-900/50 transition-colors duration-200"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="p-2.5 rounded-lg border border-cream-100/20 text-gold-600 bg-cream-100/5"
              aria-label="Falar no WhatsApp"
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-cream-100 bg-cream-100/5 border border-cream-100/10 hover:bg-cream-100/10 transition-colors"
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
            className="lg:hidden bg-ink-900/98 border-b border-gold-600/30 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-8 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium tracking-wide transition-colors ${
                    currentPage === item.id
                      ? 'bg-gold-600/10 text-gold-600 border-l-4 border-gold-600'
                      : 'text-cream-100/90 hover:bg-cream-100/5 hover:text-cream-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-6 grid grid-cols-1 gap-3 px-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border border-cream-100/20 text-cream-100 bg-cream-100/5"
                  >
                    <Phone size={14} className="text-gold-600" />
                    WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSignUp();
                    }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-600 text-cream-100"
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
                      ? 'bg-emerald-600 text-cream-100 border-emerald-500' 
                      : 'bg-cream-100/10 text-gold-600 border-gold-600/50'
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
                    className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center bg-danger-700/20 text-danger-700 border border-red-900/40"
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
