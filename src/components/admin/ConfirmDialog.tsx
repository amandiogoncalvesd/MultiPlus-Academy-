import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ open, title, description, confirmLabel, busy, danger, onCancel, onConfirm }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} onCancel={(event) => { event.preventDefault(); onCancel(); }} aria-labelledby="confirm-dialog-title" className="w-[min(440px,calc(100vw-2rem))] rounded-3xl border border-gray-150 bg-white p-0 text-ink-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-ink-800 dark:bg-ink-900 dark:text-cream-100"><div className="p-6"><h2 id="confirm-dialog-title" className="font-serif text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-cream-200/70">{description}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onCancel} disabled={busy} className="min-h-11 rounded-xl border border-gray-250 px-4 text-xs font-mono font-bold uppercase dark:border-ink-800">Cancelar</button><button onClick={onConfirm} disabled={busy} className={`min-h-11 rounded-xl px-4 text-xs font-mono font-bold uppercase ${danger ? 'bg-rose-600 text-white' : 'bg-ink-900 text-white dark:bg-gold-600 dark:text-ink-900'} disabled:opacity-50`}>{busy ? 'A processar…' : confirmLabel}</button></div></div></dialog>;
}
