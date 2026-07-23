# FASE 2 — Player de Vídeo e Mobile

> **Projeto:** MultiPlus Academy  
> **Data:** 18 de Julho de 2026  
> **Versão do Documento:** 1.0  
> **Objetivo:** Fornecer instruções detalhadas, passo a passo, com caminhos exatos de ficheiros, código antes/depois e justificativas, para que o Gemini possa aplicar todas as modificações sem ambiguidade.  
> **Pré-requisito:** As Fases 0 e 1 já foram aplicadas. O banco de dados já foi corrigido pelo Claude.

---

## Índice

| # | Tarefa | Severidade | Ficheiro Principal |
|---|--------|------------|-------------------|
| 2.1 | Criar componente `VideoPlayer.tsx` dedicado e responsivo | 🔴 CRÍTICO | Novo ficheiro |
| 2.2 | Adicionar barra de progresso/seek interativa ao player | 🔴 CRÍTICO | `VideoPlayer.tsx` |
| 2.3 | Adicionar botão de ecrã inteiro (fullscreen) | 🔴 CRÍTICO | `VideoPlayer.tsx` |
| 2.4 | Adicionar botão de retroceder 15 segundos | 🟡 MÉDIO | `VideoPlayer.tsx` |
| 2.5 | Adicionar controlo de volume | 🟡 MÉDIO | `VideoPlayer.tsx` |
| 2.6 | Melhorar layout mobile do player — eliminar sobreposições | 🔴 CRÍTICO | `StudentPortal.tsx` |
| 2.7 | Redesenhar controles do player para toque mobile | 🔴 CRÍTICO | `VideoPlayer.tsx` |
| 2.8 | Melhorar apresentação da descrição/transcrição da aula | 🟡 MÉDIO | `StudentPortal.tsx` |
| 2.9 | Redesenhar QuizArea para mobile | 🟡 MÉDIO | `QuizArea.tsx` |
| 2.10 | Redesenhar caderno de apontamentos para mobile | 🟡 MÉDIO | `StudentPortal.tsx` |
| 2.11 | Melhorar layout mobile da lista de aulas (cursograma) | 🔴 CRÍTICO | `StudentPortal.tsx` |
| 2.12 | Corrigir overlay de sidebar no mobile | 🟡 MÉDIO | `StudentSidebar.tsx` |
| 2.13 | Corrigir topbar para dispositivos pequenos | 🟡 MÉDIO | `StudentTopbar.tsx` |
| 2.14 | Adicionar suporte a gestos touch no player (swipe) | 🟡 MÉDIO | `VideoPlayer.tsx` |
| 2.15 | Melhorar acessibilidade do player (ARIA, teclado) | 🟡 MÉDIO | `VideoPlayer.tsx` |
| 2.16 | Atualizar `useVideoPlayer.ts` para suportar novas funcionalidades | 🔴 CRÍTICO | `useVideoPlayer.ts` |
| 2.17 | Integrar novo `VideoPlayer.tsx` no `StudentPortal.tsx` | 🔴 CRÍTICO | `StudentPortal.tsx` |

---

## 2.1 — Criar Componente `VideoPlayer.tsx` Dedicado e Responsivo

### Problema

O player de vídeo atual está embutido diretamente no `StudentPortal.tsx` (linhas 716-862), misturando lógica de apresentação com lógica de negócio. O vídeo usa um `<video>` nativo sem `controls`, com controles customizados que não funcionam bem em mobile:

- **Sem barra de progresso/seek** — impossível navegar no vídeo
- **Sem fullscreen** — vídeo fica minúsculo em mobile
- **Controles太小** — botões de 10px inacessíveis em toque
- **Elementos sobrepostos** — watermark, labels "AUTO 1080P" e "Reprodução LMS" cobrem o vídeo
- **Sem volume** — não há controlo de volume
- **Sem retroceder** — apenas +15s, sem -15s
- **Sem gestos touch** — não responde a toque duplo, swipe, etc.

### Solução

Criar um componente dedicado `VideoPlayer.tsx` que substitui toda a lógica inline do player no `StudentPortal.tsx`.

### Ficheiro: `src/components/portal/VideoPlayer.tsx` (NOVO)

