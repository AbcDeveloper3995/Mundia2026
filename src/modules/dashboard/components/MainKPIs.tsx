import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { RivalryWidget } from './RivalryWidget';

interface MainKPIsProps {
  stats: any; // DashboardStats
  myUsername?: string;
  updateMyCoins: (amount: number) => void;
  canSeeRivalry?: boolean;
}

export const MainKPIs = ({ stats, myUsername, updateMyCoins, canSeeRivalry = true }: MainKPIsProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
        Tus Estadísticas
      </Typography>
      <Grid container spacing={3}>
        {/* ROW 1: Estadísticas Personales */}
        <Grid size={{ xs: 12, sm: 4 }}  >
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,215,0,0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <EmojiEventsIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(255,215,0,0.1)' }} />
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase',  fontWeight: 800 }} >Ranking General</Typography>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 900, my: 1 }}>
                #{stats.position}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Puntos: <strong>{stats.totalPoints}</strong>
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {stats.distanceToLeader !== null && stats.distanceToLeader > 0 ? (
                  <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                    A <strong>{stats.distanceToLeader}</strong> pts del líder
                  </Typography>
                ) : (
                  <Typography variant="caption"  color="primary.main" sx={{ display: 'block',  fontWeight: 800 }}>
                    ¡Eres el líder actual!
                  </Typography>
                )}
                {stats.distanceToNext !== null && stats.distanceToNext > 0 && (
                  <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                    A <strong>{stats.distanceToNext}</strong> pts del puesto #{stats.position - 1}
                  </Typography>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}  >
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(33, 150, 243, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <TrackChangesIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(33, 150, 243, 0.05)' }} />
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase',  fontWeight: 800 }} >Resultados Exactos</Typography>
              <Typography variant="h3" sx={{ color: '#2196f3', fontWeight: 900, my: 1 }}>
                {stats.exactMatches}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                marcadores perfectos
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                  Valen 5 puntos cada uno
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}  >
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(156, 39, 176, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <CheckCircleIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(156, 39, 176, 0.05)' }} />
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase',  fontWeight: 800 }} >Ganadores</Typography>
              <Typography variant="h3" sx={{ color: '#9c27b0', fontWeight: 900, my: 1 }}>
                {stats.correctWinners}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                partidos acertados
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                  Incluye resultados exactos
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* ROW 2: Rivalidad */}
        {canSeeRivalry && (
          <Grid size={{ xs: 12, md: 6, lg: 4 }}  >
            <motion.div whileHover={{ y: -5 }} style={{ height: '100%' }}>
              <RivalryWidget stats={stats} myUsername={myUsername || 'Tú'} updateMyCoins={updateMyCoins} />
            </motion.div>
          </Grid>
        )}

      </Grid>
    </Box>
  );
};
