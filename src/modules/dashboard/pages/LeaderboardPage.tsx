import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { fetchLeaderboard, type LeaderboardEntry } from '@/modules/predictions/services/predictions.service';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

export const LeaderboardPage = () => {
  const { user } = useAuthStore();
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
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden', 
            bgcolor: 'rgba(20, 20, 20, 0.6)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.4)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 100, textAlign: 'center', py: 3, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Pos</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 3, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Participante</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', py: 3, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Puntos</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', py: 3, color: '#ffc107', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <MonetizationOnIcon sx={{ fontSize: 16 }} /> Saldo en MC
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    Aún no hay puntos registrados. ¡Empieza a predecir!
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  
                  return (
                    <TableRow 
                      key={entry.userId}
                      sx={{ 
                        bgcolor: isMe ? 'rgba(0, 230, 118, 0.08)' : idx === 0 ? 'rgba(255, 215, 0, 0.05)' : idx === 1 ? 'rgba(192, 192, 192, 0.05)' : idx === 2 ? 'rgba(205, 127, 50, 0.05)' : 'transparent',
                        borderLeft: isMe ? '4px solid #00E676' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isMe ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.03)',
                        },
                        '& td': { borderBottom: '1px solid rgba(255,255,255,0.03)', py: 2.5 } 
                      }}
                    >
                      <TableCell sx={{ textAlign: 'center', fontWeight: 900, fontSize: idx < 3 ? '1.3rem' : '1.1rem', color: idx === 0 ? '#ffd700' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : 'text.secondary' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: isMe ? 800 : 600, color: isMe ? '#00E676' : 'text.primary', fontSize: '1.1rem' }}>
                        {isMe ? `${user?.user_metadata?.username} (Tú)` : entry.username}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 900, fontSize: '1.2rem', color: 'primary.main' }}>
                        {entry.totalPoints} <Typography component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>pts</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 900, fontSize: '1.2rem', color: '#ffc107' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {entry.coins} <MonetizationOnIcon sx={{ fontSize: 18 }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>
    </Box>
  );
};
