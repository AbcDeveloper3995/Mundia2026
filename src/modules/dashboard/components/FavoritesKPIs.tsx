import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import PublicIcon from '@mui/icons-material/Public';
import StarIcon from '@mui/icons-material/Star';

interface FavoritesKPIsProps {
  stats: any; // DashboardStats
}

export const FavoritesKPIs = ({ stats }: FavoritesKPIsProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
        Los favoritos de ustedes
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}  >
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0, 230, 118, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <PublicIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(0, 230, 118, 0.05)' }} />
              <Typography variant="body2" sx={{ color: '#00e676', textTransform: 'uppercase',  fontWeight: 800 }} >Favoritos al Título</Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {stats.topChampions && stats.topChampions.length > 0 ? stats.topChampions.map((c: any, i: number) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 900 }}>#{i + 1}</Typography>
                      {c.flag && <img src={c.flag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                      <Typography variant="body1" sx={{ fontWeight: 800 }} color={i === 0 ? '#00e676' : 'text.primary'}>{c.teamName}</Typography>
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

        <Grid size={{ xs: 12, sm: 6 }}  >
          <motion.div whileHover={{ y: -5 }}>
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 152, 0, 0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}>
              <StarIcon sx={{ position: 'absolute', right: -10, top: -10, fontSize: 100, color: 'rgba(255, 152, 0, 0.05)' }} />
              <Typography variant="body2" sx={{ color: '#ff9800', textTransform: 'uppercase',  fontWeight: 800 }} >Jugadores Más Votados</Typography>
              
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#ff9800', textTransform: 'uppercase',  fontWeight: 800 }}>MVP del Mundial</Typography>
                  {stats.mvpVotes && stats.mvpVotes.length > 0 ? (
                    stats.mvpVotes.map((v: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.5 }}>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 800 }}>{v.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{v.count} {v.count === 1 ? 'voto' : 'votos'}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aún no hay votos para MVP.</Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="caption" sx={{ color: '#ff9800', textTransform: 'uppercase',  fontWeight: 800 }}>Máximo Goleador</Typography>
                  {stats.scorerVotes && stats.scorerVotes.length > 0 ? (
                    stats.scorerVotes.map((v: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.5 }}>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 800 }}>{v.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{v.count} {v.count === 1 ? 'voto' : 'votos'}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aún no hay votos para Goleador.</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#ff9800', textTransform: 'uppercase',  fontWeight: 800 }}>Máximo Asistente</Typography>
                  {stats.assistVotes && stats.assistVotes.length > 0 ? (
                    stats.assistVotes.map((v: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.5 }}>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 800 }}>{v.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{v.count} {v.count === 1 ? 'voto' : 'votos'}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aún no hay votos para Asistente.</Typography>
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
