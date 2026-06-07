import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import StarIcon from '@mui/icons-material/Star';

interface MainKPIsProps {
  stats: any; // DashboardStats
}

export const MainKPIs = ({ stats }: MainKPIsProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
        Tus Estadísticas
      </Typography>
      <Grid container spacing={3}>
        {/* ROW 1: Estadísticas Personales */}
        <Grid item xs={12} sm={4}>
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,215,0,0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <EmojiEventsIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(255,215,0,0.1)' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={800} textTransform="uppercase">Ranking General</Typography>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 900, my: 1 }}>
                #{stats.position}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Puntos: <strong>{stats.totalPoints}</strong>
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {stats.distanceToLeader !== null && stats.distanceToLeader > 0 ? (
                  <Typography variant="caption" display="block" color="text.secondary">
                    A <strong>{stats.distanceToLeader}</strong> pts del líder
                  </Typography>
                ) : (
                  <Typography variant="caption" display="block" color="primary.main" fontWeight={800}>
                    ¡Eres el líder actual!
                  </Typography>
                )}
                {stats.distanceToNext !== null && stats.distanceToNext > 0 && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    A <strong>{stats.distanceToNext}</strong> pts del puesto #{stats.position - 1}
                  </Typography>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={4}>
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(33, 150, 243, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <TrackChangesIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(33, 150, 243, 0.05)' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={800} textTransform="uppercase">Resultados Exactos</Typography>
              <Typography variant="h3" sx={{ color: '#2196f3', fontWeight: 900, my: 1 }}>
                {stats.exactMatches}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                marcadores perfectos
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  Valen 5 puntos cada uno
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={4}>
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(156, 39, 176, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <CheckCircleIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(156, 39, 176, 0.05)' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={800} textTransform="uppercase">Ganadores</Typography>
              <Typography variant="h3" sx={{ color: '#9c27b0', fontWeight: 900, my: 1 }}>
                {stats.correctWinners}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                partidos acertados
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  Incluye resultados exactos
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* ROW 2: Tendencias Globales */}
        <Grid item xs={12} sm={6}>
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0, 230, 118, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <PublicIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(0, 230, 118, 0.05)' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={800} textTransform="uppercase">Favoritos al Título</Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {stats.topChampions && stats.topChampions.length > 0 ? stats.topChampions.map((c: any, i: number) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="text.secondary" fontWeight={900}>#{i + 1}</Typography>
                      {c.flag && <img src={c.flag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                      <Typography variant="body1" fontWeight={800} color={i === 0 ? '#00e676' : 'text.primary'}>{c.teamName}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{c.count} votos</Typography>
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">Aún no hay predicciones de campeón.</Typography>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6}>
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 152, 0, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <StarIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(255, 152, 0, 0.05)' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={800} textTransform="uppercase">Jugadores Más Votados</Typography>
              
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={800}>MVP del Mundial</Typography>
                  {stats.topMvp ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.5 }}>
                      <Typography variant="h5" color="#ff9800" fontWeight={900}>{stats.topMvp.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{stats.topMvp.count} votos</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aún no hay votos para MVP.</Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={800}>Máximo Goleador</Typography>
                  {stats.topScorer ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.5 }}>
                      <Typography variant="h5" color="text.primary" fontWeight={900}>{stats.topScorer.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{stats.topScorer.count} votos</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aún no hay votos para Goleador.</Typography>
                  )}
                </Box>
              </Box>

            </Paper>
          </motion.div>
        </Grid>

      </Grid>
    </Box>
  );
};
