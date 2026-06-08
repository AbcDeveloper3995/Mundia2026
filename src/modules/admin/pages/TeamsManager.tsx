import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Alert, IconButton, Avatar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchTeams, deleteTeam, type Team } from '@/modules/admin/services/admin.service';
import { motion } from 'framer-motion';

export const TeamsManager = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await fetchTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este equipo?')) return;
    try {
      await deleteTeam(id);
      await loadTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <CircularProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800 }}>
          Gestionar Equipos
        </Typography>
        <Button variant="contained" color="secondary">
          + Nuevo Equipo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {teams.length === 0 && (
          <Typography variant="body1" sx={{ color: 'text.secondary', p: 3 }}>
            No hay equipos en la base de datos.
          </Typography>
        )}
        
        {teams.map((team, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}    key={team.id}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (idx % 10) * 0.05 }}>
              <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={team.flag || undefined} variant="rounded" sx={{ width: 40, height: 30 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{team.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'secondary.main' }}>
                      Grupo {team.group?.name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton color="error" onClick={() => handleDelete(team.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
