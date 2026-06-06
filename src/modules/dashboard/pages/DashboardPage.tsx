import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  const { user, role } = useAuthStore();

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'text.primary' }}>
          Bienvenido de vuelta,
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 6, fontWeight: 400 }}>
          {user?.user_metadata?.username} <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, ml: 1 }}>[{role || 'Participante'}]</Box>
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={role === 'ADMIN' ? 6 : 12}>
            <Paper sx={{ p: 4, height: '100%', borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main', fontWeight: 700 }}>
                Próximos Partidos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Aún no hay partidos programados. Vuelve más tarde para empezar a hacer tus predicciones.
              </Typography>
            </Paper>
          </Grid>
          
          {role === 'ADMIN' && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 3, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 700 }}>
                  Panel de Administración
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Desde aquí podrás gestionar los partidos, resultados y las puntuaciones de todos los participantes.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button component={RouterLink} to="/dashboard/groups" variant="outlined" color="error">
                    Gestionar Grupos
                  </Button>
                  <Button component={RouterLink} to="/dashboard/teams" variant="outlined" color="error">
                    Gestionar Equipos
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </motion.div>
    </Box>
  );
};
