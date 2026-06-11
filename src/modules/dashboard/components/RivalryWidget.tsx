import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import { useAuthStore } from '@/store/auth.store';
import { fetchGlobalSettings, unlockFeature } from '../services/economy.service';
import { CountdownTimer } from './CountdownTimer';

interface RivalryWidgetProps {
  stats: any;
  myUsername: string;
  updateMyCoins: (amount: number) => void;
}

export const RivalryWidget = ({ stats, myUsername, updateMyCoins }: RivalryWidgetProps) => {
  const { user, role } = useAuthStore();
  const [unlocked, setUnlocked] = useState(false);
  const [buying, setBuying] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expireTime, setExpireTime] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const settings = await fetchGlobalSettings();
        const unlockTime = settings.user_unlocks?.[user.id]?.rivalry;
        if (unlockTime && (Date.now() - unlockTime < 172800000)) { // 48 hours
          setUnlocked(true);
          setExpireTime(unlockTime + 172800000);
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
    if (stats.myCoins < 5) {
      alert('¡No tienes suficientes MessiCoins! Cuesta 5 MC.');
      return;
    }
    try {
      setBuying(true);
      await unlockFeature(user.id, 'rivalry', 5);
      setUnlocked(true);
      setExpireTime(Date.now() + 172800000);
      updateMyCoins(-5);
    } catch (e: any) {
      alert('Error al comprar: ' + e.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.1)', height: '100%', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', overflow: 'hidden' }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          Distancias Directas <EmojiEventsIcon color="primary" />
        </Typography>
        {unlocked && expireTime && (
          <CountdownTimer targetDate={expireTime} onExpire={() => setUnlocked(false)} />
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', flexDirection: 'column', gap: 2, 
        filter: unlocked ? 'none' : 'blur(10px)', 
        pointerEvents: unlocked ? 'auto' : 'none',
        transition: 'all 0.3s ease'
      }}>
        
        {!stats.rivalry ? (
          <Box sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Aún no hay estadísticas de competencia suficientes. (Juega partidos o espera a tener rivales)
            </Typography>
          </Box>
        ) : (
          <>
            {/* LÍDER */}
            {stats.rivalry.leader && (
              <Box sx={{ p: 2, bgcolor: 'rgba(255, 193, 7, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <StarIcon sx={{ color: '#ffc107' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffc107' }}>
                    Con respecto al Líder ({stats.rivalry.leader.username})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estás a {stats.rivalry.leader.distance} puntos de alcanzarlo.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* DELANTE DE MÍ */}
            {stats.rivalry.ahead && (
              <Box sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ color: '#f44336' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#f44336' }}>
                    Quien tienes por delante ({stats.rivalry.ahead.username})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estás a {stats.rivalry.ahead.distance} puntos de superarlo.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* DETRÁS DE MÍ */}
            {stats.rivalry.behind && (
              <Box sx={{ p: 2, bgcolor: 'rgba(0, 230, 118, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingDownIcon sx={{ color: '#00e676' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#00e676' }}>
                    Quien te persigue ({stats.rivalry.behind.username})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Está a {stats.rivalry.behind.distance} puntos de empatarte.
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {!unlocked && !checking && (
        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 10 
        }}>
          <Button 
            variant="contained" 
            color="warning" 
            size="small" 
            onClick={handleUnlock} 
            disabled={buying} 
            startIcon={buying ? <CircularProgress size={20} color="inherit" /> : <LockIcon />} 
            sx={{ fontWeight: 900, px: 3, py: 1.5, borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', textTransform: 'uppercase' }}
          >
            {buying ? 'Procesando...' : 'Revelar Rivalidad (5 MC)'}
          </Button>
        </Box>
      )}

    </Paper>
  );
};
