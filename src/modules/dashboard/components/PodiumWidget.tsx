import { Box, Typography, Paper } from '@mui/material';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface PodiumWidgetProps {
  stats: any;
}

export const PodiumWidget = ({ stats }: PodiumWidgetProps) => {
  useEffect(() => {
    let intervalId: any;

    if (stats?.podium && stats.podium.length > 0) {
      const canvas = document.getElementById('podium-confetti-canvas') as HTMLCanvasElement;
      if (canvas) {
        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: true
        });
        
        // Lanzar ráfagas pequeñas continuamente
        intervalId = setInterval(() => {
          myConfetti({
            particleCount: 15,
            spread: 80,
            origin: { y: 0.9, x: Math.random() * 0.8 + 0.1 }, // Aleatorio a lo ancho de la barra
            colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FFF8DC'],
            disableForReducedMotion: true,
            startVelocity: 15,
            gravity: 0.4,
            ticks: 200,
            scalar: 0.7
          });
        }, 600); // Cada 600 milisegundos
      }
    }

    // Limpieza al desmontar
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [stats?.podium]);

  return (
    <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,215,0,0.3)', height: '100%' }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 3 }}>
        🥇 Podio Actual
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {stats.podium.map((p: any, idx: number) => {
          const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          const medals = ['🥇', '🥈', '🥉'];
          
          const isFirst = idx === 0;

          return (
            <motion.div
              key={p.userId}
              animate={isFirst ? {
                scale: [1, 1.02, 1],
                boxShadow: ['0px 0px 0px rgba(255,215,0,0)', '0px 0px 20px rgba(255,215,0,0.4)', '0px 0px 0px rgba(255,215,0,0)']
              } : {}}
              transition={isFirst ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            >
              <Box sx={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, 
                bgcolor: isFirst ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)', 
                border: isFirst ? '1px solid rgba(255, 215, 0, 0.5)' : 'none',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isFirst && (
                  <canvas id="podium-confetti-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                  <Typography variant="h5">{medals[idx]}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800 }} color="text.primary">
                    {p.username}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: colors[idx], position: 'relative', zIndex: 1 }}>
                  {p.totalPoints}
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Box>
    </Paper>
  );
};
