import { Box, Typography, Paper, Grid, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../services/stats.service';
import { MainKPIs } from '../components/MainKPIs';
import { FunStats } from '../components/FunStats';
import { RivalryWidget } from '../components/RivalryWidget';
import { GlobalWidgets } from '../components/GlobalWidgets';
import { RulesModal } from '../components/RulesModal';
import GavelIcon from '@mui/icons-material/Gavel';

export const DashboardPage = () => {
  const { user, role } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const data = await fetchDashboardStats(user.id);
        setStats(data);
      } catch (error) {
        console.error('Error loading stats', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user]);

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', mb: 6 }}>
          <Box>
            <Typography variant="h2" component="h1" gutterBottom sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800
            }}>
              Hola de nuevo,
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400 }}>
              {user?.user_metadata?.username} <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, ml: 1 }}>[{role || 'Participante'}]</Box>
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setRulesOpen(true)}
            startIcon={<GavelIcon />}
            sx={{ mt: { xs: 2, sm: 0 }, borderRadius: 2, fontWeight: 700 }}
          >
            Reglas de Puntuación
          </Button>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={role === 'ADMIN' ? 6 : 12}>
            <Paper sx={{ p: 4, height: '100%', borderRadius: 3, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(10px)' }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main', fontWeight: 700 }}>
                Accesos Rápidos
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                <Button component={RouterLink} to="/dashboard/predictions" variant="contained" color="primary" sx={{ fontWeight: 800 }}>
                  Mis Predicciones
                </Button>
                <Button component={RouterLink} to="/dashboard/leaderboard" variant="contained" color="primary" sx={{ fontWeight: 800 }}>
                  Ranking Global
                </Button>
                <Button component={RouterLink} to="/dashboard/results" variant="outlined" color="secondary" sx={{ fontWeight: 800 }}>
                  Resultados Oficiales
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {role === 'ADMIN' && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 3, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 700 }}>
                  Panel de Administración
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                  <Button component={RouterLink} to="/dashboard/groups" variant="outlined" color="error">
                    Grupos
                  </Button>
                  <Button component={RouterLink} to="/dashboard/teams" variant="outlined" color="error">
                    Equipos
                  </Button>
                  <Button component={RouterLink} to="/dashboard/matches" variant="contained" color="error" sx={{ fontWeight: 800 }}>
                    Motor de Partidos
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : stats ? (
          <Box sx={{ mt: 6 }}>
            {/* 1. KPIs Principales */}
            <MainKPIs stats={stats} />

            {/* 2. Estadísticas Divertidas (Salón de la fama) */}
            <FunStats stats={stats} />

            {/* 3. Comparaciones y Widgets */}
            <Grid container spacing={4}>
              <Grid item xs={12} lg={4}>
                <RivalryWidget stats={stats} myUsername={user?.user_metadata?.username || 'Tú'} />
              </Grid>
              <Grid item xs={12} lg={8}>
                <GlobalWidgets stats={stats} />
              </Grid>
            </Grid>
          </Box>
        ) : null}

      </motion.div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </Box>
  );
};
