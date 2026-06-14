import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon, ListItemText, Chip, Grid } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarsIcon from '@mui/icons-material/Stars';
import { type AdminPodiumDetail } from '../services/stats.service';

interface Props {
  details: AdminPodiumDetail[];
}

export const AdminPodiumDetailsWidget = ({ details }: Props) => {
  if (!details || details.length === 0) return null;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarsIcon /> Detalles del Podio (Solo Admin)
      </Typography>

      {details.map((user, index) => (
        <Accordion key={user.username} sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, minWidth: 150 }}>
                #{index + 1} {user.username}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${user.exactMatchesCount} Exactos`} color="success" size="small" sx={{ fontWeight: 800 }} />
                <Chip label={`${user.outcomeMatchesCount} Acertados`} color="info" size="small" sx={{ fontWeight: 800 }} />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(0, 230, 118, 0.05)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 900, mb: 1 }}>
                    Marcadores Exactos ({user.exactMatchesCount})
                  </Typography>
                  {user.exactMatchNames.length > 0 ? (
                    <List dense>
                      {user.exactMatchNames.map((match, i) => (
                        <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleIcon color="success" sx={{ fontSize: 16 }} /></ListItemIcon>
                          <ListItemText primary={match} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Ninguno aún.</Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(3, 169, 244, 0.05)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="info.main" sx={{ fontWeight: 900, mb: 1 }}>
                    Marcadores Acertados ({user.outcomeMatchesCount})
                  </Typography>
                  {user.outcomeMatchNames.length > 0 ? (
                    <List dense>
                      {user.outcomeMatchNames.map((match, i) => (
                        <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleIcon color="info" sx={{ fontSize: 16 }} /></ListItemIcon>
                          <ListItemText primary={match} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Ninguno aún.</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
