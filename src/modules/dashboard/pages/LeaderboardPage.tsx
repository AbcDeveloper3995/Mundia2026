import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { fetchLeaderboard, type LeaderboardEntry } from '@/modules/predictions/services/predictions.service';
import { motion } from 'framer-motion';

export const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress color="primary" /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
          Ranking Global
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          Compara tus puntos con los demás participantes del Mundial.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 80, textAlign: 'center' }}>Posición</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Participante (ID)</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', color: 'primary.main' }}>Puntos Totales</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    Aún no hay puntos registrados. ¡Empieza a predecir!
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry, idx) => (
                  <TableRow 
                    key={entry.userId}
                    sx={{ 
                      bgcolor: idx === 0 ? 'rgba(255, 215, 0, 0.1)' : idx === 1 ? 'rgba(192, 192, 192, 0.1)' : idx === 2 ? 'rgba(205, 127, 50, 0.1)' : 'transparent',
                      '&:last-child td, &:last-child th': { border: 0 } 
                    }}
                  >
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900, fontSize: idx < 3 ? '1.2rem' : '1rem', color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'inherit' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{entry.username}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>{entry.totalPoints}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>
    </Box>
  );
};
