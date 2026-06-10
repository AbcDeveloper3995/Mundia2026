import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';

// Iconos para cada premio
const trophyConfig = {
  nostradamus: { title: '🔮 El Tiza', desc: 'Más marcadores exactos', color: '#9c27b0' },
  suertudo: { title: '🎲 El Tanke', desc: 'Más resultados acertados', color: '#ff9800' },
  mufa: { title: '💀 El Merma', desc: 'Peor porcentaje de aciertos', color: '#f44336' },
  casiCasi: { title: '😭 El Casi casi', desc: 'A un gol de acertar exacto', color: '#ffeb3b' },
  reyEliminatorias: { title: '👑 El Durakito', desc: 'Más puntos en cruces', color: '#ffd700' },
  visionario: { title: '🧠 Visionario', desc: 'Acertó MVP/Campeón', color: '#2196f3' },
  premiumRecharge: { title: '💰 Con más búsqueda', desc: 'Más +50 MessiCoins', color: '#ffb300' },
  menudito: { title: '🪙 Con un menudito', desc: 'Más +20 MessiCoins', color: '#00e676' },
  loss: { title: '💸 Con más pérdida', desc: 'Más -10 MessiCoins', color: '#ef5350' },
  elVeneno: { title: '🥶 El Veneno', desc: 'Peor racha sin puntos', color: '#00e5ff' },
};

interface FunStatsProps {
  stats: any; // DashboardStats
}

export const FunStats = ({ stats }: FunStatsProps) => {
  const cards = [
    { key: 'nostradamus', data: stats.nostradamus, value: stats.nostradamus ? `${stats.nostradamus.count} exactos` : 'Nadie aún' },
    { key: 'suertudo', data: stats.suertudo, value: stats.suertudo ? `${stats.suertudo.count} aciertos` : 'Nadie aún' },
    { key: 'mufa', data: stats.mufa, value: stats.mufa ? `${stats.mufa.percentage}% efectividad` : 'Nadie aún' },
    { key: 'casiCasi', data: stats.casiCasi, value: stats.casiCasi ? `${stats.casiCasi.count} veces` : 'Nadie aún' },
    { key: 'reyEliminatorias', data: stats.reyEliminatorias, value: stats.reyEliminatorias ? `${stats.reyEliminatorias.points} pts` : 'Nadie aún' },
    { key: 'visionario', data: stats.visionario, value: stats.visionario ? `${stats.visionario.points} pts extra` : 'Nadie aún' },
    { key: 'premiumRecharge', data: stats.premiumRecharge, value: stats.premiumRecharge ? `${stats.premiumRecharge.count} veces` : 'Nadie aún' },
    { key: 'menudito', data: stats.menudito, value: stats.menudito ? `${stats.menudito.count} veces` : 'Nadie aún' },
    { key: 'loss', data: stats.loss, value: stats.loss ? `${stats.loss.count} veces` : 'Nadie aún' },
    { key: 'elVeneno', data: stats.elVeneno, value: stats.elVeneno ? `${stats.elVeneno.count} partidos` : 'Nadie aún' },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
        Salón de la Fama
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card, idx) => {
          const config = trophyConfig[card.key as keyof typeof trophyConfig];
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}    key={card.key}>
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: config.color }}>
                    {config.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {config.desc}
                  </Typography>
                  
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }} color="text.primary">
                      {card.data ? card.data.username : '---'}
                    </Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>
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
