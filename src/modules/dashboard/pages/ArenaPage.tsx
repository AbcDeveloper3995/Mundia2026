import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, Button, Select, MenuItem, InputLabel, FormControl, Grid, Tooltip, Autocomplete, TextField } from '@mui/material';
import { fetchChallenges, createChallenge, acceptChallenge, declineChallenge, type Challenge } from '../services/arena.service';
import { fetchAllMatches, fetchTeams, type Match, type Team } from '@/modules/admin/services/admin.service';
import { fetchAllPaginated } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';
import { fetchDashboardStats } from '../services/stats.service';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import InfoIcon from '@mui/icons-material/Info';
import { ArenaRulesModal } from '../components/ArenaRulesModal';

export const ArenaPage = () => {
  const { user, role } = useAuthStore();
  const [tab, setTab] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [rulesOpen, setRulesOpen] = useState(false);
  
  // New Challenge Form
  const [selectedRival, setSelectedRival] = useState('');
  const [selectedMatch, setSelectedMatch] = useState('');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [challengesData, profilesData, matchesData, teamsData, statsData] = await Promise.all([
        fetchChallenges(user.id),
        fetchAllPaginated('profiles', 'id, username'),
        fetchAllMatches(),
        fetchTeams(),
        fetchDashboardStats(user.id)
      ]);

      if (role !== 'ADMIN') {
        if (!statsData.hasCompletedQuiniela) {
          setError('Acceso Denegado: Debes guardar toda tu quiniela para recibir tus MessiCoins iniciales y poder entrar a La Arena.');
          setLoading(false);
          return;
        }

        if (statsData.myCoins < 50) {
          setError('Acceso Denegado: Necesitas al menos 50 MessiCoins (MC) para entrar a La Arena.');
          setLoading(false);
          return;
        }
      }

      setChallenges(challengesData);
      const adminUsernames = ['änthuan', 'anthuan', 'SirRuben30', 'admin', 'Admin'];
      setUsers((profilesData as any[]).filter(u => u.id !== user.id && (u.username === 'miri' || adminUsernames.includes(u.username))));
      
      const today = new Date();
      const yy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yy}-${mm}-${dd}`;

      // Only unfinished GROUP matches can be challenged
      setMatches(matchesData.filter(m => {
        return !m.is_finished && m.home_team_id && m.away_team_id && m.stage === 'GROUP';
      }));
      setTeams(teamsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !selectedRival || !selectedMatch || !betAmount) return;
    try {
      setSubmitting(true);
      await createChallenge(user.id, selectedRival, selectedMatch, betAmount);
      alert('¡Reto enviado correctamente!');
      setSelectedRival('');
      setSelectedMatch('');
      await loadData();
      setTab(1); // Switch to "Mis Retos"
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (challenge: Challenge) => {
    if (!user) return;
    try {
      await acceptChallenge(challenge.id, user.id, challenge.amount);
      alert('¡Reto aceptado! Que gane el mejor.');
      await loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDecline = async (challenge: Challenge) => {
    if (!user) return;
    try {
      await declineChallenge(challenge.id, challenge.challenger_id, challenge.amount);
      alert('Reto rechazado.');
      await loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress color="primary" /></Box>;

  if (error && error.includes('Acceso Denegado')) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mt: 10, p: 4, bgcolor: 'rgba(20,20,20,0.8)', borderRadius: 3, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
        <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 900, mb: 3 }}>
          Acceso Denegado 🔒
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontSize: '1.2rem' }}>
          {error}
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained" color="warning" size="large" sx={{ fontWeight: 800 }}>
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  // Filter Challenges
  const incomingPending = challenges.filter(c => c.challenged_id === user?.id && c.status === 'pending');
  const outgoingPending = challenges.filter(c => c.challenger_id === user?.id && c.status === 'pending');
  const history = challenges.filter(c => c.status !== 'pending');

  const getMatchLabel = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return matchId;
    const home = teams.find(t => t.id === match.home_team_id)?.name || 'TBD';
    const away = teams.find(t => t.id === match.away_team_id)?.name || 'TBD';
    return `${home} vs ${away} (${match.stage === 'GROUP' ? 'Fase Grupos' : match.stage})`;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
        <Typography variant="h2" sx={{ color: 'warning.main', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
          La Arena ⚔️
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          Reta a otros participantes en partidos específicos. Doble o nada.
        </Typography>
        <Button 
          variant="outlined" 
          color="warning" 
          startIcon={<InfoIcon />} 
          onClick={() => setRulesOpen(true)}
          sx={{ mt: 2, borderRadius: 8, fontWeight: 800 }}
        >
          Reglas de La Arena
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }} textColor="secondary" indicatorColor="secondary" centered>
        <Tab label="Lanzar Reto" sx={{ fontWeight: 800 }} />
        <Tab label={`Mis Retos (${incomingPending.length > 0 ? incomingPending.length + ' Nuevo' : 'Historial'})`} sx={{ fontWeight: 800 }} />
      </Tabs>

      {tab === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', bgcolor: 'rgba(20,20,20,0.8)' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, color: 'primary.main', textAlign: 'center' }}>
              Configurar Reto
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>1. Selecciona a tu Víctima</InputLabel>
              <Select value={selectedRival} onChange={(e) => setSelectedRival(e.target.value)} label="1. Selecciona a tu Víctima">
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Autocomplete
                options={matches}
                getOptionLabel={(m) => {
                  const home = teams.find(t => t.id === m.home_team_id);
                  const away = teams.find(t => t.id === m.away_team_id);
                  return `${home?.name || 'TBD'} vs ${away?.name || 'TBD'}`;
                }}
                value={matches.find(m => m.id === selectedMatch) || null}
                onChange={(_, newValue) => setSelectedMatch(newValue ? newValue.id : '')}
                renderOption={(props, m) => {
                  const home = teams.find(t => t.id === m.home_team_id);
                  const away = teams.find(t => t.id === m.away_team_id);
                  return (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '45%' }}>
                        {home?.flag && <img src={home.flag} alt="" style={{ width: 24, height: 16, borderRadius: 2 }} />}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{home?.name || 'TBD'}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 900 }}>VS</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '45%', justifyContent: 'flex-end' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{away?.name || 'TBD'}</Typography>
                        {away?.flag && <img src={away.flag} alt="" style={{ width: 24, height: 16, borderRadius: 2 }} />}
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => <TextField {...params} label="2. Selecciona el Partido" />}
              />
              <Typography variant="caption" sx={{ color: 'primary.main', mt: 1, ml: 1, fontWeight: 700 }}>
                * Por los momentos, los retos solo están disponibles para partidos de la Fase de Grupos.
              </Typography>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>3. Apuesta (MessiCoins)</InputLabel>
              <Select value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} label="3. Apuesta (MessiCoins)">
                <MenuItem value={5}>5 MC</MenuItem>
                <MenuItem value={10}>10 MC</MenuItem>
                <MenuItem value={20}>20 MC</MenuItem>
                <MenuItem value={30}>30 MC</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="warning" sx={{ mb: 3 }}>
              Solo puedes lanzar 1 reto al día. Se descontarán {betAmount} MC de tu saldo inmediatamente. Si el rival rechaza, se te reembolsarán.
            </Alert>

            <Button 
              variant="contained" 
              color="warning" 
              fullWidth 
              size="large" 
              sx={{ fontWeight: 900, py: 1.5 }}
              disabled={submitting || !selectedRival || !selectedMatch}
              onClick={handleCreateChallenge}
            >
              {submitting ? 'Lanzando Reto...' : `APOSTAR ${betAmount} MC`}
            </Button>
          </Paper>
        </motion.div>
      )}

      {tab === 1 && (
        <Box>
          {incomingPending.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 800, mb: 2 }}>Retos Entrantes</Typography>
              <Grid container spacing={2}>
                {incomingPending.map(c => (
                  <Grid size={{ xs: 12, sm: 6 }} key={c.id}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'warning.main', bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                        {c.challenger?.name} te ha retado
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        Partido: {getMatchLabel(c.match_id)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800, display: 'block', mb: 2 }}>
                        Apuesta: {c.amount} MC
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" color="success" size="small" fullWidth onClick={() => handleAccept(c)}>Aceptar</Button>
                        <Button variant="outlined" color="error" size="small" fullWidth onClick={() => handleDecline(c)}>Rechazar</Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {outgoingPending.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 800, mb: 2 }}>Retos Enviados (Esperando...)</Typography>
              <Grid container spacing={2}>
                {outgoingPending.map(c => (
                  <Grid size={{ xs: 12, sm: 6 }} key={c.id}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                        Retaste a {c.challenged?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        Partido: {getMatchLabel(c.match_id)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, display: 'block' }}>
                        En juego: {c.amount * 2} MC
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 800, mb: 2 }}>Historial</Typography>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay retos en tu historial.</Typography>
            ) : (
              <Grid container spacing={2}>
                {history.map(c => {
                  const amIChallenger = c.challenger_id === user?.id;
                  const opponentName = amIChallenger ? c.challenged?.name : c.challenger?.name;
                  
                  let bgColor = 'rgba(255,255,255,0.05)';
                  let borderColor = 'rgba(255,255,255,0.1)';
                  let resultText = '';

                  if (c.status === 'declined') {
                    resultText = 'Rechazado';
                  } else if (c.status === 'expired') {
                    resultText = 'Caducado (Reembolso)';
                    bgColor = 'rgba(255, 255, 255, 0.05)';
                    borderColor = 'rgba(255, 255, 255, 0.1)';
                  } else if (c.status === 'accepted') {
                    resultText = 'En Progreso...';
                    borderColor = 'primary.main';
                  } else if (c.status === 'tied') {
                    resultText = 'Empate (Reembolso)';
                    bgColor = 'rgba(255, 255, 255, 0.1)';
                  } else if (c.status === 'resolved') {
                    if (c.winner_id === user?.id) {
                      resultText = '¡Victoria! (+' + (c.amount * 2) + ' MC)';
                      bgColor = 'rgba(0, 230, 118, 0.1)';
                      borderColor = 'success.main';
                    } else {
                      resultText = 'Derrota';
                      bgColor = 'rgba(244, 67, 54, 0.1)';
                      borderColor = 'error.main';
                    }
                  }

                  return (
                    <Grid size={{ xs: 12 }} key={c.id}>
                      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: bgColor, border: '1px solid', borderColor: borderColor, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            vs {opponentName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {getMatchLabel(c.match_id)} | Apuesta: {c.amount} MC
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: c.winner_id === user?.id ? 'success.main' : c.status === 'declined' ? 'text.secondary' : 'inherit' }}>
                          {resultText}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      )}

      <ArenaRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </Box>
  );
};
