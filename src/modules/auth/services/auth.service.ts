import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';

/**
 * Inicializa el listener de estado de autenticación de Supabase
 * y actualiza Zustand según los cambios de sesión.
 */
export const setupAuthListener = () => {
  const { setUser, setRole, setLoading } = useAuthStore.getState();

  supabase.auth.onAuthStateChange(async (event, session) => {
    setLoading(true);
    if (session?.user) {
      setUser(session.user);
      
      // Obtener el rol del usuario desde una hipotética tabla `profiles` o de los metadatos.
      // Para este ejemplo, si no hay perfil creado, asumiremos Participante por defecto.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      let userRole = profile?.role || 'Participante';

      // Regla especial para el administrador "yankee"
      if (session.user.email?.toLowerCase().includes('yankee')) {
        userRole = 'ADMIN';
      }

      setRole(userRole);
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  });
};