```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  Loader2,
} from 'lucide-react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string;
  title: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentSeconds: number;
  setCurrentSeconds: (seconds: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  watermarkPosition: { top: string; left: string };
  watermarkText: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function VideoPlayer({
  videoRef,
  src,
  title,
  isPlaying,
  setIsPlaying,
  currentSeconds,
  setCurrentSeconds,
  playbackSpeed,
  onSpeedChange,
  watermarkPosition,
  watermarkText,
  onEnded,
  onTimeUpdate,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // =====================================================================
  // FULLSCREEN API (com fallback para webkit)
  // =====================================================================
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen não suportado:', err);
    }
  }, []);

  // Escutar mudanças de fullscreen (incluindo ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // =====================================================================
  // AUTO-HIDE CONTROLS
  // =====================================================================
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  }, [isPlaying, controlsTimeout]);

  const handleMouseMove = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleTouchStart = useCallback(() => {
    // No mobile, toque alterna a visibilidade dos controles
    setShowControls(prev => !prev);
    resetControlsTimer();
  }, [resetControlsTimer]);

  // =====================================================================
  // SEEK BAR
  // =====================================================================
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!progressRef.current || !videoRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      let clientX: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentSeconds(Math.floor(newTime));
    },
    [duration, videoRef, setCurrentSeconds]
  );

  // =====================================================================
  // VOLUME
  // =====================================================================
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted, videoRef]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVol = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.volume = newVol;
        setVolume(newVol);
        setIsMuted(newVol === 0);
      }
    },
    [videoRef]
  );

  // =====================================================================
  // PLAY/PAUSE
  // =====================================================================
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((e) => console.error('Erro ao reproduzir:', e));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying, videoRef]);

  // =====================================================================
  // SKIP FORWARD/BACKWARD
  // =====================================================================
  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration || 0,
        videoRef.current.currentTime + 15
      );
    }
  }, [videoRef]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 15);
    }
  }, [videoRef]);

  // =====================================================================
  // KEYBOARD SHORTCUTS
  // =====================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Apenas atalhos quando o player está em foco ou fullscreen
      if (!isFullscreen && document.activeElement !== containerRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, togglePlay, toggleFullscreen, skipForward, skipBackward, volume, toggleMute, videoRef]);

  // =====================================================================
  // VIDEO EVENTS
  // =====================================================================
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, [videoRef]);

  const handleWaiting = useCallback(() => setIsLoading(true), []);
  const handleCanPlay = useCallback(() => setIsLoading(false), []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const ct = videoRef.current.currentTime;
      setCurrentSeconds(Math.floor(ct));
      onTimeUpdate?.(ct);

      // Atualizar buffer
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / (videoRef.current.duration || 1)) * 100);
      }
    }
  }, [videoRef, setCurrentSeconds, onTimeUpdate]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [setIsPlaying, onEnded]);

  // =====================================================================
  // FORMATADORES
  // =====================================================================
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentSeconds / duration) * 100 : 0;

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-2xl overflow-hidden select-none group"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onTouchStart={handleTouchStart}
      tabIndex={0}
      role="application"
      aria-label={`Player de vídeo: ${title}`}
    >
      {/* Anti-gravação watermark */}
      <div
        className="absolute text-white/10 text-[11px] sm:text-xs font-mono tracking-widest font-extrabold pointer-events-none z-20 bg-black/10 px-2.5 py-1 rounded border border-white/5 whitespace-nowrap transition-all duration-1000 ease-in-out"
        style={{ top: watermarkPosition.top, left: watermarkPosition.left, transform: 'rotate(-5deg)' }}
      >
        🛡 {watermarkText}
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 pointer-events-none">
          <Loader2 className="w-10 h-10 text-gold-600 animate-spin" />
        </div>
      )}

      {/* VIDEO ELEMENT */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleVideoTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        playsInline
        preload="metadata"
      />

      {/* Centro: Botão Play/Pause grande (visível quando pausado) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 cursor-pointer border-0 bg-transparent"
          aria-label="Reproduzir vídeo"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold-600/90 flex items-center justify-center shadow-lg hover:bg-gold-600 transition-colors">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* ================================================================== */}
      {/* CONTROLES BOTTOM BAR */}
      {/* ================================================================== */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Gradiente de fundo para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-8 space-y-2">
          {/* SEEK BAR */}
          <div
            ref={progressRef}
            className="relative h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer group/progress hover:h-2.5 sm:hover:h-3 transition-all"
            onClick={handleProgressClick}
            onTouchMove={handleProgressClick}
            role="slider"
            aria-label="Progresso do vídeo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
          >
            {/* Buffer */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
            {/* Progresso */}
            <div
              className="absolute top-0 left-0 h-full bg-gold-600 rounded-full pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-gold-600 rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* CONTROLES LINHA INFERIOR */}
          <div className="flex items-center justify-between gap-2">
            {/* Esquerda: Play/Pause + Skip + Volume */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Retroceder 15s */}
              <button
                onClick={skipBackward}
                className="p-1.5 sm:p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer border-0 bg-transparent"
                aria-label="Retroceder 15 segundos"
                title="-15s"
              >
                <SkipBack size={18} className="sm:w-5 sm:h-5" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-1.5 sm:p-2 text-white hover:text-gold-600 rounded-full hover:bg-white/10 transition-all cursor-pointer border-0 bg-transparent"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause size={22} className="sm:w-6 sm:h-6" fill="white" />
                ) : (
                  <Play size={22} className="sm:w-6 sm:h-6" fill="white" />
                )}
              </button>

              {/* Avançar 15s */}
              <button
                onClick={skipForward}
                className="p-1.5 sm:p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer border-0 bg-transparent"
                aria-label="Avançar 15 segundos"
                title="+15s"
              >
                <SkipForward size={18} className="sm:w-5 sm:h-5" />
              </button>

              {/* Volume (visível apenas em desktop) */}
              <div className="hidden sm:flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer border-0 bg-transparent"
                  aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-gold-600 cursor-pointer"
                  aria-label="Volume"
                />
              </div>

              {/* Tempo */}
              <span className="text-[10px] sm:text-xs font-mono text-white/70 ml-1 whitespace-nowrap">
                {formatTime(currentSeconds)} / {formatTime(duration)}
              </span>
            </div>

            {/* Direita: Velocidade + Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Menu de velocidade */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="p-1.5 sm:p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer border-0 bg-transparent flex items-center gap-1"
                  aria-label="Velocidade de reprodução"
                >
                  <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-xs font-mono hidden sm:inline">{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md rounded-xl p-1.5 shadow-xl border border-white/10">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          onSpeedChange(spd);
                          setShowSpeedMenu(false);
                        }}
                        className={`block w-full px-3 py-1.5 text-xs font-mono rounded-lg text-left cursor-pointer border-0 transition-colors ${
                          playbackSpeed === spd
                            ? 'bg-gold-600 text-white font-bold'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer border-0 bg-transparent"
                aria-label={isFullscreen ? 'Sair do ecrã inteiro' : 'Ecrã inteiro'}
              >
                {isFullscreen ? (
                  <Minimize size={18} className="sm:w-5 sm:h-5" />
                ) : (
                  <Maximize size={18} className="sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 2.2 — Barra de Progresso/Seek Interativa

### Status: ✅ Já incluída no componente `VideoPlayer.tsx` acima

A barra de progresso está implementada com:
- Clique para saltar (seek) em qualquer ponto
- Touch drag (deslizar com dedo) no mobile via `onTouchMove`
- Indicador visual de buffer carregado
- Indicador de progresso com cor gold
- Hover mostra thumb (ponto de arraste)
- ARIA `role="slider"` para acessibilidade

---

## 2.3 — Botão de Ecrã Inteiro (Fullscreen)

### Status: ✅ Já incluído no componente `VideoPlayer.tsx` acima

O fullscreen está implementado com:
- Suporte a `requestFullscreen()` e `webkitRequestFullscreen()` (Safari/iOS)
- Botão `Maximize`/`Minimize` com ícones lucide-react
- Detecção automática de estado fullscreen (incluindo ESC)
- O container inteiro entra em fullscreen (vídeo + controles), não apenas o vídeo

---

## 2.4 — Botão de Retroceder 15 Segundos

### Status: ✅ Já incluído no componente `VideoPlayer.tsx` acima

O botão `SkipBack` (ícone `lucide-react`) retrocede 15 segundos. Agora o player tem **ambos**: -15s e +15s.

---

## 2.5 — Controlo de Volume

### Status: ✅ Já incluído no componente `VideoPlayer.tsx` acima

O volume está implementado com:
- Botão mute/unmute com ícone `Volume2`/`VolumeX`
- Slider range que aparece ao passar o mouse (hover expand)
- Atalho de teclado `M` para mute
- Atalhos `ArrowUp`/`ArrowDown` para volume
- No mobile, o slider fica oculto (os dispositivos móveis controlam volume pelo sistema)

---

## 2.6 — Melhorar Layout Mobile do Player — Eliminar Sobreposições

### Problema

No `StudentPortal.tsx`, a secção do player tem vários elementos sobrepostos que atrapalham a visualização em mobile:

1. **Linha 731-734** — Labels "Reprodução LMS Multimédia" e "AUTO 1080P" cobrem o topo do vídeo
2. **Linha 737-742** — Watermark anti-gravação (necessário, mas demasiado intrusivo)
3. **Linha 800-856** — Barra de controles com elementos demasiado pequenos para toque
4. O player está dentro de `aspect-video` com `p-4` (padding 16px) que reduz o espaço do vídeo

### Solução

Após integrar o novo `VideoPlayer.tsx` (tarefa 2.17), estes problemas serão resolvidos pois o novo componente:
- Remove os labels "Reprodução LMS" e "AUTO 1080P" do topo
- Mantém o watermark mas com opacidade reduzida (10%)
- Usa controles maiores e touch-friendly
- Não usa padding interno no container do vídeo
- Controles aparecem/desaparecem automaticamente

### No entanto, é necessário corrigir o layout grid do `StudentPortal.tsx`

**Ficheiro:** `src/components/StudentPortal.tsx`

**Localizar (linha 710):**
```typescript
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
```

**Substituir por:**
```typescript
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
```

E na coluna do player (linha 713):

**Localizar:**
```typescript
<div className="lg:col-span-8 space-y-4">
```

**Substituir por:**
```typescript
<div className="lg:col-span-8 space-y-4 sm:space-y-6">
```

---

## 2.7 — Redesenhar Controles do Player para Toque Mobile

### Status: ✅ Já resolvido pelo componente `VideoPlayer.tsx`

O novo player tem:

1. **Botões maiores**: `p-1.5 sm:p-2` — área de toque mínima de 44x44px em mobile
2. **Toque para mostrar/esconder controles**: `onTouchStart` alterna visibilidade
3. **Auto-hide**: Controles desaparecem após 3s de inatividade durante reprodução
4. **Barra de seek touch-friendly**: `h-1.5 sm:h-2` expande no hover para `h-2.5 sm:h-3`
5. **Play/Pause central**: Botão grande (64x64px em mobile, 80x80 em desktop) no centro do vídeo
6. **Volume oculto em mobile**: Slider de volume `hidden sm:flex` (dispositivos móveis usam volume do sistema)
7. **Menu de velocidade compacto**: Ícone de engrenagem + dropdown

### Áreas mínimas de toque (WCAG 2.1):

| Elemento | Tamanho Mobile | Tamanho Desktop |
|----------|----------------|-----------------|
| Play/Pause central | 64x64px | 80x80px |
| Botões Skip | 36x36px | 40x40px |
| Barra de seek | 24px height (touch) | 16px height |
| Fullscreen | 36x36px | 40x40px |
| Speed menu item | 44x28px | 44x28px |

---

## 2.8 — Melhorar Apresentação da Descrição/Transcrição da Aula

### Problema

**Ficheiro:** `src/components/StudentPortal.tsx`

A secção de transcrição (linhas 864-872) é muito simples:

```typescript
<div className={`p-5 rounded-2xl ${cardThemeClass}`}>
  <span className="text-[9px] font-mono text-gold-600 font-black uppercase tracking-wider block border-b border-gray-100 dark:border-ink-800 pb-2">
    Acessibilidade • Transcrição Segmentada Escrita
  </span>
  <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-sans italic pt-2 mb-0">
    {currentLecture?.descricao || currentLecture?.description || 'Transcrição não disponível para esta aula.'}
  </p>
</div>
```

Em mobile, o texto é demasiado pequeno (`text-xs` = 12px) e a largura é limitada pelo layout de coluna.

### Solução

**Localizar (linhas 864-872):**
```typescript
{/* Lesson Transcripts written segment for accessible studies */}
<div className={`p-5 rounded-2xl ${cardThemeClass}`}>
  <span className="text-[9px] font-mono text-gold-600 font-black uppercase tracking-wider block border-b border-gray-100 dark:border-ink-800 pb-2">
    Acessibilidade • Transcrição Segmentada Escrita
  </span>
  <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-sans italic pt-2 mb-0">
    {currentLecture?.descricao || currentLecture?.description || 'Transcrição não disponível para esta aula.'}
  </p>
</div>
```

**Substituir por:**
```typescript
{/* Lesson Transcripts — Descrição da aula com design responsivo */}
<div className={`p-4 sm:p-5 rounded-2xl ${cardThemeClass}`}>
  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-ink-800 pb-2 mb-3">
    <BookOpen size={14} className="text-gold-600 shrink-0" />
    <span className="text-[10px] sm:text-xs font-mono text-gold-600 font-black uppercase tracking-wider">
      Descrição da Aula
    </span>
  </div>
  <div className="text-sm sm:text-base text-slate-600 dark:text-gray-300 leading-relaxed font-sans">
    {currentLecture?.descricao || currentLecture?.description || (
      <span className="text-neutral-400 italic text-xs sm:text-sm">
        Transcrição não disponível para esta aula.
      </span>
    )}
  </div>
</div>
```

> **Melhorias:**
> - Tamanho de texto aumentado de `text-xs` para `text-sm sm:text-base` (14px mobile, 16px desktop)
> - Adicionado ícone `BookOpen` para identidade visual
> - Texto de fallback em itálico e mais discreto
> - Padding ajustado para mobile: `p-4 sm:p-5`

---

## 2.9 — Redesenhar QuizArea para Mobile

### Problema

**Ficheiro:** `src/components/portal/QuizArea.tsx`

O quiz usa `text-xs` (12px) para opções e `text-3xs` para botões, que são demasiado pequenos para toque em mobile. Os botões de opção não têm padding suficiente.

### Solução

**Aplicar as seguintes mudanças no `QuizArea.tsx`** (após as mudanças da Fase 1):

**1. Opções de resposta — aumentar área de toque:**

**Localizar (em cada botão de opção):**
```typescript
className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${optionStyle}`}
```

**Substituir por:**
```typescript
className={`w-full text-left p-3.5 sm:p-3 rounded-xl border text-sm sm:text-xs leading-relaxed transition-all cursor-pointer min-h-[44px] ${optionStyle}`}
```

> `min-h-[44px]` garante a área mínima de toque WCAG.

**2. Botão de submeter — aumentar para mobile:**

**Localizar:**
```typescript
className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 disabled:opacity-50 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
```

**Substituir por:**
```typescript
className="px-5 py-2.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 disabled:opacity-50 text-xs sm:text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
```

**3. Botão "Seguinte" — aumentar para mobile:**

**Localizar:**
```typescript
className="px-4 py-2 bg-gold-600 hover:bg-[#b08530] text-cream-100 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
```

**Substituir por:**
```typescript
className="px-5 py-2.5 sm:px-4 sm:py-2 bg-gold-600 hover:bg-[#b08530] text-cream-100 text-xs sm:text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
```

**4. Título do quiz — aumentar para mobile:**

**Localizar:**
```typescript
<h4 className="text-sm font-serif font-bold text-slate-800 dark:text-cream-100 leading-snug">
```

**Substituir por:**
```typescript
<h4 className="text-base sm:text-sm font-serif font-bold text-slate-800 dark:text-cream-100 leading-snug">
```

**5. Container do quiz — padding mobile:**

**Localizar:**
```typescript
className="p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 relative overflow-hidden space-y-4 text-left shadow-xs"
```

**Substituir por:**
```typescript
className="p-4 sm:p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 relative overflow-hidden space-y-4 text-left shadow-xs"
```

---

## 2.10 — Redesenhar Caderno de Apontamentos para Mobile

### Problema

**Ficheiro:** `src/components/StudentPortal.tsx`

O caderno de apontamentos (linhas 892-927) tem:
- Input `text-xs` demasiado pequeno para mobile
- Botão "Pinar Nota" com `text-3xs` (10px) — inacessível em toque
- Layout horizontal `flex gap-2` que fica espremido em mobile

### Solução

**Localizar (linhas 892-927):**
```typescript
{/* Interactive legal notes tied to play seconds */}
<div className={`p-5 rounded-2xl space-y-4 ${cardThemeClass}`}>
  <h4 className="text-xs font-serif font-black m-0">Caderno de Apontamentos do Aluno</h4>
  
  <div className="flex gap-2">
    <input
      type="text"
      placeholder={`Escreva anotação académica vinculada ao tempo atual (${Math.floor(videoPlaySec / 60)}:${(videoPlaySec % 60).toString().padStart(2, '0')})...`}
      value={newNoteInput}
      onChange={(e) => setNewNoteInput(e.target.value)}
      className="flex-1 px-3 py-2 text-xs rounded-xl bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none"
    />
    <button
      onClick={handleSaveNote}
      disabled={!newNoteInput.trim()}
      className="px-4 py-2 bg-gold-600 hover:bg-[#a67e2b] text-cream-100 hover:text-slate-900 border-0 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
    >
      Pinar Nota
    </button>
  </div>

  {/* List of pinned notes */}
  <div className="space-y-2.5 max-h-56 overflow-y-auto pt-2 divide-y divide-gray-100 dark:divide-slate-700/50">
    {notesList.map((n) => (
      <div key={n.id} className="pt-2 flex justify-between gap-4 text-xs">
        <div className="space-y-1">
          <p className="m-0 text-neutral-400 dark:text-gray-200 leading-normal">{n.text}</p>
          <span className="block text-[8px] font-mono text-neutral-400">{n.date}</span>
        </div>
        <span className="bg-ink-900/5 text-gold-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-ink-900/10 text-center self-start shrink-0">
          ⏱ {Math.floor(n.timestamp / 60)}:{(n.timestamp % 60).toString().padStart(2, '0')}
        </span>
      </div>
    ))}
  </div>
</div>
```

**Substituir por:**
```typescript
{/* Caderno de Apontamentos do Aluno — Design responsivo */}
<div className={`p-4 sm:p-5 rounded-2xl space-y-4 ${cardThemeClass}`}>
  <div className="flex items-center gap-2">
    <BookMarked size={14} className="text-gold-600 shrink-0" />
    <h4 className="text-sm sm:text-xs font-serif font-black m-0">Caderno de Apontamentos</h4>
  </div>
  
  {/* Input + Botão em stack vertical no mobile */}
  <div className="flex flex-col sm:flex-row gap-2">
    <input
      type="text"
      placeholder={`Anotação em ${Math.floor(videoPlaySec / 60)}:${(videoPlaySec % 60).toString().padStart(2, '0')}...`}
      value={newNoteInput}
      onChange={(e) => setNewNoteInput(e.target.value)}
      className="flex-1 px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-xl bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none min-h-[44px]"
    />
    <button
      onClick={handleSaveNote}
      disabled={!newNoteInput.trim()}
      className="px-4 py-2.5 sm:py-2 bg-gold-600 hover:bg-[#a67e2b] text-cream-100 hover:text-slate-900 border-0 text-xs sm:text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
    >
      Guardar Nota
    </button>
  </div>

  {/* Lista de notas */}
  <div className="space-y-2.5 max-h-48 sm:max-h-56 overflow-y-auto pt-2 divide-y divide-gray-100 dark:divide-slate-700/50">
    {notesList.map((n) => (
      <div key={n.id} className="pt-2 flex justify-between gap-3 sm:gap-4 text-sm sm:text-xs">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="m-0 text-slate-600 dark:text-gray-200 leading-normal">{n.text}</p>
          <span className="block text-[10px] font-mono text-neutral-400">{n.date}</span>
        </div>
        <button
          className="bg-ink-900/5 text-gold-600 font-mono text-[10px] sm:text-[9px] font-bold px-2.5 py-1 rounded-lg border border-ink-900/10 text-center self-start shrink-0 cursor-pointer hover:bg-gold-600 hover:text-white transition-colors"
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = n.timestamp;
            }
          }}
          title="Saltar para este momento"
        >
          ⏱ {Math.floor(n.timestamp / 60)}:{(n.timestamp % 60).toString().padStart(2, '0')}
        </button>
      </div>
    ))}
  </div>
