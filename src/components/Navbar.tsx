import React, { useState, useEffect } from 'react';
import { PageId, User } from '../types';
import { Phone, GraduationCap, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import StarBorder from './ui/StarBorder';
import PillNav, { PillNavItem } from './ui/PillNav';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pillNavItems: PillNavItem[] = navItems.map((item) => ({
    label: item.label,
    href: item.id,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      navigateTo(item.id);
    }
  }));

  const handleWhatsApp = () => {
    window.open(`https://wa.me/244956449084?text=Ol%C3%A1%2C+gostaria+de+saber+mais+sobre+a+forma%C3%A7%C3%A3o+English+for+the+Legal+Field+da+MultiPlus+Academy.`, '_blank');
  };

  const handlePortalRedirect = () => {
    if (!currentUser) {
      navigateTo('login');
      return;
    }
    if (currentUser.role === 'ALUNO') {
      navigateTo('student-dashboard');
    } else if (currentUser.role === 'PROFESSOR') {
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

  const mobileExtraContent = (
    <div className="pt-2 grid grid-cols-1 gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#25D366] text-white hover:bg-[#20ba5a] transition-all duration-200 shadow-sm"
        >
          <Phone size={14} className="fill-current text-white" />
          WhatsApp
        </button>

        <button
          onClick={onOpenSignUp}
          className="flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C89B3C] text-white hover:bg-[#b0842f] transition-colors shadow-sm"
        >
          <GraduationCap size={15} />
          Inscrição
        </button>
      </div>

      {/* Mobile Portal Trigger */}
      <button
        onClick={handlePortalRedirect}
        className={`w-full py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 border transition-all shadow-sm ${
          currentUser 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-[#0A2E5D] text-white border-[#0A2E5D]/20 hover:bg-[#123C73]'
        }`}
      >
        {currentUser ? <LayoutDashboard size={14} /> : <LogIn size={14} />}
        {currentUser ? `Painel (${currentUser.firstName})` : 'Portal Académico'}
      </button>

      {currentUser && (
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-center bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
        >
          Terminar Sessão
        </button>
      )}
    </div>
  );

  return (
    <nav
      id="navbar-root"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'py-3 bg-[#F8F8F6]/95 backdrop-blur-xl border-b border-slate-200/60 shadow-md'
          : 'py-6 bg-[#F8F8F6]/30 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Responsive PillNav (Handles Logo, Menu, Mobile Hamburger, and Dropdown with GSAP) */}
          <div className="flex-1 min-w-0 md:flex-initial">
            <PillNav
              logo="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
              logoAlt="MultiPlus Academy"
              items={pillNavItems}
              activeHref={currentPage}
              baseColor="#0A2E5D"
              pillColor="#0A2E5D"
              hoveredPillTextColor="#FFFFFF"
              pillTextColor="#FAF9F6"
              containerBgColor="#FAF9F6"
              activeBgColor="#C89B3C"
              activeTextColor="#FFFFFF"
              inactiveTextColor="#FAF9F6"
              hoverBgColor="#C89B3C"
              logoBgColor="#FFFFFF"
              hamburgerBgColor="#FFFFFF"
              hamburgerLineColor="#0A2E5D"
              className="py-1"
              mobileExtra={mobileExtraContent}
            />
          </div>

          {/* Desktop-only CTAs on the Right */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase bg-[#25D366] text-white hover:bg-[#20ba5a] shadow-md shadow-emerald-500/10 hover:scale-[1.03] transition-all duration-300"
            >
              <Phone size={13} className="fill-current text-white" />
              WhatsApp
            </button>
            
            <StarBorder
              as="button"
              onClick={onOpenSignUp}
              color="#0A2E5D"
              speed="4s"
              thickness={1.5}
              className="rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:scale-[1.03]"
              innerClassName="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C89B3C] to-[#E2B755] text-white text-xs font-bold tracking-wider uppercase rounded-xl"
            >
              <GraduationCap size={14} />
              Inscrição
            </StarBorder>

            {/* Dynamic Portal Button */}
            <StarBorder
              as="button"
              onClick={handlePortalRedirect}
              color={currentUser ? "#10B981" : "#C89B3C"}
              speed="5s"
              thickness={1.5}
              className="rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:scale-[1.03]"
              innerClassName={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl ${
                currentUser 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#0A2E5D] text-[#FAF9F6] border border-[#C89B3C]/20'
              }`}
            >
              {currentUser ? <LayoutDashboard size={14} className="text-white" /> : <LogIn size={14} className="text-[#C89B3C]" />}
              {currentUser ? `Painel ${currentUser.firstName}` : 'Portal Académico'}
            </StarBorder>

            {/* Quick Logout if logged in */}
            {currentUser && (
              <button
                onClick={handleLogout}
                title="Sair da Conta"
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors duration-200 shadow-sm"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
