import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface RivalryWidgetProps {
  stats: any;
  myUsername: string;
}

export const RivalryWidget = ({ stats, myUsername }: RivalryWidgetProps) => {
  if (!stats.rival) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h6" color="text.secondary">Aún no tienes un rival cercano.</Typography>
      </Paper>
    );
  }

  const { username, points, distance, ahead } = stats.rival;
  const myPoints = stats.totalPoints;
  const maxPoints = Math.max(myPoints, points) + 10;
  const myPercent = (myPoints / maxPoints) * 100;
  const rivalPercent = (points / maxPoints) * 100;

  return (
    <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        Rivalidad Directa <EmojiEventsIcon color="primary" />
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={800} color={ahead ? "text.primary" : "primary.main"}>
              Tú
            </Typography>
            <Typography variant="subtitle1" fontWeight={800} color="text.secondary">
              {myPoints} pts
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={myPercent} 
            sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: ahead ? 'rgba(255,255,255,0.3)' : 'primary.main' } }} 
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={800} color={ahead ? "primary.main" : "text.primary"}>
              {username}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800} color="text.secondary">
              {points} pts
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={rivalPercent} 
            sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: ahead ? 'primary.main' : 'rgba(255,255,255,0.3)' } }} 
          />
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: ahead ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0, 230, 118, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUpIcon sx={{ color: ahead ? '#f44336' : '#00e676', transform: ahead ? 'scaleY(-1)' : 'none' }} />
          <Box>
            <Typography variant="body2" fontWeight={800} color={ahead ? "#f44336" : "#00e676"}>
              {ahead ? "A quién persigues" : "Quién te persigue"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ahead ? `Te faltan ${distance} puntos para alcanzar a ${username}` : `${username} está a ${distance} puntos de superarte`}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