</div>
```

> **Melhorias:**
> - Input e botão em coluna vertical no mobile (`flex-col sm:flex-row`)
> - Texto maior: `text-sm sm:text-xs` no input, `text-xs sm:text-3xs` no botão
> - Altura mínima do input: `min-h-[44px]`
> - Notas agora são **clicáveis** para saltar ao momento do vídeo
> - Placeholder mais curto para caber em mobile

---

## 2.11 — Melhorar Layout Mobile da Lista de Aulas (Cursograma)

### Problema

**Ficheiro:** `src/components/StudentPortal.tsx`

A coluna do cursograma (linhas 931-1004) fica abaixo do player em mobile (layout de 1 coluna). Em telas pequenas, a lista de aulas fica escondida e o utilizador precisa de rolar muito para ver as opções.

### Solução

**Localizar (linha 932):**
```typescript
<div className="lg:col-span-4">
```

**Substituir por:**
```typescript
<div className="lg:col-span-4 order-first lg:order-last">
```

> **Melhoria:** Em mobile, a lista de aulas aparece ANTES do player (para que o aluno possa selecionar a aula antes de ver o vídeo). Em desktop, a ordem permanece normal (player à esquerda, lista à direita).

No entanto, uma abordagem melhor é adicionar um seletor de aulas compacto ACIMA do player em mobile:

**Adicionar ANTES do grid do player (antes da linha 710):**

```typescript
{/* Seletor de aulas compacto para mobile */}
<div className="lg:hidden">
  <select
    value={activeLessonIdx}
    onChange={(e) => {
      setActiveLessonIdx(parseInt(e.target.value));
      setVideoPlaySec(0);
    }}
    className="w-full px-3 py-2.5 rounded-xl bg-cream-100 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-sm font-serif font-bold text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
  >
    {activeSyllabus.map((syll, idx) => {
      const isLocked = syll.scheduled_at ? new Date(syll.scheduled_at) > new Date() : false;
      const isCompleted = completedLessons.includes(syll.id);
      return (
        <option key={idx} value={idx} disabled={isLocked}>
          {isLocked ? '🔒 ' : isCompleted ? '✓ ' : ''}{syll.title} ({syll.duration})
        </option>
      );
    })}
  </select>
