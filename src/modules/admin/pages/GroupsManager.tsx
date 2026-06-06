import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { fetchGroups, updateGroup, type Group } from '@/modules/admin/services/admin.service';
import { motion } from 'framer-motion';

export const GroupsManager = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await fetchGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, newHead: string) => {
    try {
      setSavingId(id);
      await updateGroup(id, { head: newHead });
      await loadGroups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <CircularProgress color="primary" />;

  return (
    <Box>
      <Typography variant="h3" sx={{ color: 'primary.main', mb: 4, fontWeight: 800 }}>
        Gestionar Grupos
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {groups.map((group, idx) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="h5" sx={{ color: 'secondary.main', mb: 2 }}>
                  Grupo {group.name}
                </Typography>
                <TextField
                  fullWidth
                  label="Cabeza de Serie"
                  defaultValue={group.head}
                  size="small"
                  sx={{ mb: 2 }}
                  onBlur={(e) => {
                    if (e.target.value !== group.head) {
                      handleUpdate(group.id, e.target.value);
                    }
                  }}
                />
                {savingId === group.id && <Typography variant="caption" color="primary">Guardando...</Typography>}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Equipos del Grupo
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    {group.teams?.map(team => (
                      <Box key={team.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                        {team.flag && <img src={team.flag} alt={team.name} style={{ width: 24, height: 16, borderRadius: 2 }} />}
                        <Typography variant="body2">{team.name}</Typography>
                      </Box>
                    ))}
                    {(!group.teams || group.teams.length === 0) && (
                      <Typography variant="body2" color="text.secondary">Sin equipos asignados</Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
