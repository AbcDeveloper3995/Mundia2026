import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Button, TextField, Tabs, Tab, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { fetchAllMatches, fetchTeams, fetchGroups, type Match, type Team, type Group } from '@/modules/admin/services/admin.service';
import { fetchUserPredictions, saveAllPredictions, fetchUserAwards, saveUserAwards, type Prediction, type PredictionAwards } from '@/modules/predictions/services/predictions.service';
import { calculateGroupStandings, generateBracket, getWinner, getPointsBreakdown } from '@/utils/tournament.rules';
import { ThirdsRanking } from '@/components/ThirdsRanking';
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
  const [awardsLocked, setAwardsLocked] = useState(false);
  const [isSavedSession, setIsSavedSession] = useState(false);

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
      if (awardsData) {
        setAwards(awardsData);
        if (awardsData.top_scorer || awardsData.top_assist || awardsData.mvp) {
          setAwardsLocked(true);
        }
      }
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
          predicted_away_score: type === 'away' ? score : p.predicted_away_score,
          // Si el usuario cambia el marcador y ya no es empate, limpiar el ganador de penales
          predicted_penalty_winner: (type === 'home' ? score : p.predicted_home_score) === (type === 'away' ? score : p.predicted_away_score) ? p.predicted_penalty_winner : null
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

  const handlePenaltyWinnerChange = (matchId: string, winner: 'HOME' | 'AWAY') => {
    setPredictions(prev => {
      const existing = prev.find(p => p.match_id === matchId);
      if (existing) {
        return prev.map(p => p.match_id === matchId ? { ...p, predicted_penalty_winner: winner } : p);
      }
      return prev;
    });
  };

  const handleSaveAllPredictions = async () => {
    if (!allTournamentMatchesPredicted) {
      alert("Por favor completa todas las predicciones antes de guardar.");
      return;
    }
    
    try {
      const payload = simulatedMatches.map(sm => {
        const p = predictions.find(pred => pred.match_id === sm.id);
        return {
          match_id: sm.id,
          home_score: p!.predicted_home_score,
          away_score: p!.predicted_away_score,
          home_team_id: sm.stage !== 'GROUP' ? (sm.home_team_id ?? undefined) : undefined,
          away_team_id: sm.stage !== 'GROUP' ? (sm.away_team_id ?? undefined) : undefined,
          penalty_winner: p!.predicted_penalty_winner
        };
      });
      await saveAllPredictions(user!.id, payload);
      setIsSavedSession(true);
      alert("¡Quiniela guardada correctamente!");
    } catch (err: any) {
      alert("Error al guardar la quiniela: " + err.message);
    }
  };

  const isQuinielaSaved = useMemo(() => {
    if (matches.length === 0) return false;
    const savedCount = predictions.filter(p => p.id && !p.id.startsWith('temp-')).length;
    return isSavedSession || savedCount === matches.length;
  }, [matches, predictions, isSavedSession]);

  const handleSaveAwards = async () => {
    try {
      await saveUserAwards(user!.id, {
        top_scorer: awards.top_scorer || null,
        top_assist: awards.top_assist || null,
        mvp: awards.mvp || null
      });
      alert("¡Premios guardados correctamente!");
      setAwardsLocked(true);
    } catch (err: any) {
      alert("Error al guardar premios: " + err.message);
    }
  };

  // ---- MOTOR DE SIMULACIÓN LOCAL ----
  const allGroupMatchesPredicted = useMemo(() => {
    const groupMatches = matches.filter(m => m.stage === 'GROUP');
    if (groupMatches.length === 0) return false;
    return groupMatches.every(m => {
      const pred = predictions.find(p => p.match_id === m.id);
      return pred && pred.predicted_home_score !== -1 && pred.predicted_away_score !== -1;
    });
  }, [matches, predictions]);

  const allTournamentMatchesPredicted = useMemo(() => {
    if (matches.length === 0) return false;
    return matches.every(m => {
      const pred = predictions.find(p => p.match_id === m.id);
      if (!pred || pred.predicted_home_score === -1 || pred.predicted_away_score === -1) return false;
      if (m.stage !== 'GROUP' && pred.predicted_home_score === pred.predicted_away_score && !pred.predicted_penalty_winner) return false;
      return true;
    });
  }, [matches, predictions]);

  const simulatedMatches = useMemo(() => {
    let sim = matches.map(m => ({ ...m })); // clon profundo de primer nivel
    
    // 1. Inyectar predicciones
    sim = sim.map(m => {
      const p = predictions.find(pred => pred.match_id === m.id);
      if (p && p.predicted_home_score !== -1 && p.predicted_away_score !== -1) {
         return { 
           ...m, 
           home_score: p.predicted_home_score, 
           away_score: p.predicted_away_score, 
           home_penalties: p.predicted_penalty_winner === 'HOME' ? 1 : 0,
           away_penalties: p.predicted_penalty_winner === 'AWAY' ? 1 : 0,
           is_finished: true 
         };
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
         const thirdPlaceMatches = stage === 'SF' ? sim.filter(m => m.stage === '3RD').sort((a,b) => a.id.localeCompare(b.id)) : [];

         stageMatches.forEach((m, idx) => {
            if (m.home_score !== null && m.away_score !== null) {
               const winnerId = getWinner(m as any);
               const loserId = m.home_team_id === winnerId ? m.away_team_id : m.home_team_id;

               if (winnerId) {
                  const nextMatchIndex = Math.floor(idx / 2);
                  const isHome = idx % 2 === 0;
                  if (nextStageMatches[nextMatchIndex]) {
                     if (isHome) nextStageMatches[nextMatchIndex].home_team_id = winnerId;
                     else nextStageMatches[nextMatchIndex].away_team_id = winnerId;
                  }
                  
                  if (stage === 'SF' && thirdPlaceMatches[0]) {
                     if (isHome) thirdPlaceMatches[0].home_team_id = loserId;
                     else thirdPlaceMatches[0].away_team_id = loserId;
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

    const realMatch = matches.find(m => m.id === match.id);
    const isLocked = realMatch?.is_finished;
    const { breakdown, total } = getPointsBreakdown(match, prediction, matches, teams);
    
    // Verificamos si tiene una predicción válida para mostrar borde verde o rojo
    const isKnockout = match.stage !== 'GROUP';
    const hasScores = prediction && prediction.predicted_home_score !== -1 && prediction.predicted_away_score !== -1;
    const isTie = hasScores && prediction.predicted_home_score === prediction.predicted_away_score;
    const isValidKnockoutTie = isKnockout && isTie ? !!prediction.predicted_penalty_winner : true;
    const isFullyPredicted = hasScores && isValidKnockoutTie;
    
    // Si la card es de un partido pasado o bloqueado, usamos colores tenues, sino rojo (falta) o verde (listo)
    const borderColor = isLocked ? 'rgba(255,255,255,0.1)' : (isFullyPredicted ? 'success.main' : 'error.main');

    return (
      <Grid size={{ xs: 12, md: 6 }}   key={match.id} sx={{ display: 'flex' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', display: 'flex' }}>
          <Paper sx={{ width: '100%', p: 3, borderRadius: 3, border: '1px solid', borderColor: borderColor, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s' }}>
            
            {realMatch && (
              <Box sx={{ position: 'absolute', top: 0, right: 0, bgcolor: isLocked ? 'rgba(46, 125, 50, 0.2)' : 'rgba(255, 160, 0, 0.2)', px: 2, py: 0.5, borderBottomLeftRadius: 8 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: isLocked ? 'success.light' : 'warning.light' }}>
                  {isLocked ? `Resultado Real: ${realMatch.home_score} - ${realMatch.away_score}` : 'Partido Pendiente'}
                </Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 2, display: 'block' }}>
              {match.stage === 'GROUP' ? `Grupo ${group?.name}` : `Fase: ${match.stage}`}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%' }}>
                {home?.flag ? <img src={home.flag} alt="" style={{width: 48, height: 32, objectFit: 'cover', borderRadius: 4, marginBottom: 8}}/> : <Box sx={{width: 48, height: 32, bgcolor: '#333', mb: 1, borderRadius: 1}}/>}
                <Box sx={{ height: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center', fontSize: '0.85rem', lineHeight: 1.2 }}>{home?.name || 'TBD'}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30%', gap: 1 }}>
                <Box sx={{ width: 48, height: 56, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: isLocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', '&:focus-within': { borderColor: 'primary.main', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    maxLength={2}
                    value={hScore ?? ''}
                    onChange={(e) => handlePredictionChange(match.id, 'home', e.target.value)}
                    disabled={isLocked || (!home && !away) || isQuinielaSaved}
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', fontSize: '1.4rem', fontWeight: 900, outline: 'none' }}
                  />
                </Box>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 900 }}>-</Typography>
                <Box sx={{ width: 48, height: 56, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: isLocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', '&:focus-within': { borderColor: 'primary.main', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    maxLength={2}
                    value={aScore ?? ''}
                    onChange={(e) => handlePredictionChange(match.id, 'away', e.target.value)}
                    disabled={isLocked || (!home && !away) || isQuinielaSaved}
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', fontSize: '1.4rem', fontWeight: 900, outline: 'none' }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%' }}>
                {away?.flag ? <img src={away.flag} alt="" style={{width: 48, height: 32, objectFit: 'cover', borderRadius: 4, marginBottom: 8}}/> : <Box sx={{width: 48, height: 32, bgcolor: '#333', mb: 1, borderRadius: 1}}/>}
                <Box sx={{ height: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center', fontSize: '0.85rem', lineHeight: 1.2 }}>{away?.name || 'TBD'}</Typography>
                </Box>
              </Box>
            </Box>

            {!isLocked && isKnockout && isTie && home && away && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800, mb: 1, display: 'block' }}>
                  Empate. ¿Quién gana en penales?
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button 
                    variant={prediction.predicted_penalty_winner === 'HOME' ? 'contained' : 'outlined'} 
                    color="primary" 
                    size="small" 
                    onClick={() => handlePenaltyWinnerChange(match.id, 'HOME')}
                    disabled={isQuinielaSaved}
                  >
                    {home.name}
                  </Button>
                  <Button 
                    variant={prediction.predicted_penalty_winner === 'AWAY' ? 'contained' : 'outlined'} 
                    color="primary" 
                    size="small" 
                    onClick={() => handlePenaltyWinnerChange(match.id, 'AWAY')}
                    disabled={isQuinielaSaved}
                  >
                    {away.name}
                  </Button>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isLocked || breakdown.length > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography variant="body2" sx={{ color: total > 0 ? 'success.main' : 'error.main', fontWeight: 800 }}>
                      Puntos Obtenidos: {total}
                    </Typography>
                    {isLocked && (
                      <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: 2, 
                        bgcolor: total === 5 ? 'rgba(0,230,118,0.2)' : total >= 3 ? 'rgba(0,230,118,0.1)' : 'rgba(239,68,68,0.2)',
                        border: '1px solid',
                        borderColor: total === 5 ? 'success.main' : total >= 3 ? 'success.light' : 'error.main'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: total >= 3 ? 'success.main' : 'error.main' }}>
                          {total === 5 ? '+50' : total >= 3 ? '+20' : '-10'} MC
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Acierto exacto: 5pts | Ganador: 3pts
                  </Typography>
                )}
              </Box>

              {breakdown.length > 0 && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 0.5, display: 'block' }}>Desglose de puntos:</Typography>
                  {breakdown.map((item, i) => (
                    <Typography key={i} variant="caption" sx={{ display: 'block', color: 'success.light', fontWeight: 600 }}>
                      ✓ +{item.points} pts: {item.reason}
                    </Typography>
                  ))}
                </Box>
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
        {isQuinielaSaved && (
          <Alert severity="success" sx={{ mt: 2, fontWeight: 700 }}>
            ¡Tu quiniela está guardada y bloqueada! Mucha suerte.
          </Alert>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }} textColor="secondary" indicatorColor="secondary">
        <Tab label="Fase de Grupos" sx={{ fontWeight: 700 }} />
        <Tab label="Fase Eliminatoria" sx={{ fontWeight: 700 }} disabled={!allGroupMatchesPredicted} />
        <Tab label="Premios del Torneo" sx={{ fontWeight: 700 }} />
      </Tabs>

      {tab === 0 && (() => {
        const matchesWithPredictions = simulatedMatches.map(m => {
          const p = predictions.find(pred => pred.match_id === m.id);
          const isPlayed = !!(p && p.predicted_home_score !== -1 && p.predicted_away_score !== -1);
          return {
            ...m,
            is_finished: isPlayed,
            home_score: isPlayed ? p.predicted_home_score : null,
            away_score: isPlayed ? p.predicted_away_score : null
          };
        });

        return (
          <>
            <Box>
              <Alert severity="info" sx={{ mb: 4 }}>
                Debes completar todos los resultados de la fase de grupos para que se desbloquee la pestaña de Fase Eliminatoria.
              </Alert>
              {groups.map(group => {
                const groupMatches = matchesWithPredictions.filter(m => m.stage === 'GROUP' && m.group_id === group.id).sort((a,b) => a.id.localeCompare(b.id));
                if (groupMatches.length === 0) return null;

                const standings = calculateGroupStandings(group.teams || [], groupMatches as any);

                return (
                  <Box key={group.id} sx={{ mb: 6 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                      Grupo {group.name}
                    </Typography>
                    <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
                      <Grid size={{ xs: 12, md: 9, lg: 10 }}>
                        <Grid container spacing={3}>
                          {simulatedMatches.filter(m => m.stage === 'GROUP' && m.group_id === group.id).sort((a,b) => a.id.localeCompare(b.id)).map(m => renderMatchCard(m))}
                        </Grid>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3, lg: 2 }}>
                        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, textAlign: 'center', letterSpacing: 1 }}>POSICIONES</Typography>
                          {standings.map((team, idx) => (
                            <Box key={team.team_id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: idx < 2 ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, width: 14 }}>{idx + 1}.</Typography>
                                {team.flag ? <img src={team.flag} alt={team.name} style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }} /> : <Box sx={{ width: 24, height: 16, bgcolor: '#333', borderRadius: 1 }} />}
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{team.name.substring(0,3).toUpperCase()}</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: 'secondary.main' }}>{team.points}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
                <Grid size={{ xs: 12, md: 8, lg: 6 }}>
                  <ThirdsRanking groups={groups} matches={matchesWithPredictions as any} />
                </Grid>
              </Grid>
            </Box>
          </>
        );
      })()}

      {tab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 4 }}>
            Predice los resultados de los grupos para que los equipos clasificados aparezcan aquí en las llaves.
          </Alert>
          <Grid container spacing={3}>
             {['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'].map(stage => (
               <Box key={stage} sx={{ width: '100%', mb: 4 }}>
                  <Typography variant="h5" sx={{ ml: 2, mb: 2, fontWeight: 800, color: 'secondary.main' }}>Fase: {stage}</Typography>
                  <Grid container spacing={3}>
                    {simulatedMatches.filter(m => m.stage === stage).map(m => renderMatchCard(m))}
                  </Grid>
               </Box>
             ))}
          </Grid>
          
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color={isQuinielaSaved ? 'success' : 'primary'}
              size="large"
              onClick={handleSaveAllPredictions}
              disabled={!allTournamentMatchesPredicted || isQuinielaSaved}
              sx={{ fontWeight: 900, px: 6, py: 1.5, borderRadius: 3, fontSize: '1.2rem' }}
            >
              {isQuinielaSaved ? 'Quiniela Completada' : 'Guardar Quiniela'}
            </Button>
          </Box>
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
                disabled={awardsLocked}
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
                disabled={awardsLocked}
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
                disabled={awardsLocked}
              >
                {TOP_PLAYERS.map(p => (
                  <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="contained" color="primary" fullWidth size="large" onClick={handleSaveAwards} sx={{ fontWeight: 800 }} disabled={awardsLocked}>
              {awardsLocked ? 'Selección Bloqueada' : 'Guardar Premios'}
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