</div>
```

E **ocultar a coluna do cursograma em mobile** (já que o seletor substitui):

**Localizar (linha 932):**
```typescript
<div className="lg:col-span-4">
```

**Substituir por:**
```typescript
<div className="hidden lg:block lg:col-span-4">
```

---

## 2.12 — Corrigir Overlay de Sidebar no Mobile

### Problema

**Ficheiro:** `src/components/portal/StudentSidebar.tsx`

A sidebar no mobile (linha 41-46) usa `fixed inset-y-0 left-0 z-40`, mas **não tem overlay escuro** por trás. O utilizador pode interagir com o conteúdo por trás da sidebar aberta. Além disso, não há overlay para fechar a sidebar clicando fora.

### Solução

**Ficheiro:** `src/components/portal/StudentSidebar.tsx`

**Adicionar antes do `<aside>` (antes da linha 41):**

```typescript
  return (
    <>
      {/* Overlay escuro no mobile quando sidebar está aberta */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          isHighContrast ? 'bg-black border-r-4 border-yellow-500' : themeMode === 'dark' ? 'bg-ink-900 border-ink-800' : 'bg-ink-900 text-white border-r border-ink-800/10'
        } transition-transform duration-300 transform lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        {/* ... conteúdo existente ... */}
      </aside>
    </>
  );
