import { Box, Typography, Paper } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarIcon from '@mui/icons-material/Star';

interface RivalryWidgetProps {
  stats: any;
  myUsername: string;
}

export const RivalryWidget = ({ stats, myUsername }: RivalryWidgetProps) => {
  if (!stats.rivalry) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h6" color="text.secondary">Aún no hay estadísticas de competencia.</Typography>
      </Paper>
    );
  }

  const { leader, ahead, behind } = stats.rivalry;

  return (
    <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.1)', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        Distancias Directas <EmojiEventsIcon color="primary" />
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* LÍDER */}
        {leader && (
          <Box sx={{ p: 2, bgcolor: 'rgba(255, 193, 7, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <StarIcon sx={{ color: '#ffc107' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffc107' }}>
                Con respecto al Líder ({leader.username})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estás a {leader.distance} puntos de alcanzarlo.
              </Typography>
            </Box>
          </Box>
        )}

        {/* DELANTE DE MÍ */}
        {ahead && (
          <Box sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon sx={{ color: '#f44336' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#f44336' }}>
                Quien tienes por delante ({ahead.username})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estás a {ahead.distance} puntos de superarlo.
              </Typography>
            </Box>
          </Box>
        )}

        {/* DETRÁS DE MÍ */}
        {behind && (
          <Box sx={{ p: 2, bgcolor: 'rgba(0, 230, 118, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingDownIcon sx={{ color: '#00e676' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#00e676' }}>
                Quien te persigue ({behind.username})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Está a {behind.distance} puntos de empatarte.
              </Typography>
            </Box>
          </Box>
        )}

        {!leader && !ahead && !behind && (
          <Typography variant="body2" color="text.secondary">
            Eres el único participante con puntos, ¡sigue así!
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
