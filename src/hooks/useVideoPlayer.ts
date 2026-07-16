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