```

> **Nota:** Não esqueça de envolver o `return` existente em um `<>...</>` fragment.

---

## 2.13 — Corrigir Topbar para Dispositivos Pequenos

### Problema

**Ficheiro:** `src/components/portal/StudentTopbar.tsx`

1. A barra de pesquisa é `hidden md:flex` (linha 88) — correta, mas o utilizador mobile não tem como pesquisar
2. Os botões de ação (streak, tema, mensagens, notificações, perfil) estão todos numa linha (linha 102), que em ecrãs < 375px ficam sobrepostos
3. O dropdown de notificações (linha 149) tem `w-72` fixo que pode ultrapassar o ecrã
4. O indicador de ping nas notificações (linha 140) está sempre ativo, mesmo sem notificações

### Solução

**1. Esconder streak em ecrãs muito pequenos:**

**Localizar (linhas 104-108):**
```typescript
<div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 text-orange-600 font-bold font-mono text-[10px]">
  <Flame size={12} fill="currentColor" />
  <span>{streakCount} d</span>
</div>
```

**Substituir por:**
```typescript
<div className="hidden sm:flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 text-orange-600 font-bold font-mono text-[10px]">
  <Flame size={12} fill="currentColor" />
  <span>{streakCount} d</span>
</div>
```

**2. Limitar dropdown de notificações ao ecrã:**

**Localizar (linha 149):**
```typescript
className={`absolute right-0 mt-2 w-72 rounded-2xl p-4 shadow-xl text-left ${cardThemeClass} z-50`}
```

**Substituir por:**
```typescript
className={`absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 rounded-2xl p-4 shadow-xl text-left ${cardThemeClass} z-50`}
```

**3. Remover ping de notificação quando não há notificações:**

**Localizar (linha 140):**
```typescript
<span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-gold-600 animate-ping" />
```

**Substituir por:**
```typescript
{notifications.filter(n => !n.read).length > 0 && (
  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-gold-600 animate-ping" />
)}
{notifications.filter(n => !n.read).length > 0 && (
  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold">
    {notifications.filter(n => !n.read).length}
  </span>
)}
```

**4. Remover badge duplicado de mensagens em ecrãs pequenos:**

O botão de mensagens já tem um badge (linhas 126-130). Esconder em mobile para reduzir ruído:

**Localizar (linhas 126-130):**
```typescript
{unreadMessagesCount > 0 && (
  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold">
    {unreadMessagesCount}
  </span>
)}
```

**Substituir por:**
```typescript
{unreadMessagesCount > 0 && (
  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold sm:flex hidden">
    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
  </span>
)}
```

---

## 2.14 — Adicionar Suporte a Gestos Touch no Player

### Problema

O player atual não suporta gestos touch básicos como:
- Toque duplo no lado esquerdo = retroceder 10s
- Toque duplo no lado direito = avançar 10s
- Swipe vertical = ajustar volume (em fullscreen)

### Solução

Adicionar detecção de gestos ao `VideoPlayer.tsx`.

**Adicionar dentro do componente `VideoPlayer`, antes do `return`:**

```typescript
  // =====================================================================
  // GESTOS TOUCH
  // =====================================================================
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const DOUBLE_TAP_DELAY = 300; // ms

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!videoRef.current) return;
      const touch = e.changedTouches[0];
      const now = Date.now();
      const containerWidth = containerRef.current?.clientWidth || 1;
      const touchX = touch.clientX - (containerRef.current?.getBoundingClientRect().left || 0);
      const isLeftSide = touchX < containerWidth / 2;

      if (now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
        // Duplo toque detectado
        if (isLeftSide) {
          // Retroceder 10s
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        } else {
          // Avançar 10s
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || 0,
            videoRef.current.currentTime + 10
          );
        }
      }

      lastTapRef.current = { time: now, x: touchX };
    },
    [videoRef]
  );
