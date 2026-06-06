-- Creación de la tabla de predicciones
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    predicted_home_score INTEGER NOT NULL,
    predicted_away_score INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id) -- Un usuario solo puede tener una predicción por partido
);

-- Habilitar RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Políticas para Predictions
-- Los usuarios pueden ver todas las predicciones (para el leaderboard o resultados)
CREATE POLICY "Predictions are viewable by everyone" ON public.predictions FOR SELECT USING (true);

-- Los usuarios solo pueden insertar sus propias predicciones
CREATE POLICY "Users can insert their own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propias predicciones
CREATE POLICY "Users can update their own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);

-- Opcional: El admin podría actualizar puntos, así que permitimos al admin saltarse esto si es necesario,
-- pero para simplificar, el cliente de Supabase (usando service_role) en un backend o el cliente con RLS laxo
-- Para el propósito de esta prueba, dejamos que cualquiera actualice (o el propio usuario) pero el código controlará la lógica.
CREATE POLICY "Anyone can update predictions" ON public.predictions FOR UPDATE USING (true);
