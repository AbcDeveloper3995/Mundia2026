import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';

// Iconos para cada premio
const trophyConfig = {
  nostradamus: { title: '🔮 El Tiza', desc: 'Más marcadores exactos', color: '#9c27b0' },
  suertudo: { title: '🎲 El Prospecto', desc: 'Más puntos sin marcadores exactos', color: '#ff9800' },
  mufa: { title: '💀 El Merma', desc: 'Peor porcentaje de aciertos', color: '#f44336' },
  casiCasi: { title: '😭 Casi Casi', desc: 'A un gol de acertar exacto', color: '#ffeb3b' },
  francotirador: { title: '🎯 Durakito', desc: 'Mejor porcentaje de exactos', color: '#00e676' },
  rachaActual: { title: '🔥 Racha Actual', desc: 'Aciertos seguidos', color: '#ff5722' },
  reyEliminatorias: { title: '👑 Anda Pro', desc: 'Más puntos en cruces', color: '#ffd700' },
  visionario: { title: '🧠 Visionario', desc: 'Acertó MVP/Campeón', color: '#2196f3' },
};

interface FunStatsProps {
  stats: any; // DashboardStats
}

export const FunStats = ({ stats }: FunStatsProps) => {
  const cards = [
    { key: 'nostradamus', data: stats.nostradamus, value: stats.nostradamus ? `${stats.nostradamus.count} exactos` : 'Nadie aún' },
    { key: 'suertudo', data: stats.suertudo, value: stats.suertudo ? `${stats.suertudo.points} pts` : 'Nadie aún' },
    { key: 'mufa', data: stats.mufa, value: stats.mufa ? `${stats.mufa.percentage}% efectividad` : 'Nadie aún' },
    { key: 'casiCasi', data: stats.casiCasi, value: stats.casiCasi ? `${stats.casiCasi.count} veces` : 'Nadie aún' },
    { key: 'francotirador', data: stats.francotirador, value: stats.francotirador ? `${stats.francotirador.percentage}% exactos` : 'Nadie aún' },
    { key: 'rachaActual', data: stats.rachaActual > 0 ? { username: 'Tú' } : null, value: `${stats.rachaActual} seguidos` },
    { key: 'reyEliminatorias', data: stats.reyEliminatorias, value: stats.reyEliminatorias ? `${stats.reyEliminatorias.points} pts` : 'Nadie aún' },
    { key: 'visionario', data: stats.visionario, value: stats.visionario ? `${stats.visionario.points} pts extra` : 'Nadie aún' },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
        Salón de la Fama (y la Infamia)
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card, idx) => {
          const config = trophyConfig[card.key as keyof typeof trophyConfig];
          return (
            <Grid item xs={12} sm={6} md={3} key={card.key}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: 'rgba(20,20,20,0.6)', 
                  border: `1px solid ${config.color}33`,
                  borderLeft: `4px solid ${config.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <Typography variant="subtitle1" fontWeight={800} color={config.color}>
                    {config.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {config.desc}
                  </Typography>
                  
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight={700} color="text.primary">
                      {card.data ? card.data.username : '---'}
                    </Typography>
                    <Typography variant="body2" color="primary.main" fontWeight={800}>
                      {card.value}
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