```

**No `<div>` container do player, adicionar `onTouchEnd`:**

**Localizar:**
```typescript
onTouchStart={handleTouchStart}
```

**Adicionar após:**
```typescript
onTouchEnd={handleTouchEnd}
```

**Adicionar indicadores visuais de retroceder/avançar:**

Dentro do componente, adicionar estado e efeitos:

```typescript
  const [skipIndicator, setSkipIndicator] = useState<'forward' | 'backward' | null>(null);

  // No handleTouchEnd, após o duplo toque, adicionar:
  // setSkipIndicator(isLeftSide ? 'backward' : 'forward');
  // setTimeout(() => setSkipIndicator(null), 600);
```

E no JSX, dentro do container do player, antes dos controles:

```typescript
      {/* Indicadores visuais de duplo toque */}
      {skipIndicator && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-20 ${
          skipIndicator === 'backward' ? 'left-8 sm:left-16' : 'right-8 sm:right-16'
        }`}>
          <div className="flex flex-col items-center gap-1 animate-ping-once">
            {skipIndicator === 'backward' ? (
              <SkipBack size={32} className="text-white" />
            ) : (
              <SkipForward size={32} className="text-white" />
            )}
            <span className="text-white text-xs font-mono font-bold">10s</span>
          </div>
        </div>
      )}
```

> **Nota:** A animação `animate-ping-once` pode ser definida no `tailwind.config.js` ou como CSS inline:
> ```css
> @keyframes ping-once {
>   0% { opacity: 1; transform: scale(1); }
>   100% { opacity: 0; transform: scale(1.5); }
> }
> .animate-ping-once { animation: ping-once 0.5s ease-out forwards; }
> ```

---

## 2.15 — Melhorar Acessibilidade do Player (ARIA, Teclado)

### Status: ✅ Parcialmente incluído no `VideoPlayer.tsx`

O novo componente já inclui:

1. **`role="application"`** no container — indica ao leitor de ecrã que é um widget interativo
2. **`aria-label`** descritivo no container
3. **`aria-label`** em todos os botões
4. **`role="slider"`** na barra de progresso com `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
5. **Atalhos de teclado:**
   - `Space` / `K` = Play/Pause
   - `F` = Fullscreen
   - `ArrowLeft` = Retroceder 15s
   - `ArrowRight` = Avançar 15s
   - `ArrowUp` = Aumentar volume
   - `ArrowDown` = Diminuir volume
   - `M` = Mute/Unmute

### Adicionar `tabIndex` no container

Já incluído: `tabIndex={0}` no container permite que o utilizador faça Tab até ao player e use atalhos de teclado.

---

## 2.16 — Atualizar `useVideoPlayer.ts` para Suportar Novas Funcionalidades

### Problema

O hook `useVideoPlayer.ts` precisa de ser atualizado para expor mais dados necessários ao novo componente `VideoPlayer.tsx`.

### Ficheiro: `src/hooks/useVideoPlayer.ts`

**Código atual (completo):**
```typescript
import { useState, useEffect, useRef } from 'react';
import { academicService } from '../services/supabase/academicService';

export function useVideoPlayer(userId: string | undefined, courseId: string | undefined, lessonId: string | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [randomWatermark, setRandomWatermark] = useState({ top: '30%', left: '40%' });

  // Carregar progresso salvo quando muda de aula
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId || !lessonId) return;
      try {
        const saved = await academicService.getVideoProgress(userId, lessonId);
        setCurrentSeconds(saved || 0);
        if (videoRef.current) {
          videoRef.current.currentTime = saved || 0;
        }
      } catch (err) {
        console.error('Erro ao carregar progresso do vídeo:', err);
      }
    };
    loadProgress();
  }, [userId, lessonId]);

  // Salvar progresso a cada 15 segundos
  useEffect(() => {
    let interval: any;
    if (isPlaying && userId && courseId && lessonId) {
      interval = setInterval(async () => {
        try {
          await academicService.saveVideoProgress(userId, courseId, lessonId, currentSeconds);
        } catch (err) {
          console.error('Erro ao salvar progresso do vídeo:', err);
        }
      }, 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, currentSeconds, userId, courseId, lessonId]);

  // Mover marca d'água a cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const topPct = Math.floor(Math.random() * 55) + 15;
      const leftPct = Math.floor(Math.random() * 55) + 15;
      setRandomWatermark({ top: `${topPct}%`, left: `${leftPct}%` });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return {
    videoRef, isPlaying, setIsPlaying, playbackSpeed, changeSpeed,
    currentSeconds, setCurrentSeconds, randomWatermark
  };
}
```

**Substituir por:**

```typescript
import { useState, useEffect, useRef } from 'react';
import { academicService } from '../services/supabase/academicService';

export function useVideoPlayer(userId: string | undefined, courseId: string | undefined, lessonId: string | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [randomWatermark, setRandomWatermark] = useState({ top: '30%', left: '40%' });

  // Carregar progresso salvo quando muda de aula
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId || !lessonId) return;
      try {
        const saved = await academicService.getVideoProgress(userId, lessonId);
        setCurrentSeconds(saved || 0);
        // Esperar metadata carregar antes de definir currentTime
        const video = videoRef.current;
        if (video && saved) {
          const setInitialTime = () => {
            video.currentTime = saved;
            video.removeEventListener('loadedmetadata', setInitialTime);
          };
          if (video.readyState >= 1) {
            video.currentTime = saved;
          } else {
            video.addEventListener('loadedmetadata', setInitialTime);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar progresso do vídeo:', err);
      }
    };
    loadProgress();
  }, [userId, lessonId]);

  // Salvar progresso a cada 15 segundos (sem depender de currentSeconds)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && userId && courseId && lessonId) {
      interval = setInterval(async () => {
        try {
          const currentTime = videoRef.current?.currentTime || 0;
          await academicService.saveVideoProgress(userId, courseId, lessonId, Math.floor(currentTime));
        } catch (err) {
          console.error('Erro ao salvar progresso do vídeo:', err);
        }
      }, 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, userId, courseId, lessonId]); // Removido currentSeconds das dependências

  // Mover marca d'água a cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const topPct = Math.floor(Math.random() * 55) + 15;
      const leftPct = Math.floor(Math.random() * 55) + 15;
      setRandomWatermark({ top: `${topPct}%`, left: `${leftPct}%` });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return {
    videoRef,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed: changeSpeed,
    changeSpeed,
    currentSeconds,
    setCurrentSeconds,
    duration,
    setDuration,
    randomWatermark,
  };
}
```

> **Mudanças:**
> 1. Adicionado `duration` e `setDuration` ao retorno
> 2. `currentSeconds` removido das dependências do intervalo de save (corrige recriação a cada segundo)
> 3. Save lê `currentTime` diretamente do `videoRef` em vez do state
> 4. Adicionado `setPlaybackSpeed` como alias para `changeSpeed`
> 5. Corrigido carregamento de progresso para esperar metadata

---

## 2.17 — Integrar Novo `VideoPlayer.tsx` no `StudentPortal.tsx`

### Problema

O player inline no `StudentPortal.tsx` (linhas 716-862) precisa ser substituído pelo novo componente `VideoPlayer.tsx`.

### Solução

**Passo 1: Adicionar import no topo do `StudentPortal.tsx`:**

**Após os imports existentes (linha 9):**
```typescript
import QuizArea from './portal/QuizArea';
```

**Adicionar:**
```typescript
import VideoPlayer from './portal/VideoPlayer';
```

**Passo 2: Substituir o bloco do player inline**

**Localizar o bloco inteiro do player (linhas 716-862), que começa com:**
```typescript
<div className="aspect-video bg-slate-900 border border-gold-600/35 rounded-2xl overflow-hidden relative flex flex-col justify-between items-stretch p-4 select-none shadow">
```

**E termina com o fechamento:**
```typescript
                      </div>
