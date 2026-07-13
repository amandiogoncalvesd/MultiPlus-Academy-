import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  innerClassName = 'bg-gradient-to-b from-black to-gray-900 border border-gray-800 text-white text-center text-[16px] py-[16px] px-[26px] rounded-[20px]',
  color,
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (color) return; // If an explicit color prop was provided, don't override with flag animation
    if (!containerRef.current) return;

    // Set initial value for CSS custom property
    gsap.set(containerRef.current, { '--star-color': '#CE1126' });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(containerRef.current, {
        '--star-color': '#000000',
        duration: 2.5,
        ease: 'power1.inOut',
      })
      .to(containerRef.current, {
        '--star-color': '#F7CE00',
        duration: 2.5,
        ease: 'power1.inOut',
      })
      .to(containerRef.current, {
        '--star-color': '#CE1126',
        duration: 2.5,
        ease: 'power1.inOut',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [color]);

  const activeColor = color || 'var(--star-color, #CE1126)';

  return (
    <Component
      ref={containerRef as any}
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as any).style
      }}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${activeColor}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${activeColor}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div className={`relative z-1 ${innerClassName}`}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
