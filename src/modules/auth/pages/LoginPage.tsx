import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/services/supabase';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${data.username}@porra2026.local`,
      password: data.password,
    });

    if (authError) {
      setError('Credenciales inválidas. Intenta nuevamente.');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1" sx={{ color: 'primary.main', mb: 1 }}>
          PORRA 2026
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Ingresa para ver los resultados y tus predicciones
        </Typography>
      </Box>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        </motion.div>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          fullWidth
          label="Usuario"
          variant="outlined"
          margin="normal"
          {...register('username')}
          error={!!errors.username}
          helperText={errors.username?.message}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="Contraseña"
          type="password"
          variant="outlined"
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ mb: 4 }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting}
          sx={{ mb: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Entrar a la Porra'}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: '#1DB954', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate aquí
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};
