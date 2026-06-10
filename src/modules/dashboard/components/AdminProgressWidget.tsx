import { Box, Typography, Paper, Grid, Chip, LinearProgress } from '@mui/material';
import type { DashboardStats } from '../services/stats.service';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import { motion } from 'framer-motion';

interface Props {
  stats: DashboardStats;
}

export const AdminProgressWidget = ({ stats }: Props) => {
  const { adminProgress } = stats;

  if (!adminProgress) return null;

  const { totalSystemUsers, systemUsernames, completedCount, pendingUsers, completedUsers } = adminProgress;
  const progressPercentage = totalSystemUsers > 0 ? (completedCount / totalSystemUsers) * 100 : 0;

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, color: 'error.main', display: 'flex', alignItems: 'center', gap: 2 }}>
        <GroupIcon fontSize="large" /> Monitor de Quinielas (Solo Admin)
      </Typography>

      <Grid container spacing={4}>
        {/* KPI Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(211, 47, 47, 0.05)', border: '1px solid rgba(211, 47, 47, 0.3)', height: '100%' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Progreso General
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 900, color: 'error.main' }}>
                {completedCount}
              </Typography>
              <Typography variant="h5" color="text.secondary">
                / {totalSystemUsers}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Quinielas 100% completadas (partidos + premios)
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              color="error" 
              sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.1)' }} 
            />
          </Paper>
        </Grid>

        {/* Faltantes */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(30,30,30,0.6)', border: '1px solid rgba(255, 152, 0, 0.3)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <WarningAmberIcon /> Faltan por Completar ({pendingUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', maxHeight: 200, pr: 1,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }
            }}>
              {pendingUsers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Todos han completado.</Typography>
              ) : (
                pendingUsers.map(user => (
                  <Box key={user.username} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.username}</Typography>
                    <Chip label={`Faltan: ${user.missing}`} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Completados */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(30,30,30,0.6)', border: '1px solid rgba(76, 175, 80, 0.3)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CheckCircleIcon /> Ya Completaron ({completedUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, overflowY: 'auto', maxHeight: 200, pr: 1, alignContent: 'flex-start',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }
            }}>
              {completedUsers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nadie ha completado aún.</Typography>
              ) : (
                completedUsers.map(username => (
                  <Chip key={username} label={username} size="small" color="success" sx={{ fontWeight: 600 }} />
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Total Usuarios Registrados */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(30,30,30,0.6)', border: '1px solid rgba(33, 150, 243, 0.3)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ color: 'info.main', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PersonIcon /> Registrados ({totalSystemUsers})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, overflowY: 'auto', maxHeight: 200, pr: 1, alignContent: 'flex-start',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }
            }}>
              {systemUsernames.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No hay usuarios.</Typography>
              ) : (
                systemUsernames.map(username => (
                  <Chip key={username} label={username} size="small" color="info" variant="outlined" sx={{ fontWeight: 600 }} />
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
