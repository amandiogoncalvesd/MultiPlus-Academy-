import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ 
  label, 
  error, 
  className = "", 
  id, 
  ...props 
}: InputProps) {
  const uniqueId = id || Math.random().toString(36).substr(2, 9);
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label htmlFor={uniqueId} className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#0A2E5D]/60">
          {label}
        </label>
      )}
      <input
        id={uniqueId}
        className={`w-full px-4 py-3 bg-white border border-gray-250 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]/30 shadow-inner transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[10px] font-mono text-rose-500 font-bold m-0">{error}</p>
      )}
    </div>
  );
}
