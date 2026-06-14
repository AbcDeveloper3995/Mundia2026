import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Button, IconButton } from '@mui/material';
import { fetchLeaderboard, type LeaderboardEntry } from '@/modules/predictions/services/predictions.service';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import { fetchGlobalSettings, unlockFeature } from '../services/economy.service';
import { CountdownTimer } from '../components/CountdownTimer';
import { SpyStoreModal } from '../components/SpyStoreModal';

export const LeaderboardPage = () => {
  const { user, role } = useAuthStore();
  const canSeeColumns = role === 'ADMIN' || user?.user_metadata?.username === 'miri';
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockedStreaks, setUnlockedStreaks] = useState(false);
  const [buyingStreaks, setBuyingStreaks] = useState(false);
  const [checkingStreaks, setCheckingStreaks] = useState(true);
  const [userUnlocks, setUserUnlocks] = useState<any>({});
  const [expireTime, setExpireTime] = useState<number | null>(null);
  const [myCoins, setMyCoins] = useState<number>(100);
  const [myExpenses, setMyExpenses] = useState<number>(0);
  
  const [activeSpies, setActiveSpies] = useState<{ targetId: string, targetName: string, expiresAt: number }[]>([]);
  const [targetSpyUser, setTargetSpyUser] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    loadData();
    // Poll active spies every 10 seconds to keep the global badge updated
    const interval = setInterval(pollActiveSpies, 10000);
    return () => clearInterval(interval);
  }, []);

  const pollActiveSpies = async () => {
    try {
      const settings = await fetchGlobalSettings();
      const validSpies = (settings.active_spies || []).filter(s => s.expiresAt > Date.now());
      setActiveSpies(validSpies);
    } catch(e) {}
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, settings] = await Promise.all([
        fetchLeaderboard(),
        fetchGlobalSettings()
      ]);
      setLeaderboard(data);
      
      const validSpies = (settings.active_spies || []).filter(s => s.expiresAt > Date.now());
      setActiveSpies(validSpies);
      
      if (user) {
        setUserUnlocks(settings.user_unlocks?.[user.id] || {});
        if (role === 'ADMIN') {
          setUnlockedStreaks(true);
          setMyExpenses(9999);
        } else {
          if (settings.user_unlocks?.[user.id]?.streaks) {
            if (Date.now() - settings.user_unlocks[user.id].streaks! < 172800000) { // 48 hours
              setUnlockedStreaks(true);
              setExpireTime(settings.user_unlocks[user.id].streaks! + 172800000);
            }
          }
          const spent = settings.user_expenses?.[user.id] || 0;
          setMyExpenses(spent);
        }
        
        const entry = data.find(l => l.userId === user.id);
        if (entry) {
          setMyCoins(entry.coins);
        } else {
          const spent = settings.user_expenses?.[user.id] || 0;
          setMyCoins(100 - spent);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setCheckingStreaks(false);
    }
  };

  const handleUnlockStreaks = async () => {
    if (!user) return;

    if (role !== 'ADMIN') {
      const [{ count: predsCount }, { count: matchesCount }] = await Promise.all([
        supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('matches').select('*', { count: 'exact', head: true })
      ]);
      if (predsCount !== matchesCount || matchesCount === 0) {
        alert('¡Debes guardar toda tu quiniela completa para acceder a tus MessiCoins!');
        return;
      }
    }

    if (myCoins < 10) {
      alert('¡No tienes suficientes MessiCoins! Cuesta 10 MC.');
      return;
    }
    try {
      setBuyingStreaks(true);
      await unlockFeature(user.id, 'streaks', 10);
      setUnlockedStreaks(true);
      setExpireTime(Date.now() + 172800000);
      setMyCoins(prev => prev - 10);
      setMyExpenses(prev => prev + 10);
      setLeaderboard(leaderboard.map(l => l.userId === user.id ? { ...l, coins: l.coins - 10 } : l));
    } catch (e: any) {
      alert('Error al comprar: ' + e.message);
    } finally {
      setBuyingStreaks(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress color="primary" /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 4 } }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
          Ranking Global
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          Compara tus puntos con los demás participantes del Mundial.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <AnimatePresence>
        {activeSpies.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16 }}>
            <Paper sx={{ 
              p: 2, 
              bgcolor: 'rgba(211, 47, 47, 0.1)', 
              border: '1px solid', 
              borderColor: 'error.main', 
              borderRadius: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              animation: 'pulse 2s infinite'
            }}>
              <WarningIcon color="error" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                  ¡ALERTA DE SEGURIDAD!
                </Typography>
                <Typography variant="body2" color="error.light" sx={{ fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {activeSpies.map(spy => (
                    <Box key={spy.targetId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      • La quiniela de {spy.targetName} está siendo espiada.
                      <Typography component="span" variant="caption" sx={{ fontWeight: 900, color: '#fff', bgcolor: 'error.dark', px: 1, py: 0.2, borderRadius: 1, lineHeight: 1 }}>
                        <CountdownTimer targetDate={spy.expiresAt} onExpire={() => pollActiveSpies()} />
                      </Typography>
                    </Box>
                  ))}
                </Typography>
              </Box>
            </Paper>
            <style>{`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(211, 47, 47, 0); }
                100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {canSeeColumns && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, minHeight: 36 }}>
          {unlockedStreaks && expireTime ? (
            <CountdownTimer targetDate={expireTime} onExpire={() => setUnlockedStreaks(false)} />
          ) : !unlockedStreaks && !checkingStreaks && (
            <Button 
              variant="contained" 
              color="warning" 
              size="small" 
              onClick={handleUnlockStreaks} 
              disabled={buyingStreaks} 
              startIcon={buyingStreaks ? <CircularProgress size={16} color="inherit" /> : <LockIcon />} 
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              {buyingStreaks ? 'Procesando...' : 'Revelar Rachas (10 MC)'}
            </Button>
          )}
        </Box>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 4, 
            overflowX: 'auto', 
            bgcolor: 'rgba(20, 20, 20, 0.6)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.4)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: { xs: 50, sm: 100 }, textAlign: 'center', py: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 }, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>Pos</TableCell>
                <TableCell sx={{ fontWeight: 800, py: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 }, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>Participante</TableCell>
                {canSeeColumns && (
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', py: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 }, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>
                    Racha {!unlockedStreaks && <LockIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle', color: 'warning.main' }} />}
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', py: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 }, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>Puntos</TableCell>
                {canSeeColumns && (
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right', py: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 }, color: '#ffc107', textTransform: 'uppercase', letterSpacing: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <MonetizationOnIcon sx={{ fontSize: 16 }} /> <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Saldo MC</Box>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canSeeColumns ? 5 : 3} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    Aún no hay puntos registrados. ¡Empieza a predecir!
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  
                  return (
                    <TableRow 
                      key={entry.userId}
                      sx={{ 
                        bgcolor: isMe ? 'rgba(0, 230, 118, 0.08)' : idx === 0 ? 'rgba(255, 215, 0, 0.05)' : idx === 1 ? 'rgba(192, 192, 192, 0.05)' : idx === 2 ? 'rgba(205, 127, 50, 0.05)' : 'transparent',
                        borderLeft: isMe ? '4px solid #00E676' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isMe ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.03)',
                        },
                        '& td': { borderBottom: '1px solid rgba(255,255,255,0.03)', py: { xs: 1.5, sm: 2.5 }, px: { xs: 1, sm: 2 } } 
                      }}
                    >
                      <TableCell sx={{ textAlign: 'center', fontWeight: 900, fontSize: idx < 3 ? { xs: '1.1rem', sm: '1.3rem' } : { xs: '0.9rem', sm: '1.1rem' }, color: idx === 0 ? '#ffd700' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.2, sm: 0.5 } }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: isMe ? 800 : 600, color: isMe ? '#00E676' : 'text.primary', fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isMe ? `${user?.user_metadata?.username} (Tú)` : entry.username}
                          {!isMe && (() => {
                            const mySpies = userUnlocks?.spies?.[entry.userId] || {};
                            const hasActiveSpyOnThisUser = Object.values(mySpies).some((time: any) => time > Date.now());
                            const isGlobalPanic = activeSpies.length > 0;
                            const isSpyDisabled = isGlobalPanic && !hasActiveSpyOnThisUser;

                            return (
                              <Tooltip title={isSpyDisabled ? `Seguridad Global Activada. Sistema de espionaje bloqueado temporalmente.` : `Espiar quiniela de ${entry.username}`}>
                                <span>
                                  <IconButton 
                                    size="small" 
                                    disabled={isSpyDisabled}
                                    onClick={() => {
                                      if (role !== 'ADMIN' && myExpenses < 100) {
                                        alert('🔒 ACCESO DENEGADO: Solo los inversores activos pueden usar el Espía. Debes haber gastado al menos 100 MC en el juego para desbloquear esta función.');
                                        return;
                                      }
                                      setTargetSpyUser({ id: entry.userId, name: entry.username });
                                    }} 
                                    sx={{ 
                                      color: isSpyDisabled ? 'text.disabled' : 'primary.main', 
                                      bgcolor: isSpyDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(0,229,255,0.1)', 
                                      '&:hover': { bgcolor: isSpyDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(0,229,255,0.2)' } 
                                    }}
                                  >
                                    {isSpyDisabled ? <LockIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            );
                          })()}
                        </Box>
                      </TableCell>
                      {canSeeColumns && (
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {unlockedStreaks ? (
                              (entry.recentForm || []).map((status, i) => (
                                <Tooltip key={i} title={status !== 'LOSS' ? 'Sumó puntos' : 'No sumó puntos'}>
                                  <Box sx={{ 
                                    width: 12, height: 12, borderRadius: '50%',
                                    bgcolor: status !== 'LOSS' ? '#00e676' : '#f44336',
                                    border: '1px solid rgba(0,0,0,0.5)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                  }} />
                                </Tooltip>
                              ))
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.disabled', opacity: 0.5 }}>---</Typography>
                            )}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell sx={{ textAlign: 'right', fontWeight: 900, fontSize: { xs: '1rem', sm: '1.2rem' }, color: 'primary.main' }}>
                        {entry.totalPoints} <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>pts</Typography>
                      </TableCell>
                      {canSeeColumns && (
                        <TableCell sx={{ textAlign: 'right', fontWeight: 900, fontSize: { xs: '1rem', sm: '1.2rem' }, color: '#ffc107' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {entry.coins} <MonetizationOnIcon sx={{ fontSize: { xs: 14, sm: 18 } }} />
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>

      {targetSpyUser && user && (
        <SpyStoreModal 
          open={!!targetSpyUser} 
          onClose={() => setTargetSpyUser(null)} 
          targetId={targetSpyUser.id} 
          targetName={targetSpyUser.name} 
          userId={user.id} 
          userCoins={myCoins}
          onSpend={(amount) => {
            setMyCoins(prev => prev - amount);
            setMyExpenses(prev => prev + amount);
            setLeaderboard(leaderboard.map(l => l.userId === user.id ? { ...l, coins: l.coins - amount } : l));
            loadData(); // Reload to update active spies badge
          }}
        />
      )}
    </Box>
  );
};
