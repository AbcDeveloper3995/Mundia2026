import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Button, TextField, Tabs, Tab, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { fetchAllMatches, fetchTeams, fetchGroups, type Match, type Team, type Group } from '@/modules/admin/services/admin.service';
import { fetchUserPredictions, savePrediction, fetchUserAwards, saveUserAwards, type Prediction, type PredictionAwards } from '@/modules/predictions/services/predictions.service';
import { calculateGroupStandings, generateBracket, getWinner } from '@/utils/tournament.rules';
import { TOP_PLAYERS } from '@/utils/players.data';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';

export const PredictionsPage = () => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [awards, setAwards] = useState<PredictionAwards>({ user_id: '', top_scorer: '', top_assist: '', mvp: '' });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (user) loadData(user.id);
  }, [user]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      const [matchesData, teamsData, groupsData, predsData, awardsData] = await Promise.all([
        fetchAllMatches(),
        fetchTeams(),
        fetchGroups(),
        fetchUserPredictions(userId),
        fetchUserAwards(userId)
      ]);
      setMatches(matchesData);
      setTeams(teamsData);
      setGroups(groupsData);
      setPredictions(predsData);
      if (awardsData) setAwards(awardsData);
      else setAwards({ user_id: userId, top_scorer: '', top_assist: '', mvp: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionChange = (matchId: string, type: 'home' | 'away', value: string) => {
    const score = value === '' ? -1 : parseInt(value, 10);
    if (value !== '' && isNaN(score)) return;

    setPredictions(prev => {
      const existing = prev.find(p => p.match_id === matchId);
      if (existing) {
        return prev.map(p => p.match_id === matchId ? { 
          ...p, 
          predicted_home_score: type === 'home' ? score : p.predicted_home_score,
          predicted_away_score: type === 'away' ? score : p.predicted_away_score
        } : p);
      } else {
        return [...prev, {
          id: 'temp-' + matchId,
          user_id: user!.id,
          match_id: matchId,
          predicted_home_score: type === 'home' ? score : -1,
          predicted_away_score: type === 'away' ? score : -1,
          points_earned: 0,
          created_at: new Date().toISOString()
        }];
      }
    });
  };

  const handleSavePrediction = async (matchId: string, homeTeamId?: string | null, awayTeamId?: string | null) => {
    const pred = predictions.find(p => p.match_id === matchId);
    if (!pred || pred.predicted_home_score === -1 || pred.predicted_away_score === -1) {
      alert("Por favor ingresa ambos marcadores antes de guardar.");
      return;
    }

    try {
      await savePrediction(user!.id, matchId, pred.predicted_home_score, pred.predicted_away_score, homeTeamId || undefined, awayTeamId || undefined);
      alert("¡Predicción guardada correctamente!");
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    }
  };

  const handleSaveAwards = async () => {
    try {
      await saveUserAwards(user!.id, {
        top_scorer: awards.top_scorer || null,
        top_assist: awards.top_assist || null,
        mvp: awards.mvp || null
      });
      alert("¡Premios guardados correctamente!");
    } catch (err: any) {
      alert("Error al guardar premios: " + err.message);
    }
  };

  // ---- MOTOR DE SIMULACIÓN LOCAL ----
  const simulatedMatches = useMemo(() => {
    let sim = matches.map(m => ({ ...m })); // clon profundo de primer nivel
    
    // 1. Inyectar predicciones
    sim = sim.map(m => {
      const p = predictions.find(pred => pred.match_id === m.id);
      if (p && p.predicted_home_score !== -1 && p.predicted_away_score !== -1) {
         return { ...m, home_score: p.predicted_home_score, away_score: p.predicted_away_score, is_finished: true };
      }
      return m;
    });

    // 2. Resolver Fase de Grupos
    const groupStandings = groups.map(g => calculateGroupStandings(g.teams || [], sim.filter(m => m.group_id === g.id)));
    const allTeamsStandings = groupStandings.flat();
    
    // Validar si todos los partidos de grupo están predichos (opcional) para generar la llave
    const matchups = generateBracket(groups, sim as any);
    
    // 3. Poblar R32 y avanzar rondas iterativamente
    if (matchups.length === 16) {
      const r32Matches = sim.filter(m => m.stage === 'R32').sort((a,b) => a.id.localeCompare(b.id));
      r32Matches.forEach((m, idx) => {
         m.home_team_id = matchups[idx]?.[0]?.team_id || null;
         m.away_team_id = matchups[idx]?.[1]?.team_id || null;
      });

      const stages = ['R32', 'R16', 'QF', 'SF'];
      const nextStages: Record<string, string> = { 'R32': 'R16', 'R16': 'QF', 'QF': 'SF', 'SF': 'FINAL' };

      stages.forEach(stage => {
         const stageMatches = sim.filter(m => m.stage === stage).sort((a,b) => a.id.localeCompare(b.id));
         const nextStageMatches = sim.filter(m => m.stage === nextStages[stage]).sort((a,b) => a.id.localeCompare(b.id));

         stageMatches.forEach((m, idx) => {
            if (m.home_score !== null && m.away_score !== null) {
               const winnerId = getWinner(m as any);
               if (winnerId) {
                  const nextMatchIndex = Math.floor(idx / 2);
                  const isHome = idx % 2 === 0;
                  if (nextStageMatches[nextMatchIndex]) {
                     if (isHome) nextStageMatches[nextMatchIndex].home_team_id = winnerId;
                     else nextStageMatches[nextMatchIndex].away_team_id = winnerId;
                  }
               }
            }
         });
      });
    }

    return sim;
  }, [matches, predictions, groups]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress color="primary" /></Box>;

  const renderMatchCard = (match: Match) => {
    const home = teams.find(t => t.id === match.home_team_id);
    const away = teams.find(t => t.id === match.away_team_id);
    const group = groups.find(g => g.id === match.group_id);
    const prediction = predictions.find(p => p.match_id === match.id);

    const hScore = prediction?.predicted_home_score === -1 ? '' : prediction?.predicted_home_score;
    const aScore = prediction?.predicted_away_score === -1 ? '' : prediction?.predicted_away_score;

    // Is the real match finished? If so, lock predictions.
    const realMatch = matches.find(m => m.id === match.id);
    const isLocked = realMatch?.is_finished;

    return (
      <Grid item xs={12} md={6} key={match.id}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: isLocked ? 'rgba(255,255,255,0.1)' : 'primary.main', position: 'relative', overflow: 'hidden' }}>
            
            {isLocked && (
              <Box sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.1)', px: 2, py: 0.5, borderBottomLeftRadius: 8 }}>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>Partido Real Finalizado</Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 2, display: 'block' }}>
              {match.stage === 'GROUP' ? `Grupo ${group?.name}` : `Fase: ${match.stage}`}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                {home?.flag ? <img src={home.flag} alt="" style={{width: 40, height: 28, borderRadius: 4, marginBottom: 8}}/> : <Box sx={{width: 40, height: 28, bgcolor: '#333', mb: 1}}/>}
                <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center' }}>{home?.name || 'TBD'}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField 
                  size="small" 
                  sx={{ width: 50 }} 
                  inputProps={{ style: { textAlign: 'center', fontWeight: 900, fontSize: '1.2rem' } }}
                  value={hScore ?? ''}
                  onChange={(e) => handlePredictionChange(match.id, 'home', e.target.value)}
                  disabled={isLocked || (!home && !away)}
                />
                <Typography variant="h6" color="text.secondary">-</Typography>
                <TextField 
                  size="small" 
                  sx={{ width: 50 }} 
                  inputProps={{ style: { textAlign: 'center', fontWeight: 900, fontSize: '1.2rem' } }}
                  value={aScore ?? ''}
                  onChange={(e) => handlePredictionChange(match.id, 'away', e.target.value)}
                  disabled={isLocked || (!home && !away)}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                {away?.flag ? <img src={away.flag} alt="" style={{width: 40, height: 28, borderRadius: 4, marginBottom: 8}}/> : <Box sx={{width: 40, height: 28, bgcolor: '#333', mb: 1}}/>}
                <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center' }}>{away?.name || 'TBD'}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {isLocked ? (
                <Typography variant="body2" sx={{ color: (prediction?.points_earned || 0) > 0 ? 'success.main' : 'error.main', fontWeight: 800 }}>
                  Puntos Obtenidos: {prediction?.points_earned || 0}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Acierto exacto: 3pts | Ganador: 1pt
                </Typography>
              )}

              {!isLocked && home && away && (
                <Button variant="contained" color="primary" size="small" onClick={() => handleSavePrediction(match.id, match.home_team_id, match.away_team_id)}>
                  Guardar
                </Button>
              )}
            </Box>
          </Paper>
        </motion.div>
      </Grid>
    );
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 900 }}>
          Mi Simulador del Torneo
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Completa toda tu quiniela hasta la final. Los equipos avanzarán automáticamente según tus predicciones.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }} textColor="secondary" indicatorColor="secondary">
        <Tab label="Fase de Grupos" sx={{ fontWeight: 700 }} />
        <Tab label="Fase Eliminatoria" sx={{ fontWeight: 700 }} />
        <Tab label="Premios del Torneo" sx={{ fontWeight: 700 }} />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          {simulatedMatches.filter(m => m.stage === 'GROUP').map(m => renderMatchCard(m))}
        </Grid>
      )}

      {tab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 4 }}>
            Predice los resultados de los grupos para que los equipos clasificados aparezcan aquí en las llaves.
          </Alert>
          <Grid container spacing={3}>
             {['R32', 'R16', 'QF', 'SF', 'FINAL'].map(stage => (
               <Box key={stage} sx={{ width: '100%', mb: 4 }}>
                  <Typography variant="h5" sx={{ ml: 2, mb: 2, fontWeight: 800, color: 'secondary.main' }}>Fase: {stage}</Typography>
                  <Grid container spacing={3}>
                    {simulatedMatches.filter(m => m.stage === stage).map(m => renderMatchCard(m))}
                  </Grid>
               </Box>
             ))}
          </Grid>
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 800, color: 'primary.main', textAlign: 'center' }}>
              Elige a las Estrellas
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Máximo Goleador</InputLabel>
              <Select 
                value={awards.top_scorer || ''} 
                onChange={(e) => setAwards({...awards, top_scorer: e.target.value})}
                label="Máximo Goleador"
              >
                {TOP_PLAYERS.map(p => (
                  <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Máximo Asistente</InputLabel>
              <Select 
                value={awards.top_assist || ''} 
                onChange={(e) => setAwards({...awards, top_assist: e.target.value})}
                label="Máximo Asistente"
              >
                {TOP_PLAYERS.map(p => (
                  <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>MVP del Torneo</InputLabel>
              <Select 
                value={awards.mvp || ''} 
                onChange={(e) => setAwards({...awards, mvp: e.target.value})}
                label="MVP del Torneo"
              >
                {TOP_PLAYERS.map(p => (
                  <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="contained" color="primary" fullWidth size="large" onClick={handleSaveAwards} sx={{ fontWeight: 800 }}>
              Guardar Premios
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
