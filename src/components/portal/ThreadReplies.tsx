import { FormEvent, useEffect, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
import { DiscussionPost, DiscussionThread, learningService } from '../../services/supabase/learningService';
import { useToast } from '../ui/Toast';

export default function ThreadReplies({ thread, userId }: { thread: DiscussionThread; userId: string }) {
  const toast = useToast(); const [posts, setPosts] = useState<DiscussionPost[]>([]); const [text, setText] = useState(''); const [open, setOpen] = useState(false);
  const load = async () => { try { setPosts(await learningService.getPosts(thread.id)); } catch { setPosts([]); } };
  useEffect(() => { if (open) void load(); }, [open, thread.id]);
  const reply = async (event: FormEvent) => { event.preventDefault(); if (!text.trim()) return; try { await learningService.createPost(thread.id, userId, text.trim()); setText(''); await load(); toast.success('Resposta publicada.'); } catch (error: any) { toast.error(error.message || 'Não foi possível publicar a resposta.'); } };
  return <div className="mt-3 border-t border-gray-150 pt-3 dark:border-ink-800"><button onClick={() => setOpen(!open)} className="text-[10px] font-bold text-gold-600">{open ? 'Ocultar respostas' : 'Ver e responder'}</button>{open && <div className="mt-3 space-y-3"><div className="space-y-2">{posts.map(post => <div key={post.id} className="ml-2 rounded-lg bg-cream-200 p-2.5 text-xs dark:bg-ink-800"><p className="text-neutral-600 dark:text-cream-200">{post.body}</p><p className="mt-1 font-mono text-[8px] text-gold-600">{post.author?.nome_completo || 'Participante'}</p></div>)}{!posts.length && <p className="text-[11px] text-neutral-400">Sem respostas ainda.</p>}</div><form onSubmit={reply} className="flex gap-2"><input value={text} onChange={e=>setText(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-150 bg-cream-100 px-2 py-1.5 text-xs dark:border-ink-800 dark:bg-ink-950" placeholder="Responder ao tópico"/><button className="rounded-lg bg-gold-600 px-2 text-ink-900" aria-label="Publicar resposta"><CornerDownRight size={14}/></button></form></div>}</div>;
}
