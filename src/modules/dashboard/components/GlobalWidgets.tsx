import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuthStore } from '@/store/auth.store';
import { fetchGlobalSettings, unlockFeature } from '../services/economy.service';
import { CountdownTimer } from './CountdownTimer';

interface GlobalWidgetsProps {
  stats: any;
  updateMyCoins: (amount: number) => void;
}

export const GlobalWidgets = ({ stats, updateMyCoins }: GlobalWidgetsProps) => {
  const { user, role } = useAuthStore();
  const [unlocked, setUnlocked] = useState(false);
  const [buying, setBuying] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expireTime, setExpireTime] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        if (role === 'ADMIN') {
          setUnlocked(true);
        } else {
          const settings = await fetchGlobalSettings();
          const unlockTime = settings.user_unlocks?.[user.id]?.extreme_matches;
          if (unlockTime && (Date.now() - unlockTime < 172800000)) { // 48 hours
            setUnlocked(true);
            setExpireTime(unlockTime + 172800000);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [user]);

  const handleUnlock = async () => {
    if (!user) return;
    if (!stats.hasCompletedQuiniela && role !== 'ADMIN') {
      alert('¡Debes guardar toda tu quiniela completa para acceder a tus MessiCoins!');
      return;
    }
    if (stats.myCoins < 10) {
      alert('¡No tienes suficientes MessiCoins! Cuesta 10 MC.');
      return;
    }
    try {
      setBuying(true);
      await unlockFeature(user.id, 'extreme_matches', 10);
      setUnlocked(true);
      setExpireTime(Date.now() + 172800000);
      updateMyCoins(-10);
    } catch (e: any) {
      alert('Error al comprar: ' + e.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800 }}>
          Partidos Extremos
        </Typography>
        {unlocked && expireTime && (
          <CountdownTimer targetDate={expireTime} onExpire={() => setUnlocked(false)} />
        )}
      </Box>

      <Grid container spacing={3} sx={{ 
        height: '100%',
        filter: unlocked ? 'none' : 'blur(10px)', 
        pointerEvents: unlocked ? 'auto' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <Grid size={{ xs: 12, md: 6 }}  >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(244, 67, 54, 0.3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ color: '#f44336', fontWeight: 800, mb: 2 }}>
                ⚽ Partido Más Difícil (Rompe-Quinielas)
              </Typography>
              {stats.hardestMatch ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stats.hardestMatch.homeFlag && <img src={stats.hardestMatch.homeFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.hardestMatch.homeName}</Typography>
                    </Box>
                    <Typography variant="h5" color="text.primary"  sx={{ fontWeight: 900,  lineHeight: 1 }}>
                      {stats.hardestMatch.homeScore} - {stats.hardestMatch.awayScore}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.hardestMatch.awayName}</Typography>
                      {stats.hardestMatch.awayFlag && <img src={stats.hardestMatch.awayFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 800 }}>Solo {stats.hardestMatch.hits} aciertos</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay partidos finalizados con predicciones.</Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(0, 230, 118, 0.3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ color: '#00e676', fontWeight: 800, mb: 2 }}>
                🎉 Partido Más Fácil (Regalado)
              </Typography>
              {stats.easiestMatch ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stats.easiestMatch.homeFlag && <img src={stats.easiestMatch.homeFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.easiestMatch.homeName}</Typography>
                    </Box>
                    <Typography variant="h5" color="text.primary"  sx={{ fontWeight: 900,  lineHeight: 1 }}>
                      {stats.easiestMatch.homeScore} - {stats.easiestMatch.awayScore}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.easiestMatch.awayName}</Typography>
                      {stats.easiestMatch.awayFlag && <img src={stats.easiestMatch.awayFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>{stats.easiestMatch.hits} aciertos totales</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay partidos finalizados.</Typography>
              )}
            </Paper>

          </Box>
        </Grid>
      </Grid>

      {!unlocked && !checking && (
        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 10 
        }}>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large" 
            onClick={handleUnlock} 
            disabled={buying} 
            startIcon={buying ? <CircularProgress size={20} color="inherit" /> : <LockIcon />} 
            sx={{ fontWeight: 900, px: 4, py: 2, borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', textTransform: 'uppercase' }}
          >
            {buying ? 'Procesando...' : 'Revelar Partidos Rompe-Quinielas y Regalados (10 MC)'}
          </Button>
        </Box>
      )}

    </Box>
  );
};
