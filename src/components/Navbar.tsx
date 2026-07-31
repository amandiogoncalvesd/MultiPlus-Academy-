import React, { useEffect, useRef, useState } from 'react';
import { PageId } from '../types';
import { Phone, GraduationCap, LogIn, LayoutDashboard, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface NavbarProps { currentPage: PageId; setCurrentPage: (page: PageId) => void; onOpenSignUp: () => void; }

export default function Navbar({ currentPage, setCurrentPage, onOpenSignUp }: NavbarProps) {
  const { signOut, user: currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const firstMobileLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { const onScroll = () => setIsScrolled(window.scrollY > 20); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsMobileMenuOpen(false); setIsUserDropdownOpen(false); } };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    if (isMobileMenuOpen) window.setTimeout(() => firstMobileLinkRef.current?.focus(), 0);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [isMobileMenuOpen]);

  const navItems: Array<{ id: PageId; label: string }> = [{ id:'home',label:'Início' },{ id:'courses',label:'Cursos' },{ id:'instructors',label:'Formadores' },{ id:'about',label:'Sobre' },{ id:'contact',label:'Contactos' }];
  const closeMobile = () => setIsMobileMenuOpen(false);
  const navigateTo = (page: PageId) => { setCurrentPage(page); closeMobile(); setIsUserDropdownOpen(false); window.scrollTo({ top:0, behavior:'smooth' }); };
  const portal = () => { if (!currentUser) return navigateTo('login'); if (currentUser.role==='ALUNO') navigateTo('student-dashboard'); else if (currentUser.role==='PROFESSOR') navigateTo('instructor-dashboard'); else navigateTo('admin-dashboard'); };
  const logout = async () => { await signOut().catch(() => undefined); navigateTo('home'); };
  const whatsapp = () => window.open('https://wa.me/244956449084?text=Olá%2C+gostaria+de+saber+mais+sobre+a+MultiPlus+Academy.', '_blank', 'noopener,noreferrer');
  const signUp = () => { closeMobile(); onOpenSignUp(); };

  return <>
    <nav aria-label="Navegação pública" className={`fixed inset-x-0 top-0 z-[70] border-b transition-all duration-200 ${isScrolled ? 'border-stone-200/70 bg-white/95 shadow-sm backdrop-blur-md' : 'border-transparent bg-white/80 backdrop-blur-sm'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigateTo('home')} className="group flex items-center gap-2.5" aria-label="Ir para a página inicial"><img src="/brand/multiplus-academy-logo-original.png" alt="MultiPlus Academy" className="h-9 w-auto transition-transform duration-200 group-hover:scale-[1.03]"/><span className="hidden sm:block"><b className="block font-serif text-[15px] leading-none text-ink-900">MultiPlus</b><small className="mt-1 block font-mono text-[8px] font-bold uppercase tracking-[.2em] text-accent">Academy</small></span></button>
        <div className="hidden items-center gap-1 md:flex">{navItems.map(item=><button key={item.id} onClick={()=>navigateTo(item.id)} aria-current={currentPage===item.id?'page':undefined} className={`rounded-lg px-3.5 py-2 text-[13px] transition ${currentPage===item.id?'bg-stone-100 font-semibold text-ink-900':'text-stone-500 hover:bg-stone-50 hover:text-ink-900'}`}>{item.label}</button>)}</div>
        <div className="hidden items-center gap-2 md:flex"><button onClick={whatsapp} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-[11px] font-bold text-white hover:bg-[#1fb75b]" aria-label="Contactar via WhatsApp"><Phone size={13}/>WhatsApp</button><button onClick={signUp} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-[11px] font-mono font-bold uppercase text-white hover:bg-accent/90"><GraduationCap size={14}/>Inscrição</button>{currentUser?<div className="relative"><button onClick={()=>setIsUserDropdownOpen(!isUserDropdownOpen)} aria-expanded={isUserDropdownOpen} aria-haspopup="menu" className="ml-1 flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 shadow-sm hover:border-stone-300">{currentUser.avatarUrl?<img src={currentUser.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover"/>:<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">{currentUser.firstName?.[0]||'A'}</span>}<ChevronDown size={12} className="text-stone-400"/></button>{isUserDropdownOpen&&<div role="menu" className="absolute right-0 mt-2 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl"><button role="menuitem" onClick={portal} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs text-ink-900 hover:bg-stone-50"><LayoutDashboard size={15} className="text-accent"/>Painel acadêmico</button><button role="menuitem" onClick={logout} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs text-danger-700 hover:bg-red-50"><LogOut size={15}/>Terminar sessão</button></div>}</div>:<button onClick={portal} className="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3.5 text-[11px] font-mono font-bold uppercase text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-white"><LogIn size={14}/>Portal</button>}</div>
        <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-lg p-2 text-ink-900 hover:bg-stone-100 md:hidden" aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" aria-label="Alternar menu de navegação">{isMobileMenuOpen?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
    </nav>
    {isMobileMenuOpen&&<div className="fixed inset-0 z-[60] md:hidden" aria-hidden={false}><button className="absolute inset-0 bg-[#081525]/35 backdrop-blur-[1px]" aria-label="Fechar menu" onClick={closeMobile}/><div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Menu de navegação" className="absolute inset-x-0 top-16 border-b border-stone-200 bg-white shadow-xl"><div className="mx-auto max-w-7xl px-4 py-5"><div className="space-y-1">{navItems.map((item,index)=><button ref={index===0?firstMobileLinkRef:undefined} key={item.id} onClick={()=>navigateTo(item.id)} aria-current={currentPage===item.id?'page':undefined} className={`flex min-h-12 w-full items-center rounded-xl px-4 text-left text-[15px] ${currentPage===item.id?'bg-stone-100 font-semibold text-ink-900':'text-stone-600 hover:bg-stone-50 hover:text-ink-900'}`}>{item.label}</button>)}</div><div className="mt-5 border-t border-stone-200 pt-4"><button onClick={signUp} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[12px] font-mono font-bold uppercase text-white hover:bg-accent/90"><GraduationCap size={16}/>Inscrição</button><div className="mt-3 grid grid-cols-2 gap-3"><button onClick={whatsapp} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[12px] font-bold text-white hover:bg-[#1fb75b]"><Phone size={14}/>WhatsApp</button><button onClick={portal} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 text-[12px] font-bold text-ink-900 hover:bg-stone-50">{currentUser ? <><LayoutDashboard size={14}/><span>Painel</span></> : <><LogIn size={14}/><span>Portal</span></>}</button></div></div></div></div></div>}
  </>;
}
