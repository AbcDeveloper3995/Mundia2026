import { Box, Typography, Paper } from '@mui/material';
import { type Match, type Team } from '@/modules/admin/services/admin.service';
import bgStadium from '@/assets/bg_stadium.png';
import wcLogo from '@/assets/wc_logo.png';

interface TournamentBracketProps {
  matches: Match[];
  teams: Team[];
}

export const TournamentBracket = ({ matches, teams }: TournamentBracketProps) => {
  // Helpers
  const getTeam = (id: string | null) => teams.find(t => t.id === id);
  const getMatchesByStage = (stage: string) => 
    matches.filter(m => m.stage === stage).sort((a, b) => a.id.localeCompare(b.id));

  // Obtener partidos por fase
  const r32 = getMatchesByStage('R32');
  const r16 = getMatchesByStage('R16');
  const qf = getMatchesByStage('QF');
  const sf = getMatchesByStage('SF');
  const thirdPlace = getMatchesByStage('3RD')[0];
  const final = getMatchesByStage('FINAL')[0];

  // Funciones para dividir mitades
  const getLeft = (list: Match[]) => list.slice(0, Math.ceil(list.length / 2));
  const getRight = (list: Match[]) => list.slice(Math.ceil(list.length / 2));

  const renderMatchCard = (match?: Match) => {
    if (!match) return <Box sx={{ width: 180, height: 60 }} />;

    const home = getTeam(match.home_team_id);
    const away = getTeam(match.away_team_id);

    return (
      <Paper 
        key={match.id}
        sx={{
          width: { xs: 130, xl: 160 },
          mb: 1.5,
          p: { xs: 0.8, xl: 1.2 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: match.is_finished ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(40,40,40,0.6))',
          backdropFilter: 'blur(10px)',
          boxShadow: match.is_finished ? '0 4px 15px rgba(255, 215, 0, 0.1)' : '0 4px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 15px rgba(255,255,255,0.1)',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {home?.flag ? <img src={home.flag} alt="" style={{width: 18, height: 12, borderRadius: 2}}/> : <Box sx={{width: 18, height: 12, bgcolor: '#333', borderRadius: 2}}/>}
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.65rem', xl: '0.8rem' }, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 70, xl: 100 } }}>{home?.name || 'TBD'}</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '0.75rem', xl: '0.9rem' } }}>{match.home_score ?? '-'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {away?.flag ? <img src={away.flag} alt="" style={{width: 18, height: 12, borderRadius: 2}}/> : <Box sx={{width: 18, height: 12, bgcolor: '#333', borderRadius: 2}}/>}
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.65rem', xl: '0.8rem' }, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 70, xl: 100 } }}>{away?.name || 'TBD'}</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '0.75rem', xl: '0.9rem' } }}>{match.away_score ?? '-'}</Typography>
        </Box>
      </Paper>
    );
  };

  const renderColumn = (matches: Match[], title: string) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: { xs: 130, xl: 160 }, zIndex: 1 }}>
      <Typography variant="caption" sx={{ textAlign: 'center', mb: 2, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.6rem', xl: '0.75rem' } }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flexGrow: 1 }}>
        {matches.map(m => renderMatchCard(m))}
      </Box>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        overflowX: 'auto', 
        p: { xs: 1, md: 3 }, 
        borderRadius: 4, 
        minHeight: 700,
        position: 'relative',
        backgroundImage: `url(${bgStadium})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
      }}
    >
      {/* Overlay oscuro para legibilidad */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 4 }} />

      <Box sx={{ display: 'flex', gap: { xs: 1, xl: 2 }, width: '100%', maxWidth: 1800, position: 'relative' }}>
        
        {/* RAMA IZQUIERDA */}
        {renderColumn(getLeft(r32), 'R32')}
        {renderColumn(getLeft(r16), 'Octavos')}
        {renderColumn(getLeft(qf), 'Cuartos')}
        {renderColumn(getLeft(sf), 'Semifinal')}

        {/* COLUMNA CENTRAL */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1.2, minWidth: { xs: 150, xl: 200 }, zIndex: 1, gap: { xs: 1, xl: 3 } }}>
          
          {/* Final */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'gold', mb: 1, textTransform: 'uppercase', letterSpacing: { xs: 1, xl: 2 }, fontSize: { xs: '0.75rem', xl: '0.9rem' } }}>
              La Gran Final
            </Typography>
            {final && renderMatchCard(final)}
          </Box>

          {/* Logo del Trofeo */}
          <Box sx={{ 
            my: { xs: 1, xl: 3 }, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Glow detrás del trofeo */}
            <Box sx={{ position: 'absolute', width: { xs: 100, xl: 150 }, height: { xs: 100, xl: 150 }, background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(20px)', zIndex: 0 }} />
            <img src={wcLogo} alt="World Cup Trophy" style={{ width: '100%', maxWidth: 120, height: 'auto', objectFit: 'contain', zIndex: 1, filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' }} />
          </Box>

          {/* Tercer Puesto */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.65rem', xl: '0.75rem' } }}>
              Tercer Puesto
            </Typography>
            {thirdPlace && renderMatchCard(thirdPlace)}
          </Box>

        </Box>

        {/* RAMA DERECHA */}
        {renderColumn(getRight(sf), 'Semifinal')}
        {renderColumn(getRight(qf), 'Cuartos')}
        {renderColumn(getRight(r16), 'Octavos')}
        {renderColumn(getRight(r32), 'R32')}

      </Box>
    </Box>
  );
};
