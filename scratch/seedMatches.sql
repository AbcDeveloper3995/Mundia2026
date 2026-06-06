-- Creación de la tabla de partidos
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage VARCHAR(10) NOT NULL, -- 'GROUP', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- Solo para fase de grupos
    home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    home_score INTEGER,
    away_score INTEGER,
    home_penalties INTEGER,
    away_penalties INTEGER,
    is_finished BOOLEAN DEFAULT false,
    match_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (opcional según el setup actual, pero recomendado)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Políticas para Matches (Público puede leer, Admin puede escribir)
-- Asumiendo que el cliente es público por ahora o hay políticas previas
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Matches are insertable by everyone" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Matches are updatable by everyone" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Matches are deletable by everyone" ON public.matches FOR DELETE USING (true);

-- OPCIONAL: Para generar automáticamente los partidos de fase de grupos
-- Ejecuta este bloque si quieres pre-generar los cruces de grupo (Todos contra todos, 6 partidos por grupo)
DO $$
DECLARE
    g RECORD;
    t1 RECORD;
    t2 RECORD;
BEGIN
    FOR g IN SELECT id FROM public.groups LOOP
        -- Obtener los equipos de este grupo (asumimos que ya hay 4)
        -- Cruzarlos todos contra todos
        FOR t1 IN SELECT id FROM public.teams WHERE group_id = g.id ORDER BY name LOOP
            FOR t2 IN SELECT id FROM public.teams WHERE group_id = g.id AND name > (SELECT name FROM public.teams WHERE id = t1.id) ORDER BY name LOOP
                INSERT INTO public.matches (stage, group_id, home_team_id, away_team_id)
                VALUES ('GROUP', g.id, t1.id, t2.id);
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Insertar placeholders para la fase eliminatoria
    -- Round of 32 (16 partidos)
    FOR i IN 1..16 LOOP
        INSERT INTO public.matches (stage) VALUES ('R32');
    END LOOP;
    -- Round of 16 (8 partidos)
    FOR i IN 1..8 LOOP
        INSERT INTO public.matches (stage) VALUES ('R16');
    END LOOP;
    -- Quarter Finals (4 partidos)
    FOR i IN 1..4 LOOP
        INSERT INTO public.matches (stage) VALUES ('QF');
    END LOOP;
    -- Semi Finals (2 partidos)
    FOR i IN 1..2 LOOP
        INSERT INTO public.matches (stage) VALUES ('SF');
    END LOOP;
    -- 3rd Place (1 partido)
    INSERT INTO public.matches (stage) VALUES ('3RD');
    -- Final (1 partido)
    INSERT INTO public.matches (stage) VALUES ('FINAL');
END $$;
