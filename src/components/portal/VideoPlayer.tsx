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
  const [skipIndicator, setSkipIndicator] = useState<'forward' | 'backward' | null>(null);

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
          setSkipIndicator('backward');
          setTimeout(() => setSkipIndicator(null), 600);
        } else {
          // Avançar 10s
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || 0,
            videoRef.current.currentTime + 10
          );
          setSkipIndicator('forward');
          setTimeout(() => setSkipIndicator(null), 600);
        }
      }

      lastTapRef.current = { time: now, x: touchX };
    },
    [videoRef]
  );

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
      onTouchEnd={handleTouchEnd}
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

      {/* Indicadores visuais de duplo toque */}
      {skipIndicator && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none ${
          skipIndicator === 'backward' ? 'left-8 sm:left-16' : 'right-8 sm:right-16'
        }`}>
          <div className="flex flex-col items-center gap-1 opacity-150 scale-125 transition-all">
            {skipIndicator === 'backward' ? (
              <SkipBack size={32} className="text-white" />
            ) : (
              <SkipForward size={32} className="text-white" />
            )}
            <span className="text-white text-xs font-mono font-bold">10s</span>
          </div>
        </div>
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
