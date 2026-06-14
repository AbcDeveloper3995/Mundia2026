import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { fetchAllMatches, fetchTeams, type Match, type Team } from '@/modules/admin/services/admin.service';
import { fetchUserPredictions, savePrediction, type Prediction } from '@/modules/predictions/services/predictions.service';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';

export const AdminPredictionsPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [adminId, setAdminId] = useState<string | null>(null);
  const [miriId, setMiriId] = useState<string | null>(null);
  
  const [adminPreds, setAdminPreds] = useState<Prediction[]>([]);
  const [miriPreds, setMiriPreds] = useState<Prediction[]>([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPred, setEditingPred] = useState<{
    userId: string;
    matchId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: string;
    awayScore: string;
    homeTeamId?: string;
    awayTeamId?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [matchesData, teamsData, { data: profiles }] = await Promise.all([
        fetchAllMatches(),
        fetchTeams(),
        supabase.from('profiles').select('id, username')
      ]);

      setMatches(matchesData.sort((a, b) => new Date(a.match_date || 0).getTime() - new Date(b.match_date || 0).getTime()));
      setTeams(teamsData);

      const aId = user?.id || null;
      const mId = profiles?.find(p => p.username === 'miri' || p.username === 'Miri')?.id || null;

      setAdminId(aId);
      setMiriId(mId);

      const [aPreds, mPreds] = await Promise.all([
        aId ? fetchUserPredictions(aId) : Promise.resolve([]),
        mId ? fetchUserPredictions(mId) : Promise.resolve([])
      ]);

      setAdminPreds(aPreds);
      setMiriPreds(mPreds);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (match: Match, userId: string, isMiri: boolean) => {
    const preds = isMiri ? miriPreds : adminPreds;
    const pred = preds.find(p => p.match_id === match.id);
    
    const hTeamId = pred?.predicted_home_team_id || match.home_team_id;
    const aTeamId = pred?.predicted_away_team_id || match.away_team_id;
    
    const hTeam = teams.find(t => t.id === hTeamId);
    const aTeam = teams.find(t => t.id === aTeamId);

    setEditingPred({
      userId,
      matchId: match.id,
      homeTeamName: hTeam?.name || 'TBD',
      awayTeamName: aTeam?.name || 'TBD',
      homeScore: pred?.predicted_home_score !== undefined && pred?.predicted_home_score !== -1 ? pred.predicted_home_score.toString() : '',
      awayScore: pred?.predicted_away_score !== undefined && pred?.predicted_away_score !== -1 ? pred.predicted_away_score.toString() : '',
      homeTeamId: hTeamId,
      awayTeamId: aTeamId
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPred) return;
    
    const hs = parseInt(editingPred.homeScore);
    const as = parseInt(editingPred.awayScore);
    
    if (isNaN(hs) || isNaN(as)) {
      alert("Debes ingresar números válidos para los goles.");
      return;
    }

    try {
      setSaving(true);
      await savePrediction(
        editingPred.userId, 
        editingPred.matchId, 
        hs, 
        as,
        editingPred.homeTeamId,
        editingPred.awayTeamId
      );
      
      // Reload predictions
      const newPreds = await fetchUserPredictions(editingPred.userId);
      if (editingPred.userId === miriId) {
        setMiriPreds(newPreds);
      } else {
        setAdminPreds(newPreds);
      }
      
      setEditModalOpen(false);
    } catch (e: any) {
      alert("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  const currentUserId = tabIndex === 0 ? adminId : miriId;
  const currentPreds = tabIndex === 0 ? adminPreds : miriPreds;
  const isMiriTab = tabIndex === 1;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, sm: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'error.main', fontWeight: 900, textTransform: 'uppercase' }}>
          Editor de Predicciones
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          Modifica silenciosamente tus marcadores o los de Miri.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ mb: 4, bgcolor: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, p: 2, gap: 2 }}>
          <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)} textColor="primary" indicatorColor="primary">
            <Tab label="Mis Predicciones (Admin)" sx={{ fontWeight: 800 }} />
            <Tab label="Predicciones de Miri" sx={{ fontWeight: 800 }} disabled={!miriId} />
          </Tabs>
          <TextField 
            placeholder="Buscar por equipo o fase..." 
            variant="outlined" 
            size="small" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: 300 } }}
          />
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.5)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Fase</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Partido</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textAlign: 'center' }}>Predicción Actual</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.filter(match => {
              if (!searchQuery) return true;
              const pred = currentPreds.find(p => p.match_id === match.id);
              const hTeam = teams.find(t => t.id === (pred?.predicted_home_team_id || match.home_team_id));
              const aTeam = teams.find(t => t.id === (pred?.predicted_away_team_id || match.away_team_id));
              const searchStr = `${hTeam?.name || ''} ${aTeam?.name || ''} ${match.stage}`.toLowerCase();
              return searchStr.includes(searchQuery.toLowerCase());
            }).map(match => {
              const pred = currentPreds.find(p => p.match_id === match.id);
              const hTeamId = pred?.predicted_home_team_id || match.home_team_id;
              const aTeamId = pred?.predicted_away_team_id || match.away_team_id;
              const hTeam = teams.find(t => t.id === hTeamId);
              const aTeam = teams.find(t => t.id === aTeamId);

              const hasPred = pred && pred.predicted_home_score !== -1 && pred.predicted_away_score !== -1;

              return (
                <TableRow key={match.id} sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
                  <TableCell sx={{ color: 'text.secondary' }}>{match.stage === 'GROUP' ? `Grupo ${match.group_id}` : match.stage}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {hTeam?.name || 'TBD'} <span style={{ color: '#666', margin: '0 8px' }}>vs</span> {aTeam?.name || 'TBD'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {hasPred ? (
                      <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                        {pred.predicted_home_score} - {pred.predicted_away_score}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>Sin predicción</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => currentUserId && handleEditClick(match, currentUserId, isMiriTab)}
                      disabled={!currentUserId}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editModalOpen} onClose={() => !saving && setEditModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900, color: 'error.main' }}>Editar Predicción</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editingPred && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>{editingPred.homeTeamName}</Typography>
                <TextField 
                  type="number" 
                  value={editingPred.homeScore} 
                  onChange={e => setEditingPred({...editingPred, homeScore: e.target.value})}
                  inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 900, fontSize: '1.5rem' } }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.secondary' }}>-</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>{editingPred.awayTeamName}</Typography>
                <TextField 
                  type="number" 
                  value={editingPred.awayScore} 
                  onChange={e => setEditingPred({...editingPred, awayScore: e.target.value})}
                  inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 900, fontSize: '1.5rem' } }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditModalOpen(false)} disabled={saving} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !editingPred?.homeScore || !editingPred?.awayScore} variant="contained" color="error" sx={{ fontWeight: 800 }}>
            {saving ? 'Guardando...' : 'Guardar Marcador'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
