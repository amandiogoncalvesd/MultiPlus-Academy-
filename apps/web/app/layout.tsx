import * as React from "react";
import "./globals.css";

export const metadata = {
  title: "MultiPlus Academy | Transformando Competências em Oportunidades",
  description: "Instituição de ensino de Inglês e especializações de excelência. Estude híbrido ou presencial no Huambo, Angola.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col justify-between">
        {/* Header / Navbar */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <span className="font-serif font-black text-xl tracking-tight text-[#0A2E5D] flex items-center gap-2">
              <span className="text-[#C89B3C]">🔷</span> MultiPlus <span className="font-sans font-light text-slate-500">Academy</span>
            </span>
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-bold uppercase tracking-wider text-[#0A2E5D]/85">
              <a href="/home" className="hover:text-[#C89B3C] transition-colors">Início</a>
              <a href="/sobre" className="hover:text-[#C89B3C] transition-colors">Sobre Nós</a>
              <a href="/cursos" className="hover:text-[#C89B3C] transition-colors">Cursos</a>
              <a href="/blog" className="hover:text-[#C89B3C] transition-colors">Blog</a>
              <a href="/contactos" className="hover:text-[#C89B3C] transition-colors">Contactos</a>
            </nav>
            <div className="flex items-center gap-3">
              <a 
                href="/login" 
                className="px-4 py-2 border border-[#0A2E5D]/25 hover:bg-[#0A2E5D]/5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#0A2E5D]"
              >
                Login Portal
              </a>
            </div>
          </div>
        </header>

        {/* Dynamic page contents */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-[#0A2E5D] text-white border-t border-white/10 py-12 text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <span className="font-serif font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                <span className="text-[#C89B3C]">🔷</span> MultiPlus Academy
              </span>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Líderes no ensino acadêmico e linguístico de excelência internacional. Transformando Competências em Oportunidades.
              </p>
            </div>
            <div>
              <h5 className="font-mono text-xs font-black uppercase text-[#C89B3C] tracking-widest mb-3">Programas</h5>
              <ul className="space-y-1.5 text-xs text-white/75 list-none pl-0">
                <li><a href="/cursos" className="hover:text-[#C89B3C]">English for the Legal Field</a></li>
                <li><a href="/cursos" className="hover:text-[#C89B3C]">Inglês Geral Completo</a></li>
                <li><a href="/cursos" className="hover:text-[#C89B3C]">Preparatórios IELTS/TOEFL</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-mono text-xs font-black uppercase text-[#C89B3C] tracking-widest mb-3">Links Rápidos</h5>
              <ul className="space-y-1.5 text-xs text-white/75 list-none pl-0">
                <li><a href="/sobre" className="hover:text-[#C89B3C]">Sobre Nós</a></li>
                <li><a href="/contactos" className="hover:text-[#C89B3C]">Fale Connosco</a></li>
                <li><a href="/login" className="hover:text-[#C89B3C]">Portal Académico</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-mono text-xs font-black uppercase text-[#C89B3C] tracking-widest mb-3">Contactos</h5>
              <p className="text-xs text-white/75 font-sans mb-1">📞 +244 956 449 084</p>
              <p className="text-xs text-white/75 font-sans mb-1">✉️ multiplusacademy@gmail.com</p>
              <p className="text-xs text-white/75 font-sans">📍 Huambo, República de Angola</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-white/40">
            <span>© 2026 MULTIPLUS ACADEMY. TODOS OS DIREITOS RESERVADOS.</span>
            <span>POLÍTICA DE PRIVACIDADE • TERMOS DE SERVIÇO</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
