import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, CircularProgress, Paper, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import { fetchGlobalSettings, unlockSpy, triggerSpyAlert } from '../services/economy.service';
import { useAuthStore } from '@/store/auth.store';
import { SpyViewerModal } from './SpyViewerModal';
import { CountdownTimer } from './CountdownTimer';

interface SpyStoreModalProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  userId: string;
  userCoins: number;
  onSpend: (amount: number) => void;
}

const TIERS = [
  { id: 'recent', title: 'Últimos 2 Partidos', price: 300, icon: '💎', desc: 'Descubre de dónde sacó puntos recientemente.' },
  { id: 'groups', title: 'Fase de Grupos', price: 400, icon: '💎', desc: 'Toda su estrategia de la fase inicial al descubierto.' },
  { id: 'knockouts', title: 'Fase Eliminatoria', price: 500, icon: '💎', desc: 'La llave completa. El secreto mejor guardado.' },
  { id: 'awards', title: 'Premios del Torneo', price: 350, icon: '💎', desc: 'Su apuesta a Goleador, MVP y Campeón.' }
] as const;

export const SpyStoreModal = ({ open, onClose, targetId, targetName, userId, userCoins, onSpend }: SpyStoreModalProps) => {
  const { role } = useAuthStore();
  const isAdmin = role === 'ADMIN';
  
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTiers, setActiveTiers] = useState<Record<string, number>>({});
  
  // State for the viewer
  const [viewingTier, setViewingTier] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadActiveSpies();
  }, [open]);

  const loadActiveSpies = async () => {
    try {
      setLoading(true);
      const settings = await fetchGlobalSettings();
      const userUnlocks = settings.user_unlocks[userId]?.spies?.[targetId] || {};
      setActiveTiers(userUnlocks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tierId: 'recent' | 'groups' | 'knockouts' | 'awards', price: number) => {
    if (userCoins < price && !isAdmin) {
      alert(`No tienes suficientes MessiCoins. Necesitas ${price} MC.`);
      return;
    }

    try {
      setPurchasing(tierId);
      if (!isAdmin) {
        await unlockSpy(userId, targetId, targetName, tierId, price);
        onSpend(price);
      }
      // Update local state to reflect purchase (5 minutes)
      setActiveTiers(prev => ({ ...prev, [tierId]: isAdmin ? Date.now() + 86400000 : Date.now() + 300000 }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPurchasing(null);
    }
  };

  const handleView = async (tierId: string) => {
    if (isAdmin) {
      try {
        await unlockSpy(userId, targetId, targetName, tierId as any, 0);
        setActiveTiers(prev => ({ ...prev, [tierId]: Date.now() + 300000 }));
      } catch(e) {
        console.error(e);
      }
    }
    setViewingTier(tierId);
  };

  return (
    <>
      <Dialog open={open && !viewingTier} onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { bgcolor: '#1a1a1a', backgroundImage: 'none', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VisibilityIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Espiar a {targetName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {TIERS.map(tier => {
                const expiration = activeTiers[tier.id];
                const isActive = isAdmin || (expiration && expiration > Date.now());

                return (
                  <Paper key={tier.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: isActive ? 'primary.main' : 'rgba(255,255,255,0.05)', borderRadius: 3, transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1, color: isActive ? 'primary.main' : 'text.primary' }}>
                          {tier.icon} {tier.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {tier.desc}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, minWidth: 120 }}>
                        {isActive ? (
                          <>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              size="small" 
                              onClick={() => handleView(tier.id)}
                              startIcon={<VisibilityIcon />}
                              sx={{ fontWeight: 800, borderRadius: 2, width: '100%' }}
                            >
                              VER AHORA
                            </Button>
                            {expiration && expiration > Date.now() && (
                              <Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>
                                <CountdownTimer targetDate={expiration} onExpire={() => loadActiveSpies()} />
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Button 
                            variant="outlined" 
                            color="inherit" 
                            size="small" 
                            onClick={() => handlePurchase(tier.id as any, tier.price)}
                            disabled={purchasing === tier.id}
                            startIcon={purchasing === tier.id ? <CircularProgress size={14} color="inherit" /> : <LockIcon />}
                            sx={{ fontWeight: 800, borderRadius: 2, width: '100%', borderColor: 'rgba(255,255,255,0.2)' }}
                          >
                            {tier.price} MC
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {viewingTier && (
        <SpyViewerModal 
          open={!!viewingTier} 
          onClose={() => setViewingTier(null)} 
          targetId={targetId} 
          targetName={targetName} 
          tierId={viewingTier as any} 
        />
      )}
    </>
  );
};
