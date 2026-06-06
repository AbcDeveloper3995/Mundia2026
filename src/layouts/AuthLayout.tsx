import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, #1DB954 0%, #0A0A0A 40%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
          opacity: 0.1,
          zIndex: 0,
        }}
      />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Box
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              backgroundColor: 'rgba(20, 20, 20, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Outlet />
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};
