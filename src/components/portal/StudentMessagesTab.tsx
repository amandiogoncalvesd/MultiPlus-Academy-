import React from 'react';
import ChatShell from '../messaging/ChatShell';
import { Mail } from 'lucide-react';

export default function StudentMessagesTab() {
  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150">
        <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Canais Académicos</span>
        <h3 className="text-lg font-serif font-black text-[#0A2E5D] m-0">Canal de Tutoria Direta (Mensagens)</h3>
        <p className="text-xs text-gray-400 mt-1">
          Comunique diretamente com a sua professora titular para tirar dúvidas académicas ou guias de oratória em tempo real.
        </p>
      </div>

      {/* Real-time chat console */}
      <ChatShell role="ALUNO" />
    </div>
  );
}
