import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface ArenaRulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const ArenaRulesModal = ({ open, onClose }: ArenaRulesModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { bgcolor: '#121212', border: '1px solid #ff9800', borderRadius: 3 } } }}>
      <DialogTitle sx={{ textAlign: 'center', color: '#ff9800', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,152,0,0.2)' }}>
        ⚔️ Reglas de La Arena
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          La Arena es el coliseo de apuestas donde los participantes se enfrentan 1 vs 1 en partidos específicos. Conoce las reglas antes de lanzar tu primer desafío:
        </Typography>
        
        <List sx={{ color: 'text.primary' }}>
          <ListItem alignItems="flex-start">
            <ListItemIcon><LockOpenIcon color="warning" /></ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 800 }}>1. Requisitos de Acceso</Typography>} 
              secondary={<Typography variant="body2" color="text.secondary">Debes haber completado tu quiniela y tener un saldo mínimo de 50 MessiCoins (MC) para ingresar.</Typography>} 
            />
          </ListItem>
          
          <ListItem alignItems="flex-start">
            <ListItemIcon><CheckCircleIcon color="warning" /></ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 800 }}>2. Límites de Combate</Typography>} 
              secondary={<Typography variant="body2" color="text.secondary">Solo están disponibles partidos de la Fase de Grupos. Además, cada usuario está limitado a realizar y recibir 1 reto al día.</Typography>} 
            />
          </ListItem>

          <ListItem alignItems="flex-start">
            <ListItemIcon><AttachMoneyIcon color="warning" /></ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 800 }}>3. Apuestas Fijas</Typography>} 
              secondary={<Typography variant="body2" color="text.secondary">Las apuestas son de "Doble o Nada". Puedes elegir montos de 5, 10, 20 o 30 MC al lanzar el reto. Los MC se descuentan inmediatamente al lanzar o aceptar un reto.</Typography>} 
            />
          </ListItem>

          <ListItem alignItems="flex-start">
            <ListItemIcon><GavelIcon color="warning" /></ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 800 }}>4. Resolución del Duelo</Typography>} 
              secondary={<Typography variant="body2" color="text.secondary">Gana quien obtenga más puntos en ese partido específico. Se utilizan las mismas reglas de puntuación general (Marcador Exacto = 5pts, Acertar Ganador = 3pts, etc).</Typography>} 
            />
          </ListItem>

          <ListItem alignItems="flex-start">
            <ListItemIcon><SwapHorizIcon color="warning" /></ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 800 }}>5. Empate Técnico</Typography>} 
              secondary={<Typography variant="body2" color="text.secondary">Si ambos gladiadores consiguen los mismos puntos en el partido (ej. ambos fallan por completo o ambos aciertan exacto), se declara un empate técnico y las monedas se devuelven a sus respectivos dueños.</Typography>} 
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2, borderLeft: '4px solid #ff9800' }}>
          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 800 }}>
            💡 Nota: Las apuestas se resuelven automáticamente una vez que el motor de administración marca el partido como "Finalizado". Si tu víctima rechaza tu reto, se te reembolsa tu MC al instante.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
        <Button onClick={onClose} variant="contained" color="warning" sx={{ fontWeight: 800, px: 4 }}>
          ¡Entendido!
        </Button>
      </DialogActions>
    </Dialog>
  );
};
