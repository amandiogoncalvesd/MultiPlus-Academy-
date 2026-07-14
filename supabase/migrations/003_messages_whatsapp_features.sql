-- 003_messages_whatsapp_features.sql
-- Add WhatsApp-like columns to public.messages
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create public.conversation_clears to allow local conversation clearing
CREATE TABLE IF NOT EXISTS public.conversation_clears (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cleared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, partner_id)
);

-- Enable RLS on conversation_clears
ALTER TABLE public.conversation_clears ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own clears
CREATE POLICY "Users can view their own clears" 
  ON public.conversation_clears FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own clears
CREATE POLICY "Users can insert their own clears" 
  ON public.conversation_clears FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own clears
CREATE POLICY "Users can update their own clears" 
  ON public.conversation_clears FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own clears
CREATE POLICY "Users can delete their own clears" 
  ON public.conversation_clears FOR DELETE 
  USING (auth.uid() = user_id);