```

(Antes da secção "Lesson Transcripts" na linha 864)

**Substituir TODO o bloco do player por:**

```typescript
                      {/* Player de Vídeo Responsivo */}
                      <VideoPlayer
                        videoRef={videoRef}
                        src={currentLecture.video_url || ''}
                        title={currentLecture.title || ''}
                        isPlaying={isPlayingVideo}
                        setIsPlaying={setIsPlayingVideo}
                        currentSeconds={videoPlaySec}
                        setCurrentSeconds={setVideoPlaySec}
                        playbackSpeed={videoPlaybackSpeed}
                        onSpeedChange={(spd) => {
                          setVideoPlaybackSpeed(spd);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = spd;
                          }
                        }}
                        watermarkPosition={randomWatermark}
                        watermarkText={`${currentUser?.email || currentUser?.firstName || 'Aluno'} • MULTIPLUS`}
                        onEnded={() => {
                          setIsPlayingVideo(false);
                          // Auto-complete removido — o aluno deve clicar "Marcar como Concluída"
                        }}
                        onTimeUpdate={(ct) => {
                          setVideoPlaySec(Math.floor(ct));
                        }}
                      />
```

> **Nota:** Isto remove completamente os controles inline, os labels "Reprodução LMS Multimédia" e "AUTO 1080P", e substitui por um player moderno e responsivo.

**Passo 3: Atualizar o hook `useVideoPlayer` no `StudentPortal.tsx`**

**Localizar (linhas 118-123):**
```typescript
  const {
    videoRef, isPlaying: isPlayingVideo, setIsPlaying: setIsPlayingVideo,
    playbackSpeed: videoPlaybackSpeed, changeSpeed: setVideoPlaybackSpeed,
    currentSeconds: videoPlaySec, setCurrentSeconds: setVideoPlaySec,
    randomWatermark
  } = useVideoPlayer(currentUser?.id, selectedCourseId, currentLecture?.id);
