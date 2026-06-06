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

const registerSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    const { error: authError } = await supabase.auth.signUp({
      email: `${data.username}@porra2026.local`,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1" sx={{ color: 'secondary.main', mb: 1 }}>
          ÚNETE
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Crea tu cuenta de Participante y empieza a jugar
        </Typography>
      </Box>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        </motion.div>
      )}

      {success && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Cuenta creada exitosamente. Redirigiendo...
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
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Confirmar contraseña"
          type="password"
          variant="outlined"
          margin="normal"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          sx={{ mb: 4 }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="secondary"
          size="large"
          disabled={isSubmitting || success}
          sx={{ mb: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#FFB800', textDecoration: 'none', fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};
