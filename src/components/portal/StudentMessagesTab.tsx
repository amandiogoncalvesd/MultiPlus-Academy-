import React from 'react';
import ChatShell from '../messaging/ChatShell';
import { Mail } from 'lucide-react';

export default function StudentMessagesTab() {
  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150">
        <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Canais Académicos</span>
        <h3 className="text-lg font-serif font-black text-ink-900 m-0">Canal de Tutoria Direta (Mensagens)</h3>
        <p className="text-xs text-neutral-400 mt-1">
          Comunique diretamente com a sua professora titular para tirar dúvidas académicas ou guias de oratória em tempo real.
        </p>
      </div>

      {/* Real-time chat console */}
      <ChatShell role="ALUNO" />
    </div>
  );
}
