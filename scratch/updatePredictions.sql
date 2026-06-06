-- Modificar tabla de predicciones para incluir equipos previstos en eliminatorias
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS predicted_home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS predicted_away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Tabla para Premios Individuales del Torneo
CREATE TABLE IF NOT EXISTS public.prediction_awards (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    top_scorer TEXT,
    top_assist TEXT,
    mvp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en prediction_awards
ALTER TABLE public.prediction_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Awards are viewable by everyone" ON public.prediction_awards FOR SELECT USING (true);
CREATE POLICY "Users can insert their own awards" ON public.prediction_awards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own awards" ON public.prediction_awards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can update awards" ON public.prediction_awards FOR UPDATE USING (true);
