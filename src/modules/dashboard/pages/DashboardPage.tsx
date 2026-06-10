import { Box, Typography, Paper, Grid, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../services/stats.service';
import { MainKPIs } from '../components/MainKPIs';
import { FunStats } from '../components/FunStats';
import { FavoritesKPIs } from '../components/FavoritesKPIs';
import { GlobalWidgets } from '../components/GlobalWidgets';
import { PodiumWidget } from '../components/PodiumWidget';
import { RulesModal } from '../components/RulesModal';
import { AdminProgressWidget } from '../components/AdminProgressWidget';
import GavelIcon from '@mui/icons-material/Gavel';

export const DashboardPage = () => {
  const { user, role } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [messiIndex, setMessiIndex] = useState(0);
  const messiImages = ['/messi1.jpg', '/messi2.jpg'];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessiIndex(prev => (prev + 1) % messiImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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

        {/* Marquee Banner */}
        <Box sx={{
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'error.main',
          color: 'white',
          py: 1.5, mb: 4, borderRadius: 2,
          whiteSpace: 'nowrap',
          display: 'flex',
          boxShadow: '0 4px 20px rgba(211,47,47,0.4)'
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            display: 'inline-block',
            animation: 'marquee 12s linear infinite',
            '@keyframes marquee': {
              '0%': { transform: 'translateX(100vw)' },
              '100%': { transform: 'translateX(-100%)' }
            }
          }}>
            ⚠️ ATENCIÓN: Si eres Madridista comienzas con -20ptos ⚠️
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{
              fontWeight: 800
            }}>
              Bienvenido, {user?.user_metadata?.username}
            </Typography>
            <Typography variant="h2" component="h1" color="text.secondary" sx={{ fontWeight: 400 }}>
              <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, ml: 1 }}>[{role || 'Participante'}]</Box>
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

          <Grid size={{ xs: 12, md: role === 'ADMIN' ? 6 : 12 }}  >
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
                  Clasificación
                </Button>
              </Box>
            </Paper>
          </Grid>

          {role === 'ADMIN' && (
            <Grid size={{ xs: 12, md: 6 }}  >
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
            {/* Podium movido arriba */}
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 12, lg: 8 }}>
                  <Paper sx={{
                    p: 0,
                    borderRadius: 4,
                    height: '100%',
                    bgcolor: 'rgba(10,10,10,0.85)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    boxShadow: '0 10px 40px rgba(0,230,118,0.15)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ width: { xs: '100%', md: '30%' }, position: 'relative', minHeight: { xs: 250, md: 'auto' }, bgcolor: '#000', overflow: 'hidden' }}>
                      {messiImages.map((src, idx) => (
                        <Box
                          key={src}
                          sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            opacity: messiIndex === idx ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                            backgroundImage: `url(${src})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center'
                          }}
                        />
                      ))}
                    </Box>
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: { xs: '100%', md: '70%' } }}>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#00e676', mb: 2 }}>
                        Advertencia para Alain: 😄
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6, fontWeight: 400 }}>
                        "La administración no se hace responsable de recaídas, traumas, sufrimiento, ansiedad y pesadillas ocasionados por el GOAT."
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 12, lg: 4 }}>
                  <PodiumWidget stats={stats} />
                </Grid>
              </Grid>
            </Box>

            {/* Admin Progress (Only visible for Admins) */}
            {role === 'ADMIN' && <AdminProgressWidget stats={stats} />}

            {/* 1. KPIs Principales */}
            <MainKPIs stats={stats} myUsername={user?.user_metadata?.username} />

            {/* Favoritos */}
            <FavoritesKPIs stats={stats} />

            {/* 2. Estadísticas Divertidas (Salón de la fama) */}
            <FunStats stats={stats} />

            {/* 3. Comparaciones y Widgets */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, lg: 12 }}  >
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
