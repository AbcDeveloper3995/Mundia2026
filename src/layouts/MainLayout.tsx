import { Box, AppBar, Toolbar, Typography, Button, Container, Breadcrumbs as MuiBreadcrumbs, Link } from '@mui/material';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';

const routeMap: Record<string, string> = {
  'dashboard': 'Inicio',
  'results': 'Clasificación',
  'predictions': 'Simulador',
  'leaderboard': 'Ranking',
  'groups': 'Admin Grupos',
  'teams': 'Admin Equipos',
  'matches': 'Admin Partidos'
};

const CustomBreadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length <= 1 && pathnames[0] === 'dashboard') {
    return null; // Ocultar breadcrumbs en el dashboard principal para no ser redundante
  }

  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 4, '& .MuiBreadcrumbs-separator': { color: 'primary.main', fontWeight: 800 } }}>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const name = routeMap[value] || value;

        return last ? (
          <Typography color="text.primary" key={to} sx={{ fontWeight: 800 }}>
            {name}
          </Typography>
        ) : (
          <Link component={RouterLink} underline="hover" color="text.secondary" to={to} key={to} sx={{ fontWeight: 600, transition: '0.2s', '&:hover': { color: 'primary.main' } }}>
            {name}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isAdminRoute = ['/dashboard/groups', '/dashboard/teams', '/dashboard/matches'].includes(location.pathname);

  const getBackgroundImage = (pathname: string) => {
    if (pathname.includes('/dashboard/predictions')) return 'url("/0ab71fd8b48a7b584e27b705e5d3ca80.jpg")';
    if (pathname.includes('/dashboard/leaderboard')) return 'url("/8c7cd01b131a89d006ecdedc59e50d60.jpg")';
    if (pathname.includes('/dashboard/results')) return 'url("/c3a9e850085fdda78773f1b8e8827614.jpg")';
    return 'url("/argentina.jpg")'; // Inicio
  };

  return (
    <Box sx={{ 
      minHeight: '100dvh', 
      bgcolor: 'background.default', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {!isAdminRoute && (
        <>
          <Box 
            sx={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundImage: getBackgroundImage(location.pathname), 
              backgroundSize: '100% 100%', 
              backgroundPosition: 'top center', 
              backgroundRepeat: 'no-repeat',
              zIndex: 0 
            }} 
          />
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: location.pathname === '/dashboard' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.85)', zIndex: 0 }} />
        </>
      )}

      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link component={RouterLink} to="/dashboard" sx={{ textDecoration: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'primary.main', cursor: 'pointer' }}>
                PORRA 2026
              </Typography>
            </Link>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
              <Link component={RouterLink} to="/dashboard" sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 700, '&:hover': { color: 'primary.main' } }}>Inicio</Link>
              <Link component={RouterLink} to="/dashboard/leaderboard" sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 700, '&:hover': { color: 'primary.main' } }}>Ranking</Link>
              <Link component={RouterLink} to="/dashboard/results" sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 700, '&:hover': { color: 'primary.main' } }}>Clasificación</Link>
              {role === 'ADMIN' && (
                <Link component={RouterLink} to="/dashboard/matches" sx={{ textDecoration: 'none', color: 'secondary.main', fontWeight: 700, '&:hover': { color: 'primary.main' } }}>Admin Panel</Link>
              )}
            </Box>
          </Box>
          <Button color="inherit" onClick={handleLogout} sx={{ color: 'text.secondary', fontWeight: 700, '&:hover': { color: 'error.main' } }}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 14 }, pb: 6, flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <CustomBreadcrumbs />
        <Outlet />
      </Container>
    </Box>
  );
};
