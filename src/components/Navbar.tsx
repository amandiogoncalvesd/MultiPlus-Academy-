// New Navbar for MultiPlus Academy — Clean, Professional LMS Navigation
// Replaces the heavy PillNav (628 lines) with a proper LMS-appropriate navbar

import React, { useState, useEffect } from 'react';
import { PageId } from '../types';
import { Phone, GraduationCap, LogIn, LayoutDashboard, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface NavbarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  onOpenSignUp: () => void;
}

export default function Navbar({ currentPage, setCurrentPage, onOpenSignUp }: NavbarProps) {
  const { signOut, user: currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsMobileMenuOpen(false); setIsUserDropdownOpen(false); } };
    window.addEventListener('keydown', closeOnEscape);
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', closeOnEscape); };
  }, [isMobileMenuOpen]);

  const navItems: Array<{ id: PageId; label: string }> = [
    { id: 'home', label: 'Início' },
    { id: 'courses', label: 'Cursos' },
    { id: 'instructors', label: 'Formadores' },
    { id: 'about', label: 'Sobre' },
    { id: 'contact', label: 'Contactos' },
  ];

  const navigateTo = (pageId: PageId) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePortalRedirect = () => {
    if (!currentUser) { navigateTo('login'); return; }
    if (currentUser.role === 'ALUNO') navigateTo('student-dashboard');
    else if (currentUser.role === 'PROFESSOR') navigateTo('instructor-dashboard');
    else navigateTo('admin-dashboard');
  };

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    navigateTo('home');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/244956449084?text=Ol%C3%A1%2C+gostaria+de+saber+mais+sobre+a+forma%C3%A7%C3%B3o+English+for+the+Legal+Field+da+MultiPlus+Academy.', '_blank');
  };

  return (
    <nav
      aria-label="Navegação pública"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/98 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-stone-200/60'
          : 'bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">

          {/* Logo */}
          <button onClick={() => navigateTo('home')} className="flex items-center gap-2.5 group" aria-label="Ir para página inicial">
            <img
              src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
              alt="MultiPlus Academy"
              className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.04]"
            />
            <div className="hidden sm:block">
              <span className="font-serif text-[15px] font-black tracking-wide text-ink-900 leading-none">MultiPlus</span>
              <span className="block text-[9px] font-mono font-bold tracking-[0.18em] uppercase text-accent leading-none mt-0.5">Academy</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                aria-current={currentPage === item.id ? 'page' : undefined}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                  currentPage === item.id
                    ? 'text-ink-900 font-semibold bg-stone-100'
                    : 'text-stone-500 hover:text-ink-900 hover:bg-stone-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold tracking-wide bg-[#25D366] text-white hover:bg-[#20ba5a] transition-all duration-200 shadow-sm"
              aria-label="Contactar via WhatsApp"
            >
              <Phone size={13} className="fill-current" />
              <span className="hidden lg:inline">WhatsApp</span>
            </button>

            {/* Sign Up */}
            <button
              onClick={onOpenSignUp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide uppercase bg-accent text-white hover:bg-accent/90 transition-all duration-200 shadow-sm"
            >
              <GraduationCap size={14} />
              Inscrição
            </button>

            {/* Portal / User */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-300 bg-white transition-all duration-200"
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold capitalize">{currentUser.firstName?.[0] || 'A'}</span>
                  )}
                  <span className="text-[12px] font-medium text-ink-900 max-w-[80px] truncate">{currentUser.firstName}</span>
                  <ChevronDown size={12} className="text-stone-400 transition-transform duration-200" style={{ transform: isUserDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {isUserDropdownOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-[200px] bg-white rounded-xl border border-stone-200 shadow-lg py-2 z-50">
                    <button onClick={handlePortalRedirect} role="menuitem" className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] font-medium text-ink-900 hover:bg-stone-50 transition-colors rounded-lg">
                      <LayoutDashboard size={15} className="text-accent" />
                      Painel Académico
                    </button>
                    <button onClick={handleLogout} role="menuitem" className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] font-medium text-danger-700 hover:bg-red-50 transition-colors rounded-lg">
                      <LogOut size={15} />
                      Terminar Sessão
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handlePortalRedirect}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide uppercase border border-stone-200 text-ink-900 hover:bg-ink-900 hover:text-white hover:border-ink-900 transition-all duration-200"
              >
                <LogIn size={14} />
                Portal
              </button>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-navigation"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMobileMenuOpen ? <X size={22} className="text-ink-900" /> : <Menu size={22} className="text-ink-900" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id="public-mobile-navigation" className="md:hidden fixed inset-0 top-[64px] z-40 bg-white/98 backdrop-blur-md overflow-y-auto">
          <div className="px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full px-4 py-3 rounded-xl text-left text-[14px] font-medium transition-all cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-stone-100 text-ink-900 font-semibold'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-ink-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="px-4 pt-4 pb-6 space-y-3 border-t border-stone-200">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold tracking-wide bg-[#25D366] text-white hover:bg-[#20ba5a] transition-all"
              >
                <Phone size={14} className="fill-current" />
                WhatsApp
              </button>
              <button
                onClick={onOpenSignUp}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold tracking-wide uppercase bg-accent text-white hover:bg-accent/90 transition-all"
              >
                <GraduationCap size={14} />
                Inscrição
              </button>
            </div>

            <button
              onClick={handlePortalRedirect}
              className={`w-full py-3 rounded-xl text-[12px] font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-all ${
                currentUser
                  ? 'bg-ink-900 text-white border border-ink-800'
                  : 'border border-stone-200 text-ink-900 hover:bg-ink-900 hover:text-white hover:border-ink-900'
              }`}
            >
              {currentUser ? <LayoutDashboard size={14} /> : <LogIn size={14} />}
              {currentUser ? `Painel de ${currentUser.firstName}` : 'Portal Académico'}
            </button>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold tracking-wide uppercase text-danger-700 border border-danger-700/20 bg-danger-700/5 hover:bg-danger-700/10 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Terminar Sessão
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
