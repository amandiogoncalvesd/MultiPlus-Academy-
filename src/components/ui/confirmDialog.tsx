import { createRoot } from 'react-dom/client';
import ConfirmDialog from '../admin/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}

/**
 * Confirmação imperativa baseada no ConfirmDialog institucional.
 * Substitui o `window.confirm` nativo por um diálogo acessível e
 * consistente com o design Ledger Light.
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const finish = (result: boolean) => {
      resolve(result);
      // Deixa o dialog fechar antes de desmontar.
      window.setTimeout(() => {
        root.unmount();
        host.remove();
      }, 80);
    };
    root.render(
      <ConfirmDialog
        open
        title={options.title}
        description={options.description ?? ''}
        confirmLabel={options.confirmLabel ?? 'Confirmar'}
        danger={options.danger}
        onCancel={() => finish(false)}
        onConfirm={() => finish(true)}
      />,
    );
  });
}
