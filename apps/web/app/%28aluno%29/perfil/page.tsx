import { User, Phone, Mail, Award, KeyRound } from 'lucide-react';

export default function StudentProfilePage() {
  return (
    <div id="student-profile-root" className="space-y-8 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Meu Perfil de Membro</h2>
        <p className="text-xs text-gray-500">Mantenha os seus dados cadastrais corporativo e credenciais de login atualizados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Basic settings list card */}
        <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-gray-150 space-y-6">
          <h3 className="font-serif font-black text-[#0A2E5D] text-lg border-b border-gray-100 pb-3">Informação Académica</h3>

          <form className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Primeiro Nome</label>
                <input type="text" defaultValue="António" className="w-full p-3 rounded-lg border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Último Nome</label>
                <input type="text" defaultValue="Ferreira Carvalho" className="w-full p-3 rounded-lg border border-gray-200 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Contacto Telefónico</label>
              <input type="text" defaultValue="+244 923 000 000" className="w-full p-3 rounded-lg border border-gray-200 outline-none" />
            </div>

            <button type="button" className="px-5 py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors">
              Guardar Alterações
            </button>
          </form>
        </div>

        {/* Dynamic metadata card */}
        <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-center">
          <div className="h-20 w-20 rounded-full bg-[#0A2E5D]/5 text-[#C89B3C] border border-[#C89B3C]/20 flex items-center justify-center mx-auto text-xl font-serif font-black">
            AC
          </div>
          <div>
            <h4 className="font-serif font-black text-[#0A2E5D] text-base">Dr. António Ferreira</h4>
            <p className="text-[10px] text-gray-400 font-mono">ESTUDANTE DE ELITE</p>
          </div>
        </div>

      </div>
    </div>
  );
}
