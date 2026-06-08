import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel, TextField, Switch, FormControlLabel, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchGroups, fetchMatchesByGroup, fetchAllMatches, fetchTeams, updateMatch, resetKnockoutStage, fetchOfficialAwards, saveOfficialAwards, type Group, type Match, type Team, type OfficialAwards } from '@/modules/admin/services/admin.service';
import { calculateGroupStandings, generateBracket, getWinner, type TeamStanding } from '@/utils/tournament.rules';
import { TournamentBracket } from '../components/TournamentBracket';
import { recalculateAllLeaderboards } from '@/modules/predictions/services/predictions.service';
import { TOP_PLAYERS } from '@/utils/players.data';
import { motion } from 'framer-motion';

export const MatchesManager = () => {
  const [tab, setTab] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([]);
  const [officialAwards, setOfficialAwards] = useState<OfficialAwards>({
    top_scorer: null, top_assist: null, mvp: null, champion_team_id: null, runner_up_team_id: null, third_place_team_id: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isBracketOpen, setIsBracketOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [groupsData, teamsData, matchesData, awardsData] = await Promise.all([
        fetchGroups(),
        fetchTeams(),
        fetchAllMatches(),
        fetchOfficialAwards()
      ]);
      setGroups(groupsData);
      setAllTeams(teamsData);
      if (awardsData) setOfficialAwards(awardsData);
      
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0].id);
        const groupMatches = matchesData.filter(m => m.group_id === groupsData[0].id);
        setMatches(groupMatches);
        updateStandings(groupsData[0], groupMatches);
      }
      
      setKnockoutMatches(matchesData.filter(m => m.stage !== 'GROUP').sort((a,b) => {
        const order: Record<string, number> = { 'R32': 1, 'R16': 2, 'QF': 3, 'SF': 4, '3RD': 5, 'FINAL': 6 };
        if(order[a.stage] !== order[b.stage]) return order[a.stage] - order[b.stage];
        return a.id.localeCompare(b.id);
      }));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStandings = (group: Group, matchesData: Match[]) => {
    if (!group || !group.teams) return;
    const computed = calculateGroupStandings(group.teams, matchesData as any);
    setStandings(computed);
  };

  const handleGroupChange = async (groupId: string) => {
    setSelectedGroup(groupId);
    try {
      const data = await fetchMatchesByGroup(groupId);
      setMatches(data);
      const group = groups.find(g => g.id === groupId);
      if (group) updateStandings(group, data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGroupScoreChange = async (matchId: string, field: 'home_score' | 'away_score', value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    if (value !== '' && isNaN(score as number)) return;

    const updatedMatches = matches.map(m => m.id === matchId ? { ...m, [field]: score } : m);
    setMatches(updatedMatches);
    const group = groups.find(g => g.id === selectedGroup);
    if (group) updateStandings(group, updatedMatches);

    try {
      await updateMatch(matchId, { [field]: score });
    } catch (err: any) {
      setError("Error guardando el resultado: " + err.message);
    }
  };

  const handleKnockoutScoreChange = async (matchId: string, field: 'home_score' | 'away_score' | 'home_penalties' | 'away_penalties', value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    if (value !== '' && isNaN(score as number)) return;

    const updatedMatches = knockoutMatches.map(m => m.id === matchId ? { ...m, [field]: score } : m);
    setKnockoutMatches(updatedMatches);

    try {
      await updateMatch(matchId, { [field]: score });
    } catch (err: any) {
      setError("Error guardando el resultado: " + err.message);
    }
  };

  const handleStatusToggle = async (matchId: string, isFinished: boolean, isKnockout: boolean) => {
    try {
      await updateMatch(matchId, { is_finished: isFinished });
      
      if (!isKnockout) {
        const updatedMatches = matches.map(m => m.id === matchId ? { ...m, is_finished: isFinished } : m);
        setMatches(updatedMatches);
        const group = groups.find(g => g.id === selectedGroup);
        if (group) updateStandings(group, updatedMatches);
      } else {
        const updatedMatches = knockoutMatches.map(m => m.id === matchId ? { ...m, is_finished: isFinished } : m);
        setKnockoutMatches(updatedMatches);
        
        // Logica para avanzar al ganador a la siguiente fase
        if (isFinished) {
          const matchFinished = updatedMatches.find(m => m.id === matchId);
          if (matchFinished && matchFinished.stage !== 'FINAL' && matchFinished.stage !== '3RD') {
            const winnerId = getWinner(matchFinished as any);
            if (winnerId) {
              const stageMatches = updatedMatches.filter(m => m.stage === matchFinished.stage);
              const matchIndex = stageMatches.findIndex(m => m.id === matchId);
              
              const nextStages: Record<string, string> = { 'R32': 'R16', 'R16': 'QF', 'QF': 'SF', 'SF': 'FINAL' };
              const nextStageMatches = updatedMatches.filter(m => m.stage === nextStages[matchFinished.stage]);
              const nextMatchIndex = Math.floor(matchIndex / 2);
              const isHome = matchIndex % 2 === 0;
              
              const nextMatch = nextStageMatches[nextMatchIndex];
              if (nextMatch) {
                await updateMatch(nextMatch.id, isHome ? { home_team_id: winnerId } : { away_team_id: winnerId });
                loadInitialData();
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError("Error actualizando el estado: " + err.message);
    }
  };

  const handleArmarLlaves = async () => {
    try {
      setLoading(true);
      const allM = await fetchAllMatches();
      const matchups = generateBracket(groups, allM as any);
      
      const r32Matches = allM.filter(m => m.stage === 'R32').sort((a,b) => a.id.localeCompare(b.id));
      
      for(let i = 0; i < 16; i++) {
        if(r32Matches[i] && matchups[i]) {
          await updateMatch(r32Matches[i].id, {
            home_team_id: matchups[i][0].team_id,
            away_team_id: matchups[i][1].team_id
          });
        }
      }
      await loadInitialData();
      setTab(1);
    } catch (err: any) {
      setError("Error armando llaves: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetKnockout = async () => {
    if (window.confirm('¿Estás seguro de que quieres borrar TODOS los resultados de la Fase Eliminatoria? Los grupos se mantendrán intactos.')) {
      try {
        setLoading(true);
        await resetKnockoutStage();
        await loadInitialData();
      } catch (err: any) {
        setError("Error al reiniciar: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveOfficialAwards = async () => {
    try {
      await saveOfficialAwards(officialAwards);
      alert('Premios oficiales guardados.');
    } catch (err: any) {
      alert('Error guardando premios: ' + err.message);
    }
  };

  const handleRecalculateLeaderboard = async () => {
    if (window.confirm("¿Estás seguro? Esto calculará la puntuación de TODOS los participantes basándose en los resultados reales actuales. Esto puede tardar unos segundos.")) {
      try {
        setLoading(true);
        await recalculateAllLeaderboards();
        alert('Leaderboard recalculado con éxito.');
      } catch (err: any) {
        setError('Error al recalcular: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <CircularProgress color="primary" />;

  const currentGroup = groups.find(g => g.id === selectedGroup);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800 }}>
          Motor del Torneo
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleArmarLlaves} sx={{ fontWeight: 800 }}>
            Cerrar Grupos y Armar Llaves
          </Button>
          <Button variant="contained" color="primary" onClick={handleRecalculateLeaderboard} sx={{ fontWeight: 800 }}>
            Recalcular Leaderboard Global
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4 }}>
        <Tab label="Fase de Grupos" sx={{ fontWeight: 800 }} />
        <Tab label="Fase Eliminatoria" sx={{ fontWeight: 800 }} />
        <Tab label="Premios Oficiales" sx={{ fontWeight: 800 }} />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={4}>
          {/* Tabla de Posiciones */}
          <Grid size={{ xs: 12, lg: 8 }}  >
             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>Tabla de Posiciones</Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <Select value={selectedGroup} onChange={(e) => handleGroupChange(e.target.value)}>
                  {groups.map(g => (
                    <MenuItem key={g.id} value={g.id}>Grupo {g.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Paper sx={{ overflow: 'hidden', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography sx={{ width: '40%', fontWeight: 700 }}>Equipo</Typography>
                <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 700 }}>PJ</Typography>
                <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 700 }}>G</Typography>
                <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 700 }}>E</Typography>
                <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 700 }}>P</Typography>
                <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 700 }}>DG</Typography>
                <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 700, color: 'primary.main' }}>Pts</Typography>
              </Box>
              {standings.map((team, idx) => (
                <Box key={team.team_id} sx={{ display: 'flex', p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: idx < 2 ? 'rgba(46, 125, 50, 0.1)' : 'transparent' }}>
                  <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, width: 20 }}>{idx + 1}</Typography>
                    {team.flag && <img src={team.flag} alt={team.name} style={{ width: 24, height: 16, borderRadius: 2 }} />}
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{team.name}</Typography>
                  </Box>
                  <Typography sx={{ width: '10%', textAlign: 'center' }}>{team.played}</Typography>
                  <Typography sx={{ width: '10%', textAlign: 'center' }}>{team.won}</Typography>
                  <Typography sx={{ width: '10%', textAlign: 'center' }}>{team.drawn}</Typography>
                  <Typography sx={{ width: '10%', textAlign: 'center' }}>{team.lost}</Typography>
                  <Typography sx={{ width: '10%', textAlign: 'center' }}>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</Typography>
                  <Typography sx={{ width: '10%', textAlign: 'center', fontWeight: 800, color: 'primary.main' }}>{team.points}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Lista de Partidos Grupo */}
          <Grid size={{ xs: 12, lg: 4 }}  >
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>Resultados</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {matches.map((match, idx) => {
                const home = currentGroup?.teams?.find(t => t.id === match.home_team_id);
                const away = currentGroup?.teams?.find(t => t.id === match.away_team_id);
                if (!home || !away) return null;

                return (
                  <motion.div key={match.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '35%' }}>
                          {home.flag && <img src={home.flag} alt={home.name} style={{ width: 24, height: 16, borderRadius: 2 }} />}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{home.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small" sx={{ width: 45 }} slotProps={{ htmlInput: { style: { textAlign: 'center', fontWeight: 800 } } }}
                            value={match.home_score ?? ''} onChange={(e) => handleGroupScoreChange(match.id, 'home_score', e.target.value)}
                          />
                          <Typography variant="body1" sx={{ color: 'text.secondary' }}>-</Typography>
                          <TextField
                            size="small" sx={{ width: 45 }} slotProps={{ htmlInput: { style: { textAlign: 'center', fontWeight: 800 } } }}
                            value={match.away_score ?? ''} onChange={(e) => handleGroupScoreChange(match.id, 'away_score', e.target.value)}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '35%', justifyContent: 'flex-end' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{away.name}</Typography>
                          {away.flag && <img src={away.flag} alt={away.name} style={{ width: 24, height: 16, borderRadius: 2 }} />}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <FormControlLabel
                          control={<Switch size="small" checked={match.is_finished} onChange={(e) => handleStatusToggle(match.id, e.target.checked, false)} color="success" />}
                          label={<Typography variant="caption" sx={{ color: match.is_finished ? 'success.main' : 'text.secondary' }}>{match.is_finished ? 'Finalizado' : 'Pendiente'}</Typography>}
                        />
                        <Button 
                          variant="outlined" 
                          size="small" 
                          color="primary" 
                          onClick={() => {
                            updateMatch(match.id, { home_score: match.home_score, away_score: match.away_score });
                            alert('Resultado guardado correctamente');
                          }}
                        >
                          Guardar
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                );
              })}
            </Box>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>Fase Eliminatoria</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => setIsBracketOpen(true)} sx={{ fontWeight: 800 }}>
                Ver Árbol del Torneo
              </Button>
              <Button variant="outlined" color="error" onClick={handleResetKnockout}>
                Reiniciar Esquema
              </Button>
            </Box>
          </Box>
          <Grid container spacing={4}>
            {['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'].map(stage => {
              const stageMatches = knockoutMatches.filter(m => m.stage === stage);
              if (stageMatches.length === 0) return null;
              
              const stageNames: Record<string, string> = {
                'R32': 'Dieciseisavos', 'R16': 'Octavos', 'QF': 'Cuartos', 'SF': 'Semifinales', '3RD': 'Tercer Puesto', 'FINAL': 'Final'
              };

              return (
                <Grid size={{ xs: 12, md: 6 }}   key={stage}>
                  <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>{stageNames[stage]}</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {stageMatches.map(match => {
                        const home = allTeams.find(t => t.id === match.home_team_id);
                        const away = allTeams.find(t => t.id === match.away_team_id);
                        
                        return (
                          <Paper key={match.id} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {/* Home */}
                              <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                {home?.flag ? <img src={home.flag} alt="" style={{width: 24}}/> : <Box sx={{width: 24, height: 16, bgcolor: '#333'}} />}
                                <Typography variant="body2">{home ? home.name : 'TBD'}</Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <TextField size="small" sx={{ width: 40 }} value={match.home_score ?? ''} onChange={(e) => handleKnockoutScoreChange(match.id, 'home_score', e.target.value)} />
                                  <Typography>-</Typography>
                                  <TextField size="small" sx={{ width: 40 }} value={match.away_score ?? ''} onChange={(e) => handleKnockoutScoreChange(match.id, 'away_score', e.target.value)} />
                                </Box>
                                {(match.home_score !== null && match.home_score === match.away_score) && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.8 }}>
                                    <Typography variant="caption" color="secondary">Penales:</Typography>
                                    <TextField size="small" sx={{ width: 35 }} slotProps={{ htmlInput: {style:{fontSize:12, padding:4}} }} value={match.home_penalties ?? ''} onChange={(e) => handleKnockoutScoreChange(match.id, 'home_penalties', e.target.value)} />
                                    <TextField size="small" sx={{ width: 35 }} slotProps={{ htmlInput: {style:{fontSize:12, padding:4}} }} value={match.away_penalties ?? ''} onChange={(e) => handleKnockoutScoreChange(match.id, 'away_penalties', e.target.value)} />
                                  </Box>
                                )}
                                <Switch size="small" checked={match.is_finished} onChange={(e) => handleStatusToggle(match.id, e.target.checked, true)} color="secondary" />
                              </Box>

                              {/* Away */}
                              <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                <Typography variant="body2">{away ? away.name : 'TBD'}</Typography>
                                {away?.flag ? <img src={away.flag} alt="" style={{width: 24}}/> : <Box sx={{width: 24, height: 16, bgcolor: '#333'}} />}
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 800, color: 'primary.main', textAlign: 'center' }}>
              Definir Ganadores Reales
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}  >
                <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>Premios Individuales</Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Máximo Goleador</InputLabel>
                  <Select value={officialAwards.top_scorer || ''} onChange={(e) => setOfficialAwards({...officialAwards, top_scorer: e.target.value})} label="Máximo Goleador">
                    {TOP_PLAYERS.map(p => <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Máximo Asistente</InputLabel>
                  <Select value={officialAwards.top_assist || ''} onChange={(e) => setOfficialAwards({...officialAwards, top_assist: e.target.value})} label="Máximo Asistente">
                    {TOP_PLAYERS.map(p => <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>MVP del Torneo</InputLabel>
                  <Select value={officialAwards.mvp || ''} onChange={(e) => setOfficialAwards({...officialAwards, mvp: e.target.value})} label="MVP del Torneo">
                    {TOP_PLAYERS.map(p => <MenuItem key={p.id} value={p.name}>{p.name} ({p.country})</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}  >
                <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>Podio del Torneo</Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Campeón (20 pts)</InputLabel>
                  <Select value={officialAwards.champion_team_id || ''} onChange={(e) => setOfficialAwards({...officialAwards, champion_team_id: e.target.value})} label="Campeón (20 pts)">
                    {allTeams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Subcampeón (10 pts)</InputLabel>
                  <Select value={officialAwards.runner_up_team_id || ''} onChange={(e) => setOfficialAwards({...officialAwards, runner_up_team_id: e.target.value})} label="Subcampeón (10 pts)">
                    {allTeams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Tercer Lugar (5 pts)</InputLabel>
                  <Select value={officialAwards.third_place_team_id || ''} onChange={(e) => setOfficialAwards({...officialAwards, third_place_team_id: e.target.value})} label="Tercer Lugar (5 pts)">
                    {allTeams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Button variant="contained" color="primary" fullWidth size="large" onClick={handleSaveOfficialAwards} sx={{ mt: 2, fontWeight: 800 }}>
              Guardar Clasificación
            </Button>
          </Paper>
        </Box>
      )}

      {/* Modal del Árbol del Torneo */}
      <Dialog open={isBracketOpen} onClose={() => setIsBracketOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Llaves del Mundial</Typography>
          <IconButton onClick={() => setIsBracketOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#000', p: 0 }}>
          <TournamentBracket matches={knockoutMatches} teams={allTeams} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
