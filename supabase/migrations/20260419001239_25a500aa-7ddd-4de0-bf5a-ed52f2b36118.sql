-- Community levels table for anonymous publishing
CREATE TABLE public.community_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 32),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy','Normal','Hard','Insane')),
  length_tiles INTEGER NOT NULL CHECK (length_tiles BETWEEN 40 AND 2000),
  obstacles JSONB NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_levels_created_at ON public.community_levels(created_at DESC);
CREATE INDEX idx_community_levels_play_count ON public.community_levels(play_count DESC);

ALTER TABLE public.community_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can read any published level
CREATE POLICY "Anyone can view community levels"
  ON public.community_levels FOR SELECT
  USING (true);

-- Anyone can publish a level (anonymous publishing)
CREATE POLICY "Anyone can publish a level"
  ON public.community_levels FOR INSERT
  WITH CHECK (true);

-- No update / delete policies = nobody can modify or delete (anti-tamper for anonymous)

-- RPC to safely increment play count without granting UPDATE
CREATE OR REPLACE FUNCTION public.increment_level_play_count(level_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_levels
  SET play_count = play_count + 1
  WHERE id = level_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_level_play_count(UUID) TO anon, authenticated;