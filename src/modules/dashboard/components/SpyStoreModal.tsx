import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, CircularProgress, Paper, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { fetchGlobalSettings, requestSpy, consumeSpyAccess } from '../services/economy.service';
import { useAuthStore } from '@/store/auth.store';
import { SpyViewerModal } from './SpyViewerModal';

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
  { id: 'recent', title: 'Último Partido', price: 300, icon: '💎', desc: 'Descubre de dónde sacó puntos recientemente.' },
  { id: 'groups', title: 'Fase de Grupos', price: 400, icon: '💎', desc: 'Toda su estrategia de la fase inicial al descubierto.' },
  { id: 'knockouts', title: 'Fase Eliminatoria', price: 500, icon: '💎', desc: 'La llave completa. El secreto mejor guardado.' },
  { id: 'awards', title: 'Premios del Torneo', price: 350, icon: '💎', desc: 'Su apuesta a Goleador, MVP y Campeón.' }
] as const;

export const SpyStoreModal = ({ open, onClose, targetId, targetName, userId, userCoins, onSpend }: SpyStoreModalProps) => {
  const { role, user } = useAuthStore();
  const isAdmin = role === 'ADMIN' || ['anthuan', 'änthuan', 'SirRuben30', 'miri', 'admin', 'Admin'].includes(user?.user_metadata?.username);
  
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTiers, setActiveTiers] = useState<Record<string, any>>({});
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [acceptedRequests, setAcceptedRequests] = useState<Record<string, boolean>>({});
  
  // State for the viewer
  const [viewingTier, setViewingTier] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadActiveSpies();
      const interval = setInterval(loadActiveSpies, 10000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const loadActiveSpies = async () => {
    try {
      setLoading(true);
      const settings = await fetchGlobalSettings();
      const userUnlocks = settings.user_unlocks[userId]?.spies?.[targetId] || {};
      setActiveTiers(userUnlocks);

      const reqs = settings.spy_requests || [];
      const pending: Record<string, boolean> = {};
      const accepted: Record<string, boolean> = {};
      
      reqs.forEach(req => {
        if (req.requesterId === userId && req.targetId === targetId) {
          if (req.status === 'pending') pending[req.tierId] = true;
          if (req.status === 'accepted') accepted[req.tierId] = true;
        }
      });
      setPendingRequests(pending);
      setAcceptedRequests(accepted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (tierId: string) => {
    if (isAdmin || activeTiers[tierId] === true || acceptedRequests[tierId]) {
      setViewingTier(tierId);
    } else {
      try {
        setPurchasing(tierId);
        await requestSpy(userId, user?.user_metadata?.username || 'Usuario', targetId, targetName, tierId);
        setPendingRequests(prev => ({ ...prev, [tierId]: true }));
      } catch (e: any) {
        alert(e.message);
      } finally {
        setPurchasing(null);
      }
    }
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
                const isPending = pendingRequests[tier.id];
                const hasAccess = isAdmin || activeTiers[tier.id] === true || acceptedRequests[tier.id];

                return (
                  <Paper key={tier.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: hasAccess ? 'primary.main' : 'rgba(255,255,255,0.05)', borderRadius: 3, transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1, color: hasAccess ? 'primary.main' : 'text.primary' }}>
                          {tier.icon} {tier.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {tier.desc}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, minWidth: 120 }}>
                        <Button 
                          variant={hasAccess ? "contained" : "outlined"} 
                          color={hasAccess ? "primary" : "inherit"} 
                          size="small" 
                          onClick={() => handleView(tier.id)}
                          disabled={isPending || purchasing === tier.id}
                          startIcon={purchasing === tier.id ? <CircularProgress size={14} color="inherit" /> : <VisibilityIcon />}
                          sx={{ fontWeight: 800, borderRadius: 2, width: '100%', borderColor: hasAccess ? 'transparent' : 'rgba(255,255,255,0.2)' }}
                        >
                          {hasAccess ? 'VER AHORA' : isPending ? 'ESPERANDO...' : 'VER AHORA'}
                        </Button>
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
          onClose={async () => {
            setViewingTier(null);
            if (!isAdmin) {
              await consumeSpyAccess(userId, targetId, viewingTier);
            }
            loadActiveSpies();
          }} 
          targetId={targetId} 
          targetName={targetName} 
          tierId={viewingTier as any} 
        />
      )}
    </>
  );
};
