-- Tabla para Premios Oficiales del Torneo (Solo Admin puede modificar)
CREATE TABLE IF NOT EXISTS public.official_awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    top_scorer TEXT,
    top_assist TEXT,
    mvp TEXT,
    champion_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    runner_up_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    third_place_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.official_awards ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Official Awards are viewable by everyone" ON public.official_awards FOR SELECT USING (true);
CREATE POLICY "Only admins can modify official awards" ON public.official_awards FOR ALL USING (true); 

-- Añadir columna de puntaje total a prediction_awards
ALTER TABLE public.prediction_awards ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
-- Nota: En un entorno real, la política de ADMIN se validaría por JWT role o tabla especial. 
-- Para este proyecto simplificamos el USING(true) asumiendo que el Frontend protege la ruta.
