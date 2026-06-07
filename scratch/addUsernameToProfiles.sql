-- 1. Agregar la columna username a la tabla profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Asegurarnos que todos los usuarios de auth.users tengan su fila en profiles con el username correcto.
-- Como el email que creamos en el registro es "username@porra2026.local", podemos extraer el username del email.
INSERT INTO public.profiles (id, email, username)
SELECT id, email, SPLIT_PART(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username, email = EXCLUDED.email;

-- 3. Crear (o actualizar) la función que se ejecuta cada vez que un usuario nuevo se registra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    new.id, 
    new.email,
    SPLIT_PART(new.email, '@', 1)
  )
  ON CONFLICT (id) DO UPDATE 
  SET username = EXCLUDED.username, email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger en la tabla de autenticación
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
