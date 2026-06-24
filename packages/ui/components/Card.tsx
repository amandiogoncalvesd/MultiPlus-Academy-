import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ 
  children, 
  hoverEffect = true, 
  className = "", 
  ...props 
}: CardProps) {
  return (
    <div 
      className={`bg-white border border-gray-150 rounded-2xl p-6 shadow-[0_12px_24px_rgba(10,46,93,0.02)] transition-all duration-300 ${
        hoverEffect ? "hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(10,46,93,0.06)] hover:border-gray-200" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-b border-gray-100 pb-4 mb-4 flex items-center justify-between ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h4 className={`text-base font-serif font-black text-[#0A2E5D] m-0 ${className}`}>{children}</h4>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-xs text-gray-650 leading-relaxed font-sans ${className}`}>{children}</div>;
}
