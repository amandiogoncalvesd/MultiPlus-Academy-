import { useState, useEffect } from 'react';
import { academicService } from '../services/supabase/academicService';

interface NoteItem {
  id: string;
  timestamp: number;
  text: string;
  date: string;
}

export function useLessonNotes(userId: string | undefined, courseId: string | undefined, lessonId: string | undefined) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const loadNotes = async () => {
      if (!userId || !lessonId) return;
      try {
        const savedNotes = await academicService.getLessonNotes(userId, lessonId);
        setNotes((savedNotes || []).map((n: any) => ({
          id: n.id,
          timestamp: n.video_timestamp,
          text: n.content,
          date: new Date(n.created_at).toISOString().replace('T', ' ').slice(0, 16)
        })));
      } catch (err) {
        console.error('Erro ao carregar apontamentos:', err);
      }
    };
    loadNotes();
  }, [userId, lessonId]);

  const saveNote = async (videoTimestamp: number) => {
    if (!newNote.trim() || !userId || !lessonId || !courseId) return;
    try {
      const saved = await academicService.saveLessonNote(userId, lessonId, courseId, newNote.trim(), videoTimestamp);
      setNotes(prev => [{
        id: saved.id,
        timestamp: saved.video_timestamp,
        text: saved.content,
        date: new Date(saved.created_at).toISOString().replace('T', ' ').slice(0, 16)
      }, ...prev]);
      setNewNote('');
    } catch (err) {
      console.error('Erro ao salvar apontamento:', err);
    }
  };

  return { notes, newNote, setNewNote, saveNote };
}
