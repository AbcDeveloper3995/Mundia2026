ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS predicted_penalty_winner TEXT CHECK (predicted_penalty_winner IN ('HOME', 'AWAY'));
