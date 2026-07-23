import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type DeferredInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const DISMISS_KEY = 'multiplus-install-prompt-dismissed-v1';
interface Props { enabled: boolean; }

export default function AppExperiencePrompt({ enabled }: Props) {
  const [installPrompt, setInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(() => typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === 'true');

  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as DeferredInstallPrompt); };
    const onInstalled = () => { setStandalone(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (!enabled || standalone || dismissed || !installPrompt) return null;
  const dismissForever = () => { localStorage.setItem(DISMISS_KEY, 'true'); setDismissed(true); };
  const install = async () => { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstallPrompt(null); else dismissForever(); };

  return <aside className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] mx-auto max-w-md rounded-2xl border border-[#C99A47]/35 bg-[#0B1629] p-4 text-[#F7F6F2] shadow-2xl sm:left-auto sm:right-5 sm:w-[390px]" aria-label="Instalação do aplicativo"><button onClick={dismissForever} className="absolute right-2 top-2 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Não mostrar novamente"><X size={16}/></button><p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#E8C77C]">MultiPlus no seu dispositivo</p><h2 className="mt-2 pr-7 font-serif text-lg font-black">Instale o aplicativo</h2><p className="mt-1 text-xs leading-relaxed text-white/70">Acesse seus dashboards mais rapidamente em modo aplicativo.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={install} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#C99A47] px-3 text-xs font-mono font-bold uppercase text-[#0B1629]"><Download size={15}/>Instalar app</button><button onClick={dismissForever} className="min-h-10 px-3 text-xs font-mono font-bold uppercase text-white/70 hover:text-white">Não mostrar novamente</button></div></aside>;
}
