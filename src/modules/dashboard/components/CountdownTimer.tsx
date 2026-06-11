import { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface Props {
  targetDate: number;
  onExpire: () => void;
}

export const CountdownTimer = ({ targetDate, onExpire }: Props) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate - Date.now();
      if (difference <= 0) {
        return '00:00:00';
      }

      const h = Math.floor((difference / (1000 * 60 * 60)));
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      if (newTime === '00:00:00') {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  // Si no hay tiempo o ya expiró por completo al primer render, no mostramos nada y dejamos que onExpire actúe
  if (timeLeft === '00:00:00') return null;

  return (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 0.5, 
      px: 1.5, 
      py: 0.5, 
      bgcolor: 'rgba(255, 152, 0, 0.1)', 
      border: '1px solid rgba(255, 152, 0, 0.3)', 
      borderRadius: 2,
      boxShadow: '0 0 10px rgba(255, 152, 0, 0.1)'
    }}>
      <HourglassEmptyIcon sx={{ 
        fontSize: 16, 
        color: 'warning.main', 
        animation: 'spin 4s linear infinite', 
        '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } 
      }} />
      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1 }}>
        Expira en: {timeLeft}
      </Typography>
    </Box>
  );
};
