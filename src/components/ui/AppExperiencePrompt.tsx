import { useEffect, useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';

type DeferredInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

interface Props { enabled: boolean; }

export default function AppExperiencePrompt({ enabled }: Props) {
  const [installPrompt, setInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setStandalone(isStandalone);
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as DeferredInstallPrompt); };
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); document.removeEventListener('fullscreenchange', onFullscreen); };
  }, []);

  useEffect(() => { if (enabled) setDismissed(false); }, [enabled]);
  if (!enabled || dismissed || (standalone && fullscreen)) return null;

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };
  const immersive = async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); }
    catch { /* Browser requires a user gesture and may deny fullscreen. */ }
  };

  return <aside className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] mx-auto max-w-md rounded-2xl border border-[#C99A47]/35 bg-[#0B1629] p-4 text-[#F7F6F2] shadow-2xl sm:left-auto sm:right-5 sm:w-[390px]" aria-label="Experiência do aplicativo"><button onClick={() => setDismissed(true)} className="absolute right-2 top-2 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Fechar aviso"><X size={16}/></button><p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#E8C77C]">MultiPlus no seu dispositivo</p><h2 className="mt-2 pr-7 font-serif text-lg font-black">Use a plataforma em modo aplicativo</h2><p className="mt-1 text-xs leading-relaxed text-white/70">Instale a MultiPlus Academy para acesso rápido ou abra o modo imersivo durante seus estudos.</p><div className="mt-4 flex flex-wrap gap-2">{installPrompt && !standalone && <button onClick={install} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#C99A47] px-3 text-xs font-mono font-bold uppercase text-[#0B1629]"><Download size={15}/>Instalar app</button>}{!fullscreen && <button onClick={immersive} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 px-3 text-xs font-mono font-bold uppercase text-white hover:bg-white/10"><Maximize2 size={15}/>Modo imersivo</button>}</div>{!installPrompt && !standalone && <p className="mt-3 text-[10px] text-white/50">A opção de instalação aparece quando o navegador oferece suporte a aplicativos instaláveis.</p>}</aside>;
}
