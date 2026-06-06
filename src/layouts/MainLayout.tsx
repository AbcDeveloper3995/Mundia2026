import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export const MainLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'primary.main' }}>
            PORRA 2026
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 6, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};
