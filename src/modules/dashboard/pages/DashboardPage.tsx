import { Box, Typography, Paper, Grid, Button, CircularProgress, Alert, Link, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../services/stats.service';
import { fetchChallenges } from '../services/arena.service';
import { MainKPIs } from '../components/MainKPIs';
import { FunStats } from '../components/FunStats';
import { FavoritesKPIs } from '../components/FavoritesKPIs';
import { GlobalWidgets } from '../components/GlobalWidgets';
import { PodiumWidget } from '../components/PodiumWidget';
import { RulesModal } from '../components/RulesModal';
import { AdminProgressWidget } from '../components/AdminProgressWidget';
import GavelIcon from '@mui/icons-material/Gavel';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { fetchGlobalSettings, updateBannerMessage, spendUserCoins } from '../services/economy.service';
import { CountdownTimer } from '../components/CountdownTimer';

export const DashboardPage = () => {
  const { user, role } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [messiIndex, setMessiIndex] = useState(0);
  const messiImages = ['/messi1.jpg', '/messi2.jpg'];

  const [bannerMessage, setBannerMessage] = useState('📢 ¿Quieres que todos lean tu mensaje? Haz clic en la bocina de la derecha para secuestrar este banner por 10 MC.');
  const [bannerExpiration, setBannerExpiration] = useState<number | null>(null);
  const [hijackModalOpen, setHijackModalOpen] = useState(false);
  const [newBannerText, setNewBannerText] = useState('');
  const [buying, setBuying] = useState(false);
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);

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
        const [data, settings, challengesData] = await Promise.all([
          fetchDashboardStats(user.id),
          fetchGlobalSettings(),
          fetchChallenges(user.id)
        ]);
        setStats(data);
        if (settings.banner_message) {
          setBannerMessage(settings.banner_message);
        }
        if (settings.banner_expiration) {
          setBannerExpiration(settings.banner_expiration);
        }
        const pending = challengesData.filter(c => c.challenged_id === user.id && c.status === 'pending');
        setPendingChallengesCount(pending.length);
      } catch (error) {
        console.error('Error loading stats', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user]);

  const handleHijackBanner = async () => {
    if (!user || !stats) return;
    if (!stats.hasCompletedQuiniela && role !== 'ADMIN') {
      alert('¡Debes guardar toda tu quiniela completa para acceder a tus MessiCoins!');
      return;
    }
    if (stats.myCoins < 20) {
      alert('¡No tienes suficientes MessiCoins! Cuesta 20 MC.');
      return;
    }
    if (!newBannerText.trim()) return;

    try {
      setBuying(true);
      await spendUserCoins(user.id, 20);
      const newExp = Date.now() + 43200000; // 12 hours
      await updateBannerMessage(newBannerText, newExp);
      setBannerMessage(newBannerText);
      setBannerExpiration(newExp);
      setStats({ ...stats, myCoins: stats.myCoins - 20 });
      setHijackModalOpen(false);
      setNewBannerText('');
    } catch (e: any) {
      alert('Error al secuestrar el banner: ' + e.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Controles del Banner */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 1 }}>
          {bannerExpiration && Date.now() < bannerExpiration && (
            <CountdownTimer targetDate={bannerExpiration} onExpire={() => setBannerExpiration(null)} />
          )}
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setHijackModalOpen(true)}
            disabled={!!bannerExpiration && Date.now() < bannerExpiration}
            startIcon={<NotificationsActiveIcon />}
            size="small"
            sx={{ borderRadius: 4, fontWeight: 800, textTransform: 'none' }}
          >
            Secuestrar Banner (20 MC)
          </Button>
        </Box>

        {/* Marquee Banner */}
        <Box sx={{
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'error.main',
          color: 'white',
          py: 1.5, mb: 4, borderRadius: 2,
          whiteSpace: 'nowrap',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(211,47,47,0.4)',
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
            {bannerMessage}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 800, mb: 0 }}>
                Bienvenido, {user?.user_metadata?.username}
              </Typography>
            </Box>
            {stats && (
              <Box sx={{ mt: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1, width: 'fit-content' }}>
                {(stats.hasCompletedQuiniela || role === 'ADMIN') ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255, 193, 7, 0.1)', border: '1px solid #ffc107', borderRadius: 2, px: 2, py: 0.5, gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#ffc107', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}><MonetizationOnIcon sx={{ fontSize: 18 }} /> Saldo en MessiCoins (MC):</Typography>
                    <Typography variant="h6" sx={{ color: '#ffc107', fontWeight: 900 }}>{stats.myCoins}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.3)', borderRadius: 2, px: 2, py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      ⏳ Guarda toda tu quiniela para recibir 100 MC
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
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

        {pendingChallengesCount > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Link component={RouterLink} to="/dashboard/arena" sx={{ textDecoration: 'none' }}>
              <Alert 
                severity="warning" 
                sx={{ mb: 4, borderRadius: 3, fontWeight: 800, fontSize: '1rem', border: '1px solid', borderColor: 'warning.main', cursor: 'pointer', bgcolor: 'rgba(255, 152, 0, 0.15)', color: 'warning.light' }}
              >
                ¡Tienes {pendingChallengesCount} reto(s) pendiente(s) en La Arena! Haz clic aquí para revisarlos.
              </Alert>
            </Link>
          </motion.div>
        )}

        <Grid container spacing={4} sx={{ mb: 6 }}>

          <Grid size={{ xs: 12, md: role === 'ADMIN' ? 6 : 12 }}  >
            <Paper sx={{ p: 4, height: '100%', borderRadius: 3, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(10px)' }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main', fontWeight: 700 }}>
                Accesos Rápidos
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {stats && (role === 'ADMIN' || stats.hasCompletedQuiniela || user?.user_metadata?.username === 'SirRuben30' || user?.user_metadata?.username === 'Fabian' || user?.user_metadata?.username === 'miri' || user?.user_metadata?.username === 'Douglas' || user?.user_metadata?.username === 'douglas') ? (
                    <Button fullWidth component={RouterLink} to="/dashboard/predictions" variant="contained" color="primary" sx={{ fontWeight: 800 }}>
                      Mis Predicciones
                    </Button>
                  ) : (
                    <Tooltip title="Lo sentimos el torneo ha comenzado">
                      <span>
                        <Button fullWidth disabled variant="contained" sx={{ fontWeight: 800, bgcolor: 'rgba(25, 118, 210, 0.2) !important', color: 'rgba(255,255,255,0.4) !important' }}>
                          Mis Predicciones 🔒
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button fullWidth component={RouterLink} to="/dashboard/leaderboard" variant="contained" color="primary" sx={{ fontWeight: 800 }}>
                    Ranking Global
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button fullWidth component={RouterLink} to="/dashboard/results" variant="outlined" color="secondary" sx={{ fontWeight: 800 }}>
                    Clasificación
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {stats && (role === 'ADMIN' || (stats.hasCompletedQuiniela && stats.myCoins >= 50)) ? (
                    <Button fullWidth component={RouterLink} to="/dashboard/arena" variant="contained" color="warning" sx={{ fontWeight: 800 }}>
                      La Arena ⚔️
                    </Button>
                  ) : (
                    <Tooltip title={!stats?.hasCompletedQuiniela ? "Completa y guarda toda tu quiniela para recibir tus MC y desbloquear La Arena" : "Necesitas al menos 50 MC para desbloquear La Arena"}>
                      <span>
                        <Button fullWidth disabled variant="contained" sx={{ fontWeight: 800, bgcolor: 'rgba(255, 152, 0, 0.2) !important', color: 'rgba(255,255,255,0.4) !important' }}>
                          La Arena 🔒 (Mín. 50 MC)
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>
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
            <MainKPIs stats={stats} myUsername={user?.user_metadata?.username} updateMyCoins={(amount: number) => {
              if (stats) setStats({ ...stats, myCoins: stats.myCoins + amount });
            }} />

            {/* Favoritos */}
            <FavoritesKPIs stats={stats} />

            {/* 2. Estadísticas Divertidas (Salón de la fama) */}
            <FunStats stats={stats} updateMyCoins={(amount: number) => {
              if (stats) setStats({ ...stats, myCoins: stats.myCoins + amount });
            }} />

            {/* 3. Comparaciones y Widgets */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, lg: 12 }}  >
                <GlobalWidgets stats={stats} updateMyCoins={(amount: number) => {
                  if (stats) setStats({ ...stats, myCoins: stats.myCoins + amount });
                }} />
              </Grid>
            </Grid>
          </Box>
        ) : null}

      </motion.div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <Dialog open={hijackModalOpen} onClose={() => setHijackModalOpen(false)} sx={{ '& .MuiDialog-paper': { bgcolor: 'background.paper', borderRadius: 4, minWidth: { xs: 300, sm: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 900, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon /> Secuestrar Banner (20 MC)
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Costo: <strong style={{ color: '#00e676' }}>20 MessiCoins</strong>. Tu mensaje será visible para todos durante 12 horas.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Escribe tu mensaje"
            variant="outlined"
            value={newBannerText}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setNewBannerText(e.target.value);
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setHijackModalOpen(false)} color="inherit" disabled={buying}>Cancelar</Button>
          <Button onClick={handleHijackBanner} variant="contained" color="warning" disabled={buying || !newBannerText.trim()} sx={{ fontWeight: 800 }}>
            {buying ? 'Comprando...' : 'Pagar 20 MC'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
