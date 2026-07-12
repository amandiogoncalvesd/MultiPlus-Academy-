import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export interface PillNavProps {
  logo: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
  mobileExtra?: React.ReactNode;

  // Custom design overrides
  containerBgColor?: string;
  activeBgColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  hoverBgColor?: string;
  logoBgColor?: string;
  hamburgerBgColor?: string;
  hamburgerLineColor?: string;
}

// Simple fallback Link component to avoid dependencies on react-router-dom
const Link: React.FC<{ to: string; className?: string; style?: React.CSSProperties; [key: string]: any }> = ({
  to,
  children,
  ...props
}) => {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
};

const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#fff',
  pillColor = '#120F17',
  hoveredPillTextColor = '#120F17',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
  mobileExtra,
  containerBgColor,
  activeBgColor,
  activeTextColor,
  inactiveTextColor,
  hoverBgColor,
  logoBgColor,
  hamburgerBgColor,
  hamburgerLineColor
}) => {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLElement | null>(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1, y: 0, pointerEvents: 'none' });
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;

      if (logoEl) {
        gsap.set(logoEl, { scale: 0 });
        gsap.to(logoEl, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, {
          width: 'auto',
          duration: 0.6,
          ease
        });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  // Handles premium GSAP animations for mobile menu & hamburger icon when state changes
  useEffect(() => {
    const menu = mobileMenuRef.current;
    const hamburger = hamburgerRef.current;
    if (!menu) return;

    const listItems = menu.querySelectorAll('li');

    if (isMobileMenuOpen) {
      // Hamburger morph to close button (X)
      if (hamburger) {
        const lines = hamburger.querySelectorAll('.hamburger-line');
        if (lines.length >= 2) {
          gsap.killTweensOf(lines);
          gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease: 'power2.out' });
          gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease: 'power2.out' });
        }
      }

      // Smooth slide down and fade in for the mobile menu panel
      gsap.killTweensOf([menu, listItems]);
      gsap.set(menu, { visibility: 'visible', pointerEvents: 'auto' });
      gsap.fromTo(
        menu,
        { opacity: 0, y: -15, scaleY: 0.95 },
        {
          opacity: 1,
          y: 0,
          scaleY: 1,
          duration: 0.45,
          ease: 'power4.out',
          transformOrigin: 'top center'
        }
      );

      // Staggered reveal for individual list items
      gsap.fromTo(
        listItems,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power3.out',
          delay: 0.08
        }
      );
    } else {
      // Hamburger morph back to menu button (three lines)
      if (hamburger) {
        const lines = hamburger.querySelectorAll('.hamburger-line');
        if (lines.length >= 2) {
          gsap.killTweensOf(lines);
          gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.out' });
          gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.out' });
        }
      }

      // Smooth slide up and fade out for the mobile menu panel
      gsap.killTweensOf([menu, listItems]);
      gsap.to(listItems, {
        opacity: 0,
        y: -8,
        duration: 0.2,
        stagger: 0.02,
        ease: 'power2.in'
      });

      gsap.to(menu, {
        opacity: 0,
        y: -15,
        scaleY: 0.95,
        duration: 0.35,
        ease: 'power3.inOut',
        transformOrigin: 'top center',
        onComplete: () => {
          gsap.set(menu, { visibility: 'hidden', pointerEvents: 'none' });
        }
      });
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => href && !isExternalLink(href);

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor,
    ['--nav-h']: '46px',
    ['--logo']: '38px',
    ['--pill-pad-x']: '18px',
    ['--pill-gap']: '4px',

    // Custom overrides
    ['--container-bg']: containerBgColor ?? baseColor,
    ['--active-bg']: activeBgColor ?? baseColor,
    ['--active-text']: activeTextColor ?? hoveredPillTextColor,
    ['--inactive-text']: inactiveTextColor ?? resolvedPillTextColor,
    ['--hover-bg']: hoverBgColor ?? activeBgColor ?? baseColor,
    ['--logo-bg']: logoBgColor ?? baseColor,
    ['--hamburger-bg']: hamburgerBgColor ?? baseColor,
    ['--hamburger-line-color']: hamburgerLineColor ?? pillColor
  } as React.CSSProperties;

  return (
    <div className="relative z-[1000] w-full md:w-auto">
      <nav
        className={`w-full md:w-max flex items-center justify-between md:justify-start box-border px-4 md:px-0 ${className}`}
        aria-label="Primary"
        style={cssVars}
      >
        {isRouterLink(items?.[0]?.href) ? (
          <Link
            to={items[0].href}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            role="menuitem"
            onClick={(e) => {
              if (items[0].onClick) {
                e.preventDefault();
                items[0].onClick(e);
              }
            }}
            ref={el => {
              logoRef.current = el;
            }}
            className="rounded-full p-1.5 inline-flex items-center justify-center overflow-hidden border border-slate-200/40 shadow-sm"
            style={{
              width: 'var(--nav-h)',
              height: 'var(--nav-h)',
              background: 'var(--logo-bg, var(--base, #000))'
            }}
          >
            <img src={logo} alt={logoAlt} ref={logoImgRef} className="w-full h-full object-cover block" />
          </Link>
        ) : (
          <a
            href={items?.[0]?.href || '#'}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            onClick={(e) => {
              if (items?.[0]?.onClick) {
                e.preventDefault();
                items[0].onClick(e);
              }
            }}
            ref={el => {
              logoRef.current = el as HTMLAnchorElement;
            }}
            className="rounded-full p-1.5 inline-flex items-center justify-center overflow-hidden border border-slate-200/40 shadow-sm"
            style={{
              width: 'var(--nav-h)',
              height: 'var(--nav-h)',
              background: 'var(--logo-bg, var(--base, #000))'
            }}
          >
            <img src={logo} alt={logoAlt} ref={logoImgRef} className="w-full h-full object-cover block" />
          </a>
        )}

        <div
          ref={navItemsRef}
          className="relative items-center rounded-full hidden md:flex ml-2 shadow-sm border border-slate-200/50"
          style={{
            height: 'var(--nav-h)',
            background: 'var(--container-bg, var(--base, #000))'
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-[3px] h-full"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;

              const pillStyle: React.CSSProperties = {
                background: isActive ? 'var(--active-bg, var(--base, #fff))' : 'var(--pill-bg, #fff)',
                color: isActive ? 'var(--active-text, var(--hover-text, #fff))' : 'var(--inactive-text, var(--pill-text, var(--base, #000)))',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)'
              };

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: 'var(--hover-bg, var(--base, #000))',
                      willChange: 'transform'
                    }}
                    aria-hidden="true"
                    ref={el => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack relative inline-block leading-[1] z-[2]">
                    <span
                      className="pill-label relative z-[2] inline-block leading-[1]"
                      style={{ willChange: 'transform' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-[3] inline-block"
                      style={{
                        color: 'var(--active-text, var(--hover-text, #fff))',
                        willChange: 'transform, opacity'
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-1.5 h-1.5 rounded-full z-[4]"
                      style={{ background: 'var(--active-bg, var(--base, #000))' }}
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              const basePillClasses =
                'relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[13px] leading-[0] uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-0 transition-colors duration-200';

              return (
                <li key={item.href} role="none" className="flex h-full">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={(e) => {
                        if (item.onClick) {
                          e.preventDefault();
                          item.onClick(e);
                        }
                      }}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={(e) => {
                        if (item.onClick) {
                          e.preventDefault();
                          item.onClick(e);
                        }
                      }}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden rounded-full border border-slate-200/60 shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer p-0 relative ml-auto"
          style={{
            width: 'var(--nav-h)',
            height: 'var(--nav-h)',
            background: 'var(--hamburger-bg, var(--base, #000))'
          }}
        >
          <span
            className="hamburger-line w-4 h-0.5 rounded origin-center transition-all duration-[10ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ background: 'var(--hamburger-line-color, var(--pill-bg, #fff))' }}
          />
          <span
            className="hamburger-line w-4 h-0.5 rounded origin-center transition-all duration-[10ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ background: 'var(--hamburger-line-color, var(--pill-bg, #fff))' }}
          />
        </button>
      </nav>

      <div
        ref={mobileMenuRef}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) {
            setIsMobileMenuOpen(false);
          }
        }}
        className="md:hidden absolute top-[3em] left-4 right-4 rounded-[27px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-200/80 z-[998] origin-top p-2"
        style={{
          ...cssVars,
          background: 'var(--pill-bg, #ffffff)',
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      >
          <ul className="list-none m-0 p-[3px] flex flex-col gap-[3px]">
            {items.map(item => {
              const isActive = activeHref === item.href;
              const defaultStyle: React.CSSProperties = {
                background: isActive ? 'var(--active-bg, var(--base, #000))' : '#F3F4F6',
                color: isActive ? 'var(--active-text, var(--hover-text, #fff))' : 'var(--inactive-text, var(--pill-text, #111))'
              };
              const hoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--active-bg, var(--base))';
                  e.currentTarget.style.color = 'var(--active-text, var(--hover-text, #fff))';
                }
              };
              const hoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#F3F4F6';
                  e.currentTarget.style.color = 'var(--inactive-text, var(--pill-text, #111))';
                }
              };

              const linkClasses =
                'block py-3 px-4 text-[14px] font-medium rounded-[50px] transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] text-center cursor-pointer';

              return (
                <li key={item.href}>
                  {isRouterLink(item.href) ? (
                    <Link
                      to={item.href}
                      className={linkClasses}
                      style={defaultStyle}
                      onMouseEnter={hoverIn}
                      onMouseLeave={hoverOut}
                      onClick={(e) => {
                        setIsMobileMenuOpen(false);
                        if (item.onClick) {
                          e.preventDefault();
                          item.onClick(e);
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className={linkClasses}
                      style={defaultStyle}
                      onMouseEnter={hoverIn}
                      onMouseLeave={hoverOut}
                      onClick={(e) => {
                        setIsMobileMenuOpen(false);
                        if (item.onClick) {
                          e.preventDefault();
                          item.onClick(e);
                        }
                      }}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          {mobileExtra && (
            <div className="mt-4 pt-3 border-t border-[#FAF9F6]/10 px-1">
              {mobileExtra}
            </div>
          )}
        </div>
    </div>
  );
};

export default PillNav;
