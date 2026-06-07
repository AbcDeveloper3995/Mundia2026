import { Dialog, DialogTitle, DialogContent, Typography, Box, IconButton, Divider, Grid, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesModal = ({ open, onClose }: RulesModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#121212', borderRadius: 4, backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" fontWeight={800} color="primary">
          Reglas de Puntuación
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', p: 4 }}>
        
        <Grid container spacing={4}>
          {/* Fase de Grupos y Partidos */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SportsSoccerIcon color="secondary" />
                <Typography variant="h6" fontWeight={700}>Partidos</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puntos otorgados al finalizar cada partido basándose en tu predicción del resultado.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(0, 230, 118, 0.1)', borderRadius: 2, borderLeft: '3px solid #00e676' }}>
                  <Typography variant="body1" fontWeight={600}>Marcador Exacto</Typography>
                  <Typography variant="h6" fontWeight={800} color="#00e676">+5 pts</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2, borderLeft: '3px solid #2196f3' }}>
                  <Typography variant="body1" fontWeight={600}>Acertar Ganador / Empate</Typography>
                  <Typography variant="h6" fontWeight={800} color="#2196f3">+3 pts</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Eliminatorias */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <EmojiEventsIcon color="error" />
                <Typography variant="h6" fontWeight={700}>Eliminatorias</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puntos extra por acertar la conformación de los cruces a partir de Octavos de Final.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2, borderLeft: '3px solid #ff9800' }}>
                  <Typography variant="body1" fontWeight={600}>Enfrentamiento Exacto</Typography>
                  <Typography variant="h6" fontWeight={800} color="#ff9800">+5 pts</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(255, 235, 59, 0.1)', borderRadius: 2, borderLeft: '3px solid #ffeb3b' }}>
                  <Typography variant="body1" fontWeight={600}>Acertar Equipo Clasificado</Typography>
                  <Typography variant="h6" fontWeight={800} color="#ffeb3b">+2 pts c/u</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Premios de Torneo */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <StarIcon color="warning" />
                <Typography variant="h6" fontWeight={700}>Premios del Torneo</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puntos adicionales que se otorgarán al finalizar el torneo.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2, borderLeft: '3px solid #9c27b0' }}>
                    <Typography variant="body1" fontWeight={600}>Campeón del Mundo</Typography>
                    <Typography variant="h6" fontWeight={800} color="#9c27b0">+20 pts</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2, borderLeft: '3px solid #9c27b0' }}>
                    <Typography variant="body1" fontWeight={600}>Goleador / Asistidor / MVP</Typography>
                    <Typography variant="h6" fontWeight={800} color="#9c27b0">+10 pts c/u</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2, borderLeft: '3px solid #9c27b0' }}>
                    <Typography variant="body1" fontWeight={600}>Subcampeón</Typography>
                    <Typography variant="h6" fontWeight={800} color="#9c27b0">+10 pts</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2, borderLeft: '3px solid #9c27b0' }}>
                    <Typography variant="body1" fontWeight={600}>Tercer Lugar</Typography>
                    <Typography variant="h6" fontWeight={800} color="#9c27b0">+5 pts</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

      </DialogContent>
    </Dialog>
  );
};
