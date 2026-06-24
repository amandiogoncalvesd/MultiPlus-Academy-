import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export function Button({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}: ButtonProps) {
  let baseStyle = "px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2";
  
  let variantStyle = "";
  if (variant === "primary") {
    variantStyle = "bg-[#0A2E5D] text-white hover:bg-[#123C73] border border-[#0A2E5D] shadow-[0_4px_12px_rgba(10,46,93,0.15)]";
  } else if (variant === "secondary") {
    variantStyle = "bg-[#C89B3C] text-white hover:bg-[#B3872F] border border-[#C89B3C] shadow-[0_4px_12px_rgba(200,155,60,0.15)]";
  } else {
    variantStyle = "bg-transparent text-[#0A2E5D] hover:bg-[#0A2E5D]/5 border border-[#0A2E5D]/25";
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}
