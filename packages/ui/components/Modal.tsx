import * as React from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#061B37]/45 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Content box */}
      <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-[0_24px_64px_rgba(10,46,93,0.18)] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-lg font-serif font-black text-[#0A2E5D] m-0">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="text-left py-2">
          {children}
        </div>
      </div>
    </div>
  );
}
