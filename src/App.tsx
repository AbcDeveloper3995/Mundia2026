import { useEffect } from 'react';
import { setupAuthListener } from '@/modules/auth/services/auth.service';
import { AppRouter } from '@/routes';

function App() {
  useEffect(() => {
    // Inicializar el listener de sesión al cargar la app
    setupAuthListener();
  }, []);

  return <AppRouter />;
}

export default App;
