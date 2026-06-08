import { Box, Typography, Paper, Grid, Avatar } from '@mui/material';
import { motion } from 'framer-motion';

interface GlobalWidgetsProps {
  stats: any;
}

export const GlobalWidgets = ({ stats }: GlobalWidgetsProps) => {
  return (
    <Box sx={{ height: '100%' }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        
        {/* Podio */}
        <Grid size={{ xs: 12, md: 6 }}  >
          <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,215,0,0.3)', height: '100%' }}>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
              🥇 Podio Actual
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.podium.map((p: any, idx: number) => {
                const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <Box key={p.userId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h5">{medals[idx]}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800 }} color="text.primary">{p.username}</Typography>
                    </Box>
                    <Typography variant="h6"  sx={{ fontWeight: 900,  color: colors[idx] }}>
                      {p.totalPoints}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Partidos Extremos */}
        <Grid size={{ xs: 12, md: 6 }}  >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(244, 67, 54, 0.3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ color: '#f44336', fontWeight: 800, mb: 2 }}>
                ⚽ Partido Más Difícil
              </Typography>
              {stats.hardestMatch ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stats.hardestMatch.homeFlag && <img src={stats.hardestMatch.homeFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.hardestMatch.homeName}</Typography>
                    </Box>
                    <Typography variant="h5" color="text.primary"  sx={{ fontWeight: 900,  lineHeight: 1 }}>
                      {stats.hardestMatch.homeScore} - {stats.hardestMatch.awayScore}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.hardestMatch.awayName}</Typography>
                      {stats.hardestMatch.awayFlag && <img src={stats.hardestMatch.awayFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 800 }}>Solo {stats.hardestMatch.hits} aciertos</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay partidos finalizados con predicciones.</Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(0, 230, 118, 0.3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ color: '#00e676', fontWeight: 800, mb: 2 }}>
                🎉 Partido Más Fácil
              </Typography>
              {stats.easiestMatch ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stats.easiestMatch.homeFlag && <img src={stats.easiestMatch.homeFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.easiestMatch.homeName}</Typography>
                    </Box>
                    <Typography variant="h5" color="text.primary"  sx={{ fontWeight: 900,  lineHeight: 1 }}>
                      {stats.easiestMatch.homeScore} - {stats.easiestMatch.awayScore}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 800 }}>{stats.easiestMatch.awayName}</Typography>
                      {stats.easiestMatch.awayFlag && <img src={stats.easiestMatch.awayFlag} style={{ width: 24, height: 16, borderRadius: 2 }} alt="" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>{stats.easiestMatch.hits} aciertos totales</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay partidos finalizados.</Typography>
              )}
            </Paper>

          </Box>
        </Grid>

      </Grid>
    </Box>
  );
};
