import { Box, Typography, Paper } from '@mui/material';

interface PodiumWidgetProps {
  stats: any;
}

export const PodiumWidget = ({ stats }: PodiumWidgetProps) => {
  return (
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
  );
};
