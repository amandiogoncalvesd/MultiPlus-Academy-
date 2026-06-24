import { Award, CheckCircle, ShieldAlert } from 'lucide-react';

export default function StudentCertificatesPage() {
  return (
    <div id="student-certificates-root" className="space-y-8 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Os Meus Certificados</h2>
        <p className="text-xs text-gray-500">Transfira os seus certificados homologados e auditáveis em formato PDF de alta resolução.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-gray-150 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold uppercase rounded border border-emerald-100">Emitido com Sucesso</span>
              <Award size={20} className="text-[#C89B3C]" />
            </div>
            
            <h3 className="text-lg font-serif font-black text-[#0A2E5D]">Intensivo de Legal Vocabulary</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Domínio conceitual dos termos contratuais e prática elementar de conversações e correspondência societária internacional.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="text-[9px] font-mono text-gray-400">REG: MPA-9482-1102</span>
            <button className="px-3.5 py-1.5 bg-[#0A2E5D] text-white font-mono text-[10px] font-bold uppercase rounded-lg hover:bg-[#123C73] transition-all">
              Descarregar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