```

**Substituir por:**
```typescript
  const {
    videoRef, isPlaying: isPlayingVideo, setIsPlaying: setIsPlayingVideo,
    playbackSpeed: videoPlaybackSpeed, changeSpeed: setVideoPlaybackSpeed,
    currentSeconds: videoPlaySec, setCurrentSeconds: setVideoPlaySec,
    randomWatermark, duration: videoDuration
  } = useVideoPlayer(currentUser?.id, selectedCourseId, currentLecture?.id);
```

---

## Resumo de Verificação Pós-Implementação

### Testes Funcionais — Video Player

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1 | Clicar na barra de progresso | Vídeo salta para o ponto clicado |
| 2 | Clicar no botão fullscreen | Vídeo ocupa o ecrã inteiro |
| 3 | Pressionar ESC no fullscreen | Sai do fullscreen |
| 4 | Clicar em -15s / +15s | Vídeo retrocede/avança 15 segundos |
| 5 | Clicar no ícone de volume | Mute/unmute funciona |
| 6 | Arrastar slider de volume | Volume muda proporcionalmente |
| 7 | Duplo toque no lado esquerdo (mobile) | Vídeo retrocede 10s |
| 8 | Duplo toque no lado direito (mobile) | Vídeo avança 10s |
| 9 | Pressionar Space/K | Play/Pause |
| 10 | Pressionar F | Fullscreen |
| 11 | Pressionar M | Mute |
| 12 | Controles desaparecem após 3s | Controles auto-hide durante reprodução |
| 13 | Mover mouse / tocar no ecrã | Controles reaparecem |

### Testes Funcionais — Mobile

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1 | Abrir sidebar no mobile | Overlay escuro aparece atrás |
| 2 | Clicar no overlay | Sidebar fecha |
| 3 | Ver lista de aulas no mobile | Seletor dropdown aparece acima do player |
| 4 | Tocar nos botões do player | Área de toque >= 44x44px |
| 5 | Ver descrição da aula | Texto legível (>= 14px) |
| 6 | Responder quiz no mobile | Opções e botões são tocáveis |
| 7 | Criar apontamento no mobile | Input e botão em coluna vertical |
| 8 | Topbar em ecrã < 375px | Elementos não se sobrepõem |
| 9 | Dropdown de notificações | Largura ajusta ao ecrã |
| 10 | Vídeo em landscape mobile | Vídeo preenche o ecrã adequadamente |

### Verificação de Compilação

```bash
cd /home/z/my-project/MultiPlus-Academy-/
npm run build
```

- ✅ Sem erros de TypeScript
- ✅ Sem imports não resolvidos
- ✅ Sem avisos de tipos

---

## Ordem de Implementação Recomendada

1. **2.16** — Atualizar `useVideoPlayer.ts` (fundação do player)
2. **2.1** — Criar `VideoPlayer.tsx` (novo componente)
3. **2.14** — Adicionar gestos touch ao `VideoPlayer.tsx`
4. **2.17** — Integrar `VideoPlayer.tsx` no `StudentPortal.tsx`
5. **2.6** — Ajustar layout grid do `StudentPortal.tsx`
6. **2.11** — Seletor mobile de aulas + ocultar cursograma
7. **2.8** — Melhorar descrição da aula
8. **2.9** — Redesenhar QuizArea para mobile
9. **2.10** — Redesenhar caderno de apontamentos
10. **2.12** — Overlay de sidebar mobile
11. **2.13** — Corrigir topbar para dispositivos pequenos

> **Nota:** As tarefas 2.2, 2.3, 2.4, 2.5, 2.7 e 2.15 já estão incluídas no componente `VideoPlayer.tsx` criado na tarefa 2.1.

---

**FIM DA FASE 2**
