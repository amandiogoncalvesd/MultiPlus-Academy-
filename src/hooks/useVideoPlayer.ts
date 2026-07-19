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

  // Salvar progresso a cada 15 segundos (sem depender de currentSeconds para evitar recriar intervalo)
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, userId, courseId, lessonId]);

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
