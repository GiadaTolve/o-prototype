-- Patch schema dopo pull Neon: il dump può essere indietro rispetto al codice locale.
-- Idempotente (IF NOT EXISTS).

ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS social_class text;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS social_class_chosen_at timestamp;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS social_subclass_sheet jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS current_hp integer;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS chrono_stack_state jsonb NOT NULL DEFAULT '{"current":0,"accumulating":false,"overheatTurns":0,"skipNextTurn":false}'::jsonb;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS player_preferences text;

CREATE TABLE IF NOT EXISTS public.social_class_daily_usage (
  character_id uuid NOT NULL REFERENCES public.characters(id),
  day_key text NOT NULL,
  heal_hp_used integer NOT NULL DEFAULT 0,
  integrity_used integer NOT NULL DEFAULT 0,
  gather_used integer NOT NULL DEFAULT 0,
  pact_weight_used integer NOT NULL DEFAULT 0,
  ofuda_power_used integer NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, day_key)
);
